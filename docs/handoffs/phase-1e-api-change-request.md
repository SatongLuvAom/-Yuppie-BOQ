# Phase 1E API Change Request

- Status: Deferred backend contract decisions; non-blocking for Phase 1E
- Date: 2026-07-22

## Contract Gaps

- Phase 1D exposes typed mutations but no typed list, detail, review queue,
  evidence history, version history, or audit history read contract.
- The accepted Labor Version contract contains `unit`, `interpretationBasis`,
  `applicability`, and `source`; it does not contain productivity or OT/night
  conditions.

## Phase 1E Boundary

- Add request-scoped server read queries in `apps/web` using the authenticated
  Supabase client and existing RLS policies.
- Keep read models UI-specific; do not add lifecycle rules, privileged keys,
  schema changes, migrations, or alternate mutation paths.
- Render only fields in the accepted contracts. Productivity and OT/night
  fields remain absent rather than being simulated or stored indirectly.

## Decisions Required Before a Backend Change

- Decide whether shared typed read contracts belong in Domain or a dedicated
  application-query package.
- Define the meaning, unit model, evidence requirements, and approval impact
  of Labor productivity and OT/night conditions before changing the schema.
