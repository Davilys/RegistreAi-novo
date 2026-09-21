import { db, queueEncryptedReply } from "./db.js";

type FeeTier = "STANDARD" | "DISCOUNT_50" | "DISCOUNT_100";

type FeePreparation =
  | { status: "waiting_eligibility" }
  | {
      status: "ready_for_gru";
      federalFeeId: string;
      serviceCode: string;
      niceClass: number;
      expectedAmountCents: number | null;
      discountTier: FeeTier;
    };

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

async function feeProfile(holderId: string) {
  const { data, error } = await db.from("holder_fee_profiles")
    .select("*")
    .eq("holder_id", holderId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function askEligibility(args: {
  workspaceId: string;
  holderId: string;
  processId: string;
}) {
  const { error: profileError } = await db.from("holder_fee_profiles").upsert({
    holder_id: args.holderId,
    discount_tier: "UNKNOWN",
    verification_status: "UNVERIFIED"
  }, { onConflict: "holder_id", ignoreDuplicates: true });

  if (profileError) throw profileError;

  const { error: requestError } = await db.from("fee_eligibility_requests").upsert({
    workspace_id: args.workspaceId,
    holder_id: args.holderId,
    process_id: args.processId,
    status: "PENDING"
  }, { onConflict: "process_id" });

  if (requestError) throw requestError;

  const { error: taskError } = await db.from("workflow_tasks").insert({
    workspace_id: args.workspaceId,
    process_id: args.processId,
    task_type: "CUSTOMER_FEE_DISCOUNT_ELIGIBILITY",
    owner_type: "CUSTOMER",
    status: "waiting",
    priority: 90,
    payload_redacted: {
      purpose: "determine_inpi_fee_tier"
    },
    idempotency_key: "fee-eligibility:" + args.processId
  });

  if (taskError && taskError.code !== "23505") throw taskError;

  const threadId = await openThread(args.workspaceId);

  await queueEncryptedReply({
    workspaceId: args.workspaceId,
    threadId,
    body:
      "Antes de gerar a taxa oficial do INPI, preciso confirmar seu enquadramento para não cobrar um valor errado.\n\n" +
      "Responda com uma destas opções:\n" +
      "• *PF* — pessoa física sem participação societária em empresa do mesmo ramo\n" +
      "• *MEI*, *ME* ou *EPP*\n" +
      "• *SIMPLES INOVAÇÃO*\n" +
      "• *COOPERATIVA*\n" +
      "• *ENSINO/PESQUISA*\n" +
      "• *SEM FINS LUCRATIVOS*\n" +
      "• *ÓRGÃO PÚBLICO*\n" +
      "• *GRATUIDADE* — se você possui hipótese legal de gratuidade\n" +
      "• *SEM DESCONTO*\n\n" +
      "Eu só aplico o valor depois de conferir o que o próprio INPI gerar.",
    idempotencyKey: "fee-eligibility-question:" + args.processId
  });
}

export async function prepareInitialInpiFee(args: {
  workspaceId: string;
  processId: string;
  serviceCode?: string;
  niceClass?: number;
}): Promise<FeePreparation> {
  const serviceCode = args.serviceCode ?? "389";

  const { data: process, error: processError } = await db.from("processes")
    .select("id,holder_id,status")
    .eq("id", args.processId)
    .eq("workspace_id", args.workspaceId)
    .single();

  if (processError) throw processError;
  if (process.status !== "awaiting_inpi_fee") {
    throw new Error("PROCESS_NOT_AWAITING_INPI_FEE:" + process.status);
  }

  let niceClass = args.niceClass ?? null;

  if (!niceClass) {
    const { data: primary, error: classError } = await db.from("process_classes")
      .select("nice_class")
      .eq("process_id", args.processId)
      .eq("is_primary", true)
      .limit(1)
      .maybeSingle();

    if (classError) throw classError;
    niceClass = primary?.nice_class ?? null;
  }

  if (!niceClass) throw new Error("PRIMARY_NICE_CLASS_MISSING");

  const profile = await feeProfile(process.holder_id);

  if (!profile || profile.discount_tier === "UNKNOWN") {
    await askEligibility({
      workspaceId: args.workspaceId,
      holderId: process.holder_id,
      processId: args.processId
    });

    return { status: "waiting_eligibility" };
  }

  const tier = profile.discount_tier as FeeTier;

  const { data: feeCatalog, error: catalogError } = await db.from("inpi_fee_catalog")
    .select("service_code,standard_amount_cents,discount50_amount_cents,effective_from,source_version")
    .eq("service_code", serviceCode)
    .eq("active", true)
    .lte("effective_from", new Date().toISOString().slice(0, 10))
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();

  if (catalogError) throw catalogError;

  const expectedAmountCents =
    tier === "STANDARD"
      ? feeCatalog.standard_amount_cents
      : tier === "DISCOUNT_50"
      ? feeCatalog.discount50_amount_cents
      : null;

  if (tier === "DISCOUNT_50" && expectedAmountCents == null) {
    throw new Error("INPI_DISCOUNT_VALUE_NOT_CATALOGED");
  }

  const { data: existing, error: existingError } = await db.from("federal_fees")
    .select("id,status")
    .eq("process_id", args.processId)
    .eq("service_code", serviceCode)
    .eq("nice_class", niceClass)
    .not("status", "in", '("cancelled","expired")')
    .maybeSingle();

  if (existingError) throw existingError;

  let federalFeeId = existing?.id ?? null;

  if (!federalFeeId) {
    const { data: inserted, error: insertError } = await db.from("federal_fees").insert({
      workspace_id: args.workspaceId,
      process_id: args.processId,
      fee_type: "TRADEMARK_FILING",
      provider: "INPI",
      service_code: serviceCode,
      nice_class: niceClass,
      expected_amount_cents: expectedAmountCents,
      discount_tier: tier,
      status: "checking",
      amount_verified: false
    }).select("id").single();

    if (insertError) throw insertError;
    federalFeeId = inserted.id;
  }

  return {
    status: "ready_for_gru",
    federalFeeId,
    serviceCode,
    niceClass,
    expectedAmountCents,
    discountTier: tier
  };
}

function normalizeCategory(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

const DISCOUNT_50_CATEGORIES = new Set([
  "PF",
  "MEI",
  "ME",
  "EPP",
  "SIMPLES INOVACAO",
  "COOPERATIVA",
  "ENSINO/PESQUISA",
  "ENSINO PESQUISA",
  "SEM FINS LUCRATIVOS",
  "ORGAO PUBLICO"
]);

export async function tryResolveFeeEligibility(args: {
  workspaceId: string;
  providerMessageId: string;
  phrase: string;
}) {
  const normalized = normalizeCategory(args.phrase);

  const recognized =
    normalized === "SEM DESCONTO" ||
    normalized === "GRATUIDADE" ||
    DISCOUNT_50_CATEGORIES.has(normalized);

  if (!recognized) return { handled: false as const };

  const { data: requests, error: requestError } = await db.from("fee_eligibility_requests")
    .select("id,holder_id,process_id,status")
    .eq("workspace_id", args.workspaceId)
    .eq("status", "PENDING")
    .order("created_at", { ascending: true })
    .limit(10);

  if (requestError) throw requestError;
  if (!requests?.length) return { handled: false as const };

  const threadId = await openThread(args.workspaceId);

  if (requests.length > 1) {
    await queueEncryptedReply({
      workspaceId: args.workspaceId,
      threadId,
      body:
        "Tenho mais de um processo aguardando essa informação. Me diga o nome da marca para eu aplicar o enquadramento ao processo correto.",
      idempotencyKey: "fee-eligibility-ambiguous:" + args.providerMessageId
    });

    return { handled: true as const, ambiguous: true as const };
  }

  const request = requests[0];
  if (!request) throw new Error("FEE_ELIGIBILITY_REQUEST_NOT_FOUND_AFTER_LOOKUP");

  const tier: FeeTier =
    normalized === "SEM DESCONTO"
      ? "STANDARD"
      : normalized === "GRATUIDADE"
      ? "DISCOUNT_100"
      : "DISCOUNT_50";

  const verificationStatus =
    tier === "STANDARD" ? "VERIFIED" : "PENDING_EVIDENCE";

  const now = new Date().toISOString();

  const { error: profileError } = await db.from("holder_fee_profiles").upsert({
    holder_id: request.holder_id,
    discount_tier: tier,
    eligibility_basis: normalized,
    verification_status: verificationStatus,
    verified_at: tier === "STANDARD" ? now : null,
    source: "CUSTOMER_DECLARATION"
  }, { onConflict: "holder_id" });

  if (profileError) throw profileError;

  const { error: updateRequestError } = await db.from("fee_eligibility_requests")
    .update({
      status: "ANSWERED",
      declared_category: normalized,
      provider_message_id: args.providerMessageId,
      answered_at: now
    })
    .eq("id", request.id)
    .eq("status", "PENDING");

  if (updateRequestError) throw updateRequestError;

  const { error: customerTaskError } = await db.from("workflow_tasks")
    .update({ status: "completed", completed_at: now })
    .eq("workspace_id", args.workspaceId)
    .eq("process_id", request.process_id)
    .eq("task_type", "CUSTOMER_FEE_DISCOUNT_ELIGIBILITY")
    .eq("status", "waiting");

  if (customerTaskError) throw customerTaskError;

  const { data: feeTask, error: feeTaskLookupError } = await db.from("workflow_tasks")
    .select("id")
    .eq("workspace_id", args.workspaceId)
    .eq("process_id", request.process_id)
    .eq("task_type", "GENERATE_INPI_FEE")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (feeTaskLookupError) throw feeTaskLookupError;

  if (feeTask) {
    const { error: taskUpdateError } = await db.from("workflow_tasks")
      .update({ status: "pending", last_error: null })
      .eq("id", feeTask.id);

    if (taskUpdateError) throw taskUpdateError;

    const { error: enqueueError } = await db.rpc("reg_queue_send", {
      p_queue: "reg_jobs",
      p_message: {
        job_type: "workflow_task",
        workflow_task_id: feeTask.id,
        task_type: "GENERATE_INPI_FEE",
        workspace_id: args.workspaceId,
        process_id: request.process_id
      },
      p_delay: 0
    });

    if (enqueueError) throw enqueueError;
  }

  await queueEncryptedReply({
    workspaceId: args.workspaceId,
    threadId,
    body:
      tier === "STANDARD"
        ? "Perfeito. Vou gerar a taxa sem desconto e conferir o valor diretamente no INPI antes de te enviar."
        : "Perfeito. Vou validar esse enquadramento no fluxo da taxa. Não vou aplicar desconto ou gratuidade sem conferir o valor que o próprio INPI apresentar.",
    idempotencyKey: "fee-eligibility-ack:" + request.id
  });

  return {
    handled: true as const,
    processId: request.process_id,
    tier,
    verificationStatus
  };
}
