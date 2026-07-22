# Phase 1D: Standards Service and API

- Status: Completed
- Date: 2026-07-22

## Scope

Implemented typed service and server mutation boundaries for Material, Labor,
Work Method, their versions, Evidence, Review submission, Approval, Rejection,
and Retirement. UI, Project, BOQ, Calculation, and AI remain out of scope.

## Design

- `packages/domain` owns portable requests, receipts, error codes, lifecycle
  rules, repository ports, and the service orchestration.
- `packages/validation` owns runtime request validation shared by every server
  action.
- `packages/db` maps the repository port to authenticated Supabase RPC calls.
- `apps/web/src/server` resolves the Supabase session and organization roles,
  then composes validation, service, and repository layers.
- Phase 1D RPCs derive the actor from `auth.uid()`, apply each write and audit
  event in one transaction, and return the append-only audit ID.

## Security and Verification

- Server actions use the publishable key with the caller session; no
  service-role credential is accepted or exposed.
- Domain and database checks both protect lifecycle transitions, organization
  isolation, immutable Approved/Retired versions, and independent approval.
- Unit and integration coverage includes shared validation, service rules,
  repository mapping, server response boundaries, and audited database RPCs.
- Completed checks: `pnpm install --frozen-lockfile`, `pnpm lint`,
  `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- Migration replay and an authenticated lifecycle smoke test passed with
  PGlite. Real Supabase pgTAP/RLS coverage is in
  `supabase/tests/database/standards_service_api.test.sql` for the pinned CI
  workflow; no local Docker was used.
