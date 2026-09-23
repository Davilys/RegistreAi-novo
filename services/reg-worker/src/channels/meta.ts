import type { SendResult, WhatsAppChannel } from "./types.js";

export interface MetaChannelConfig {
  accessToken?: string;
  phoneNumberId?: string;
  graphVersion?: string;
}

export class MetaCloudChannel implements WhatsAppChannel {
  readonly provider = "meta" as const;
  readonly enforcesCustomerServiceWindow = true;

  constructor(private cfg: MetaChannelConfig, private fetcher: typeof fetch = fetch) {}

  async sendText(to: string, body: string): Promise<SendResult> {
    const { accessToken, phoneNumberId, graphVersion } = this.cfg;
    if (!accessToken || !phoneNumberId || !graphVersion) throw new Error("META_NOT_CONFIGURED");

    const endpoint = "https://graph.facebook.com/" + graphVersion + "/" + phoneNumberId + "/messages";
    const response = await this.fetcher(endpoint, {
      method: "POST",
      headers: { authorization: "Bearer " + accessToken, "content-type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body }
      })
    });

    const payload = await response.json() as { messages?: Array<{ id?: string }>; error?: unknown };
    if (!response.ok) throw new Error("META_HTTP_" + response.status + ":" + JSON.stringify(payload).slice(0, 600));
    const id = payload.messages?.[0]?.id;
    if (!id) throw new Error("META_MISSING_MESSAGE_ID");
    return { providerMessageId: id };
  }
}
