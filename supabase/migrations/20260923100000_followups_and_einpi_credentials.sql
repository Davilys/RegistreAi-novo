-- Follow-ups de conversa (regras WebMarcas 1-8) + custódia da credencial e-INPI (modo A, decisão do dono 23/09/2026).
-- PREPARADO. Aplicar só com OK do dono, junto com as demais migrations.
-- Todas as tabelas: RLS ligada, nenhum acesso anon/authenticated, GRANT explícito só ao service_role.

CREATE TABLE IF NOT EXISTS public.conversation_followups(
  thread_id uuid NOT NULL REFERENCES public.conversation_threads(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  step smallint NOT NULL CHECK (step IN (1,2,3)),
  status text NOT NULL CHECK (status IN ('pending','sent','cancelled','failed')),
  due_at timestamptz NOT NULL,
  sent_at timestamptz,
  cancelled_at timestamptz,
  attempt_count int NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 5),
  last_error text,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  skipped_duplicate boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, step)
);
CREATE INDEX IF NOT EXISTS conversation_followups_due_idx
  ON public.conversation_followups(due_at) WHERE status IN ('pending','failed');

CREATE TABLE IF NOT EXISTS public.credential_link_tokens(
  token_hash text PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('EINPI_NEW_REGISTRATION','EINPI_EXISTING','EINPI_RECOVERY')),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Senha só cifrada (AES-256-GCM, chave EINPI_CREDENTIAL_KEY_B64 fora do banco). Nunca texto claro.
CREATE TABLE IF NOT EXISTS public.einpi_credentials(
  workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  login text NOT NULL CHECK (login ~ '^[A-Za-z0-9]{1,10}$'),  -- usuário e-INPI (até 10 caracteres)
  secret_ciphertext bytea NOT NULL,
  secret_nonce bytea NOT NULL,
  key_version int NOT NULL DEFAULT 1,
  stored_at timestamptz NOT NULL DEFAULT now(),
  last_validated_at timestamptz,
  last_validation_ok boolean,
  expires_at timestamptz  -- caso fechado + 30 dias; job de retenção apaga
);

CREATE TABLE IF NOT EXISTS public.credential_access_events(
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  workspace_id uuid NOT NULL,
  actor text NOT NULL,
  reason text NOT NULL,
  action text NOT NULL CHECK (action IN ('store','decrypt','delete','purge')),
  occurred_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversation_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_link_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.einpi_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_access_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.conversation_followups, public.credential_link_tokens,
  public.einpi_credentials, public.credential_access_events FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_followups TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.credential_link_tokens TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.einpi_credentials TO service_role;
GRANT SELECT, INSERT ON public.credential_access_events TO service_role;  -- trilha só cresce
GRANT USAGE ON SEQUENCE public.credential_access_events_id_seq TO service_role;
