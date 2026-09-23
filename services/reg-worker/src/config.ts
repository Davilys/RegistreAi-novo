import { z } from "zod";

const schema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),

  OPENAI_API_KEY: z.string().min(20).optional(),
  OPENAI_MODEL_DEFAULT: z.string().default("gpt-5.6-terra"),
  OPENAI_MODEL_LEGAL: z.string().default("gpt-5.6-sol"),

  WEBHOOK_PAYLOAD_KEY_B64: z.string().min(40),
  PII_ENCRYPTION_KEY_B64: z.string().min(40),
  IDENTITY_HASH_KEY: z.string().min(24),
  PII_HASH_KEY: z.string().min(24),

  META_ACCESS_TOKEN: z.string().optional(),
  META_PHONE_NUMBER_ID: z.string().optional(),
  META_GRAPH_VERSION: z.string().regex(/^v\d+\.\d+$/).optional(),
  META_APP_SECRET: z.string().min(16).optional(),
  META_WEBHOOK_VERIFY_TOKEN: z.string().min(24).optional(),
  META_ENVIRONMENT: z.enum(["test","production"]).default("test"),
  META_ALLOWED_PHONE_NUMBER_IDS: z.string().default(""),
  META_MEDIA_MAX_BYTES: z.coerce.number().int().min(1024).max(104857600).default(104857600),

  ASAAS_API_KEY: z.string().optional(),
  ASAAS_ENV: z.enum(["sandbox","production"]).default("sandbox"),
  ASAAS_USER_AGENT: z.string().default("RegistreAi/0.1"),

  PUBLIC_SITE_URL: z.string().url().default("http://localhost:5173"),

  INPI_SEARCH_MODE: z.enum(["legacy_web","official_api"]).default("legacy_web"),
  INPI_OFFICIAL_API_BASE: z.string().url().optional(),
  INPI_OFFICIAL_API_TOKEN: z.string().optional(),
  INPI_TIMEOUT_MS: z.coerce.number().int().min(5000).max(60000).default(20000),

  WORKER_POLL_MS: z.coerce.number().int().min(250).max(30000).default(1200),
  WORKER_BATCH_SIZE: z.coerce.number().int().min(1).max(25).default(5),
  WORKER_VISIBILITY_TIMEOUT: z.coerce.number().int().min(30).max(1800).default(120)
});

export const config = schema.parse(process.env);
