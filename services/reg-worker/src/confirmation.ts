import { db, queueEncryptedReply } from "./db.js";

async function openThread(workspaceId: string) {
  const { data, error } = await db.from("conversation_threads")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("channel", "whatsapp")
    .eq("status", "open")
    .limit(1)
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function tryConfirmViability(args: {
  workspaceId: string;
  providerMessageId: string;
  phrase: string;
}) {
  if (args.phrase.trim().toUpperCase() !== "CONFIRMO") {
    return { handled: false as const };
  }

  const { data: confirmations, error: confirmationError } = await db
    .from("viability_confirmations")
    .select("id,process_id,report_id,confirmed_class,status")
    .eq("workspace_id", args.workspaceId)
    .eq("status", "PENDING")
    .order("created_at", { ascending: true })
    .limit(10);

  if (confirmationError) throw confirmationError;

  if (!confirmations || confirmations.length === 0) {
    return { handled: false as const };
  }

  const threadId = await openThread(args.workspaceId);

  if (confirmations.length > 1) {
    await queueEncryptedReply({
      workspaceId: args.workspaceId,
      threadId,
      body:
        "Tenho mais de uma marca aguardando sua confirmação. Me diga o nome da marca que você quer confirmar para eu não vincular sua resposta ao processo errado.",
      idempotencyKey: "viability-confirm-ambiguous:" + args.providerMessageId
    });

    return { handled: true as const, ambiguous: true as const };
  }

  const confirmation = confirmations[0];
  if (!confirmation) throw new Error("VIABILITY_CONFIRMATION_NOT_FOUND_AFTER_LOOKUP");

  const [{ data: report, error: reportError }, { data: process, error: processError }] =
    await Promise.all([
      db.from("viability_reports")
        .select("id,verdict")
        .eq("id", confirmation.report_id)
        .single(),
      db.from("processes")
        .select("id,status,version")
        .eq("id", confirmation.process_id)
        .eq("workspace_id", args.workspaceId)
        .single()
    ]);

  if (reportError) throw reportError;
  if (processError) throw processError;

  if (report.verdict !== "GREEN") {
    await queueEncryptedReply({
      workspaceId: args.workspaceId,
      threadId,
      body:
        "Esse processo tem um cenário de risco que ainda precisa ser concluído pela minha análise antes do protocolo. Não vou avançar como se estivesse livre.",
      idempotencyKey: "viability-confirm-risk-block:" + args.providerMessageId
    });

    return { handled: true as const, blocked: true as const };
  }

  if (process.status !== "awaiting_customer_confirmation") {
    throw new Error("PROCESS_NOT_AWAITING_VIABILITY_CONFIRMATION:" + process.status);
  }

  const { error: transitionError } = await db.rpc("transition_process", {
    p_process_id: process.id,
    p_expected_version: process.version,
    p_to_status: "awaiting_inpi_fee",
    p_actor_type: "customer",
    p_actor_ref: args.providerMessageId,
    p_reason: "customer_confirmed_green_viability"
  });

  if (transitionError) throw transitionError;

  const now = new Date().toISOString();

  const { error: updateError } = await db.from("viability_confirmations")
    .update({
      status: "CONFIRMED",
      provider_message_id: args.providerMessageId,
      confirmed_at: now
    })
    .eq("id", confirmation.id)
    .eq("status", "PENDING");

  if (updateError) throw updateError;

  const { error: customerTaskError } = await db.from("workflow_tasks")
    .update({
      status: "completed",
      completed_at: now
    })
    .eq("workspace_id", args.workspaceId)
    .eq("process_id", process.id)
    .eq("task_type", "CUSTOMER_VIABILITY_CONFIRMATION")
    .eq("status", "waiting");

  if (customerTaskError) throw customerTaskError;

  const { error: feeTaskError } = await db.from("workflow_tasks").insert({
    workspace_id: args.workspaceId,
    process_id: process.id,
    task_type: "GENERATE_INPI_FEE",
    owner_type: "SYSTEM",
    status: "pending",
    priority: 95,
    payload_redacted: {
      service_code: "389",
      nice_class: confirmation.confirmed_class,
      trigger: "green_viability_confirmed"
    },
    idempotency_key: "initial-inpi-fee:" + process.id
  });

  if (feeTaskError && feeTaskError.code !== "23505") throw feeTaskError;

  await queueEncryptedReply({
    workspaceId: args.workspaceId,
    threadId,
    body:
      "Confirmação registrada ✅ Agora vou preparar a taxa oficial do INPI da classe " +
      confirmation.confirmed_class +
      ". Se eu precisar confirmar alguma informação sobre o seu enquadramento para desconto, eu te peço aqui.",
    idempotencyKey: "viability-confirmed:" + confirmation.id
  });

  return {
    handled: true as const,
    processId: process.id,
    confirmedClass: confirmation.confirmed_class
  };
}
