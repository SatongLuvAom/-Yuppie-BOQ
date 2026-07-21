# ADR-002: Immutable BOQ Snapshot

- Status: Accepted
- Date: 2026-07-21

## Context

An official BOQ revision must remain explainable and reproducible after source
standards, project inputs, or calculation code evolve. Keeping only references
to mutable current records would make historical results ambiguous.

## Decision

- `Approved` and `Issued` are distinct BOQ states. Each Issued BOQ revision is
  bound to one immutable snapshot captured when it becomes Issued; Draft and
  Approved previews are not official snapshots.
- A snapshot records the effective inputs, produced outputs and warnings, units
  and interpretation metadata, and the exact approved versions of every
  material, labor, productivity, and work-method standard used. It must not
  resolve standards through a mutable "current" pointer.
- The snapshot records an immutable Calculation Build/Release ID and Calculation
  Contract Version so the result can be interpreted without changing historical
  records. This ADR intentionally does not choose a payload or storage schema.
- Once captured, neither snapshot content nor its BOQ revision binding may be
  replaced. Any later input, standard, or calculation change creates a new BOQ
  revision and a new snapshot.
- Retiring a referenced standard does not invalidate an existing snapshot; the
  exact historical version remains available for traceability.
- All snapshots and their evidence are retained without deletion during the MVP.
- The domain owns capture eligibility and snapshot contracts. Calculation
  produces deterministic output from explicit inputs; persistence only stores
  and retrieves the immutable result with integrity checks.

## Consequences

- Official revisions remain stable when masters or software change.
- Approval can complete before issue without creating an official snapshot.
- Snapshot creation must fail if a referenced standard is not the exact
  approved version required at capture time.
- Storage and retention costs increase because official history is preserved.
- Reproduction can identify the exact calculation release and contract used;
  compatibility execution policy beyond identifier retention is outside Phase 1A.
