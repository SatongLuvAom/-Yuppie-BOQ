# ADR-003: Audit, Approval, and Data Isolation

- Status: Accepted
- Date: 2026-07-21

## Context

Governed standards and official BOQ revisions require evidence of who changed,
reviewed, and approved them. The application will serve organizations whose data
must not be visible or referenceable across tenant boundaries.

## Decision

- Every governed action records an append-only audit event with organization,
  actor, action, subject, outcome, and occurrence time. Relevant version,
  evidence, approval, and snapshot identifiers provide an end-to-end trace;
  audit history is not edited to rewrite past events.
- Every standard version carries the common governance information `Source`,
  `Evidence`, `Reviewer`, `Approval Date`, and `Effective Date`; Material,
  Labor, and Work Method add evidence appropriate to their category.
- Evidence and each approval decision bind to one exact standard version. One
  independent Approver is required, and a person who created or edited a
  version cannot approve it. Delegation and override are not supported.
- Only an Approver may retire a standard, with a recorded reason and immediate
  effect.
- All business records and references are organization-scoped. Cross-organization
  reads, writes, references, approvals, and snapshot composition are denied.
  The MVP launches with one pilot organization and does not support sharing
  across organizations.
- Audit logs, snapshots, and evidence are retained without deletion throughout
  the MVP.
- The domain owns policy, state-transition rules, authorization requirements,
  and portable contracts. Database adapters persist them and the database
  enforces referential integrity and access isolation, but neither owns business
  rules. Authentication adapters supply verified identity and grants.
- Calculation depends only on domain contracts and explicit inputs. It remains
  pure and deterministic, performs no authorization or I/O, and never imports
  database, authentication, UI, Next.js, React, or browser code. Applications
  compose these layers; dependencies continue to point toward the domain.

## Consequences

- Approval and audit records can explain which evidence and standard version
  supported an official outcome.
- Separation of duties prevents routine self-approval but requires enough
  authorized reviewers for each organization.
- Organization context must be explicit at every application and persistence
  boundary; future database controls are defense in depth, not the definition
  of domain policy.
- MVP retention is simple and lossless; any later deletion, legal-hold,
  redaction, or cross-organization sharing policy requires a new decision.
