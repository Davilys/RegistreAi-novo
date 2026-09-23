import type { InboundEvent, SendResult, WhatsAppChannel } from "./types.js";

// Cliente Stevo portado do módulo provado na WebMarcas (Fernanda, set/2026).
export interface StevoChannelConfig {
  baseUrl?: string;   // STEVO_BASE_URL (padrão https://openapi.stevo.chat)
  instance?: string;  // STEVO_INSTANCE
  apiKey?: string;    // STEVO_API_KEY
}

export const STEVO_DEFAULT_BASE_URL = "https://openapi.stevo.chat";

/** Rota de envio fora (502/reset) é transitória: retry com backoff, nunca rebind. */
export class StevoTransientError extends Error {}

export function onlyDigits(v: string): string {
  return v.replace(/\D/g, "");
}

export class StevoChannel implements WhatsAppChannel {
  readonly provider = "stevo" as const;
  readonly enforcesCustomerServiceWindow = false;
  private sm?: { serverUrl: string; token: string };

  constructor(private cfg: StevoChannelConfig, private fetcher: typeof fetch = fetch) {}

  isConfigured(): boolean {
    return Boolean(this.cfg.instance && this.cfg.apiKey);
  }

  private base(): string {
    return (this.cfg.baseUrl || STEVO_DEFAULT_BASE_URL).replace(/\/+$/, "");
  }

  private async central(path: string, init: RequestInit = {}): Promise<Response> {
    if (!this.isConfigured()) throw new Error("STEVO_NOT_CONFIGURED");
    try {
      return await this.fetcher(this.base() + "/v1/instances/" + this.cfg.instance + path, {
        ...init,
        headers: { authorization: "Bearer " + this.cfg.apiKey, "content-type": "application/json", ...(init.headers ?? {}) }
      });
    } catch (e) {
      throw new StevoTransientError("STEVO_NETWORK:" + (e instanceof Error ? e.message : String(e)));
    }
  }

  async sendText(to: string, body: string): Promise<SendResult> {
    const res = await this.central("/messages", { method: "POST", body: JSON.stringify({ to: onlyDigits(to), text: body }) });
    const raw = await res.text();
    if (res.status >= 500) throw new StevoTransientError("STEVO_HTTP_" + res.status);
    if (!res.ok) throw new Error("STEVO_HTTP_" + res.status + ":" + raw.slice(0, 400));
    const id = extractStevoMessageId(safeJson(raw));
    if (!id) throw new Error("STEVO_MISSING_MESSAGE_ID");
    return { providerMessageId: id };
  }

  /** Servidor SM v2 da instância (usado por reações). */
  async smServer(): Promise<{ serverUrl: string; token: string }> {
    if (this.sm) return this.sm;
    const res = await this.central("", { method: "GET" });
    const j = safeJson(await res.text()) as { data?: { server_url?: string; token?: string } } | null;
    const serverUrl = j?.data?.server_url, token = j?.data?.token;
    if (!res.ok || !serverUrl || !token) throw new Error("STEVO_SM_SERVER_UNAVAILABLE");
    this.sm = { serverUrl: serverUrl.replace(/\/+$/, ""), token };
    return this.sm;
  }

  /** Reação a uma mensagem do cliente. Regra travada: 👂 só em áudio (decidido por quem chama). */
  async react(messageId: string, number: string, emoji: string): Promise<void> {
    const { serverUrl, token } = await this.smServer();
    const res = await this.fetcher(serverUrl + "/message/react", {
      method: "POST",
      headers: { apikey: token, "content-type": "application/json" },
      body: JSON.stringify({ id: messageId, number: onlyDigits(number), reaction: emoji, fromMe: false })
    });
    if (!res.ok) throw new Error("STEVO_REACT_HTTP_" + res.status);
  }
}

function safeJson(raw: string): unknown {
  try { return JSON.parse(raw); } catch { return null; }
}

export function extractStevoMessageId(j: unknown): string | undefined {
  const o = (j ?? {}) as Record<string, any>;
  const c = [o.id, o.messageId, o.message_id, o.data?.id, o.data?.messageId, o.data?.key?.id, o.key?.id];
  return c.find((v) => typeof v === "string" && v.length > 0);
}

const TYPE_MAP: Record<string, string> = {
  conversation: "text", extendedTextMessage: "text", audioMessage: "audio", imageMessage: "image",
  documentMessage: "document", videoMessage: "video", stickerMessage: "sticker", reactionMessage: "reaction"
};

/** Normaliza o webhook Stevo nos 2 formatos provados: data.messages[] e data.key+data.message. */
export function normalizeStevoWebhook(payload: unknown): InboundEvent[] {
  const data = ((payload ?? {}) as Record<string, any>).data ?? {};
  const items: any[] = Array.isArray(data.messages) ? data.messages : data.key ? [data] : [];
  const out: InboundEvent[] = [];
  for (const m of items) {
    const key = m?.key ?? {};
    if (key.fromMe) continue;
    const jid = String(key.remoteJid ?? "");
    if (!key.id || !jid.endsWith("@s.whatsapp.net")) continue; // ignora grupos/status
    const msg = m.message ?? {};
    const rawType = Object.keys(msg)[0] ?? "unknown";
    const messageType = TYPE_MAP[rawType] ?? "unknown";
    const text = msg.conversation ?? msg.extendedTextMessage?.text ?? msg.imageMessage?.caption ?? msg.documentMessage?.caption;
    out.push({
      kind: "message", provider: "stevo", providerMessageId: String(key.id), from: onlyDigits(jid.split("@")[0] ?? ""),
      timestamp: m.messageTimestamp ? new Date(Number(m.messageTimestamp) * 1000).toISOString() : undefined,
      messageType, ...(typeof text === "string" ? { text } : {})
    });
  }
  return out;
}
