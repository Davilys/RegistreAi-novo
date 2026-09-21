import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";
import { decryptText, encryptText, hmacSha256, maskWhatsApp, toPgByteaFromBase64 } from "./crypto.js";

export const db = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export type QueueMessage = {
  msg_id: number;
  read_ct: number;
  message: Record<string, unknown>;
};

export async function readQueue(queue: string): Promise<QueueMessage[]> {
  const { data, error } = await db.rpc("reg_queue_read", {
    p_queue: queue,
    p_visibility_timeout: config.WORKER_VISIBILITY_TIMEOUT,
    p_qty: config.WORKER_BATCH_SIZE
  });
  if (error) throw error;
  return (data ?? []) as QueueMessage[];
}

export async function archiveQueueMessage(queue: string, msgId: number) {
  const { error } = await db.rpc("reg_queue_archive", { p_queue: queue, p_msg_id: msgId });
  if (error) throw error;
}

export async function retryQueueMessage(queue: string, msgId: number, seconds: number) {
  const { error } = await db.rpc("reg_queue_set_vt", {
    p_queue: queue,
    p_msg_id: msgId,
    p_seconds: seconds
  });
  if (error) throw error;
}

export async function loadEncryptedWebhook(webhookEventId: string) {
  const [eventResult, payloadResult] = await Promise.all([
    db.from("webhook_events").select("*").eq("id", webhookEventId).single(),
    db.from("webhook_payloads").select("*").eq("webhook_event_id", webhookEventId).single()
  ]);

  if (eventResult.error) throw eventResult.error;
  if (payloadResult.error) throw payloadResult.error;

  const raw = decryptText(
    payloadResult.data.ciphertext,
    payloadResult.data.nonce_b64,
    config.WEBHOOK_PAYLOAD_KEY_B64
  );

  return { event: eventResult.data, raw };
}

export async function resolveWhatsAppWorkspace(phone: string) {
  const identifierHash = hmacSha256(config.IDENTITY_HASH_KEY, phone);
  const encrypted = encryptText(phone, config.PII_ENCRYPTION_KEY_B64);

  const { data, error } = await db.rpc("resolve_whatsapp_workspace", {
    p_identifier_hash: identifierHash,
    p_identifier_masked: maskWhatsApp(phone),
    p_ciphertext: encrypted.ciphertextB64,
    p_nonce_b64: encrypted.nonceB64,
    p_key_version: 1
  });

  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error("WORKSPACE_RESOLUTION_FAILED");

  return {
    workspaceId: row.workspace_id as string,
    threadId: row.thread_id as string,
    isNew: Boolean(row.is_new)
  };
}

export async function storeInboundText(args: {
  workspaceId: string;
  threadId: string;
  providerMessageId: string;
  text: string;
  timestamp?: string;
}) {
  const encrypted = encryptText(args.text, config.PII_ENCRYPTION_KEY_B64);
  const sentAt = args.timestamp
    ? new Date(Number(args.timestamp) * 1000).toISOString()
    : new Date().toISOString();

  const { error } = await db.from("messages").upsert({
    workspace_id: args.workspaceId,
    thread_id: args.threadId,
    provider_message_id: args.providerMessageId,
    direction: "inbound",
    message_type: "text",
    content_redacted: "[mensagem de texto]",
    content_ciphertext: toPgByteaFromBase64(encrypted.ciphertextB64),
    content_nonce: toPgByteaFromBase64(encrypted.nonceB64),
    encryption_key_version: 1,
    sent_at: sentAt,
    delivery_status: "received"
  }, { onConflict: "provider_message_id", ignoreDuplicates: true });

  if (error) throw error;
}

export async function buildWorkspaceContext(workspaceId: string) {
  const [workspace, plans, subscriptions, processes, deadlines, memory] = await Promise.all([
    db.from("workspaces").select("id,status,display_name,locale,timezone").eq("id", workspaceId).single(),
    db.from("plans").select("code,name,setup_fee_cents,monthly_fee_cents,unlimited_marks,resources_included,guarantee_included").eq("active", true),
    db.from("subscriptions").select("id,plan_code,status,holder_id,started_at").eq("workspace_id", workspaceId),
    db.from("processes").select("id,status,inpi_process_number,filing_date,next_action_at,automation_hold,hold_reason,version,trademarks(name,presentation_type,activity_description),process_classes(nice_class,specification)").eq("workspace_id", workspaceId).limit(15),
    db.from("deadlines").select("id,process_id,kind,due_at,status,customer_dependency").eq("workspace_id", workspaceId).eq("status", "open").order("due_at"),
    db.from("agent_state").select("scope,process_id,state,summary,version").eq("workspace_id", workspaceId)
  ]);

  if (workspace.error) throw workspace.error;

  return {
    workspace: workspace.data,
    plans: plans.data ?? [],
    subscriptions: subscriptions.data ?? [],
    processes: processes.data ?? [],
    deadlines: deadlines.data ?? [],
    memory: memory.data ?? []
  };
}

export async function queueEncryptedReply(args: {
  workspaceId: string;
  threadId: string;
  body: string;
  idempotencyKey: string;
}) {
  const secured = encryptText(args.body, config.PII_ENCRYPTION_KEY_B64);

  const { error } = await db.from("outbound_messages").upsert({
    workspace_id: args.workspaceId,
    thread_id: args.threadId,
    channel: "whatsapp",
    body_redacted: "[mensagem da Reg]",
    body_ciphertext: secured.ciphertextB64,
    body_nonce_b64: secured.nonceB64,
    encryption_key_version: 1,
    status: "queued",
    idempotency_key: args.idempotencyKey
  }, { onConflict: "idempotency_key", ignoreDuplicates: true });

  if (error) throw error;

  const { error: queueError } = await db.rpc("reg_queue_send", {
    p_queue: "notifications",
    p_message: { job_type: "send_outbound", idempotency_key: args.idempotencyKey },
    p_delay: 0
  });
  if (queueError) throw queueError;
}

export async function recordAgentRun(args: {
  workspaceId: string;
  agentRole: string;
  promptVersion: string;
  model: string;
  status: "succeeded" | "failed" | "blocked";
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}) {
  const { error } = await db.from("agent_runs").insert({
    workspace_id: args.workspaceId,
    agent_role: args.agentRole,
    prompt_version: args.promptVersion,
    model: args.model,
    status: args.status,
    input_redacted: args.input,
    output_redacted: args.output ?? {},
    completed_at: new Date().toISOString(),
    error_message: args.error ?? null
  });
  if (error) throw error;
}

export async function markWebhookProcessed(webhookEventId: string) {
  const { error } = await db.from("webhook_events")
    .update({ processing_status: "processed", processed_at: new Date().toISOString() })
    .eq("id", webhookEventId);
  if (error) throw error;
}

export async function getPrimaryWhatsApp(workspaceId: string): Promise<string> {
  const { data: identity, error } = await db.from("channel_identities")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("channel", "whatsapp")
    .eq("is_primary", true)
    .single();
  if (error) throw error;

  const { data, error: secretError } = await db.rpc("get_channel_identity_secret", {
    p_channel_identity_id: identity.id
  });
  if (secretError) throw secretError;

  const row = data?.[0];
  if (!row) throw new Error("WHATSAPP_IDENTITY_SECRET_MISSING");
  return decryptText(row.ciphertext, row.nonce_b64, config.PII_ENCRYPTION_KEY_B64);
}

export async function getOutboundByKey(idempotencyKey: string) {
  const { data, error } = await db.from("outbound_messages")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .single();
  if (error) throw error;
  return data;
}

export function decryptOutboundBody(row: { body_ciphertext?: string | null; body_nonce_b64?: string | null }) {
  if (!row.body_ciphertext || !row.body_nonce_b64) throw new Error("OUTBOUND_BODY_NOT_ENCRYPTED");
  return decryptText(row.body_ciphertext, row.body_nonce_b64, config.PII_ENCRYPTION_KEY_B64);
}
