import { config } from "./config.js";
import { db, getPrimaryWhatsApp, queueEncryptedReply } from "./db.js";
import { decryptText } from "./crypto.js";
import type { ConversationState, FollowupStep, FollowupStore } from "./followups.js";

type Row = {
  thread_id: string; workspace_id: string; step: number; status: FollowupStep["status"]; due_at: string;
  sent_at: string | null; cancelled_at: string | null; attempt_count: number; last_error: string | null;
  context: { trademark?: string | null } | null; skipped_duplicate: boolean | null;
};

const toStep = (r: Row): FollowupStep => ({
  threadId: r.thread_id, workspaceId: r.workspace_id, step: r.step as 1 | 2 | 3, status: r.status,
  dueAt: new Date(r.due_at), sentAt: r.sent_at ? new Date(r.sent_at) : null,
  cancelledAt: r.cancelled_at ? new Date(r.cancelled_at) : null, attemptCount: r.attempt_count,
  lastError: r.last_error, context: r.context ?? {}, skippedDuplicate: !!r.skipped_duplicate
});

const fromBytea = (v: string) => Buffer.from(v.replace(/^\\x/, ""), "hex").toString("base64");

export const supabaseFollowupStore: FollowupStore = {
  async getSteps(threadId) {
    const { data, error } = await db.from("conversation_followups").select("*").eq("thread_id", threadId);
    if (error) throw error;
    return (data as Row[]).map(toStep);
  },
  async saveStep(s) {
    const { error } = await db.from("conversation_followups").upsert({
      thread_id: s.threadId, workspace_id: s.workspaceId, step: s.step, status: s.status,
      due_at: s.dueAt.toISOString(), sent_at: s.sentAt?.toISOString() ?? null,
      cancelled_at: s.cancelledAt?.toISOString() ?? null, attempt_count: s.attemptCount,
      last_error: s.lastError, context: s.context, skipped_duplicate: !!s.skippedDuplicate,
      updated_at: new Date().toISOString()
    }, { onConflict: "thread_id,step" });
    if (error) throw error;
  },
  async lastUserMessageAt(threadId) {
    const { data, error } = await db.from("messages").select("created_at")
      .eq("thread_id", threadId).eq("direction", "inbound")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data?.created_at ? new Date(data.created_at) : null;
  },
  async recentBotTexts(threadId, limit) {
    const { data, error } = await db.from("messages").select("content_ciphertext,content_nonce")
      .eq("thread_id", threadId).eq("direction", "outbound")
      .order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    const out: string[] = [];
    for (const r of data ?? []) {
      try { out.push(decryptText(fromBytea(r.content_ciphertext), fromBytea(r.content_nonce), config.PII_ENCRYPTION_KEY_B64)); } catch { /* skip unreadable */ }
    }
    return out;
  },
  async conversationState(threadId): Promise<ConversationState> {
    const { data: thread, error } = await db.from("conversation_threads").select("workspace_id,status").eq("id", threadId).single();
    if (error) throw error;
    const [profile, tasks, phone] = await Promise.all([
      db.from("onboarding_profiles").select("onboarding_status").eq("workspace_id", thread.workspace_id).maybeSingle(),
      db.from("workflow_tasks").select("id", { count: "exact", head: true })
        .eq("workspace_id", thread.workspace_id).eq("owner_type", "SYSTEM").in("status", ["pending", "in_progress"]),
      getPrimaryWhatsApp(thread.workspace_id)
    ]);
    return {
      phone,
      stage: profile.data?.onboarding_status ?? null,
      paused: thread.status !== "open",
      hasPendingAction: (tasks.count ?? 0) > 0
    };
  },
  async dueSteps(now, limit) {
    const { data, error } = await db.from("conversation_followups").select("*")
      .in("status", ["pending", "failed"]).lte("due_at", now.toISOString())
      .order("due_at", { ascending: true }).limit(limit);
    if (error) throw error;
    return (data as Row[]).map(toStep);
  },
  async send(step, text) {
    await queueEncryptedReply({
      workspaceId: step.workspaceId, threadId: step.threadId, body: text,
      idempotencyKey: "followup:" + step.threadId + ":" + step.step + ":" + step.dueAt.toISOString()
    });
  }
};

export async function latestTrademarkName(workspaceId: string): Promise<string | null> {
  const { data } = await db.from("trademarks").select("name").eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  return (data?.name as string | undefined) ?? null;
}
