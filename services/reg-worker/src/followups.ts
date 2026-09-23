// Conversation follow-up engine. Rules ported from the WebMarcas/Fernanda fixes (set/2026):
// 1 sent/cancelled steps only revive when a USER message is newer than sent_at/cancelled_at
// 2 re-arm can run from any number of points (guard in rule 1 makes it safe)
// 3 send failure: backoff due_at = now + 15min, max 5 attempts
// 4 conversation with a pending action: postpone +30min, no send
// 5 proactive text identical to one of the last 15 bot messages: skip (mark sent, no resend)
// 6 followup 1 carries context (trademark name)
// 7 excluded (system/bot) phones: cancel all steps at claim time
// 8 schedule 10min / 24h / 5 days; cancel on any user message, terminal stage or paused thread

export type FollowupStatus = "pending" | "sent" | "cancelled" | "failed";

export type FollowupStep = {
  threadId: string;
  workspaceId: string;
  step: 1 | 2 | 3;
  status: FollowupStatus;
  dueAt: Date;
  sentAt: Date | null;
  cancelledAt: Date | null;
  attemptCount: number;
  lastError: string | null;
  context: { trademark?: string | null };
  skippedDuplicate?: boolean;
};

export type ConversationState = {
  phone: string;
  stage: string | null;
  paused: boolean;
  hasPendingAction: boolean;
};

export interface FollowupStore {
  getSteps(threadId: string): Promise<FollowupStep[]>;
  saveStep(step: FollowupStep): Promise<void>;
  lastUserMessageAt(threadId: string): Promise<Date | null>;
  recentBotTexts(threadId: string, limit: number): Promise<string[]>;
  conversationState(threadId: string): Promise<ConversationState>;
  dueSteps(now: Date, limit: number): Promise<FollowupStep[]>;
  send(step: FollowupStep, text: string): Promise<void>;
}

export const FOLLOWUP_SCHEDULE_MS: Record<1 | 2 | 3, number> = {
  1: 10 * 60_000,
  2: 24 * 60 * 60_000,
  3: 5 * 24 * 60 * 60_000
};
export const FAILURE_BACKOFF_MS = 15 * 60_000;
export const PENDING_ACTION_DELAY_MS = 30 * 60_000;
export const MAX_ATTEMPTS = 5;
export const DEDUPE_WINDOW = 15;
export const TERMINAL_STAGES = new Set(["paid", "closed", "cancelled", "contract_link_sent", "waiting_human"]);

export function followupText(step: 1 | 2 | 3, ctx: { trademark?: string | null }): string {
  const mark = ctx.trademark?.trim();
  if (step === 1) {
    return mark
      ? "Ficou alguma dúvida sobre o registro da " + mark + "? Tô aqui pra te ajudar."
      : "Ficou alguma dúvida sobre o registro da sua marca? Tô aqui pra te ajudar.";
  }
  if (step === 2) {
    return mark
      ? "Oi! Passando pra saber se quer seguir com a proteção da " + mark + ". É só me responder aqui."
      : "Oi! Passando pra saber se quer seguir com a proteção da sua marca. É só me responder aqui.";
  }
  return "Vou deixar sua conversa em espera por aqui. Quando quiser retomar o registro, é só me mandar uma mensagem.";
}

function normalize(text: string): string {
  return text.normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();
}

export async function armFollowups(
  store: FollowupStore,
  args: { threadId: string; workspaceId: string; now: Date; trademark?: string | null }
): Promise<FollowupStep[]> {
  const existing = new Map((await store.getSteps(args.threadId)).map((s) => [s.step, s]));
  const lastUser = await store.lastUserMessageAt(args.threadId);
  const out: FollowupStep[] = [];

  for (const step of [1, 2, 3] as const) {
    const dueAt = new Date(args.now.getTime() + FOLLOWUP_SCHEDULE_MS[step]);
    const current = existing.get(step);

    if (current && (current.status === "sent" || current.status === "cancelled")) {
      const closedAt = current.status === "sent" ? current.sentAt : current.cancelledAt;
      const userIsNewer = !!lastUser && !!closedAt && lastUser.getTime() > closedAt.getTime();
      if (!userIsNewer) { out.push(current); continue; } // rule 1
    }

    const next: FollowupStep = {
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      step,
      status: "pending",
      dueAt,
      sentAt: null,
      cancelledAt: null,
      attemptCount: 0,
      lastError: null,
      context: { trademark: args.trademark ?? current?.context.trademark ?? null }
    };
    await store.saveStep(next);
    out.push(next);
  }
  return out;
}

export async function cancelFollowups(store: FollowupStore, threadId: string, now: Date, reason: string) {
  for (const s of await store.getSteps(threadId)) {
    if (s.status !== "pending" && s.status !== "failed") continue;
    await store.saveStep({ ...s, status: "cancelled", cancelledAt: now, lastError: reason });
  }
}

export type FollowupOutcome = { threadId: string; step: number; outcome: "sent" | "skipped_duplicate" | "postponed" | "cancelled" | "failed" | "exhausted" };

export async function processDueFollowups(
  store: FollowupStore,
  args: { now: Date; excludedPhones: Set<string>; limit?: number }
): Promise<FollowupOutcome[]> {
  const results: FollowupOutcome[] = [];
  const due = await store.dueSteps(args.now, args.limit ?? 50);

  for (const s of due) {
    if (s.status !== "pending" && s.status !== "failed") continue;
    if (s.dueAt.getTime() > args.now.getTime()) continue;

    if (s.attemptCount >= MAX_ATTEMPTS) {
      await store.saveStep({ ...s, status: "cancelled", cancelledAt: args.now, lastError: "max_attempts" });
      results.push({ threadId: s.threadId, step: s.step, outcome: "exhausted" });
      continue;
    }

    const state = await store.conversationState(s.threadId);
    const digits = state.phone.replace(/\D/g, "");

    if (args.excludedPhones.has(digits)) { // rule 7
      await cancelFollowups(store, s.threadId, args.now, "excluded_phone");
      results.push({ threadId: s.threadId, step: s.step, outcome: "cancelled" });
      continue;
    }
    if (state.paused || (state.stage && TERMINAL_STAGES.has(state.stage))) { // rule 8
      await cancelFollowups(store, s.threadId, args.now, state.paused ? "paused" : "terminal_stage");
      results.push({ threadId: s.threadId, step: s.step, outcome: "cancelled" });
      continue;
    }
    if (state.hasPendingAction) { // rule 4
      await store.saveStep({ ...s, dueAt: new Date(args.now.getTime() + PENDING_ACTION_DELAY_MS) });
      results.push({ threadId: s.threadId, step: s.step, outcome: "postponed" });
      continue;
    }

    const text = followupText(s.step, s.context);
    const recent = (await store.recentBotTexts(s.threadId, DEDUPE_WINDOW)).map(normalize);
    if (recent.includes(normalize(text))) { // rule 5
      await store.saveStep({ ...s, status: "sent", sentAt: args.now, skippedDuplicate: true, lastError: "duplicate_skipped" });
      results.push({ threadId: s.threadId, step: s.step, outcome: "skipped_duplicate" });
      continue;
    }

    try {
      await store.send(s, text);
      await store.saveStep({ ...s, status: "sent", sentAt: args.now, attemptCount: s.attemptCount + 1, lastError: null });
      results.push({ threadId: s.threadId, step: s.step, outcome: "sent" });
    } catch (error) { // rule 3
      await store.saveStep({
        ...s,
        status: "failed",
        attemptCount: s.attemptCount + 1,
        dueAt: new Date(args.now.getTime() + FAILURE_BACKOFF_MS),
        lastError: error instanceof Error ? error.message : "send_failed"
      });
      results.push({ threadId: s.threadId, step: s.step, outcome: "failed" });
    }
  }
  return results;
}

export class MemoryFollowupStore implements FollowupStore {
  steps = new Map<string, FollowupStep>();
  userMessages = new Map<string, Date[]>();
  botTexts = new Map<string, string[]>();
  states = new Map<string, ConversationState>();
  sent: Array<{ threadId: string; step: number; text: string }> = [];
  failNextSends = 0;

  private key(threadId: string, step: number) { return threadId + ":" + step; }
  async getSteps(threadId: string) { return [...this.steps.values()].filter((s) => s.threadId === threadId).map((s) => ({ ...s })); }
  async saveStep(step: FollowupStep) { this.steps.set(this.key(step.threadId, step.step), { ...step }); }
  async lastUserMessageAt(threadId: string) {
    const list = this.userMessages.get(threadId) ?? [];
    return list.length ? new Date(Math.max(...list.map((d) => d.getTime()))) : null;
  }
  async recentBotTexts(threadId: string, limit: number) { return (this.botTexts.get(threadId) ?? []).slice(-limit); }
  async conversationState(threadId: string) {
    return this.states.get(threadId) ?? { phone: "5500000000000", stage: null, paused: false, hasPendingAction: false };
  }
  async dueSteps(now: Date, limit: number) {
    return [...this.steps.values()]
      .filter((s) => (s.status === "pending" || s.status === "failed") && s.dueAt.getTime() <= now.getTime())
      .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
      .slice(0, limit)
      .map((s) => ({ ...s }));
  }
  async send(step: FollowupStep, text: string) {
    if (this.failNextSends > 0) { this.failNextSends -= 1; throw new Error("stevo_502"); }
    this.sent.push({ threadId: step.threadId, step: step.step, text });
    const list = this.botTexts.get(step.threadId) ?? [];
    list.push(text);
    this.botTexts.set(step.threadId, list);
  }
}
