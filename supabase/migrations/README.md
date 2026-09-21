# Reproducible migrations

`supabase/schema/current_schema_snapshot.sql` is a snapshot for audit and bootstrap reference, not an ordered migration.

Before staging exists:
1. Create a new empty Supabase staging project.
2. Generate the first timestamped baseline migration from the reviewed snapshot.
3. Apply with `supabase db reset` locally, then `supabase db push` to staging only.
4. Add each later schema change as a new timestamped migration. Never edit an applied migration.
5. Run isolation, webhook idempotency, payment and deadline tests against staging before production approval.

No production database or credentials are used by this branch.
