import assert from "node:assert/strict";
import test from "node:test";
import {
  armFollowups, cancelFollowups, processDueFollowups, followupText, MemoryFollowupStore,
  FOLLOWUP_SCHEDULE_MS, FAILURE_BACKOFF_MS, PENDING_ACTION_DELAY_MS
} from "../src/followups.js";

const T = "thread-1", W = "ws-1";
const t0 = new Date("2026-09-23T12:00:00Z");
const at = (ms: number) => new Date(t0.getTime() + ms);
const none = new Set<string>();

test("rule 8: schedule is 10min / 24h / 5 days", async () => {
  const s = new MemoryFollowupStore();
  const steps = await armFollowups(s, { threadId: T, workspaceId: W, now: t0, trademark: "Zyntra" });
  assert.deepEqual(steps.map((x) => x.dueAt.getTime() - t0.getTime()), [FOLLOWUP_SCHEDULE_MS[1], FOLLOWUP_SCHEDULE_MS[2], FOLLOWUP_SCHEDULE_MS[3]]);
  assert.equal(FOLLOWUP_SCHEDULE_MS[1], 600000);
});

test("F1: re-arm without a user reply keeps a sent step sent (no infinite nudge)", async () => {
  const s = new MemoryFollowupStore();
  await armFollowups(s, { threadId: T, workspaceId: W, now: t0 });
  await processDueFollowups(s, { now: at(FOLLOWUP_SCHEDULE_MS[1]), excludedPhones: none });
  assert.equal(s.sent.length, 1);
  for (let i = 0; i < 5; i++) await armFollowups(s, { threadId: T, workspaceId: W, now: at(FOLLOWUP_SCHEDULE_MS[1] + 1000 * i) });
  const step1 = (await s.getSteps(T)).find((x) => x.step === 1)!;
  assert.equal(step1.status, "sent");
  await processDueFollowups(s, { now: at(FOLLOWUP_SCHEDULE_MS[1] * 3), excludedPhones: none });
  assert.equal(s.sent.filter((x) => x.step === 1).length, 1);
});

test("F2: a newer user reply revives the step as pending, re-anchored", async () => {
  const s = new MemoryFollowupStore();
  await armFollowups(s, { threadId: T, workspaceId: W, now: t0 });
  await processDueFollowups(s, { now: at(FOLLOWUP_SCHEDULE_MS[1]), excludedPhones: none });
  const replyAt = at(FOLLOWUP_SCHEDULE_MS[1] + 60000);
  s.userMessages.set(T, [replyAt]);
  await cancelFollowups(s, T, replyAt, "user_message");
  const rearm = at(FOLLOWUP_SCHEDULE_MS[1] + 120000);
  await armFollowups(s, { threadId: T, workspaceId: W, now: rearm });
  const step1 = (await s.getSteps(T)).find((x) => x.step === 1)!;
  assert.equal(step1.status, "pending");
  assert.equal(step1.dueAt.getTime(), rearm.getTime() + FOLLOWUP_SCHEDULE_MS[1]);
});

test("F3: pending action postpones +30min without sending", async () => {
  const s = new MemoryFollowupStore();
  s.states.set(T, { phone: "5511999990000", stage: null, paused: false, hasPendingAction: true });
  await armFollowups(s, { threadId: T, workspaceId: W, now: t0 });
  const now = at(FOLLOWUP_SCHEDULE_MS[1]);
  const r = await processDueFollowups(s, { now, excludedPhones: none });
  assert.equal(r[0].outcome, "postponed");
  assert.equal(s.sent.length, 0);
  assert.equal((await s.getSteps(T)).find((x) => x.step === 1)!.dueAt.getTime(), now.getTime() + PENDING_ACTION_DELAY_MS);
});

test("F4: followup 1 carries the trademark and is delivered verbatim", async () => {
  const s = new MemoryFollowupStore();
  await armFollowups(s, { threadId: T, workspaceId: W, now: t0, trademark: "Zyntravok" });
  await processDueFollowups(s, { now: at(FOLLOWUP_SCHEDULE_MS[1]), excludedPhones: none });
  assert.equal(s.sent[0].text, followupText(1, { trademark: "Zyntravok" }));
  assert.match(s.sent[0].text, /registro da Zyntravok\?/);
});

test("F5: identical proactive text in the last 15 bot messages is skipped, marked sent, not resent", async () => {
  const s = new MemoryFollowupStore();
  s.botTexts.set(T, [followupText(1, { trademark: "Zyntra" })]);
  await armFollowups(s, { threadId: T, workspaceId: W, now: t0, trademark: "Zyntra" });
  const r = await processDueFollowups(s, { now: at(FOLLOWUP_SCHEDULE_MS[1]), excludedPhones: none });
  assert.equal(r[0].outcome, "skipped_duplicate");
  assert.equal(s.sent.length, 0);
  const step1 = (await s.getSteps(T)).find((x) => x.step === 1)!;
  assert.equal(step1.status, "sent");
  await processDueFollowups(s, { now: at(FOLLOWUP_SCHEDULE_MS[1] * 2), excludedPhones: none });
  assert.equal(s.sent.length, 0);
});

test("rule 3: send failure backs off 15min instead of immediate re-claim", async () => {
  const s = new MemoryFollowupStore();
  s.failNextSends = 1;
  await armFollowups(s, { threadId: T, workspaceId: W, now: t0 });
  const now = at(FOLLOWUP_SCHEDULE_MS[1]);
  const r = await processDueFollowups(s, { now, excludedPhones: none });
  assert.equal(r[0].outcome, "failed");
  const step1 = (await s.getSteps(T)).find((x) => x.step === 1)!;
  assert.equal(step1.dueAt.getTime(), now.getTime() + FAILURE_BACKOFF_MS);
  assert.equal((await processDueFollowups(s, { now, excludedPhones: none })).length, 0);
  const r2 = await processDueFollowups(s, { now: at(FOLLOWUP_SCHEDULE_MS[1] + FAILURE_BACKOFF_MS), excludedPhones: none });
  assert.equal(r2[0].outcome, "sent");
});

test("rule 7: excluded system phone cancels all steps, no send", async () => {
  const s = new MemoryFollowupStore();
  s.states.set(T, { phone: "+55 11 99999-0000", stage: null, paused: false, hasPendingAction: false });
  await armFollowups(s, { threadId: T, workspaceId: W, now: t0 });
  await processDueFollowups(s, { now: at(FOLLOWUP_SCHEDULE_MS[3]), excludedPhones: new Set(["5511999990000"]) });
  assert.equal(s.sent.length, 0);
  assert.ok((await s.getSteps(T)).every((x) => x.status === "cancelled"));
});

test("rule 8: terminal stage or paused thread cancels", async () => {
  for (const state of [{ stage: "contract_link_sent", paused: false }, { stage: null, paused: true }]) {
    const s = new MemoryFollowupStore();
    s.states.set(T, { phone: "5511900000000", hasPendingAction: false, ...state });
    await armFollowups(s, { threadId: T, workspaceId: W, now: t0 });
    await processDueFollowups(s, { now: at(FOLLOWUP_SCHEDULE_MS[1]), excludedPhones: none });
    assert.equal(s.sent.length, 0);
    assert.ok((await s.getSteps(T)).every((x) => x.status === "cancelled"));
  }
});
