# Phase 1C — Supabase Local, Auth, and RLS

Status: Awaiting GitHub Actions verification.

## Completed

- Added project-pinned Supabase CLI configuration, an empty seed,
  generated-state ignores, and dedicated CI database-security validation.
- Added organization-scoped Auth contracts for Admin, Editor, Approver, and
  Viewer without UI, API, Project, BOQ, or calculation work.
- Linked active memberships to `auth.users`, enabled RLS on all Standards
  Workspace tables, and granted least-privilege authenticated access.
- Enforced tenant isolation, role-specific writes, append-only decisions,
  approval separation, immutable Approved/Retired content, and trusted audit
  actor attribution.
- Added pgTAP tests for real Supabase PostgreSQL/Auth execution and unit tests for
  authorization contracts. All fixtures are `DEMO_ONLY`.

## Verification Gate

- Developer machines do not run Docker or Supabase Local for this phase.
- Repository lint, typecheck, unit/integration tests, and build run locally and
  in the main CI workflow.
- Migration reset and pgTAP/RLS acceptance run only in the `Supabase Database
  Tests` workflow on a GitHub-hosted runner. Phase 1C must not be reported as
  passed until that workflow succeeds for the branch commit.
