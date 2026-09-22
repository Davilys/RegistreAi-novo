-- PREPARED ONLY. Do not apply until Google OAuth, redirect allowlist and private preview deployment are approved.
-- The owner explicitly authorized davillys@gmail.com as the sole initial Administrator Master.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS app_private.admin_bootstrap_allowlist (
  email extensions.citext PRIMARY KEY,
  intended_role text NOT NULL CHECK (intended_role = 'master'),
  enabled boolean NOT NULL DEFAULT true,
  claimed_by uuid UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (email = lower(email::text)::extensions.citext),
  CHECK ((claimed_by IS NULL) = (claimed_at IS NULL))
);

CREATE TABLE IF NOT EXISTS app_private.admin_bootstrap_state (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  completed boolean NOT NULL DEFAULT false,
  completed_by uuid UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  completed_at timestamptz,
  CHECK ((completed_by IS NULL) = (completed_at IS NULL)),
  CHECK (NOT completed OR completed_by IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  email extensions.citext UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('master','owner','service','finance','legal','procurador','auditor')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','offboarded')),
  mfa_required boolean NOT NULL DEFAULT true CHECK (mfa_required),
  invited_by uuid REFERENCES public.admin_users(user_id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  suspended_at timestamptz,
  offboarded_at timestamptz,
  CHECK (email = lower(email::text)::extensions.citext),
  CHECK ((status = 'suspended') = (suspended_at IS NOT NULL)),
  CHECK ((status = 'offboarded') = (offboarded_at IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS app_private.admin_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email extensions.citext NOT NULL,
  role text NOT NULL CHECK (role IN ('owner','service','finance','legal','procurador','auditor')),
  token_sha256 text UNIQUE NOT NULL CHECK (token_sha256 ~ '^[0-9a-f]{64}$'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked','expired')),
  invited_by uuid NOT NULL REFERENCES public.admin_users(user_id) ON DELETE RESTRICT,
  expires_at timestamptz NOT NULL,
  accepted_by uuid UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (email = lower(email::text)::extensions.citext),
  CHECK (expires_at > created_at),
  CHECK ((accepted_by IS NULL) = (accepted_at IS NULL))
);

CREATE TABLE IF NOT EXISTS public.admin_access_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'master_bootstrap','invitation_created','invitation_accepted','role_changed',
    'session_authorized','session_denied','user_suspended','user_offboarded',
    'recovery_requested','recovery_completed'
  )),
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  request_id text,
  metadata_redacted jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_private.admin_recovery_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_user_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  requested_email extensions.citext NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','completed','expired')),
  reason_redacted text NOT NULL,
  created_by text NOT NULL,
  approved_by text,
  expires_at timestamptz NOT NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_access_events ENABLE ROW LEVEL SECURITY;

-- Security-definer helper avoids recursive RLS evaluation on admin_users.
CREATE OR REPLACE FUNCTION app_private.is_active_master(p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = p_user_id AND role = 'master' AND status = 'active'
  );
$$;
REVOKE ALL ON FUNCTION app_private.is_active_master(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.is_active_master(uuid) TO authenticated;

-- No admin policy is added to customer/process tables here. Until tenant-aware policies are reviewed,
-- authenticated admin accounts cannot read production business data through PostgREST.
CREATE POLICY admin_users_read_self ON public.admin_users
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND status = 'active' AND (SELECT auth.jwt()->>'aal') = 'aal2');

CREATE POLICY master_reads_admin_directory ON public.admin_users
  FOR SELECT TO authenticated
  USING ((SELECT app_private.is_active_master(auth.uid())) AND (SELECT auth.jwt()->>'aal') = 'aal2');

CREATE POLICY master_reads_admin_audit ON public.admin_access_events
  FOR SELECT TO authenticated
  USING ((SELECT app_private.is_active_master(auth.uid())) AND (SELECT auth.jwt()->>'aal') = 'aal2');

REVOKE ALL ON app_private.admin_bootstrap_allowlist FROM anon, authenticated;
REVOKE ALL ON app_private.admin_bootstrap_state FROM anon, authenticated;
REVOKE ALL ON app_private.admin_invitations FROM anon, authenticated;
REVOKE ALL ON app_private.admin_recovery_requests FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.admin_users FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.admin_access_events FROM anon, authenticated;

INSERT INTO app_private.admin_bootstrap_state(singleton) VALUES (true)
ON CONFLICT (singleton) DO NOTHING;
INSERT INTO app_private.admin_bootstrap_allowlist(email,intended_role)
VALUES ('davillys@gmail.com','master')
ON CONFLICT (email) DO UPDATE SET enabled = true;

CREATE OR REPLACE FUNCTION app_private.verified_google_identity(p_user_id uuid)
RETURNS TABLE(email extensions.citext)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, auth, extensions
AS $$
  SELECT lower(u.email)::extensions.citext
  FROM auth.users u
  WHERE u.id = p_user_id
    AND u.email IS NOT NULL
    AND u.email_confirmed_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.identities i
      WHERE i.user_id = u.id AND i.provider = 'google'
    );
$$;
REVOKE ALL ON FUNCTION app_private.verified_google_identity(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.bootstrap_initial_admin_master()
RETURNS TABLE(user_id uuid, email text, role text, mfa_required boolean)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, public, app_private, auth, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email extensions.citext;
  v_state app_private.admin_bootstrap_state%ROWTYPE;
  v_allow app_private.admin_bootstrap_allowlist%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '28000'; END IF;
  IF coalesce(auth.jwt()->>'aal','aal1') <> 'aal2' THEN
    RAISE EXCEPTION 'MFA_AAL2_REQUIRED' USING ERRCODE = '28000';
  END IF;

  SELECT v.email INTO v_email FROM app_private.verified_google_identity(v_uid) v;
  IF v_email IS NULL THEN RAISE EXCEPTION 'VERIFIED_GOOGLE_IDENTITY_REQUIRED' USING ERRCODE = '28000'; END IF;

  SELECT * INTO v_state FROM app_private.admin_bootstrap_state WHERE singleton FOR UPDATE;
  IF v_state.completed THEN
    IF v_state.completed_by = v_uid THEN
      RETURN QUERY SELECT a.user_id, a.email::text, a.role, a.mfa_required
      FROM public.admin_users a WHERE a.user_id = v_uid AND a.status = 'active';
      RETURN;
    END IF;
    RAISE EXCEPTION 'MASTER_BOOTSTRAP_ALREADY_COMPLETED' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_allow FROM app_private.admin_bootstrap_allowlist
  WHERE email = v_email AND enabled FOR UPDATE;
  IF v_allow.email IS NULL OR v_allow.claimed_by IS NOT NULL THEN
    RAISE EXCEPTION 'EMAIL_NOT_PREAUTHORIZED_FOR_BOOTSTRAP' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE role = 'master' AND status = 'active') THEN
    RAISE EXCEPTION 'ACTIVE_MASTER_ALREADY_EXISTS' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.admin_users(user_id,email,role,mfa_required)
  VALUES (v_uid,v_email,'master',true);
  UPDATE app_private.admin_bootstrap_allowlist
    SET claimed_by=v_uid, claimed_at=clock_timestamp(), enabled=false WHERE email=v_email;
  UPDATE app_private.admin_bootstrap_state
    SET completed=true, completed_by=v_uid, completed_at=clock_timestamp() WHERE singleton;
  INSERT INTO public.admin_access_events(actor_user_id,event_type,target_user_id,metadata_redacted)
    VALUES(v_uid,'master_bootstrap',v_uid,jsonb_build_object('provider','google','aal','aal2'));

  RETURN QUERY SELECT a.user_id, a.email::text, a.role, a.mfa_required
  FROM public.admin_users a WHERE a.user_id=v_uid;
END;
$$;
REVOKE ALL ON FUNCTION public.bootstrap_initial_admin_master() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_initial_admin_master() TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_admin_invitation(p_token text)
RETURNS TABLE(user_id uuid, email text, role text, mfa_required boolean)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, public, app_private, auth, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid(); v_email extensions.citext; v_inv app_private.admin_invitations%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='28000'; END IF;
  IF coalesce(auth.jwt()->>'aal','aal1') <> 'aal2' THEN RAISE EXCEPTION 'MFA_AAL2_REQUIRED' USING ERRCODE='28000'; END IF;
  SELECT v.email INTO v_email FROM app_private.verified_google_identity(v_uid) v;
  IF v_email IS NULL THEN RAISE EXCEPTION 'VERIFIED_GOOGLE_IDENTITY_REQUIRED' USING ERRCODE='28000'; END IF;
  SELECT * INTO v_inv FROM app_private.admin_invitations
    WHERE token_sha256=encode(extensions.digest(p_token,'sha256'),'hex') FOR UPDATE;
  IF v_inv.id IS NULL OR v_inv.status <> 'pending' OR v_inv.expires_at <= now() OR v_inv.email <> v_email THEN
    RAISE EXCEPTION 'VALID_INVITATION_REQUIRED' USING ERRCODE='42501';
  END IF;
  INSERT INTO public.admin_users(user_id,email,role,mfa_required,invited_by)
    VALUES(v_uid,v_email,v_inv.role,true,v_inv.invited_by);
  UPDATE app_private.admin_invitations SET status='accepted',accepted_by=v_uid,accepted_at=clock_timestamp() WHERE id=v_inv.id;
  INSERT INTO public.admin_access_events(actor_user_id,event_type,target_user_id,metadata_redacted)
    VALUES(v_uid,'invitation_accepted',v_uid,jsonb_build_object('invitation_id',v_inv.id,'role',v_inv.role));
  RETURN QUERY SELECT a.user_id,a.email::text,a.role,a.mfa_required FROM public.admin_users a WHERE a.user_id=v_uid;
END;
$$;
REVOKE ALL ON FUNCTION public.accept_admin_invitation(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_admin_invitation(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.assert_admin_session()
RETURNS TABLE(user_id uuid, role text)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE v_uid uuid := auth.uid(); v_admin public.admin_users%ROWTYPE;
BEGIN
  IF v_uid IS NULL OR coalesce(auth.jwt()->>'aal','aal1') <> 'aal2' THEN RAISE EXCEPTION 'ADMIN_MFA_SESSION_REQUIRED' USING ERRCODE='28000'; END IF;
  SELECT * INTO v_admin FROM public.admin_users WHERE admin_users.user_id=v_uid AND status='active';
  IF v_admin.user_id IS NULL THEN RAISE EXCEPTION 'ACTIVE_ADMIN_REQUIRED' USING ERRCODE='42501'; END IF;
  UPDATE public.admin_users SET last_seen_at=clock_timestamp() WHERE admin_users.user_id=v_uid;
  INSERT INTO public.admin_access_events(actor_user_id,event_type,target_user_id,metadata_redacted)
    VALUES(v_uid,'session_authorized',v_uid,jsonb_build_object('aal','aal2'));
  RETURN QUERY SELECT v_admin.user_id,v_admin.role;
END;
$$;
REVOKE ALL ON FUNCTION public.assert_admin_session() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assert_admin_session() TO authenticated;
