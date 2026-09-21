import { config } from "./config.js";
import { encryptText, toPgByteaFromBase64 } from "./crypto.js";
import {
  archiveQueueMessage,
  buildWorkspaceContext,
  db,
  decryptOutboundBody,
  getOutboundByKey,
  getPrimaryWhatsApp,
  loadEncryptedWebhook,
  markWebhookProcessed,
  queueEncryptedReply,
  recordAgentRun,
  resolveWhatsAppWorkspace,
  retryQueueMessage,
  storeInboundText,
  type QueueMessage
} from "./db.js";
import { sendWhatsAppText } from "./meta.js";
import { generateRegDecision, REG_PROMPT_VERSION, type RegDecision } from "./openai.js";
import { extractMessageText, extractMetaMessages, extractMetaStatuses } from "./whatsapp.js";
import { persistCapturedData } from "./profile.js";
import { tryResolveFeeEligibility } from "./fee.js";
import { tryAcceptContract } from "./contract.js";
import { tryConfirmViability } from "./confirmation.js";
import { ensureInitialProcess } from "./process.js";
import { handleWorkflowTask } from "./workflow.js";

async function createTask(args: {
  workspaceId: string;
  processId?: string | null;
  type: string;
  owner: "SYSTEM" | "CUSTOMER";
  status?: "pending" | "waiting";
  priority?: number;
  payload?: Record<string, unknown>;
  idempotencyKey: string;
}) {
  const { error } = await db.from("workflow_tasks").insert({
    workspace_id: args.workspaceId,
    process_id: args.processId ?? null,
    task_type: args.type,
    owner_type: args.owner,
    status: args.status ?? "pending",
    priority: args.priority ?? 50,
    payload_redacted: args.payload ?? {},
    idempotency_key: args.idempotencyKey
  });

  if (error && error.code !== "23505") throw error;
}

async function persistRequestedItems(workspaceId: string, sourceMessageId: string, decision: RegDecision) {
  for (const item of decision.requested_items) {
    await createTask({
      workspaceId,
      type: "CUSTOMER_" + item.type,
      owner: "CUSTOMER",
      status: "waiting",
      priority: 70,
      payload: { label: item.label, reason: item.reason },
      idempotencyKey: "request:" + sourceMessageId + ":" + item.type + ":" + item.label
    });
  }
}

async function persistProposedActions(workspaceId: string, sourceMessageId: string, decision: RegDecision) {
  if (!decision.may_execute) return;

  const allowed = new Set([
    "CREATE_CUSTOMER_TASK",
    "CREATE_PROCESS_TASK",
    "START_CONTRACT",
    "CREATE_ASAAS_CHARGE",
    "START_VIABILITY",
    "CHECK_PAYMENT",
    "CHECK_INPI"
  ]);

  let index = 0;
  for (const action of decision.proposed_actions) {
    index += 1;
    if (!allowed.has(action.type)) continue;

    await createTask({
      workspaceId,
      processId: action.process_id,
      type: action.type,
      owner: "SYSTEM",
      status: "pending",
      priority: action.type === "START_CONTRACT" ? 80 : 60,
      payload: action.payload,
      idempotencyKey: "ai-action:" + sourceMessageId + ":" + index + ":" + action.type
    });
  }
}

async function updateWhatsAppStatuses(payload: Record<string, unknown>) {
  for (const status of extractMetaStatuses(payload)) {
    if (!status.id) continue;

    const normalized = ["sent","delivered","read","failed"].includes(status.status)
      ? status.status
      : "sent";

    await Promise.all([
      db.from("outbound_messages").update({ status: normalized }).eq("provider_message_id", status.id),
      db.from("messages").update({ delivery_status: normalized }).eq("provider_message_id", status.id)
    ]);
  }
}

async function handleWhatsAppWebhook(webhookEventId: string) {
  const { event, raw } = await loadEncryptedWebhook(webhookEventId);
  if (event.provider !== "WHATSAPP_META") return;

  const payload = JSON.parse(raw) as Record<string, unknown>;
  await updateWhatsAppStatuses(payload);

  for (const message of extractMetaMessages(payload)) {
    if (!message.id || !message.from) continue;

    const resolved = await resolveWhatsAppWorkspace(message.from);
    const currentText = extractMessageText(message);

    if (!currentText) {
      await createTask({
        workspaceId: resolved.workspaceId,
        type: "FETCH_WHATSAPP_MEDIA_OR_UNSUPPORTED_MESSAGE",
        owner: "SYSTEM",
        priority: 65,
        payload: { provider_message_id: message.id, type: message.type ?? "unknown" },
        idempotencyKey: "wa-media:" + message.id
      });
      continue;
    }

    await storeInboundText({
      workspaceId: resolved.workspaceId,
      threadId: resolved.threadId,
      providerMessageId: message.id,
      text: currentText,
      timestamp: message.timestamp
    });

    const contractAccepted = await tryAcceptContract({
      workspaceId: resolved.workspaceId,
      providerMessageId: message.id,
      phrase: currentText
    });

    if (contractAccepted) {
      await queueEncryptedReply({
        workspaceId: resolved.workspaceId,
        threadId: resolved.threadId,
        body: "Aceite confirmado ✅ Vou gerar seu Pix de adesão agora.",
        idempotencyKey: "contract-accepted-ack:" + message.id
      });
      continue;
    }

    const viabilityConfirmation = await tryConfirmViability({
      workspaceId: resolved.workspaceId,
      providerMessageId: message.id,
      phrase: currentText
    });

    if (viabilityConfirmation.handled) {
      continue;
    }

    const feeEligibility = await tryResolveFeeEligibility({
      workspaceId: resolved.workspaceId,
      providerMessageId: message.id,
      phrase: currentText
    });

    if (feeEligibility.handled) {
      continue;
    }

    const context = await buildWorkspaceContext(resolved.workspaceId);
    const startedAt = new Date().toISOString();

    try {
      const decision = await generateRegDecision({
        workspaceId: resolved.workspaceId,
        currentMessage: currentText,
        context
      });

      await recordAgentRun({
        workspaceId: resolved.workspaceId,
        agentRole: "REG_CONVERSATION",
        promptVersion: REG_PROMPT_VERSION,
        model: config.OPENAI_MODEL_DEFAULT,
        status: decision.may_execute ? "succeeded" : "blocked",
        input: { started_at: startedAt, message_type: message.type ?? "text" },
        output: {
          intent: decision.intent,
          confidence: decision.confidence,
          actions: decision.proposed_actions.map((action) => action.type),
          blockers: decision.blockers
        }
      });

      let reply = decision.reply;
      const hasCapturedData = Object.values(decision.captured_data).some((value) => value !== null);

      if (hasCapturedData) {
        const profile = await persistCapturedData(resolved.workspaceId, decision.captured_data);

        if (profile.issues.includes("cpf_cnpj_invalid")) {
          reply = "O CPF ou CNPJ informado parece inválido. Confere o número e me envia novamente? O restante continua comigo.";
        } else if (profile.issues.includes("email_invalid")) {
          reply = "O e-mail informado parece incompleto. Me envia o e-mail correto e eu continuo daqui.";
        } else if (profile.issues.includes("cep_invalid")) {
          reply = "O CEP informado parece inválido. Me envia os 8 números do CEP e eu continuo.";
        }

        if (profile.status === "ready_for_contract") {
          await createTask({
            workspaceId: resolved.workspaceId,
            type: "START_CONTRACT",
            owner: "SYSTEM",
            priority: 90,
            payload: { trigger: "onboarding_complete" },
            idempotencyKey: "contract-ready:" + resolved.workspaceId
          });
        }
      }

      await persistRequestedItems(resolved.workspaceId, message.id, decision);
      await persistProposedActions(resolved.workspaceId, message.id, decision);
      await queueEncryptedReply({
        workspaceId: resolved.workspaceId,
        threadId: resolved.threadId,
        body: reply,
        idempotencyKey: "reg-reply:" + message.id
      });
    } catch (error) {
      await recordAgentRun({
        workspaceId: resolved.workspaceId,
        agentRole: "REG_CONVERSATION",
        promptVersion: REG_PROMPT_VERSION,
        model: config.OPENAI_MODEL_DEFAULT,
        status: "failed",
        input: { started_at: startedAt, message_type: message.type ?? "text" },
        error: error instanceof Error ? error.message : "unknown_error"
      });
      throw error;
    }
  }

  await markWebhookProcessed(webhookEventId);
}

async function handleAsaasWebhook(webhookEventId: string) {
  const { event, raw } = await loadEncryptedWebhook(webhookEventId);
  if (event.provider !== "ASAAS") return;

  const body = JSON.parse(raw) as Record<string, any>;
  const payment = body.payment ?? {};
  const externalId = typeof payment.id === "string" ? payment.id : null;
  const rawStatus = typeof payment.status === "string" ? payment.status : "";

  if (externalId) {
    const normalized =
      ["RECEIVED","CONFIRMED","RECEIVED_IN_CASH"].includes(rawStatus) ? "confirmed" :
      rawStatus === "OVERDUE" ? "overdue" :
      ["REFUNDED","REFUND_REQUESTED"].includes(rawStatus) ? "refunded" :
      ["DELETED","CANCELLED"].includes(rawStatus) ? "cancelled" :
      "pending";

    const { data: rows, error: loadError } = await db.from("payments")
      .select("id,workspace_id,subscription_id,payment_type,status")
      .eq("provider", "ASAAS")
      .eq("external_id", externalId);
    if (loadError) throw loadError;

    const { error: paymentError } = await db.from("payments")
      .update({
        status: normalized,
        raw_status: rawStatus,
        paid_at: normalized === "confirmed" ? new Date().toISOString() : null
      })
      .eq("provider", "ASAAS")
      .eq("external_id", externalId);
    if (paymentError) throw paymentError;

    for (const row of rows ?? []) {
      if (normalized === "confirmed" && row.payment_type === "SETUP" && row.subscription_id) {
        await db.from("subscriptions")
          .update({ status: "active", started_at: new Date().toISOString() })
          .eq("id", row.subscription_id);

        await db.from("workspaces").update({ status: "active" }).eq("id", row.workspace_id);

        await db.from("onboarding_profiles")
          .update({ onboarding_status: "paid" })
          .eq("workspace_id", row.workspace_id);

        const process = await ensureInitialProcess(row.workspace_id, row.subscription_id);

        await createTask({
          workspaceId: row.workspace_id,
          processId: process.id,
          type: "START_VIABILITY",
          owner: "SYSTEM",
          priority: 90,
          payload: { trigger: "setup_payment_confirmed", payment_id: externalId },
          idempotencyKey: "viability:" + process.id
        });

        await createTask({
          workspaceId: row.workspace_id,
          type: "CREATE_MONTHLY_SUBSCRIPTION",
          owner: "SYSTEM",
          priority: 80,
          payload: { subscription_id: row.subscription_id, trigger: "setup_payment_confirmed" },
          idempotencyKey: "monthly-subscription:" + row.subscription_id
        });

        const { data: thread } = await db.from("conversation_threads")
          .select("id")
          .eq("workspace_id", row.workspace_id)
          .eq("channel", "whatsapp")
          .eq("status", "open")
          .limit(1)
          .maybeSingle();

        if (thread?.id) {
          await queueEncryptedReply({
            workspaceId: row.workspace_id,
            threadId: thread.id,
            body: "Pagamento confirmado ✅ Já comecei a análise da sua marca. Agora é comigo.",
            idempotencyKey: "setup-confirmed:" + externalId
          });
        }
      }
    }
  }

  await markWebhookProcessed(webhookEventId);
}

export async function handleRegJob(job: QueueMessage) {
  const jobType = String(job.message.job_type ?? "");

  if (jobType === "workflow_task") {
    const workflowTaskId = String(job.message.workflow_task_id ?? "");
    if (!workflowTaskId) throw new Error("WORKFLOW_TASK_ID_MISSING");
    await handleWorkflowTask(workflowTaskId);
    await archiveQueueMessage("reg_jobs", job.msg_id);
    return;
  }

  if (jobType === "webhook_event") {
    const webhookEventId = String(job.message.webhook_event_id ?? "");
    const provider = String(job.message.provider ?? "");
    if (!webhookEventId) throw new Error("WEBHOOK_EVENT_ID_MISSING");

    if (provider === "WHATSAPP_META") await handleWhatsAppWebhook(webhookEventId);
    else if (provider === "ASAAS") await handleAsaasWebhook(webhookEventId);

    await archiveQueueMessage("reg_jobs", job.msg_id);
    return;
  }

  await archiveQueueMessage("reg_jobs", job.msg_id);
}

export async function handleNotificationJob(job: QueueMessage) {
  if (job.message.job_type !== "send_outbound") {
    await archiveQueueMessage("notifications", job.msg_id);
    return;
  }

  const key = String(job.message.idempotency_key ?? "");
  if (!key) throw new Error("OUTBOUND_IDEMPOTENCY_KEY_MISSING");

  const outbound = await getOutboundByKey(key);
  if (["sent","delivered","read"].includes(outbound.status)) {
    await archiveQueueMessage("notifications", job.msg_id);
    return;
  }

  const phone = await getPrimaryWhatsApp(outbound.workspace_id);
  const body = decryptOutboundBody(outbound);

  await db.from("outbound_messages")
    .update({ status: "sending", attempts: (outbound.attempts ?? 0) + 1 })
    .eq("id", outbound.id);

  try {
    const providerMessageId = await sendWhatsAppText(phone, body);
    const encrypted = encryptText(body, config.PII_ENCRYPTION_KEY_B64);

    await db.from("outbound_messages").update({
      status: "sent",
      sent_at: new Date().toISOString(),
      provider_message_id: providerMessageId,
      last_error: null
    }).eq("id", outbound.id);

    await db.from("messages").insert({
      workspace_id: outbound.workspace_id,
      thread_id: outbound.thread_id,
      provider_message_id: providerMessageId,
      direction: "outbound",
      message_type: "text",
      content_redacted: "[mensagem da Reg]",
      content_ciphertext: toPgByteaFromBase64(encrypted.ciphertextB64),
      content_nonce: toPgByteaFromBase64(encrypted.nonceB64),
      encryption_key_version: 1,
      sent_at: new Date().toISOString(),
      delivery_status: "sent"
    });

    await archiveQueueMessage("notifications", job.msg_id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    await db.from("outbound_messages").update({ status: "failed", last_error: message }).eq("id", outbound.id);
    const delay = Math.min(900, 30 * Math.max(1, (outbound.attempts ?? 0) + 1));
    await retryQueueMessage("notifications", job.msg_id, delay);
  }
}
