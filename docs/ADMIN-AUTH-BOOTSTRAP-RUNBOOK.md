# Private admin bootstrap runbook

Status: prepared, not applied or deployed.

## Invariants
- The initial Master is not “the first visitor.” The sole bootstrap allowlist entry is the owner-confirmed Google email `davillys@gmail.com`, canonicalized lowercase.
- The database checks the current `auth.uid()`, a confirmed email, a linked Google identity and an AAL2 session. The browser cannot choose a role.
- Bootstrap locks a singleton row and the allowlist row in one transaction, then creates the Master, consumes the allowlist and writes an audit event. Concurrent attempts cannot both win.
- After bootstrap, every account must arrive through a server-created, expiring, single-use invitation. Master is not an invitational role.
- Business tables receive no new admin read policies in this migration. A successful login still cannot expose production customer data.

## Approved flow
1. Configure Google OAuth in the selected Supabase project and restrict exact preview/production redirects. Do not use wildcards.
2. Apply the reviewed migration in a non-production project first.
3. Sign in with the allowlisted Google account.
4. Enroll a TOTP factor and complete the MFA challenge so the JWT is AAL2.
5. Call `bootstrap_initial_admin_master()` once. Read back `admin_users`, `admin_bootstrap_state` and `admin_access_events` through a privileged operator, not the client.
6. Every subsequent request calls `assert_admin_session()` server-side and uses short session lifetime, secure/HttpOnly/SameSite cookies at the web tier, CSRF protection, inactivity timeout and token revocation on suspension.
7. Keep `/admin` private until authentication, RLS, tenant scoping, CSP and an external security review pass. `/admin-preview` remains synthetic and must not be presented as the secure admin.

## Recovery and offboarding
Recovery is not a client RPC. A privileged operator creates an `admin_recovery_requests` record after out-of-band identity verification; a second authorized operator approves it; the action rotates/revokes factors and writes `recovery_completed`. Offboarding sets status to `offboarded`, revokes all sessions/factors through the auth admin API and emits an audit event. Never offboard the sole active Master until another preauthorized Master has been established through a reviewed recovery procedure.

## Deployment gates
- Confirm Supabase/auth project and allowed origins.
- Google OAuth consent screen, client and secret configured in the vault.
- MFA UX and recovery codes tested.
- Server/BFF chosen for secure cookie and CSRF enforcement.
- Admin RLS matrix reviewed table-by-table; no blanket service-role browser access.
- Invitation creation/revocation UI and backend implemented.
- Session revocation and offboarding integration tests pass.
- Private preview access control verified from a signed-out browser.
- No production data until tenant and field-level policies pass adversarial tests.
