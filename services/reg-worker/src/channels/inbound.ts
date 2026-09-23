import type { MetaMessage } from "../whatsapp.js";
import type { InboundEvent } from "./types.js";
export { normalizeStevoWebhook } from "./stevo.js";

/** Converte eventos Stevo normalizados no formato que o fluxo atual já processa. */
export function stevoEventsAsMessages(events: InboundEvent[]): MetaMessage[] {
  const out: MetaMessage[] = [];
  for (const e of events) {
    if (e.kind !== "message") continue;
    out.push({
      id: e.providerMessageId,
      from: e.from,
      timestamp: e.timestamp ? String(Math.floor(Date.parse(e.timestamp) / 1000)) : undefined,
      type: e.messageType,
      ...(e.messageType === "text" && e.text ? { text: { body: e.text } } : {})
    });
  }
  return out;
}
