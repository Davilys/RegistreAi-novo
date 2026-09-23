import { config } from "./config.js";
import { ChannelRegistry } from "./channels/index.js";

export const channels = new ChannelRegistry({
  defaultProvider: config.WHATSAPP_PROVIDER,
  meta: {
    accessToken: config.META_ACCESS_TOKEN,
    phoneNumberId: config.META_PHONE_NUMBER_ID,
    graphVersion: config.META_GRAPH_VERSION
  },
  stevo: {
    baseUrl: config.STEVO_BASE_URL,
    instance: config.STEVO_INSTANCE,
    apiKey: config.STEVO_API_KEY
  }
});
