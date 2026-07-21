# Standards Workspace Schema Decisions

## Shape and Names

- PostgreSQL values match the domain exactly: lifecycle
  `draft | review | approved | retired`, kind
  `material | labor | work_method`, roles, and approval decisions.
- `standards` and `standard_versions` normalize common identity, source,
  lifecycle, reviewer, approval, effective-date, and retirement fields.
  Material, Labor, and Work Method tables are strict one-kind subtypes.
- Evidence targets one exact version and carries that version's kind. Common
  title/source fields remain neutral because Phase 1A did not approve
  category-specific evidence fields or types.

## Isolation and Actor Mapping

- Every organization-owned table carries `organization_id`; `organizations` is
  the documented tenant-root exception.
- Composite keys and foreign keys prevent cross-organization references. RLS
  and `auth.users` integration are intentionally deferred to the Auth/RLS phase.
- Domain contracts expose actor `userId`. Persistence stores the same actor as
  an organization-scoped membership ID, then resolves `user_id` through
  `(organization_id, membership_id)`. This preserves tenant context and avoids
  an early dependency on Supabase Auth.

## Enforced Governance

- A locked parent identity plus a trigger requires gap-free sequential version
  numbers. Partial unique indexes allow at most one Draft, one Review, and one
  eligible Approved version per standard.
- Review requires matching subtype content, exact-version evidence, and an
  independent assigned Approver. All editors are retained so any creator/editor
  is rejected as reviewer or approver.
- Review content is frozen. Approval and retirement occur only through an
  append-only decision record; Approved and Retired content is immutable.
- Evidence, approvals, audit logs, and standard versions cannot be deleted.
  Work Method references are mutable only while their source version is Draft.
- Audit `action` and `outcome` remain non-enum text for append-only evolution;
  writers use the domain's canonical actions and `succeeded | rejected` values.

## Index and Query Rationale

- Every foreign key has a primary, unique, or explicit index beginning with its
  organization and reference columns.
- Version indexes support identity/version lookup and lifecycle uniqueness.
  Evidence and approval indexes support exact-version traceability; audit
  indexes support tenant timelines, subjects, versions, and actors.
- No speculative reporting views, soft-delete columns, or cache structures are
  included.

## Migration and Verification

- `202607210001_standards_workspace.sql` is forward-only and contains no seed
  data. Later changes require a new migration.
- Integration tests execute the SQL and its triggers against in-memory
  PostgreSQL via dev-only PGlite. This avoids a Docker/Supabase CLI requirement
  while testing real constraints instead of SQL text patterns.
