# ADR-001: Standard Versioning

- Status: Accepted
- Date: 2026-07-21

## Context

Material, labor, productivity, and work-method standards must remain traceable as
their definitions evolve. A stable business identity is needed for discovery,
while calculations and approvals must never resolve through a mutable
"current" value.

## Decision

- Each standard has a stable logical identity and one or more separately
  identified versions. The identity carries only continuity and discovery
  metadata; governed content belongs to a version.
- Version numbers are sequential within each logical identity. At most one
  active Draft and one active Review version may exist for that identity.
- Version content is immutable. A correction or changed definition creates a
  successor version rather than overwriting history.
- A version follows `Draft -> Review -> Approved -> Retired`. State changes are
  recorded separately from version content. Only one `Approved` version per
  standard is eligible for new work. Retirement is immediate; `Retired`
  versions remain readable for historical reproduction.
- Evidence and approval decisions reference the exact organization, standard
  identity, and version. Approval of one version never transfers to another.
- The domain owns version identity, lifecycle policy, and transition contracts.
  The database may preserve references and integrity, but does not decide
  lifecycle business rules.
- Phase 0 contracts are preliminary. Before persistence design, labor and
  productivity contracts must express the same logical-identity/version split
  already represented conceptually for material and work method.

## Consequences

- Historical calculations cannot silently change when a standard advances.
- Sequential versions and active-state limits make concurrent work explicit.
- Corrections require a new version and a new evidence/approval cycle.
- Consumers must request an exact version for governed work; aliases such as
  "latest" are acceptable only for discovery, never as stored calculation
  input.
- Version lifecycle transitions use the authorization and audit policy defined
  by ADR-003.
