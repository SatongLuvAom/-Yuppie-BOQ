# Standards Workflow

## Governed Unit

The lifecycle applies to a specific `MaterialVersion`, `LaborRate`, `ProductivityStandard`, or `WorkMethodVersion`. Evidence and approval always point to that exact version, never only to the stable parent record.

## Lifecycle

| Status | Meaning | Permitted actions | Use in new work |
| --- | --- | --- | --- |
| Draft | Editable proposal not yet submitted | Edit content, attach evidence, submit for review | No |
| Review | Frozen candidate awaiting a decision | Approve, request changes, or withdraw to Draft | No |
| Approved | Immutable company standard | Reference in new work or retire | Yes |
| Retired | Immutable standard no longer selected for new work | Historical read only | No |

Allowed transitions are:

| From | To | Trigger |
| --- | --- | --- |
| Draft | Review | Submit for review |
| Review | Draft | Request changes or withdraw |
| Review | Approved | Approve |
| Approved | Retired | Retire |

All other transitions are prohibited.

- Submission moves Draft to Review only when required metadata and evidence are present.
- Editing reviewed content requires a return to Draft and invalidates pending decisions.
- A request for changes records a reason and returns Review to Draft; it is not a fifth lifecycle status.
- Withdrawal by the submitter returns Review to Draft before a final approval.
- Approved and Retired content cannot be edited or returned to an earlier status.
- Retirement does not alter BOQ snapshots or other historical references.

## Version, Evidence, and Approval Rules

- Version numbers are unique sequential integers within each stable standard identity and are never reused.
- Each standard may have at most one active Draft and one active Review version.
- Draft edits do not create a new version. Any content correction or change after approval requires a new Draft version.
- Every version carries `Source`, `Evidence`, `Reviewer`, `Approval Date`, and `Effective Date` as common governance information.
- Evidence records identify their source and capture time and are attached to the exact version under review. Material, Labor, and Work Method require additional evidence appropriate to their category.
- Evidence remains readable with Approved and Retired versions; replacing evidence after approval requires a new version.
- Approval decisions identify the decided version, decision, actor, time, and rationale when changes are requested or a version is retired.
- Approval does not carry forward to another version. Each version completes its own review.
- Each standard has at most one Approved version eligible for new work. Retirement takes effect immediately; retained history remains readable.
- Before a BOQ can become Issued, validation checks only the related standards and the minimum required set for each work type.
- Existing snapshots retain their selected versions and supporting traceability after retirement.

Approval authority and separation of duties are defined in [Roles and Approval](roles-and-approval.md). Architectural policy is recorded in `ADR-001-standard-versioning.md` and `ADR-003-audit-and-approval.md`.

## Decision Status

The Phase 1A lifecycle, version concurrency, evidence model, Approved-version eligibility, and immediate-retirement decisions were accepted on 2026-07-21.
