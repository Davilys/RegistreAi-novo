# Staging foundation

Production stays on `main` and the current Hostinger deployment. This branch does not deploy.

Create staging only after approval:
- separate Supabase project with separate URL, anon key, service key and webhook secrets;
- separate worker service and hostname such as `staging-api.registreai.com.br`;
- Asaas sandbox only; Meta/OpenAI disabled until their own test credentials are approved;
- branch protection requires CI, worker tests and UI Quality;
- staging data must be synthetic and must never be copied from production.

Suggested promotion: working branch -> pull request -> staging deploy -> smoke/integration tests -> explicit production approval -> merge to `main`.
