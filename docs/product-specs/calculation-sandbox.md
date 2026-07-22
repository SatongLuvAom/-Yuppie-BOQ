# Calculation Sandbox Contract Specification

## Purpose

Freeze the portable contract required to exercise a future Backdrop calculation
without implementing its formula, UI, persistence, or BOQ workflow. Phase 1F-A
defines shapes and validation only; it does not authorize an operational result.

## Contract Boundary

The contract set comprises `Quantity`, `Unit`, `PurchaseUnit`,
`ConversionRule`, `WasteRule`, `RoundingRule`, `LaborProductivity`, `LaborRate`,
`WorkMethodInput`, `CalculationInput`, `CalculationResult`, `CalculationLine`,
`CalculationWarning`, and `CalculationBuildId`.

- Inputs are explicit, readonly, unit-bearing, and refer to exact governed
  standard versions. No contract resolves a mutable `latest` standard.
- `CalculationBuildId` identifies the immutable implementation release used for
  a run. A separate calculation contract version identifies the input/output
  interpretation.
- Results preserve the build ID, contract version, output lines, warnings, and
  exact source standard versions. Full rule traceability uses the paired,
  validated `CalculationInput`, whose rules carry stable identifiers.
- Runtime validation rejects missing units, invalid numeric domains,
  inconsistent rule operands, unsupported discriminators, and incomplete
  version references before calculation execution.
- Calculation remains pure TypeScript: no database, Auth, network, browser,
  React, Next.js, clock, or environment lookup.

## Approved Labor Semantics

- Productivity is output quantity per labor unit, for example `m²/man-day`,
  `m/team-day`, `item/man-day`, or another explicitly named unit.
- Team headcount, normal working hours per day, productivity, normal labor rate,
  hourly OT rate, night-work rate, and holiday rate are separate values.
- OT and night-work rates do not multiply or otherwise change productivity
  directly.
- Every productivity input identifies its output unit, labor unit, applicable
  Work Method or work type, applicability conditions, source/evidence, exact
  version, approval, and effective date.

## Execution Preconditions

The future application layer must provide validated `CalculationInput` and the
exact standards selected under governance policy. The calculation package does
not query standards, determine authorization, select an Approved version, or
decide whether a standard is effective for a business transaction.

The future Sandbox may display validation and calculation output but must use
the same shared contracts as server execution. It must not add a second formula,
silently coerce units, or substitute local mock values in a production path.

## Outputs and Warnings

- Each `CalculationLine` states what quantity it represents, its unit, and its
  exact source standard versions. Purchase conversion, waste, and rounding stay
  as explicit input rules rather than being inferred from a display label.
- `CalculationWarning` uses a stable machine-readable code, severity, safe
  message, and optional input path or line reference.
- Warnings explain a result or prevent its use according to severity; they do
  not mutate input or hide an assumed fallback.
- Empty result lines are valid only when the contract explicitly permits them;
  absence of required output is not converted to zero automatically.

## Out of Scope

- Backdrop formulas or any quantity takeoff algorithm
- Calculation Sandbox UI or API execution endpoint
- Project, Booth, Workpiece, BOQ, pricing, quotation, or Formula Builder
- Database schema, migration, seed values, or production defaults
- Assumed productivity, labor rates, waste, conversions, rounding, or standards
- AI-assisted interpretation

Company inputs still required before formula work are listed in
[`calculation-company-inputs.md`](calculation-company-inputs.md).
