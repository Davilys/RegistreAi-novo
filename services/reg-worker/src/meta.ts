import { config } from "./config.js";

export async function sendWhatsAppText(to: string, body: string): Promise<string> {
  if (!config.META_ACCESS_TOKEN || !config.META_PHONE_NUMBER_ID || !config.META_GRAPH_VERSION) {
    throw new Error("META_NOT_CONFIGURED");
  }

  const endpoint = "https://graph.facebook.com/" + config.META_GRAPH_VERSION + "/" + config.META_PHONE_NUMBER_ID + "/messages";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: "Bearer " + config.META_ACCESS_TOKEN,
      "content-type": "application/json"
    },
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
  return id;
}
