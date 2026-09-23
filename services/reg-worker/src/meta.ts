import { config } from "./config.js";
import { MetaCloudChannel } from "./channels/meta.js";

/** Mantido por compatibilidade. Código novo usa channels/ChannelRegistry. */
export async function sendWhatsAppText(to: string, body: string): Promise<string> {
  const ch = new MetaCloudChannel({
    accessToken: config.META_ACCESS_TOKEN,
    phoneNumberId: config.META_PHONE_NUMBER_ID,
    graphVersion: config.META_GRAPH_VERSION
  });
  return (await ch.sendText(to, body)).providerMessageId;
}
