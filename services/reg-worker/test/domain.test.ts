import test from "node:test";
import assert from "node:assert/strict";
import { asaasExternalReference, classifyPaymentStatus, webhookEventKey, workspaceScoped } from "../src/domain.js";
import { classifyDispatch, discoverEditionNumbers, normalizeDate } from "../src/rpi-domain.js";

test("workspace isolation always adds workspace_id", () => {
  const calls: Array<[string,string]> = [];
  const query = { eq(column: string, value: string) { calls.push([column,value]); return this; } };
  workspaceScoped(query, "workspace-a");
  assert.deepEqual(calls, [["workspace_id", "workspace-a"]]);
  assert.throws(() => workspaceScoped(query, ""), /WORKSPACE_ID_REQUIRED/);
});

test("payment and webhook idempotency keys are stable and scope-aware", () => {
  assert.equal(asaasExternalReference("setup", "sub-1"), "registreai:setup:sub-1");
  assert.equal(asaasExternalReference("monthly", "sub-1"), "registreai:monthly:sub-1");
  assert.notEqual(webhookEventKey("ASAAS", "evt-1"), webhookEventKey("META", "evt-1"));
});

test("provider payment statuses fail closed", () => {
  assert.equal(classifyPaymentStatus("CONFIRMED"), "paid");
  assert.equal(classifyPaymentStatus("OVERDUE"), "attention");
  assert.equal(classifyPaymentStatus("unexpected"), "pending");
});

test("RPI dates, editions and actionable dispatches are deterministic", () => {
  assert.equal(normalizeDate("21/09/2026"), "2026-09-21");
  assert.deepEqual(discoverEditionNumbers('RM2831.zip RM2832.zip RM2831.zip'), [2831, 2832]);
  assert.deepEqual(classifyDispatch("", "Pedido de registro indeferido"), { eventType: "REFUSAL", requiresAction: true });
  assert.deepEqual(classifyDispatch("", "Registro concedido"), { eventType: "GRANTED", requiresAction: false });
});
