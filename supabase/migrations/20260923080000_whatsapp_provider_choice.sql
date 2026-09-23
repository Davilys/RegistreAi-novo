-- Canal WhatsApp selecionável: API oficial (Meta Cloud API) ou Stevo.
-- PREPARADO. Aplicar só com OK do dono, junto com as demais migrations.

ALTER TABLE public.channel_identities
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'meta'
  CHECK (provider IN ('meta','stevo'));

ALTER TABLE public.outbound_messages
  ADD COLUMN IF NOT EXISTS provider text
  CHECK (provider IS NULL OR provider IN ('meta','stevo'));

ALTER TABLE public.integration_status DROP CONSTRAINT IF EXISTS integration_status_provider_check;
ALTER TABLE public.integration_status ADD CONSTRAINT integration_status_provider_check
  CHECK (provider = ANY (ARRAY['ASAAS','WHATSAPP_META','WHATSAPP_STEVO','OPENAI','INPI','RPI','EMAIL','HOSTINGER']));

-- Padrão do canal escolhido no CRM (Mais > Canal). O worker usa WHATSAPP_PROVIDER quando não há linha.
CREATE TABLE IF NOT EXISTS public.whatsapp_channel_settings(
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  default_provider text NOT NULL DEFAULT 'meta' CHECK (default_provider IN ('meta','stevo')),
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_channel_settings ENABLE ROW LEVEL SECURITY;
-- GRANT explícito (regra Supabase de 2026-10-30). Só o servidor lê/escreve; o CRM altera via função de admin.
REVOKE ALL ON public.whatsapp_channel_settings FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_channel_settings TO service_role;
