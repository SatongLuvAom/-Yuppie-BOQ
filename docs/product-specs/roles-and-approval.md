# Roles and Approval

## Organization-Scoped Roles

| Role | Primary responsibility | May not |
| --- | --- | --- |
| Organization Admin | Manage organization membership and role assignments | Gain standards approval authority implicitly |
| Standards Editor | Create or edit Draft versions, attach evidence, and submit for Review | Approve a version they created or edited |
| Standards Approver | Independently review evidence, provide the single required approval, request changes, and retire standards | Alter content while it is in Review or after approval |
| Estimator | Use Approved standards in project, BOQ, and revision work | Create, approve, or retire standards unless separately assigned a standards role |
| Auditor | Read standards, evidence, decisions, snapshots, and audit history | Change operational or governance records |

A user may hold multiple roles, but authority remains organization-scoped and action-specific. Access to another organization's records is never implied by a role name.

## Approval Flow

1. A Standards Editor prepares a Draft and attaches required evidence.
2. The editor submits the exact version to Review; reviewed content is frozen.
3. One Standards Approver who neither created nor edited that version reviews its content and evidence.
4. That independent approver either approves it or records a reason and returns it to Draft for changes.
5. An Approved version becomes available for new work. A later change starts a new Draft version.
6. A Standards Approver may retire an Approved version with a recorded reason and immediate effect; retirement never rewrites historical use.

## Separation of Duties

- No user may approve a version they created or edited, even when they hold both Editor and Approver roles.
- Role assignment and standards approval are distinct actions. Organization Admin alone cannot bypass the approval flow.
- Every decision records its actor, time, target version, outcome, and required rationale.
- Approval applies to one version only and cannot be inherited, transferred, or inferred.
- The MVP requires one independent approver. Delegation and override are not supported.
- Only a Standards Approver may retire a standard.

Lifecycle transitions are defined in [Standards Workflow](standards-workflow.md). Audit behavior is governed by `ADR-003-audit-and-approval.md`.

## Decision Status

The Phase 1A role, single-approver, separation-of-duties, retirement-authority, and no-delegation/no-override decisions were accepted on 2026-07-21.
