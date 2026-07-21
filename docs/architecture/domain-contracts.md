# Domain Contracts

`packages/domain` contains small, storage-independent TypeScript contracts. They
are deliberately incomplete in Phase 0: no CRUD APIs, formulas, defaults,
validation library, or database representation is specified.

## Contract principles

- Entities use opaque-by-convention string IDs; adapters validate concrete ID
  formats at system boundaries.
- Contracts are readonly to discourage mutation of shared domain records.
- Date-times are ISO-8601 strings at package boundaries.
- `MaterialVersion`, `LaborRate`, `ProductivityStandard`, and
  `WorkMethodVersion` implement the common version/evidence/approval metadata.
- Evidence and approvals reference a specific standard and version.
- `BOQSnapshot<TPayload>` is an immutable envelope. Defining its persisted
  payload and issue workflow is deferred; revisions can already reference one.
- `TakeoffResult<TResult>` carries an unspecified result payload so Phase 0 does
  not invent measurement semantics.

## Contract groups

| Group | Contracts |
| --- | --- |
| Tenant and access | `Organization`, `User`, `Role` |
| Governed standards | `Material`, `MaterialVersion`, `LaborRate`, `ProductivityStandard`, `WorkMethod`, `WorkMethodVersion`, `StandardEvidence`, `Approval` |
| Project hierarchy | `Project`, `Booth`, `Workpiece` |
| BOQ lifecycle | `BOQ`, `BOQRevision`, `BOQSnapshot` |
| Calculation exchange | `TakeoffResult`, `CalculationWarning` |
| Traceability | `AuditLog` |

These types are not a database schema. Storage mapping, authorization rules,
runtime validation, approval workflow, calculation inputs, and snapshot payload
must be designed and verified in later phases.

