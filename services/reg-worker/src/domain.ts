export function workspaceScoped<T extends { eq(column: string, value: string): T }>(query: T, workspaceId: string): T {
  if (!workspaceId) throw new Error("WORKSPACE_ID_REQUIRED");
  return query.eq("workspace_id", workspaceId);
}

export function asaasExternalReference(kind: "setup" | "monthly", subscriptionId: string) {
  if (!subscriptionId) throw new Error("SUBSCRIPTION_ID_REQUIRED");
  return `registreai:${kind}:${subscriptionId}`;
}

export function webhookEventKey(provider: string, externalEventId: string) {
  if (!provider || !externalEventId) throw new Error("WEBHOOK_ID_REQUIRED");
  return `${provider}:${externalEventId}`;
}

export function classifyPaymentStatus(status: string) {
  const normalized = status.toUpperCase();
  if (["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(normalized)) return "paid" as const;
  if (["OVERDUE", "REFUNDED", "REFUND_REQUESTED", "CHARGEBACK_REQUESTED", "CHARGEBACK_DISPUTE"].includes(normalized)) return "attention" as const;
  return "pending" as const;
}
