# Phase 1 Product Scope

## Purpose

Define the accepted MVP boundary for YUPPIE BOQ before schema or feature design. Phase 1A records product policy and ADRs only; it does not authorize implementation.

## MVP Outcomes

- Launch with one pilot organization while scoping every user, standard, project, BOQ, approval, and audit record to an organization from the start. Cross-organization sharing is not supported.
- Govern Material, Labor, Productivity, and Work Method standards through version-specific evidence and approval.
- Organize estimating work as Project, Booth, Workpiece, BOQ, and BOQ Revision.
- Require only standards relevant to the BOQ items and validate the minimum standard set for each work type.
- Allow new work to reference the single eligible Approved version of each standard while preserving historical references after retirement.
- Keep `Approved` and `Issued` distinct and capture an immutable BOQ snapshot when a revision becomes `Issued`.
- Record attributable lifecycle, approval, retirement, and BOQ issue events for audit.
- Report calculation warnings without allowing UI or persistence code to own calculation rules.

Detailed lifecycle and authority are defined in [Standards Workflow](standards-workflow.md) and [Roles and Approval](roles-and-approval.md).

## Governed Information

This is conceptual product content, not a database field list.

Every standard version carries the common governance information `Source`,
`Evidence`, `Reviewer`, `Approval Date`, and `Effective Date`. Material, Labor,
and Work Method also require evidence appropriate to their category.

| Standard | Stable identity | Version-specific content |
| --- | --- | --- |
| Material | Organization, code, name, classification | Unit, specification and applicability, evidence, lifecycle, approval |
| Labor (`LaborRate`) | Organization, code, labor category or name | Unit and interpretation basis, applicability, evidence, lifecycle, approval |
| Work Method | Organization, code, name, intended scope | Method description, conditions and applicable standard references, evidence, lifecycle, approval |
| Productivity | Organization, code, name | Unit and interpretation basis, conditions, Work Method version reference, evidence, lifecycle, approval |

No operational value, default, allowance, formula, or assumed standard is defined in this phase.

## Phase 1 Non-Goals

- Procurement, inventory, payroll, accounting, billing, or ERP functions
- Supplier quotation, market-data, or external catalog integrations
- A configurable workflow engine or organization-specific status models
- Cross-organization sharing, public catalogs, or global standards
- Forecasting, optimization, advanced analytics, or automated recommendations
- Mobile/offline operation and legacy-data import in Phase 1B
- Default prices, labor values, productivity values, allowances, formulas, or example standards

Implementation sequencing beyond Phase 1A requires a separately approved execution plan. Phase 1A creates no schema, migration, Auth/RLS, API, UI, calculation, or scaffold.

## Decision Status

The Phase 1A product decisions were accepted on 2026-07-21. No Phase 1A product-scope decision remains open.
