-- RegistreAi live schema snapshot\n-- Generated from Supabase project qxgfkpqlaffsesqtnojh on 2026-09-21T07:21:54Z
-- This is a reference snapshot of the current live database. Future DDL must be added as versioned migrations.\n\nCREATE SCHEMA IF NOT EXISTS app_private;\nCREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;\nCREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA extensions;\nCREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;\nCREATE EXTENSION IF NOT EXISTS pgmq;\nCREATE EXTENSION IF NOT EXISTS pg_cron;\n\nCREATE TABLE app_private.channel_identity_pii (
  channel_identity_id uuid NOT NULL,
  ciphertext text NOT NULL,
  nonce_b64 text NOT NULL,
  algorithm text DEFAULT 'AES-256-GCM'::text NOT NULL,
  key_version integer DEFAULT 1 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE app_private.holder_pii (
  holder_id uuid NOT NULL,
  ciphertext bytea NOT NULL,
  nonce bytea NOT NULL,
  key_version integer DEFAULT 1 NOT NULL,
  algorithm text DEFAULT 'AES-256-GCM'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE app_private.onboarding_profile_pii (
  profile_id uuid NOT NULL,
  ciphertext text NOT NULL,
  nonce_b64 text NOT NULL,
  algorithm text DEFAULT 'AES-256-GCM'::text NOT NULL,
  key_version integer DEFAULT 1 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.agent_instances (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  status text DEFAULT 'active'::text NOT NULL,
  agent_name text DEFAULT 'Reg'::text NOT NULL,
  prompt_version text DEFAULT 'v1'::text NOT NULL,
  policy_version text DEFAULT 'v1'::text NOT NULL,
  memory_version integer DEFAULT 1 NOT NULL,
  last_active_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.agent_runs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  process_id uuid,
  agent_role text NOT NULL,
  prompt_version text NOT NULL,
  model text,
  status text DEFAULT 'started'::text NOT NULL,
  input_redacted jsonb DEFAULT '{}'::jsonb NOT NULL,
  output_redacted jsonb DEFAULT '{}'::jsonb NOT NULL,
  started_at timestamp with time zone DEFAULT now() NOT NULL,
  completed_at timestamp with time zone,
  error_code text,
  error_message text
);

CREATE TABLE public.agent_state (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  process_id uuid,
  scope text NOT NULL,
  state jsonb DEFAULT '{}'::jsonb NOT NULL,
  summary text,
  version integer DEFAULT 1 NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  workspace_id uuid,
  process_id uuid,
  actor_type text NOT NULL,
  actor_ref text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  request_id text,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.channel_identities (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  channel text NOT NULL,
  identifier_hash text NOT NULL,
  identifier_masked text,
  verified boolean DEFAULT false NOT NULL,
  is_primary boolean DEFAULT false NOT NULL,
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.contract_access_tokens (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contract_document_id uuid NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  revoked_at timestamp with time zone,
  last_viewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.contract_documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  subscription_id uuid,
  contract_version text NOT NULL,
  object_path text NOT NULL,
  document_sha256 text NOT NULL,
  status text DEFAULT 'issued'::text NOT NULL,
  accepted_phrase text,
  accepted_at timestamp with time zone,
  acceptance_channel text,
  acceptance_evidence jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.conversation_threads (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  channel text DEFAULT 'whatsapp'::text NOT NULL,
  provider_thread_id text,
  status text DEFAULT 'open'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.customer_consents (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  consent_type text NOT NULL,
  document_version text NOT NULL,
  accepted boolean NOT NULL,
  accepted_at timestamp with time zone,
  revoked_at timestamp with time zone,
  channel text,
  evidence jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.data_subject_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid,
  request_type text NOT NULL,
  status text DEFAULT 'received'::text NOT NULL,
  received_at timestamp with time zone DEFAULT now() NOT NULL,
  completed_at timestamp with time zone,
  notes text
);

CREATE TABLE public.deadline_reminders (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  process_id uuid NOT NULL,
  deadline_id uuid NOT NULL,
  milestone text NOT NULL,
  sent_at timestamp with time zone,
  outbound_message_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.deadline_rules (
  event_type text NOT NULL,
  legal_window_days integer NOT NULL,
  start_rule text DEFAULT 'FIRST_BUSINESS_DAY_AFTER_PUBLICATION'::text NOT NULL,
  continuous_days boolean DEFAULT true NOT NULL,
  extend_due_if_non_working boolean DEFAULT true NOT NULL,
  source_name text NOT NULL,
  source_url text NOT NULL,
  active boolean DEFAULT true NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.deadlines (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  process_id uuid NOT NULL,
  source_event_id uuid,
  kind text NOT NULL,
  opened_at timestamp with time zone DEFAULT now() NOT NULL,
  due_at timestamp with time zone NOT NULL,
  status text DEFAULT 'open'::text NOT NULL,
  customer_dependency boolean DEFAULT false NOT NULL,
  satisfied_at timestamp with time zone,
  missed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  publication_date date,
  legal_window_days integer,
  calendar_verified boolean DEFAULT false NOT NULL,
  calculation_basis text
);

CREATE TABLE public.decision_checks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  process_id uuid,
  legal_case_id uuid,
  action_type text NOT NULL,
  passed boolean NOT NULL,
  checks jsonb DEFAULT '{}'::jsonb NOT NULL,
  blocked_reasons text[] DEFAULT '{}'::text[] NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  process_id uuid,
  legal_case_id uuid,
  requirement_id uuid,
  object_path text NOT NULL,
  original_filename text,
  mime_type text,
  size_bytes bigint,
  sha256 text,
  classification text,
  verification_status text DEFAULT 'pending'::text NOT NULL,
  uploaded_by text DEFAULT 'customer'::text NOT NULL,
  received_at timestamp with time zone DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.federal_fees (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  process_id uuid,
  legal_case_id uuid,
  fee_type text NOT NULL,
  provider text DEFAULT 'INPI'::text NOT NULL,
  external_reference text,
  amount_cents integer,
  due_date date,
  status text DEFAULT 'generated'::text NOT NULL,
  payment_confirmed_at timestamp with time zone,
  generated_document_path text,
  proof_document_id uuid,
  last_checked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  service_code text,
  nice_class integer,
  expected_amount_cents integer,
  discount_tier text,
  amount_verified boolean DEFAULT false NOT NULL
);

CREATE TABLE public.fee_eligibility_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  holder_id uuid NOT NULL,
  process_id uuid NOT NULL,
  status text DEFAULT 'PENDING'::text NOT NULL,
  declared_category text,
  provider_message_id text,
  answered_at timestamp with time zone,
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.holder_fee_profiles (
  holder_id uuid NOT NULL,
  discount_tier text DEFAULT 'UNKNOWN'::text NOT NULL,
  eligibility_basis text,
  verification_status text DEFAULT 'UNVERIFIED'::text NOT NULL,
  verified_at timestamp with time zone,
  source text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.holders (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  holder_type text NOT NULL,
  legal_name text NOT NULL,
  document_hash text NOT NULL,
  document_masked text NOT NULL,
  registration_status text DEFAULT 'pending'::text NOT NULL,
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.inpi_calendar_years (
  year integer NOT NULL,
  verified boolean DEFAULT false NOT NULL,
  source_name text NOT NULL,
  source_url text NOT NULL,
  verified_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.inpi_fee_catalog (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  service_code text NOT NULL,
  service_name text NOT NULL,
  scope text DEFAULT 'MARKS'::text NOT NULL,
  billing_unit text DEFAULT 'SERVICE'::text NOT NULL,
  standard_amount_cents integer NOT NULL,
  discount50_amount_cents integer,
  effective_from date NOT NULL,
  effective_to date,
  source_version text NOT NULL,
  source_url text NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.inpi_non_working_days (
  day date NOT NULL,
  name text NOT NULL,
  scope text DEFAULT 'INPI_RJ'::text NOT NULL,
  source_url text NOT NULL,
  verified boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.integration_status (
  provider text NOT NULL,
  enabled boolean DEFAULT false NOT NULL,
  environment text DEFAULT 'sandbox'::text NOT NULL,
  health_status text DEFAULT 'unconfigured'::text NOT NULL,
  last_health_check_at timestamp with time zone,
  last_success_at timestamp with time zone,
  last_error_code text,
  last_error_message text,
  config_redacted jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.legal_cases (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  process_id uuid NOT NULL,
  case_type text NOT NULL,
  source_event_id uuid,
  deadline_id uuid,
  status text DEFAULT 'analysis'::text NOT NULL,
  legal_basis jsonb DEFAULT '[]'::jsonb NOT NULL,
  strategy_summary text,
  customer_message_summary text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.legal_requirements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  legal_case_id uuid NOT NULL,
  requirement_type text NOT NULL,
  label text NOT NULL,
  instructions text,
  required boolean DEFAULT true NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  fulfilled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  thread_id uuid NOT NULL,
  provider_message_id text,
  direction text NOT NULL,
  message_type text DEFAULT 'text'::text NOT NULL,
  content_redacted text,
  content_ciphertext bytea,
  content_nonce bytea,
  encryption_key_version integer,
  process_id uuid,
  sent_at timestamp with time zone NOT NULL,
  delivery_status text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.onboarding_profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  holder_type text,
  holder_document_hash text,
  holder_document_masked text,
  name_masked text,
  email_hash text,
  email_masked text,
  plan_code text,
  activity_description text,
  onboarding_status text DEFAULT 'collecting'::text NOT NULL,
  missing_fields text[] DEFAULT '{}'::text[] NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.outbound_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  thread_id uuid,
  process_id uuid,
  channel text DEFAULT 'whatsapp'::text NOT NULL,
  template_key text,
  body_redacted text,
  status text DEFAULT 'queued'::text NOT NULL,
  scheduled_at timestamp with time zone DEFAULT now() NOT NULL,
  sent_at timestamp with time zone,
  provider_message_id text,
  idempotency_key text,
  attempts integer DEFAULT 0 NOT NULL,
  last_error text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  body_ciphertext text,
  body_nonce_b64 text,
  encryption_key_version integer
);

CREATE TABLE public.payments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  subscription_id uuid,
  payment_type text NOT NULL,
  provider text DEFAULT 'ASAAS'::text NOT NULL,
  external_id text NOT NULL,
  amount_cents integer NOT NULL,
  due_date date,
  status text DEFAULT 'pending'::text NOT NULL,
  pix_copy_paste text,
  pix_qr_payload text,
  paid_at timestamp with time zone,
  raw_status text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.plans (
  code text NOT NULL,
  name text NOT NULL,
  setup_fee_cents integer NOT NULL,
  monthly_fee_cents integer NOT NULL,
  unlimited_marks boolean DEFAULT false NOT NULL,
  resources_included boolean DEFAULT false NOT NULL,
  guarantee_included boolean DEFAULT false NOT NULL,
  active boolean DEFAULT true NOT NULL,
  public_description text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.process_classes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  process_id uuid NOT NULL,
  nice_class integer NOT NULL,
  specification text,
  is_primary boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.process_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  process_id uuid NOT NULL,
  event_type text NOT NULL,
  source text NOT NULL,
  source_external_id text,
  occurred_at timestamp with time zone NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb NOT NULL,
  classification text,
  requires_action boolean DEFAULT false NOT NULL,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.process_transition_rules (
  from_status text NOT NULL,
  to_status text NOT NULL,
  active boolean DEFAULT true NOT NULL
);

CREATE TABLE public.processes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  subscription_id uuid,
  trademark_id uuid NOT NULL,
  holder_id uuid NOT NULL,
  inpi_process_number text,
  filing_date date,
  status text DEFAULT 'intake'::text NOT NULL,
  last_rpi_number text,
  last_rpi_date date,
  next_action_at timestamp with time zone,
  automation_hold boolean DEFAULT false NOT NULL,
  hold_reason text,
  version integer DEFAULT 1 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  hold_resume_status text
);

CREATE TABLE public.rpi_editions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  rpi_number integer NOT NULL,
  publication_date date,
  section text DEFAULT 'MARKS'::text NOT NULL,
  source_url text NOT NULL,
  source_sha256 text,
  status text DEFAULT 'discovered'::text NOT NULL,
  matching_processes integer DEFAULT 0 NOT NULL,
  total_events integer DEFAULT 0 NOT NULL,
  attempts integer DEFAULT 0 NOT NULL,
  last_error text,
  discovered_at timestamp with time zone DEFAULT now() NOT NULL,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.security_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid,
  process_id uuid,
  severity text NOT NULL,
  event_type text NOT NULL,
  source text NOT NULL,
  blocked boolean DEFAULT false NOT NULL,
  details_redacted jsonb DEFAULT '{}'::jsonb NOT NULL,
  occurred_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.subscriptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  plan_code text NOT NULL,
  holder_id uuid NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  asaas_customer_id text,
  asaas_subscription_id text,
  setup_payment_id text,
  started_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  terms_version text,
  terms_accepted_at timestamp with time zone,
  holder_locked boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.tool_runs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid,
  process_id uuid,
  tool_name text NOT NULL,
  idempotency_key text,
  status text DEFAULT 'started'::text NOT NULL,
  input_redacted jsonb DEFAULT '{}'::jsonb NOT NULL,
  output_redacted jsonb DEFAULT '{}'::jsonb NOT NULL,
  started_at timestamp with time zone DEFAULT now() NOT NULL,
  finished_at timestamp with time zone,
  error_code text,
  error_message text
);

CREATE TABLE public.trademarks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  holder_id uuid NOT NULL,
  name text NOT NULL,
  normalized_name text NOT NULL,
  presentation_type text DEFAULT 'nominativa'::text NOT NULL,
  activity_description text,
  logo_object_path text,
  status text DEFAULT 'draft'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.viability_confirmations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  process_id uuid NOT NULL,
  report_id uuid NOT NULL,
  status text DEFAULT 'PENDING'::text NOT NULL,
  confirmed_class integer,
  provider_message_id text,
  confirmed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.viability_matches (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  report_id uuid NOT NULL,
  inpi_process_number text,
  mark_name text NOT NULL,
  nice_class integer,
  status text,
  similarity numeric(5,4),
  match_kind text,
  evidence jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.viability_reports (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  process_id uuid NOT NULL,
  verdict text NOT NULL,
  confidence numeric(5,4),
  summary text NOT NULL,
  model text,
  search_version text,
  completed_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.webhook_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  provider text NOT NULL,
  external_event_id text NOT NULL,
  event_type text NOT NULL,
  signature_valid boolean,
  received_at timestamp with time zone DEFAULT now() NOT NULL,
  processed_at timestamp with time zone,
  processing_status text DEFAULT 'received'::text NOT NULL,
  attempts integer DEFAULT 0 NOT NULL,
  last_error text,
  payload jsonb NOT NULL
);

CREATE TABLE public.webhook_payloads (
  webhook_event_id uuid NOT NULL,
  ciphertext text NOT NULL,
  nonce_b64 text NOT NULL,
  algorithm text DEFAULT 'AES-256-GCM'::text NOT NULL,
  key_version integer DEFAULT 1 NOT NULL,
  sha256_hex text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.workflow_tasks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL,
  process_id uuid,
  legal_case_id uuid,
  task_type text NOT NULL,
  owner_type text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  priority integer DEFAULT 50 NOT NULL,
  due_at timestamp with time zone,
  payload_redacted jsonb DEFAULT '{}'::jsonb NOT NULL,
  idempotency_key text,
  attempts integer DEFAULT 0 NOT NULL,
  last_error text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  completed_at timestamp with time zone
);

CREATE TABLE public.workspaces (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  status text DEFAULT 'lead'::text NOT NULL,
  display_name text,
  primary_whatsapp_hash text,
  primary_whatsapp_masked text,
  locale text DEFAULT 'pt-BR'::text NOT NULL,
  timezone text DEFAULT 'America/Sao_Paulo'::text NOT NULL,
  source text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE app_private.channel_identity_pii ADD CONSTRAINT channel_identity_pii_channel_identity_id_fkey FOREIGN KEY (channel_identity_id) REFERENCES channel_identities(id) ON DELETE CASCADE;
ALTER TABLE app_private.channel_identity_pii ADD CONSTRAINT channel_identity_pii_pkey PRIMARY KEY (channel_identity_id);
ALTER TABLE app_private.holder_pii ADD CONSTRAINT holder_pii_pkey PRIMARY KEY (holder_id);
ALTER TABLE app_private.holder_pii ADD CONSTRAINT holder_pii_holder_id_fkey FOREIGN KEY (holder_id) REFERENCES holders(id) ON DELETE CASCADE;
ALTER TABLE app_private.onboarding_profile_pii ADD CONSTRAINT onboarding_profile_pii_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES onboarding_profiles(id) ON DELETE CASCADE;
ALTER TABLE app_private.onboarding_profile_pii ADD CONSTRAINT onboarding_profile_pii_pkey PRIMARY KEY (profile_id);
ALTER TABLE public.agent_instances ADD CONSTRAINT agent_instances_pkey PRIMARY KEY (id);
ALTER TABLE public.agent_instances ADD CONSTRAINT agent_instances_workspace_id_key UNIQUE (workspace_id);
ALTER TABLE public.agent_instances ADD CONSTRAINT agent_instances_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.agent_instances ADD CONSTRAINT agent_instances_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'blocked'::text])));
ALTER TABLE public.agent_runs ADD CONSTRAINT agent_runs_status_check CHECK ((status = ANY (ARRAY['started'::text, 'succeeded'::text, 'failed'::text, 'blocked'::text])));
ALTER TABLE public.agent_runs ADD CONSTRAINT agent_runs_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.agent_runs ADD CONSTRAINT agent_runs_process_id_fkey FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE SET NULL;
ALTER TABLE public.agent_runs ADD CONSTRAINT agent_runs_pkey PRIMARY KEY (id);
ALTER TABLE public.agent_state ADD CONSTRAINT agent_state_process_workspace_fk FOREIGN KEY (process_id, workspace_id) REFERENCES processes(id, workspace_id);
ALTER TABLE public.agent_state ADD CONSTRAINT agent_state_scope_check CHECK ((scope = ANY (ARRAY['workspace'::text, 'process'::text])));
ALTER TABLE public.agent_state ADD CONSTRAINT agent_state_process_id_fkey FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE;
ALTER TABLE public.agent_state ADD CONSTRAINT agent_state_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.agent_state ADD CONSTRAINT agent_state_pkey PRIMARY KEY (id);
ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);
ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_actor_type_check CHECK ((actor_type = ANY (ARRAY['system'::text, 'agent'::text, 'customer'::text, 'admin'::text, 'integration'::text])));
ALTER TABLE public.channel_identities ADD CONSTRAINT channel_identities_channel_identifier_hash_key UNIQUE (channel, identifier_hash);
ALTER TABLE public.channel_identities ADD CONSTRAINT channel_identities_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.channel_identities ADD CONSTRAINT channel_identities_pkey PRIMARY KEY (id);
ALTER TABLE public.channel_identities ADD CONSTRAINT channel_identities_channel_check CHECK ((channel = ANY (ARRAY['whatsapp'::text, 'email'::text])));
ALTER TABLE public.contract_access_tokens ADD CONSTRAINT contract_access_tokens_contract_document_id_fkey FOREIGN KEY (contract_document_id) REFERENCES contract_documents(id) ON DELETE CASCADE;
ALTER TABLE public.contract_access_tokens ADD CONSTRAINT contract_access_tokens_pkey PRIMARY KEY (id);
ALTER TABLE public.contract_access_tokens ADD CONSTRAINT contract_access_tokens_token_hash_key UNIQUE (token_hash);
ALTER TABLE public.contract_documents ADD CONSTRAINT contract_documents_pkey PRIMARY KEY (id);
ALTER TABLE public.contract_documents ADD CONSTRAINT contract_documents_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;
ALTER TABLE public.contract_documents ADD CONSTRAINT contract_documents_status_check CHECK ((status = ANY (ARRAY['issued'::text, 'accepted'::text, 'superseded'::text, 'cancelled'::text])));
ALTER TABLE public.contract_documents ADD CONSTRAINT contract_documents_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.conversation_threads ADD CONSTRAINT conversation_threads_channel_check CHECK ((channel = ANY (ARRAY['whatsapp'::text, 'email'::text, 'web'::text])));
ALTER TABLE public.conversation_threads ADD CONSTRAINT conversation_threads_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text, 'blocked'::text])));
ALTER TABLE public.conversation_threads ADD CONSTRAINT conversation_threads_pkey PRIMARY KEY (id);
ALTER TABLE public.conversation_threads ADD CONSTRAINT threads_id_workspace_uq UNIQUE (id, workspace_id);
ALTER TABLE public.conversation_threads ADD CONSTRAINT conversation_threads_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.customer_consents ADD CONSTRAINT customer_consents_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.customer_consents ADD CONSTRAINT customer_consents_pkey PRIMARY KEY (id);
ALTER TABLE public.data_subject_requests ADD CONSTRAINT data_subject_requests_status_check CHECK ((status = ANY (ARRAY['received'::text, 'verifying_identity'::text, 'processing'::text, 'completed'::text, 'rejected'::text])));
ALTER TABLE public.data_subject_requests ADD CONSTRAINT data_subject_requests_pkey PRIMARY KEY (id);
ALTER TABLE public.data_subject_requests ADD CONSTRAINT data_subject_requests_request_type_check CHECK ((request_type = ANY (ARRAY['ACCESS'::text, 'CORRECTION'::text, 'DELETION'::text, 'PORTABILITY'::text, 'REVOCATION'::text, 'OTHER'::text])));
ALTER TABLE public.data_subject_requests ADD CONSTRAINT data_subject_requests_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE public.deadline_reminders ADD CONSTRAINT deadline_reminders_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.deadline_reminders ADD CONSTRAINT deadline_reminders_deadline_id_fkey FOREIGN KEY (deadline_id) REFERENCES deadlines(id) ON DELETE CASCADE;
ALTER TABLE public.deadline_reminders ADD CONSTRAINT deadline_reminders_outbound_message_id_fkey FOREIGN KEY (outbound_message_id) REFERENCES outbound_messages(id) ON DELETE SET NULL;
ALTER TABLE public.deadline_reminders ADD CONSTRAINT deadline_reminders_deadline_id_milestone_key UNIQUE (deadline_id, milestone);
ALTER TABLE public.deadline_reminders ADD CONSTRAINT deadline_reminders_process_id_fkey FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE;
ALTER TABLE public.deadline_reminders ADD CONSTRAINT deadline_reminders_pkey PRIMARY KEY (id);
ALTER TABLE public.deadline_reminders ADD CONSTRAINT deadline_reminders_milestone_check CHECK ((milestone = ANY (ARRAY['D15'::text, 'D7'::text, 'D3'::text, 'D1'::text, 'D0'::text, 'MISSED'::text])));
ALTER TABLE public.deadline_rules ADD CONSTRAINT deadline_rules_legal_window_days_check CHECK ((legal_window_days > 0));
ALTER TABLE public.deadline_rules ADD CONSTRAINT deadline_rules_start_rule_check CHECK ((start_rule = ANY (ARRAY['FIRST_BUSINESS_DAY_AFTER_PUBLICATION'::text, 'PUBLICATION_DATE'::text])));
ALTER TABLE public.deadline_rules ADD CONSTRAINT deadline_rules_pkey PRIMARY KEY (event_type);
ALTER TABLE public.deadlines ADD CONSTRAINT deadlines_process_id_fkey FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE;
ALTER TABLE public.deadlines ADD CONSTRAINT deadlines_legal_window_days_check CHECK (((legal_window_days IS NULL) OR (legal_window_days > 0)));
ALTER TABLE public.deadlines ADD CONSTRAINT deadlines_pkey PRIMARY KEY (id);
ALTER TABLE public.deadlines ADD CONSTRAINT deadlines_process_workspace_fk FOREIGN KEY (process_id, workspace_id) REFERENCES processes(id, workspace_id);
ALTER TABLE public.deadlines ADD CONSTRAINT deadlines_status_check CHECK ((status = ANY (ARRAY['open'::text, 'satisfied'::text, 'missed'::text, 'cancelled'::text])));
ALTER TABLE public.deadlines ADD CONSTRAINT deadlines_source_event_id_fkey FOREIGN KEY (source_event_id) REFERENCES process_events(id) ON DELETE SET NULL;
ALTER TABLE public.deadlines ADD CONSTRAINT deadlines_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.decision_checks ADD CONSTRAINT decision_checks_pkey PRIMARY KEY (id);
ALTER TABLE public.decision_checks ADD CONSTRAINT decision_checks_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.decision_checks ADD CONSTRAINT decision_checks_process_id_fkey FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE;
ALTER TABLE public.decision_checks ADD CONSTRAINT decision_checks_legal_case_id_fkey FOREIGN KEY (legal_case_id) REFERENCES legal_cases(id) ON DELETE CASCADE;
ALTER TABLE public.documents ADD CONSTRAINT documents_size_bytes_check CHECK (((size_bytes IS NULL) OR (size_bytes >= 0)));
ALTER TABLE public.documents ADD CONSTRAINT documents_process_workspace_fk FOREIGN KEY (process_id, workspace_id) REFERENCES processes(id, workspace_id);
ALTER TABLE public.documents ADD CONSTRAINT documents_legal_case_workspace_fk FOREIGN KEY (legal_case_id, workspace_id) REFERENCES legal_cases(id, workspace_id);
ALTER TABLE public.documents ADD CONSTRAINT documents_requirement_id_fkey FOREIGN KEY (requirement_id) REFERENCES legal_requirements(id) ON DELETE SET NULL;
ALTER TABLE public.documents ADD CONSTRAINT documents_legal_case_id_fkey FOREIGN KEY (legal_case_id) REFERENCES legal_cases(id) ON DELETE CASCADE;
ALTER TABLE public.documents ADD CONSTRAINT documents_process_id_fkey FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE;
ALTER TABLE public.documents ADD CONSTRAINT documents_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.documents ADD CONSTRAINT documents_object_path_key UNIQUE (object_path);
ALTER TABLE public.documents ADD CONSTRAINT documents_pkey PRIMARY KEY (id);
ALTER TABLE public.documents ADD CONSTRAINT documents_uploaded_by_check CHECK ((uploaded_by = ANY (ARRAY['customer'::text, 'system'::text, 'inpi'::text, 'agent'::text])));
ALTER TABLE public.documents ADD CONSTRAINT documents_verification_status_check CHECK ((verification_status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text, 'needs_review'::text])));
ALTER TABLE public.federal_fees ADD CONSTRAINT federal_fees_legal_case_workspace_fk FOREIGN KEY (legal_case_id, workspace_id) REFERENCES legal_cases(id, workspace_id);
ALTER TABLE public.federal_fees ADD CONSTRAINT federal_fees_amount_cents_check CHECK (((amount_cents IS NULL) OR (amount_cents >= 0)));
ALTER TABLE public.federal_fees ADD CONSTRAINT federal_fees_pkey PRIMARY KEY (id);
ALTER TABLE public.federal_fees ADD CONSTRAINT federal_fees_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.federal_fees ADD CONSTRAINT federal_fees_process_id_fkey FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE;
ALTER TABLE public.federal_fees ADD CONSTRAINT federal_fees_legal_case_id_fkey FOREIGN KEY (legal_case_id) REFERENCES legal_cases(id) ON DELETE CASCADE;
ALTER TABLE public.federal_fees ADD CONSTRAINT federal_fees_nice_class_check CHECK (((nice_class IS NULL) OR ((nice_class >= 1) AND (nice_class <= 45))));
ALTER TABLE public.federal_fees ADD CONSTRAINT federal_fees_expected_amount_cents_check CHECK (((expected_amount_cents IS NULL) OR (expected_amount_cents >= 0)));
ALTER TABLE public.federal_fees ADD CONSTRAINT federal_fees_discount_tier_check CHECK (((discount_tier IS NULL) OR (discount_tier = ANY (ARRAY['STANDARD'::text, 'DISCOUNT_50'::text, 'DISCOUNT_100'::text]))));
ALTER TABLE public.federal_fees ADD CONSTRAINT federal_fees_proof_document_id_fkey FOREIGN KEY (proof_document_id) REFERENCES documents(id) ON DELETE SET NULL;
ALTER TABLE public.federal_fees ADD CONSTRAINT federal_fees_status_check CHECK ((status = ANY (ARRAY['generated'::text, 'sent'::text, 'proof_received'::text, 'checking'::text, 'confirmed'::text, 'expired'::text, 'cancelled'::text, 'error'::text])));
ALTER TABLE public.federal_fees ADD CONSTRAINT federal_fees_process_workspace_fk FOREIGN KEY (process_id, workspace_id) REFERENCES processes(id, workspace_id);
ALTER TABLE public.fee_eligibility_requests ADD CONSTRAINT fee_eligibility_requests_holder_id_fkey FOREIGN KEY (holder_id) REFERENCES holders(id) ON DELETE CASCADE;
ALTER TABLE public.fee_eligibility_requests ADD CONSTRAINT fee_eligibility_requests_process_id_fkey FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE;
ALTER TABLE public.fee_eligibility_requests ADD CONSTRAINT fee_eligibility_requests_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'ANSWERED'::text, 'VERIFIED'::text, 'REJECTED'::text, 'CANCELLED'::text])));
ALTER TABLE public.fee_eligibility_requests ADD CONSTRAINT fee_eligibility_requests_pkey PRIMARY KEY (id);
ALTER TABLE public.fee_eligibility_requests ADD CONSTRAINT fee_eligibility_requests_process_id_key UNIQUE (process_id);
ALTER TABLE public.fee_eligibility_requests ADD CONSTRAINT fee_eligibility_requests_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.holder_fee_profiles ADD CONSTRAINT holder_fee_profiles_pkey PRIMARY KEY (holder_id);
ALTER TABLE public.holder_fee_profiles ADD CONSTRAINT holder_fee_profiles_verification_status_check CHECK ((verification_status = ANY (ARRAY['UNVERIFIED'::text, 'PENDING_EVIDENCE'::text, 'VERIFIED'::text, 'REJECTED'::text])));
ALTER TABLE public.holder_fee_profiles ADD CONSTRAINT holder_fee_profiles_discount_tier_check CHECK ((discount_tier = ANY (ARRAY['UNKNOWN'::text, 'STANDARD'::text, 'DISCOUNT_50'::text, 'DISCOUNT_100'::text])));
ALTER TABLE public.holder_fee_profiles ADD CONSTRAINT holder_fee_profiles_holder_id_fkey FOREIGN KEY (holder_id) REFERENCES holders(id) ON DELETE CASCADE;
ALTER TABLE public.holders ADD CONSTRAINT holders_holder_type_check CHECK ((holder_type = ANY (ARRAY['CPF'::text, 'CNPJ'::text])));
ALTER TABLE public.holders ADD CONSTRAINT holders_workspace_id_document_hash_key UNIQUE (workspace_id, document_hash);
ALTER TABLE public.holders ADD CONSTRAINT holders_registration_status_check CHECK ((registration_status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text, 'inactive'::text])));
ALTER TABLE public.holders ADD CONSTRAINT holders_id_workspace_uq UNIQUE (id, workspace_id);
ALTER TABLE public.holders ADD CONSTRAINT holders_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.holders ADD CONSTRAINT holders_pkey PRIMARY KEY (id);
ALTER TABLE public.inpi_calendar_years ADD CONSTRAINT inpi_calendar_years_year_check CHECK (((year >= 2000) AND (year <= 2200)));
ALTER TABLE public.inpi_calendar_years ADD CONSTRAINT inpi_calendar_years_pkey PRIMARY KEY (year);
ALTER TABLE public.inpi_fee_catalog ADD CONSTRAINT inpi_fee_catalog_standard_amount_cents_check CHECK ((standard_amount_cents >= 0));
ALTER TABLE public.inpi_fee_catalog ADD CONSTRAINT inpi_fee_catalog_service_code_effective_from_key UNIQUE (service_code, effective_from);
ALTER TABLE public.inpi_fee_catalog ADD CONSTRAINT inpi_fee_catalog_pkey PRIMARY KEY (id);
ALTER TABLE public.inpi_fee_catalog ADD CONSTRAINT inpi_fee_catalog_discount50_amount_cents_check CHECK (((discount50_amount_cents IS NULL) OR (discount50_amount_cents >= 0)));
ALTER TABLE public.inpi_fee_catalog ADD CONSTRAINT inpi_fee_catalog_billing_unit_check CHECK ((billing_unit = ANY (ARRAY['SERVICE'::text, 'CLASS'::text, 'PROCESS'::text])));
ALTER TABLE public.inpi_non_working_days ADD CONSTRAINT inpi_non_working_days_pkey PRIMARY KEY (day);
ALTER TABLE public.integration_status ADD CONSTRAINT integration_status_pkey PRIMARY KEY (provider);
ALTER TABLE public.integration_status ADD CONSTRAINT integration_status_provider_check CHECK ((provider = ANY (ARRAY['ASAAS'::text, 'WHATSAPP_META'::text, 'OPENAI'::text, 'INPI'::text, 'RPI'::text, 'EMAIL'::text, 'HOSTINGER'::text])));
ALTER TABLE public.integration_status ADD CONSTRAINT integration_status_environment_check CHECK ((environment = ANY (ARRAY['sandbox'::text, 'production'::text])));
ALTER TABLE public.integration_status ADD CONSTRAINT integration_status_health_status_check CHECK ((health_status = ANY (ARRAY['unconfigured'::text, 'healthy'::text, 'degraded'::text, 'down'::text])));
ALTER TABLE public.legal_cases ADD CONSTRAINT legal_cases_process_id_fkey FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE;
ALTER TABLE public.legal_cases ADD CONSTRAINT legal_cases_process_workspace_fk FOREIGN KEY (process_id, workspace_id) REFERENCES processes(id, workspace_id);
ALTER TABLE public.legal_cases ADD CONSTRAINT legal_cases_id_workspace_uq UNIQUE (id, workspace_id);
ALTER TABLE public.legal_cases ADD CONSTRAINT legal_cases_source_event_id_fkey FOREIGN KEY (source_event_id) REFERENCES process_events(id) ON DELETE SET NULL;
ALTER TABLE public.legal_cases ADD CONSTRAINT legal_cases_status_check CHECK ((status = ANY (ARRAY['analysis'::text, 'awaiting_customer'::text, 'awaiting_fee'::text, 'drafting'::text, 'review'::text, 'ready_to_file'::text, 'filing'::text, 'filed'::text, 'missed'::text, 'closed'::text, 'error_hold'::text])));
ALTER TABLE public.legal_cases ADD CONSTRAINT legal_cases_case_type_check CHECK ((case_type = ANY (ARRAY['OPPOSITION'::text, 'OFFICE_ACTION'::text, 'MERIT_REQUIREMENT'::text, 'REFUSAL'::text, 'APPEAL'::text, 'OTHER'::text])));
ALTER TABLE public.legal_cases ADD CONSTRAINT legal_cases_deadline_id_fkey FOREIGN KEY (deadline_id) REFERENCES deadlines(id) ON DELETE SET NULL;
ALTER TABLE public.legal_cases ADD CONSTRAINT legal_cases_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.legal_cases ADD CONSTRAINT legal_cases_pkey PRIMARY KEY (id);
ALTER TABLE public.legal_requirements ADD CONSTRAINT legal_requirements_requirement_type_check CHECK ((requirement_type = ANY (ARRAY['DOCUMENT'::text, 'INFORMATION'::text, 'PAYMENT'::text, 'CONFIRMATION'::text])));
ALTER TABLE public.legal_requirements ADD CONSTRAINT legal_requirements_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'received'::text, 'verified'::text, 'rejected'::text, 'waived'::text])));
ALTER TABLE public.legal_requirements ADD CONSTRAINT legal_requirements_pkey PRIMARY KEY (id);
ALTER TABLE public.legal_requirements ADD CONSTRAINT legal_requirements_legal_case_id_fkey FOREIGN KEY (legal_case_id) REFERENCES legal_cases(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
ALTER TABLE public.messages ADD CONSTRAINT messages_direction_check CHECK ((direction = ANY (ARRAY['inbound'::text, 'outbound'::text])));
ALTER TABLE public.messages ADD CONSTRAINT messages_thread_workspace_fk FOREIGN KEY (thread_id, workspace_id) REFERENCES conversation_threads(id, workspace_id);
ALTER TABLE public.messages ADD CONSTRAINT messages_process_workspace_fk FOREIGN KEY (process_id, workspace_id) REFERENCES processes(id, workspace_id);
ALTER TABLE public.messages ADD CONSTRAINT messages_process_id_fkey FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD CONSTRAINT messages_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES conversation_threads(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.onboarding_profiles ADD CONSTRAINT onboarding_profiles_plan_code_fkey FOREIGN KEY (plan_code) REFERENCES plans(code);
ALTER TABLE public.onboarding_profiles ADD CONSTRAINT onboarding_profiles_holder_type_check CHECK ((holder_type = ANY (ARRAY['CPF'::text, 'CNPJ'::text])));
ALTER TABLE public.onboarding_profiles ADD CONSTRAINT onboarding_profiles_onboarding_status_check CHECK ((onboarding_status = ANY (ARRAY['collecting'::text, 'ready_for_contract'::text, 'contracted'::text, 'ready_for_payment'::text, 'paid'::text, 'completed'::text, 'blocked'::text])));
ALTER TABLE public.onboarding_profiles ADD CONSTRAINT onboarding_profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.onboarding_profiles ADD CONSTRAINT onboarding_profiles_workspace_id_key UNIQUE (workspace_id);
ALTER TABLE public.onboarding_profiles ADD CONSTRAINT onboarding_profiles_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.outbound_messages ADD CONSTRAINT outbound_messages_process_id_fkey FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE SET NULL;
ALTER TABLE public.outbound_messages ADD CONSTRAINT outbound_messages_channel_check CHECK ((channel = ANY (ARRAY['whatsapp'::text, 'email'::text])));
ALTER TABLE public.outbound_messages ADD CONSTRAINT outbound_messages_status_check CHECK ((status = ANY (ARRAY['queued'::text, 'sending'::text, 'sent'::text, 'delivered'::text, 'read'::text, 'failed'::text, 'cancelled'::text])));
ALTER TABLE public.outbound_messages ADD CONSTRAINT outbound_messages_pkey PRIMARY KEY (id);
ALTER TABLE public.outbound_messages ADD CONSTRAINT outbound_messages_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.outbound_messages ADD CONSTRAINT outbound_messages_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES conversation_threads(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD CONSTRAINT payments_provider_external_id_key UNIQUE (provider, external_id);
ALTER TABLE public.payments ADD CONSTRAINT payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'received'::text, 'overdue'::text, 'refunded'::text, 'cancelled'::text, 'error'::text])));
ALTER TABLE public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
ALTER TABLE public.payments ADD CONSTRAINT payments_amount_cents_check CHECK ((amount_cents >= 0));
ALTER TABLE public.payments ADD CONSTRAINT payments_payment_type_check CHECK ((payment_type = ANY (ARRAY['SETUP'::text, 'MONTHLY'::text, 'AVULSO'::text, 'OTHER'::text])));
ALTER TABLE public.payments ADD CONSTRAINT payments_subscription_workspace_fk FOREIGN KEY (subscription_id, workspace_id) REFERENCES subscriptions(id, workspace_id);
ALTER TABLE public.payments ADD CONSTRAINT payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD CONSTRAINT payments_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.plans ADD CONSTRAINT plans_monthly_fee_cents_check CHECK ((monthly_fee_cents >= 0));
ALTER TABLE public.plans ADD CONSTRAINT plans_setup_fee_cents_check CHECK ((setup_fee_cents >= 0));
ALTER TABLE public.plans ADD CONSTRAINT plans_pkey PRIMARY KEY (code);
ALTER TABLE public.process_classes ADD CONSTRAINT process_classes_pkey PRIMARY KEY (id);
ALTER TABLE public.process_classes ADD CONSTRAINT process_classes_process_id_fkey FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE;
ALTER TABLE public.process_classes ADD CONSTRAINT process_classes_nice_class_check CHECK (((nice_class >= 1) AND (nice_class <= 45)));
ALTER TABLE public.process_events ADD CONSTRAINT process_events_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.process_events ADD CONSTRAINT process_events_process_workspace_fk FOREIGN KEY (process_id, workspace_id) REFERENCES processes(id, workspace_id);
ALTER TABLE public.process_events ADD CONSTRAINT process_events_process_id_fkey FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE;
ALTER TABLE public.process_events ADD CONSTRAINT process_events_pkey PRIMARY KEY (id);
ALTER TABLE public.process_transition_rules ADD CONSTRAINT process_transition_rules_pkey PRIMARY KEY (from_status, to_status);
ALTER TABLE public.processes ADD CONSTRAINT processes_inpi_process_number_key UNIQUE (inpi_process_number);
ALTER TABLE public.processes ADD CONSTRAINT processes_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id);
ALTER TABLE public.processes ADD CONSTRAINT processes_holder_workspace_fk FOREIGN KEY (holder_id, workspace_id) REFERENCES holders(id, workspace_id);
ALTER TABLE public.processes ADD CONSTRAINT processes_trademark_workspace_fk FOREIGN KEY (trademark_id, workspace_id) REFERENCES trademarks(id, workspace_id);
ALTER TABLE public.processes ADD CONSTRAINT processes_subscription_workspace_fk FOREIGN KEY (subscription_id, workspace_id) REFERENCES subscriptions(id, workspace_id);
ALTER TABLE public.processes ADD CONSTRAINT processes_holder_id_fkey FOREIGN KEY (holder_id) REFERENCES holders(id);
ALTER TABLE public.processes ADD CONSTRAINT processes_id_workspace_uq UNIQUE (id, workspace_id);
ALTER TABLE public.processes ADD CONSTRAINT processes_trademark_id_fkey FOREIGN KEY (trademark_id) REFERENCES trademarks(id) ON DELETE CASCADE;
ALTER TABLE public.processes ADD CONSTRAINT processes_status_check CHECK ((status = ANY (ARRAY['intake'::text, 'contracting'::text, 'awaiting_setup_payment'::text, 'viability'::text, 'awaiting_customer_confirmation'::text, 'awaiting_inpi_fee'::text, 'ready_to_file'::text, 'filing'::text, 'filed'::text, 'monitoring'::text, 'office_action'::text, 'opposition'::text, 'refused'::text, 'appeal'::text, 'granted'::text, 'archived'::text, 'expired'::text, 'cancelled'::text, 'error_hold'::text])));
ALTER TABLE public.processes ADD CONSTRAINT processes_pkey PRIMARY KEY (id);
ALTER TABLE public.processes ADD CONSTRAINT processes_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.rpi_editions ADD CONSTRAINT rpi_editions_status_check CHECK ((status = ANY (ARRAY['discovered'::text, 'downloading'::text, 'processing'::text, 'processed'::text, 'failed'::text])));
ALTER TABLE public.rpi_editions ADD CONSTRAINT rpi_editions_pkey PRIMARY KEY (id);
ALTER TABLE public.rpi_editions ADD CONSTRAINT rpi_editions_rpi_number_key UNIQUE (rpi_number);
ALTER TABLE public.security_events ADD CONSTRAINT security_events_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE public.security_events ADD CONSTRAINT security_events_process_id_fkey FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE SET NULL;
ALTER TABLE public.security_events ADD CONSTRAINT security_events_severity_check CHECK ((severity = ANY (ARRAY['INFO'::text, 'LOW'::text, 'MEDIUM'::text, 'HIGH'::text, 'CRITICAL'::text])));
ALTER TABLE public.security_events ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_holder_id_fkey FOREIGN KEY (holder_id) REFERENCES holders(id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_id_workspace_uq UNIQUE (id, workspace_id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'past_due'::text, 'paused'::text, 'cancelled'::text])));
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_code_fkey FOREIGN KEY (plan_code) REFERENCES plans(code);
ALTER TABLE public.tool_runs ADD CONSTRAINT tool_runs_process_workspace_fk FOREIGN KEY (process_id, workspace_id) REFERENCES processes(id, workspace_id);
ALTER TABLE public.tool_runs ADD CONSTRAINT tool_runs_pkey PRIMARY KEY (id);
ALTER TABLE public.tool_runs ADD CONSTRAINT tool_runs_status_check CHECK ((status = ANY (ARRAY['started'::text, 'succeeded'::text, 'failed'::text, 'cancelled'::text, 'blocked'::text])));
ALTER TABLE public.tool_runs ADD CONSTRAINT tool_runs_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE public.tool_runs ADD CONSTRAINT tool_runs_process_id_fkey FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE SET NULL;
ALTER TABLE public.trademarks ADD CONSTRAINT trademarks_presentation_type_check CHECK ((presentation_type = ANY (ARRAY['nominativa'::text, 'mista'::text, 'figurativa'::text, 'tridimensional'::text, 'posição'::text, 'outra'::text])));
ALTER TABLE public.trademarks ADD CONSTRAINT trademarks_id_workspace_uq UNIQUE (id, workspace_id);
ALTER TABLE public.trademarks ADD CONSTRAINT trademarks_holder_id_fkey FOREIGN KEY (holder_id) REFERENCES holders(id);
ALTER TABLE public.trademarks ADD CONSTRAINT trademarks_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.trademarks ADD CONSTRAINT trademarks_pkey PRIMARY KEY (id);
ALTER TABLE public.trademarks ADD CONSTRAINT trademarks_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'viability'::text, 'ready'::text, 'filed'::text, 'monitoring'::text, 'closed'::text, 'cancelled'::text])));
ALTER TABLE public.viability_confirmations ADD CONSTRAINT viability_confirmations_process_id_report_id_key UNIQUE (process_id, report_id);
ALTER TABLE public.viability_confirmations ADD CONSTRAINT viability_confirmations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.viability_confirmations ADD CONSTRAINT viability_confirmations_process_id_fkey FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE;
ALTER TABLE public.viability_confirmations ADD CONSTRAINT viability_confirmations_report_id_fkey FOREIGN KEY (report_id) REFERENCES viability_reports(id) ON DELETE CASCADE;
ALTER TABLE public.viability_confirmations ADD CONSTRAINT viability_confirmations_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'CONFIRMED'::text, 'REJECTED'::text, 'EXPIRED'::text])));
ALTER TABLE public.viability_confirmations ADD CONSTRAINT viability_confirmations_confirmed_class_check CHECK (((confirmed_class IS NULL) OR ((confirmed_class >= 1) AND (confirmed_class <= 45))));
ALTER TABLE public.viability_confirmations ADD CONSTRAINT viability_confirmations_pkey PRIMARY KEY (id);
ALTER TABLE public.viability_matches ADD CONSTRAINT viability_matches_match_kind_check CHECK ((match_kind = ANY (ARRAY['exact'::text, 'radical'::text, 'phonetic'::text, 'visual'::text, 'market_affinity'::text, 'other'::text])));
ALTER TABLE public.viability_matches ADD CONSTRAINT viability_matches_similarity_check CHECK (((similarity IS NULL) OR ((similarity >= (0)::numeric) AND (similarity <= (1)::numeric))));
ALTER TABLE public.viability_matches ADD CONSTRAINT viability_matches_nice_class_check CHECK (((nice_class IS NULL) OR ((nice_class >= 1) AND (nice_class <= 45))));
ALTER TABLE public.viability_matches ADD CONSTRAINT viability_matches_pkey PRIMARY KEY (id);
ALTER TABLE public.viability_matches ADD CONSTRAINT viability_matches_report_id_fkey FOREIGN KEY (report_id) REFERENCES viability_reports(id) ON DELETE CASCADE;
ALTER TABLE public.viability_reports ADD CONSTRAINT viability_reports_verdict_check CHECK ((verdict = ANY (ARRAY['GREEN'::text, 'YELLOW'::text, 'RED'::text])));
ALTER TABLE public.viability_reports ADD CONSTRAINT viability_reports_confidence_check CHECK (((confidence >= (0)::numeric) AND (confidence <= (1)::numeric)));
ALTER TABLE public.viability_reports ADD CONSTRAINT viability_reports_pkey PRIMARY KEY (id);
ALTER TABLE public.viability_reports ADD CONSTRAINT viability_reports_process_id_fkey FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE;
ALTER TABLE public.webhook_events ADD CONSTRAINT webhook_events_provider_external_event_id_key UNIQUE (provider, external_event_id);
ALTER TABLE public.webhook_events ADD CONSTRAINT webhook_events_processing_status_check CHECK ((processing_status = ANY (ARRAY['received'::text, 'processing'::text, 'processed'::text, 'ignored'::text, 'failed'::text])));
ALTER TABLE public.webhook_events ADD CONSTRAINT webhook_events_pkey PRIMARY KEY (id);
ALTER TABLE public.webhook_payloads ADD CONSTRAINT webhook_payloads_pkey PRIMARY KEY (webhook_event_id);
ALTER TABLE public.webhook_payloads ADD CONSTRAINT webhook_payloads_webhook_event_id_fkey FOREIGN KEY (webhook_event_id) REFERENCES webhook_events(id) ON DELETE CASCADE;
ALTER TABLE public.workflow_tasks ADD CONSTRAINT workflow_tasks_pkey PRIMARY KEY (id);
ALTER TABLE public.workflow_tasks ADD CONSTRAINT workflow_tasks_process_id_fkey FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE;
ALTER TABLE public.workflow_tasks ADD CONSTRAINT workflow_tasks_legal_case_id_fkey FOREIGN KEY (legal_case_id) REFERENCES legal_cases(id) ON DELETE CASCADE;
ALTER TABLE public.workflow_tasks ADD CONSTRAINT workflow_tasks_owner_type_check CHECK ((owner_type = ANY (ARRAY['SYSTEM'::text, 'CUSTOMER'::text])));
ALTER TABLE public.workflow_tasks ADD CONSTRAINT workflow_tasks_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'waiting'::text, 'completed'::text, 'cancelled'::text, 'failed'::text])));
ALTER TABLE public.workflow_tasks ADD CONSTRAINT workflow_tasks_priority_check CHECK (((priority >= 0) AND (priority <= 100)));
ALTER TABLE public.workflow_tasks ADD CONSTRAINT workflow_tasks_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.workspaces ADD CONSTRAINT workspaces_pkey PRIMARY KEY (id);
ALTER TABLE public.workspaces ADD CONSTRAINT workspaces_primary_whatsapp_hash_key UNIQUE (primary_whatsapp_hash);
ALTER TABLE public.workspaces ADD CONSTRAINT workspaces_status_check CHECK ((status = ANY (ARRAY['lead'::text, 'contracting'::text, 'active'::text, 'paused'::text, 'cancelled'::text, 'blocked'::text])));

CREATE UNIQUE INDEX channel_identity_pii_pkey ON app_private.channel_identity_pii USING btree (channel_identity_id);
CREATE UNIQUE INDEX holder_pii_pkey ON app_private.holder_pii USING btree (holder_id);
CREATE UNIQUE INDEX onboarding_profile_pii_pkey ON app_private.onboarding_profile_pii USING btree (profile_id);
CREATE UNIQUE INDEX agent_instances_pkey ON public.agent_instances USING btree (id);
CREATE UNIQUE INDEX agent_instances_workspace_id_key ON public.agent_instances USING btree (workspace_id);
CREATE INDEX agent_instances_workspace_idx ON public.agent_instances USING btree (workspace_id);
CREATE UNIQUE INDEX agent_runs_pkey ON public.agent_runs USING btree (id);
CREATE INDEX agent_runs_workspace_time_idx ON public.agent_runs USING btree (workspace_id, started_at DESC);
CREATE INDEX agent_runs_process_idx ON public.agent_runs USING btree (process_id);
CREATE UNIQUE INDEX agent_state_process_scope_uq ON public.agent_state USING btree (workspace_id, process_id, scope) WHERE (process_id IS NOT NULL);
CREATE UNIQUE INDEX agent_state_pkey ON public.agent_state USING btree (id);
CREATE UNIQUE INDEX agent_state_workspace_scope_uq ON public.agent_state USING btree (workspace_id, scope) WHERE (process_id IS NULL);
CREATE INDEX agent_state_process_workspace_idx ON public.agent_state USING btree (process_id, workspace_id);
CREATE INDEX agent_state_process_idx ON public.agent_state USING btree (process_id);
CREATE UNIQUE INDEX audit_log_pkey ON public.audit_log USING btree (id);
CREATE INDEX audit_workspace_time_idx ON public.audit_log USING btree (workspace_id, created_at DESC);
CREATE UNIQUE INDEX channel_identities_channel_identifier_hash_key ON public.channel_identities USING btree (channel, identifier_hash);
CREATE INDEX channel_identities_workspace_idx ON public.channel_identities USING btree (workspace_id);
CREATE UNIQUE INDEX channel_identities_pkey ON public.channel_identities USING btree (id);
CREATE UNIQUE INDEX contract_access_tokens_token_hash_key ON public.contract_access_tokens USING btree (token_hash);
CREATE INDEX contract_access_tokens_document_idx ON public.contract_access_tokens USING btree (contract_document_id);
CREATE UNIQUE INDEX contract_access_tokens_pkey ON public.contract_access_tokens USING btree (id);
CREATE UNIQUE INDEX contract_documents_active_uq ON public.contract_documents USING btree (subscription_id, contract_version) WHERE (status = ANY (ARRAY['issued'::text, 'accepted'::text]));
CREATE UNIQUE INDEX contract_documents_pkey ON public.contract_documents USING btree (id);
CREATE INDEX contract_documents_subscription_idx ON public.contract_documents USING btree (subscription_id);
CREATE INDEX contract_documents_workspace_idx ON public.contract_documents USING btree (workspace_id);
CREATE UNIQUE INDEX conversation_threads_provider_uq ON public.conversation_threads USING btree (channel, provider_thread_id) WHERE (provider_thread_id IS NOT NULL);
CREATE UNIQUE INDEX conversation_threads_pkey ON public.conversation_threads USING btree (id);
CREATE INDEX threads_workspace_idx ON public.conversation_threads USING btree (workspace_id);
CREATE UNIQUE INDEX threads_id_workspace_uq ON public.conversation_threads USING btree (id, workspace_id);
CREATE UNIQUE INDEX customer_consents_pkey ON public.customer_consents USING btree (id);
CREATE INDEX consents_workspace_idx ON public.customer_consents USING btree (workspace_id);
CREATE UNIQUE INDEX data_subject_requests_pkey ON public.data_subject_requests USING btree (id);
CREATE INDEX dsr_workspace_idx ON public.data_subject_requests USING btree (workspace_id);
CREATE INDEX deadline_reminders_outbound_message_idx ON public.deadline_reminders USING btree (outbound_message_id);
CREATE UNIQUE INDEX deadline_reminders_pkey ON public.deadline_reminders USING btree (id);
CREATE UNIQUE INDEX deadline_reminders_deadline_id_milestone_key ON public.deadline_reminders USING btree (deadline_id, milestone);
CREATE INDEX deadline_reminders_workspace_idx ON public.deadline_reminders USING btree (workspace_id, created_at DESC);
CREATE INDEX deadline_reminders_process_idx ON public.deadline_reminders USING btree (process_id);
CREATE UNIQUE INDEX deadline_rules_pkey ON public.deadline_rules USING btree (event_type);
CREATE UNIQUE INDEX deadlines_source_event_uq ON public.deadlines USING btree (source_event_id) WHERE (source_event_id IS NOT NULL);
CREATE INDEX deadlines_process_workspace_idx ON public.deadlines USING btree (process_id, workspace_id);
CREATE INDEX deadlines_process_idx ON public.deadlines USING btree (process_id);
CREATE INDEX deadlines_source_event_idx ON public.deadlines USING btree (source_event_id);
CREATE UNIQUE INDEX deadlines_pkey ON public.deadlines USING btree (id);
CREATE INDEX deadlines_open_due_idx ON public.deadlines USING btree (due_at) WHERE (status = 'open'::text);
CREATE INDEX deadlines_workspace_idx ON public.deadlines USING btree (workspace_id);
CREATE INDEX decision_checks_legal_case_idx ON public.decision_checks USING btree (legal_case_id);
CREATE INDEX decision_checks_workspace_idx ON public.decision_checks USING btree (workspace_id);
CREATE INDEX decision_checks_process_idx ON public.decision_checks USING btree (process_id, created_at DESC);
CREATE UNIQUE INDEX decision_checks_pkey ON public.decision_checks USING btree (id);
CREATE INDEX documents_legal_case_workspace_idx ON public.documents USING btree (legal_case_id, workspace_id);
CREATE INDEX documents_process_workspace_idx ON public.documents USING btree (process_id, workspace_id);
CREATE INDEX documents_case_idx ON public.documents USING btree (legal_case_id);
CREATE INDEX documents_requirement_idx ON public.documents USING btree (requirement_id);
CREATE INDEX documents_process_idx ON public.documents USING btree (process_id);
CREATE UNIQUE INDEX documents_object_path_key ON public.documents USING btree (object_path);
CREATE UNIQUE INDEX documents_pkey ON public.documents USING btree (id);
CREATE INDEX documents_workspace_idx ON public.documents USING btree (workspace_id);
CREATE INDEX federal_fees_proof_idx ON public.federal_fees USING btree (proof_document_id);
CREATE INDEX federal_fees_process_idx ON public.federal_fees USING btree (process_id);
CREATE INDEX federal_fees_workspace_idx ON public.federal_fees USING btree (workspace_id);
CREATE UNIQUE INDEX federal_fees_pkey ON public.federal_fees USING btree (id);
CREATE INDEX federal_fees_process_workspace_idx ON public.federal_fees USING btree (process_id, workspace_id);
CREATE INDEX federal_fees_legal_case_workspace_idx ON public.federal_fees USING btree (legal_case_id, workspace_id);
CREATE UNIQUE INDEX federal_fees_process_service_class_active_uq ON public.federal_fees USING btree (process_id, service_code, COALESCE(nice_class, 0)) WHERE (status <> ALL (ARRAY['cancelled'::text, 'expired'::text]));
CREATE INDEX federal_fees_case_idx ON public.federal_fees USING btree (legal_case_id);
CREATE INDEX fee_eligibility_requests_workspace_status_idx ON public.fee_eligibility_requests USING btree (workspace_id, status);
CREATE INDEX fee_eligibility_requests_holder_idx ON public.fee_eligibility_requests USING btree (holder_id);
CREATE UNIQUE INDEX fee_eligibility_requests_pkey ON public.fee_eligibility_requests USING btree (id);
CREATE UNIQUE INDEX fee_eligibility_requests_process_id_key ON public.fee_eligibility_requests USING btree (process_id);
CREATE UNIQUE INDEX holder_fee_profiles_pkey ON public.holder_fee_profiles USING btree (holder_id);
CREATE UNIQUE INDEX holders_pkey ON public.holders USING btree (id);
CREATE INDEX holders_workspace_idx ON public.holders USING btree (workspace_id);
CREATE UNIQUE INDEX holders_id_workspace_uq ON public.holders USING btree (id, workspace_id);
CREATE UNIQUE INDEX holders_workspace_id_document_hash_key ON public.holders USING btree (workspace_id, document_hash);
CREATE UNIQUE INDEX inpi_calendar_years_pkey ON public.inpi_calendar_years USING btree (year);
CREATE UNIQUE INDEX inpi_fee_catalog_service_code_effective_from_key ON public.inpi_fee_catalog USING btree (service_code, effective_from);
CREATE UNIQUE INDEX inpi_fee_catalog_pkey ON public.inpi_fee_catalog USING btree (id);
CREATE UNIQUE INDEX inpi_non_working_days_pkey ON public.inpi_non_working_days USING btree (day);
CREATE UNIQUE INDEX integration_status_pkey ON public.integration_status USING btree (provider);
CREATE UNIQUE INDEX legal_cases_id_workspace_uq ON public.legal_cases USING btree (id, workspace_id);
CREATE UNIQUE INDEX legal_cases_source_event_uq ON public.legal_cases USING btree (source_event_id) WHERE (source_event_id IS NOT NULL);
CREATE INDEX legal_cases_process_workspace_idx ON public.legal_cases USING btree (process_id, workspace_id);
CREATE INDEX legal_cases_deadline_idx ON public.legal_cases USING btree (deadline_id);
CREATE INDEX legal_cases_source_event_idx ON public.legal_cases USING btree (source_event_id);
CREATE INDEX legal_cases_process_idx ON public.legal_cases USING btree (process_id);
CREATE INDEX legal_cases_workspace_idx ON public.legal_cases USING btree (workspace_id);
CREATE UNIQUE INDEX legal_cases_pkey ON public.legal_cases USING btree (id);
CREATE UNIQUE INDEX legal_requirements_pkey ON public.legal_requirements USING btree (id);
CREATE INDEX legal_requirements_case_idx ON public.legal_requirements USING btree (legal_case_id);
CREATE INDEX messages_process_idx ON public.messages USING btree (process_id);
CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);
CREATE UNIQUE INDEX messages_provider_uq ON public.messages USING btree (provider_message_id) WHERE (provider_message_id IS NOT NULL);
CREATE INDEX messages_workspace_sent_idx ON public.messages USING btree (workspace_id, sent_at DESC);
CREATE INDEX messages_process_workspace_idx ON public.messages USING btree (process_id, workspace_id);
CREATE INDEX messages_thread_idx ON public.messages USING btree (thread_id);
CREATE INDEX messages_thread_workspace_idx ON public.messages USING btree (thread_id, workspace_id);
CREATE UNIQUE INDEX onboarding_profiles_workspace_id_key ON public.onboarding_profiles USING btree (workspace_id);
CREATE UNIQUE INDEX onboarding_profiles_pkey ON public.onboarding_profiles USING btree (id);
CREATE INDEX onboarding_profiles_document_hash_idx ON public.onboarding_profiles USING btree (holder_document_hash) WHERE (holder_document_hash IS NOT NULL);
CREATE INDEX onboarding_profiles_plan_idx ON public.onboarding_profiles USING btree (plan_code);
CREATE INDEX outbound_messages_queue_idx ON public.outbound_messages USING btree (status, scheduled_at) WHERE (status = 'queued'::text);
CREATE UNIQUE INDEX outbound_messages_idempotency_uq ON public.outbound_messages USING btree (idempotency_key) WHERE (idempotency_key IS NOT NULL);
CREATE INDEX outbound_messages_process_idx ON public.outbound_messages USING btree (process_id);
CREATE INDEX outbound_messages_thread_idx ON public.outbound_messages USING btree (thread_id);
CREATE INDEX outbound_messages_workspace_idx ON public.outbound_messages USING btree (workspace_id);
CREATE UNIQUE INDEX outbound_messages_pkey ON public.outbound_messages USING btree (id);
CREATE UNIQUE INDEX payments_provider_external_id_key ON public.payments USING btree (provider, external_id);
CREATE INDEX payments_subscription_workspace_idx ON public.payments USING btree (subscription_id, workspace_id);
CREATE INDEX payments_subscription_idx ON public.payments USING btree (subscription_id);
CREATE INDEX payments_workspace_idx ON public.payments USING btree (workspace_id);
CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id);
CREATE UNIQUE INDEX plans_pkey ON public.plans USING btree (code);
CREATE INDEX process_classes_process_idx ON public.process_classes USING btree (process_id);
CREATE UNIQUE INDEX process_classes_uq ON public.process_classes USING btree (process_id, nice_class, COALESCE(specification, ''::text));
CREATE UNIQUE INDEX process_classes_pkey ON public.process_classes USING btree (id);
CREATE INDEX process_events_process_workspace_idx ON public.process_events USING btree (process_id, workspace_id);
CREATE INDEX process_events_workspace_idx ON public.process_events USING btree (workspace_id);
CREATE INDEX process_events_process_time_idx ON public.process_events USING btree (process_id, occurred_at DESC);
CREATE UNIQUE INDEX process_events_source_uq ON public.process_events USING btree (source, source_external_id) WHERE (source_external_id IS NOT NULL);
CREATE UNIQUE INDEX process_events_pkey ON public.process_events USING btree (id);
CREATE UNIQUE INDEX process_transition_rules_pkey ON public.process_transition_rules USING btree (from_status, to_status);
CREATE UNIQUE INDEX processes_id_workspace_uq ON public.processes USING btree (id, workspace_id);
CREATE INDEX processes_trademark_workspace_idx ON public.processes USING btree (trademark_id, workspace_id);
CREATE INDEX processes_subscription_workspace_idx ON public.processes USING btree (subscription_id, workspace_id);
CREATE INDEX processes_holder_workspace_idx ON public.processes USING btree (holder_id, workspace_id);
CREATE INDEX processes_holder_idx ON public.processes USING btree (holder_id);
CREATE INDEX processes_trademark_idx ON public.processes USING btree (trademark_id);
CREATE INDEX processes_subscription_idx ON public.processes USING btree (subscription_id);
CREATE INDEX processes_next_action_idx ON public.processes USING btree (next_action_at) WHERE (next_action_at IS NOT NULL);
CREATE INDEX processes_workspace_status_idx ON public.processes USING btree (workspace_id, status);
CREATE UNIQUE INDEX processes_inpi_process_number_key ON public.processes USING btree (inpi_process_number);
CREATE UNIQUE INDEX processes_pkey ON public.processes USING btree (id);
CREATE UNIQUE INDEX rpi_editions_pkey ON public.rpi_editions USING btree (id);
CREATE INDEX rpi_editions_status_number_idx ON public.rpi_editions USING btree (status, rpi_number DESC);
CREATE UNIQUE INDEX rpi_editions_rpi_number_key ON public.rpi_editions USING btree (rpi_number);
CREATE INDEX security_events_process_idx ON public.security_events USING btree (process_id);
CREATE UNIQUE INDEX security_events_pkey ON public.security_events USING btree (id);
CREATE INDEX security_events_workspace_time_idx ON public.security_events USING btree (workspace_id, occurred_at DESC);
CREATE INDEX subscriptions_plan_idx ON public.subscriptions USING btree (plan_code);
CREATE INDEX subscriptions_holder_idx ON public.subscriptions USING btree (holder_id);
CREATE UNIQUE INDEX subscriptions_id_workspace_uq ON public.subscriptions USING btree (id, workspace_id);
CREATE INDEX subscriptions_workspace_idx ON public.subscriptions USING btree (workspace_id);
CREATE UNIQUE INDEX subscriptions_active_holder_plan_uq ON public.subscriptions USING btree (workspace_id, holder_id, plan_code) WHERE (status = ANY (ARRAY['pending'::text, 'active'::text, 'past_due'::text, 'paused'::text]));
CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id);
CREATE UNIQUE INDEX tool_runs_pkey ON public.tool_runs USING btree (id);
CREATE UNIQUE INDEX tool_runs_idempotency_uq ON public.tool_runs USING btree (tool_name, idempotency_key) WHERE (idempotency_key IS NOT NULL);
CREATE INDEX tool_runs_workspace_idx ON public.tool_runs USING btree (workspace_id);
CREATE INDEX tool_runs_process_idx ON public.tool_runs USING btree (process_id);
CREATE INDEX tool_runs_process_workspace_idx ON public.tool_runs USING btree (process_id, workspace_id);
CREATE INDEX trademarks_normalized_trgm_idx ON public.trademarks USING gin (normalized_name gin_trgm_ops);
CREATE UNIQUE INDEX trademarks_id_workspace_uq ON public.trademarks USING btree (id, workspace_id);
CREATE INDEX trademarks_holder_idx ON public.trademarks USING btree (holder_id);
CREATE UNIQUE INDEX trademarks_pkey ON public.trademarks USING btree (id);
CREATE INDEX trademarks_workspace_idx ON public.trademarks USING btree (workspace_id);
CREATE UNIQUE INDEX viability_confirmations_pkey ON public.viability_confirmations USING btree (id);
CREATE INDEX viability_confirmations_report_idx ON public.viability_confirmations USING btree (report_id);
CREATE INDEX viability_confirmations_workspace_status_idx ON public.viability_confirmations USING btree (workspace_id, status);
CREATE UNIQUE INDEX viability_confirmations_process_id_report_id_key ON public.viability_confirmations USING btree (process_id, report_id);
CREATE UNIQUE INDEX viability_matches_pkey ON public.viability_matches USING btree (id);
CREATE INDEX viability_matches_report_idx ON public.viability_matches USING btree (report_id);
CREATE INDEX viability_reports_process_idx ON public.viability_reports USING btree (process_id);
CREATE UNIQUE INDEX viability_reports_pkey ON public.viability_reports USING btree (id);
CREATE UNIQUE INDEX webhook_events_pkey ON public.webhook_events USING btree (id);
CREATE INDEX webhook_events_provider_received_idx ON public.webhook_events USING btree (provider, received_at DESC);
CREATE UNIQUE INDEX webhook_events_provider_external_event_id_key ON public.webhook_events USING btree (provider, external_event_id);
CREATE UNIQUE INDEX webhook_payloads_pkey ON public.webhook_payloads USING btree (webhook_event_id);
CREATE INDEX workflow_tasks_pending_idx ON public.workflow_tasks USING btree (status, priority DESC, due_at) WHERE (status = ANY (ARRAY['pending'::text, 'waiting'::text]));
CREATE INDEX workflow_tasks_workspace_idx ON public.workflow_tasks USING btree (workspace_id);
CREATE INDEX workflow_tasks_legal_case_idx ON public.workflow_tasks USING btree (legal_case_id);
CREATE INDEX workflow_tasks_process_idx ON public.workflow_tasks USING btree (process_id);
CREATE UNIQUE INDEX workflow_tasks_pkey ON public.workflow_tasks USING btree (id);
CREATE UNIQUE INDEX workflow_tasks_idempotency_uq ON public.workflow_tasks USING btree (idempotency_key) WHERE (idempotency_key IS NOT NULL);
CREATE UNIQUE INDEX workspaces_pkey ON public.workspaces USING btree (id);
CREATE UNIQUE INDEX workspaces_primary_whatsapp_hash_key ON public.workspaces USING btree (primary_whatsapp_hash);

ALTER TABLE public.agent_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadline_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadline_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.federal_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_eligibility_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holder_fee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inpi_calendar_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inpi_fee_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inpi_non_working_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_transition_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpi_editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trademarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viability_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viability_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viability_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_payloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY public_read_active_plans ON public.plans AS PERMISSIVE FOR SELECT TO anon,authenticated USING ((active = true));

CREATE OR REPLACE FUNCTION public.create_agent_for_workspace()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  insert into public.agent_instances(workspace_id)
  values (new.id)
  on conflict (workspace_id) do nothing;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.enforce_subscription_holder()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_holder uuid;
  v_workspace uuid;
  v_plan text;
begin
  if new.subscription_id is null then
    return new;
  end if;

  select s.holder_id, s.workspace_id, s.plan_code
    into v_holder, v_workspace, v_plan
  from public.subscriptions s
  where s.id = new.subscription_id;

  if v_holder is null then
    raise exception 'subscription not found';
  end if;

  if new.workspace_id is distinct from v_workspace then
    raise exception 'cross-workspace subscription blocked';
  end if;

  if new.holder_id is distinct from v_holder then
    if v_plan = 'ILIMITADO' then
      raise exception 'Plano Ilimitado is locked to the contracted CPF/CNPJ holder';
    else
      raise exception 'process holder must match subscription holder';
    end if;
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.enqueue_webhook_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  perform pgmq.send(
    'reg_jobs',
    jsonb_build_object(
      'job_type','webhook_event',
      'webhook_event_id',new.id,
      'provider',new.provider,
      'event_type',new.event_type
    ),
    0
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.enqueue_workflow_task()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if new.status = 'pending' then
    perform pgmq.send(
      'reg_jobs',
      jsonb_build_object(
        'job_type','workflow_task',
        'workflow_task_id',new.id,
        'task_type',new.task_type,
        'workspace_id',new.workspace_id,
        'process_id',new.process_id
      ),
      0
    );
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_channel_identity_secret(p_channel_identity_id uuid)
 RETURNS TABLE(ciphertext text, nonce_b64 text, key_version integer)
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select p.ciphertext, p.nonce_b64, p.key_version
  from app_private.channel_identity_pii p
  where p.channel_identity_id = p_channel_identity_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_onboarding_profile_secret(p_workspace_id uuid)
 RETURNS TABLE(ciphertext text, nonce_b64 text, key_version integer)
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select p.ciphertext,p.nonce_b64,p.key_version
  from public.onboarding_profiles o
  join app_private.onboarding_profile_pii p on p.profile_id=o.id
  where o.workspace_id=p_workspace_id;
$function$
;

CREATE OR REPLACE FUNCTION public.normalize_trademark()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.normalized_name :=
    upper(
      regexp_replace(
        extensions.unaccent(trim(new.name)),
        '\s+',
        ' ',
        'g'
      )
    );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.prevent_audit_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  raise exception 'audit_log is append-only';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.prevent_locked_holder_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if old.holder_locked and new.holder_id is distinct from old.holder_id then
    raise exception 'subscription holder is locked; use formal migration flow';
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.reg_queue_archive(p_queue text, p_msg_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_ok boolean;
begin
  if p_queue not in ('reg_jobs','notifications','inpi_jobs','legal_jobs') then
    raise exception 'queue_not_allowed';
  end if;

  select pgmq.archive(p_queue, p_msg_id) into v_ok;
  return coalesce(v_ok,false);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.reg_queue_read(p_queue text, p_visibility_timeout integer DEFAULT 60, p_qty integer DEFAULT 1)
 RETURNS TABLE(msg_id bigint, read_ct bigint, enqueued_at timestamp with time zone, vt timestamp with time zone, message jsonb)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if p_queue not in ('reg_jobs','notifications','inpi_jobs','legal_jobs') then
    raise exception 'queue_not_allowed';
  end if;

  return query
  select r.msg_id, r.read_ct, r.enqueued_at, r.vt, r.message
  from pgmq.read(
    p_queue,
    greatest(p_visibility_timeout, 1),
    greatest(least(p_qty, 25), 1)
  ) r;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.reg_queue_send(p_queue text, p_message jsonb, p_delay integer DEFAULT 0)
 RETURNS bigint
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_id bigint;
begin
  if p_queue not in ('reg_jobs','notifications','inpi_jobs','legal_jobs') then
    raise exception 'queue_not_allowed';
  end if;

  select msg_id into v_id
  from pgmq.send(p_queue, p_message, greatest(p_delay,0))
  as t(msg_id bigint);

  return v_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.reg_queue_set_vt(p_queue text, p_msg_id bigint, p_seconds integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_found boolean;
begin
  if p_queue not in ('reg_jobs','notifications','inpi_jobs','legal_jobs') then
    raise exception 'queue_not_allowed';
  end if;

  select exists(
    select 1
    from pgmq.set_vt(p_queue, p_msg_id, greatest(p_seconds,1))
  ) into v_found;

  return v_found;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.resolve_whatsapp_workspace(p_identifier_hash text, p_identifier_masked text, p_ciphertext text, p_nonce_b64 text, p_key_version integer DEFAULT 1)
 RETURNS TABLE(workspace_id uuid, thread_id uuid, is_new boolean)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_identity public.channel_identities;
  v_workspace uuid;
  v_thread uuid;
  v_new boolean := false;
begin
  select * into v_identity
  from public.channel_identities
  where channel='whatsapp'
    and identifier_hash=p_identifier_hash
  limit 1;

  if not found then
    insert into public.workspaces(
      status,
      primary_whatsapp_hash,
      primary_whatsapp_masked,
      source
    ) values (
      'lead',
      p_identifier_hash,
      p_identifier_masked,
      'whatsapp'
    )
    returning id into v_workspace;

    insert into public.channel_identities(
      workspace_id,
      channel,
      identifier_hash,
      identifier_masked,
      verified,
      is_primary,
      verified_at
    ) values (
      v_workspace,
      'whatsapp',
      p_identifier_hash,
      p_identifier_masked,
      true,
      true,
      now()
    )
    returning * into v_identity;

    insert into app_private.channel_identity_pii(
      channel_identity_id,
      ciphertext,
      nonce_b64,
      key_version
    ) values (
      v_identity.id,
      p_ciphertext,
      p_nonce_b64,
      p_key_version
    );

    v_new := true;
  else
    v_workspace := v_identity.workspace_id;
  end if;

  select id into v_thread
  from public.conversation_threads
  where workspace_id=v_workspace
    and channel='whatsapp'
    and provider_thread_id='wa:'||p_identifier_hash
  limit 1;

  if v_thread is null then
    insert into public.conversation_threads(
      workspace_id,
      channel,
      provider_thread_id,
      status
    ) values (
      v_workspace,
      'whatsapp',
      'wa:'||p_identifier_hash,
      'open'
    )
    returning id into v_thread;
  end if;

  return query select v_workspace, v_thread, v_new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_payment_paid_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if new.status in ('confirmed','received') and new.paid_at is null then
    new.paid_at = now();
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.transition_process(p_process_id uuid, p_expected_version integer, p_to_status text, p_actor_type text, p_actor_ref text DEFAULT NULL::text, p_reason text DEFAULT NULL::text)
 RETURNS processes
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_process public.processes;
  v_from_status text;
  v_allowed boolean;
begin
  select * into v_process
  from public.processes
  where id = p_process_id
  for update;

  if not found then
    raise exception 'process_not_found';
  end if;

  if v_process.version <> p_expected_version then
    raise exception 'version_conflict';
  end if;

  v_from_status := v_process.status;

  if v_from_status = 'error_hold' then
    if v_process.hold_resume_status is null or p_to_status <> v_process.hold_resume_status then
      raise exception 'invalid_hold_resume_target';
    end if;
    v_allowed := true;
  else
    select exists(
      select 1
      from public.process_transition_rules
      where from_status = v_from_status
        and to_status = p_to_status
        and active = true
    ) into v_allowed;
  end if;

  if not v_allowed then
    raise exception 'invalid_process_transition:%->%', v_from_status, p_to_status;
  end if;

  update public.processes
  set
    hold_resume_status = case when p_to_status='error_hold' then v_from_status else null end,
    automation_hold = (p_to_status='error_hold'),
    hold_reason = case when p_to_status='error_hold' then p_reason else null end,
    status = p_to_status,
    version = version + 1,
    updated_at = now()
  where id = p_process_id
  returning * into v_process;

  insert into public.audit_log(
    workspace_id, process_id, actor_type, actor_ref, action, entity_type, entity_id, metadata
  ) values (
    v_process.workspace_id,
    v_process.id,
    p_actor_type,
    p_actor_ref,
    'PROCESS_STATUS_CHANGED',
    'process',
    v_process.id::text,
    jsonb_build_object(
      'from', v_from_status,
      'to', p_to_status,
      'reason', p_reason,
      'version', v_process.version
    )
  );

  return v_process;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_onboarding_profile(p_workspace_id uuid, p_holder_type text, p_holder_document_hash text, p_holder_document_masked text, p_name_masked text, p_email_hash text, p_email_masked text, p_plan_code text, p_activity_description text, p_onboarding_status text, p_missing_fields text[], p_ciphertext text, p_nonce_b64 text, p_key_version integer DEFAULT 1)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_profile_id uuid;
begin
  insert into public.onboarding_profiles(
    workspace_id,
    holder_type,
    holder_document_hash,
    holder_document_masked,
    name_masked,
    email_hash,
    email_masked,
    plan_code,
    activity_description,
    onboarding_status,
    missing_fields
  ) values (
    p_workspace_id,
    p_holder_type,
    p_holder_document_hash,
    p_holder_document_masked,
    p_name_masked,
    p_email_hash,
    p_email_masked,
    p_plan_code,
    p_activity_description,
    p_onboarding_status,
    coalesce(p_missing_fields,'{}')
  )
  on conflict (workspace_id) do update set
    holder_type = coalesce(excluded.holder_type, public.onboarding_profiles.holder_type),
    holder_document_hash = coalesce(excluded.holder_document_hash, public.onboarding_profiles.holder_document_hash),
    holder_document_masked = coalesce(excluded.holder_document_masked, public.onboarding_profiles.holder_document_masked),
    name_masked = coalesce(excluded.name_masked, public.onboarding_profiles.name_masked),
    email_hash = coalesce(excluded.email_hash, public.onboarding_profiles.email_hash),
    email_masked = coalesce(excluded.email_masked, public.onboarding_profiles.email_masked),
    plan_code = coalesce(excluded.plan_code, public.onboarding_profiles.plan_code),
    activity_description = coalesce(excluded.activity_description, public.onboarding_profiles.activity_description),
    onboarding_status = excluded.onboarding_status,
    missing_fields = excluded.missing_fields,
    updated_at = now()
  returning id into v_profile_id;

  insert into app_private.onboarding_profile_pii(
    profile_id,ciphertext,nonce_b64,key_version
  ) values (
    v_profile_id,p_ciphertext,p_nonce_b64,p_key_version
  )
  on conflict (profile_id) do update set
    ciphertext=excluded.ciphertext,
    nonce_b64=excluded.nonce_b64,
    key_version=excluded.key_version,
    updated_at=now();

  return v_profile_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_deadline_dates()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if new.due_at <= new.opened_at then
    raise exception 'deadline due_at must be after opened_at';
  end if;
  if new.status = 'satisfied' and new.satisfied_at is null then
    new.satisfied_at = now();
  end if;
  if new.status = 'missed' and new.missed_at is null then
    new.missed_at = now();
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_fee_confirmation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if new.status = 'confirmed' and new.payment_confirmed_at is null then
    raise exception 'confirmed federal fee requires payment_confirmed_at';
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_holder_workspace()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_holder_workspace uuid;
begin
  select workspace_id into v_holder_workspace
  from public.holders where id = new.holder_id;

  if v_holder_workspace is distinct from new.workspace_id then
    raise exception 'holder does not belong to workspace';
  end if;

  return new;
end;
$function$
;

CREATE TRIGGER trg_channel_identity_pii_updated_at BEFORE UPDATE ON app_private.channel_identity_pii FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_private_holder_updated_at BEFORE UPDATE ON app_private.holder_pii FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_onboarding_profile_pii_updated_at BEFORE UPDATE ON app_private.onboarding_profile_pii FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_agent_instances_updated_at BEFORE UPDATE ON agent_instances FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_audit_immutable BEFORE DELETE OR UPDATE ON audit_log FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();
CREATE TRIGGER trg_threads_updated_at BEFORE UPDATE ON conversation_threads FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_deadline_dates BEFORE INSERT OR UPDATE ON deadlines FOR EACH ROW EXECUTE FUNCTION validate_deadline_dates();
CREATE TRIGGER trg_deadlines_updated_at BEFORE UPDATE ON deadlines FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_fee_confirmation BEFORE INSERT OR UPDATE ON federal_fees FOR EACH ROW EXECUTE FUNCTION validate_fee_confirmation();
CREATE TRIGGER trg_federal_fees_updated_at BEFORE UPDATE ON federal_fees FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_holder_fee_profiles_updated_at BEFORE UPDATE ON holder_fee_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_holders_updated_at BEFORE UPDATE ON holders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_inpi_calendar_years_updated_at BEFORE UPDATE ON inpi_calendar_years FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_integration_status_updated_at BEFORE UPDATE ON integration_status FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_legal_cases_updated_at BEFORE UPDATE ON legal_cases FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_legal_requirements_updated_at BEFORE UPDATE ON legal_requirements FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_onboarding_profiles_updated_at BEFORE UPDATE ON onboarding_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_outbound_messages_updated_at BEFORE UPDATE ON outbound_messages FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_payment_paid_at BEFORE INSERT OR UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_payment_paid_at();
CREATE TRIGGER trg_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_processes_updated_at BEFORE UPDATE ON processes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_process_holder_lock BEFORE INSERT OR UPDATE OF subscription_id, holder_id, workspace_id ON processes FOR EACH ROW EXECUTE FUNCTION enforce_subscription_holder();
CREATE TRIGGER trg_rpi_editions_updated_at BEFORE UPDATE ON rpi_editions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_subscription_holder_lock BEFORE UPDATE OF holder_id ON subscriptions FOR EACH ROW EXECUTE FUNCTION prevent_locked_holder_change();
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_subscription_holder_workspace BEFORE INSERT OR UPDATE OF holder_id, workspace_id ON subscriptions FOR EACH ROW EXECUTE FUNCTION validate_holder_workspace();
CREATE TRIGGER trg_trademark_holder_workspace BEFORE INSERT OR UPDATE OF holder_id, workspace_id ON trademarks FOR EACH ROW EXECUTE FUNCTION validate_holder_workspace();
CREATE TRIGGER trg_trademarks_updated_at BEFORE UPDATE ON trademarks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_trademark_normalize BEFORE INSERT OR UPDATE OF name ON trademarks FOR EACH ROW EXECUTE FUNCTION normalize_trademark();
CREATE TRIGGER trg_enqueue_webhook_event AFTER INSERT ON webhook_events FOR EACH ROW EXECUTE FUNCTION enqueue_webhook_event();
CREATE TRIGGER trg_workflow_tasks_updated_at BEFORE UPDATE ON workflow_tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_enqueue_workflow_task AFTER INSERT ON workflow_tasks FOR EACH ROW EXECUTE FUNCTION enqueue_workflow_task();
CREATE TRIGGER trg_create_agent_for_workspace AFTER INSERT ON workspaces FOR EACH ROW EXECUTE FUNCTION create_agent_for_workspace();
CREATE TRIGGER trg_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION set_updated_at();