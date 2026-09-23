import { MetaCloudChannel, type MetaChannelConfig } from "./meta.js";
import { StevoChannel, type StevoChannelConfig } from "./stevo.js";
import { parseProvider, type WhatsAppChannel, type WhatsAppProvider } from "./types.js";

export * from "./types.js";
export { MetaCloudChannel } from "./meta.js";
export { StevoChannel, StevoTransientError, normalizeStevoWebhook } from "./stevo.js";

export interface ChannelRegistryConfig {
  defaultProvider: WhatsAppProvider;
  meta: MetaChannelConfig;
  stevo: StevoChannelConfig;
}

export class ChannelRegistry {
  private cache = new Map<WhatsAppProvider, WhatsAppChannel>();
  constructor(private cfg: ChannelRegistryConfig, private fetcher: typeof fetch = fetch) {}

  get defaultProvider(): WhatsAppProvider {
    return this.cfg.defaultProvider;
  }

  /** Resposta sai sempre pelo provedor em que a conversa entrou; sem valor, usa o padrão. */
  resolve(provider?: unknown): WhatsAppChannel {
    const p = parseProvider(provider, this.cfg.defaultProvider);
    let ch = this.cache.get(p);
    if (!ch) {
      ch = p === "meta" ? new MetaCloudChannel(this.cfg.meta, this.fetcher) : new StevoChannel(this.cfg.stevo, this.fetcher);
      this.cache.set(p, ch);
    }
    return ch;
  }
}
