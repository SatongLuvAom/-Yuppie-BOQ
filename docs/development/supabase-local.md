# Supabase Database Verification

Phase 1C does not run Docker or the Supabase stack on developer machines.
Local development is limited to dependency installation, lint, typecheck, unit
and PGlite constraint tests, and the application build.

## GitHub Actions Gate

`.github/workflows/supabase-database-tests.yml` runs on a GitHub-hosted Ubuntu
runner for every push and pull request. It:

1. installs the frozen pnpm lockfile;
2. verifies that the executed Supabase CLI version exactly matches the pin in
   `package.json`;
3. starts an ephemeral Supabase database;
4. resets it and replays every committed migration plus the empty seed; and
5. runs the pgTAP/RLS suite with `supabase test db`.

Phase 1C is not verified until the `Supabase Database Tests` workflow succeeds
for the branch commit. PGlite remains useful for Phase 1B constraints but is not
accepted as RLS verification.

## Configuration and Secrets

Commit `supabase/config.toml`, migrations, `seed.sql`, and database tests.
Supabase CLI state (`.temp`, `.branches`) and `.env*` remain ignored. Never
commit or expose access tokens, signing keys, provider secrets, or a service-role
key to browser code. The Phase 1C seed intentionally contains no records; any
future test datum must be visibly labeled `DEMO_ONLY`.

References: [Supabase automated database testing](https://supabase.com/docs/guides/deployment/ci/testing)
and [database testing](https://supabase.com/docs/guides/database/testing).
