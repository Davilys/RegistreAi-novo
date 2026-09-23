// Camada de canal WhatsApp: o worker fala com esta interface, nunca direto com um provedor.
export type WhatsAppProvider = "meta" | "stevo";

export const WEBHOOK_PROVIDER: Record<WhatsAppProvider, string> = {
  meta: "WHATSAPP_META",
  stevo: "WHATSAPP_STEVO"
};

export interface SendResult {
  providerMessageId: string;
}

export interface WhatsAppChannel {
  readonly provider: WhatsAppProvider;
  /** true quando o canal exige janela de 24h e template fora dela (regra da Meta). */
  readonly enforcesCustomerServiceWindow: boolean;
  sendText(to: string, body: string): Promise<SendResult>;
}

/** Evento de entrada normalizado, igual para qualquer provedor. */
export type InboundEvent =
  | { kind: "message"; provider: WhatsAppProvider; providerMessageId: string; from: string; timestamp?: string; messageType: string; text?: string; mediaId?: string }
  | { kind: "status"; provider: WhatsAppProvider; providerMessageId: string; status: "sent" | "delivered" | "read" | "failed" | "played" | "unknown" };

export function parseProvider(value: unknown, fallback: WhatsAppProvider): WhatsAppProvider {
  if (value === "meta" || value === "stevo") return value;
  if (value === "WHATSAPP_META") return "meta";
  if (value === "WHATSAPP_STEVO") return "stevo";
  return fallback;
}
