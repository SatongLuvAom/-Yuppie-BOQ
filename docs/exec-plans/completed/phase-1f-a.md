# Phase 1F-A: Calculation Contract Freeze

- Status: Completed
- Date: 2026-07-22
- Scope: Contracts, runtime validation, contract tests, ADR, and specification

## Delivered

- Portable calculation input/output contracts without Backdrop formulas.
- Explicit Labor Productivity and Labor Rate semantics approved for this phase.
- Shared Standards read DTO ownership in `packages/domain/src/read-models/`.
- Runtime validation and focused contract tests.
- Accepted ADR-004, Calculation Sandbox contract specification, and company
  input checklist.

## Boundary Review

- Domain/read DTOs remain storage-independent and have no workspace dependency.
- Validation depends inward on Domain; Calculation depends inward on Domain.
- Server adapters map database rows to shared DTOs; UI must not import database
  row types.
- Calculation remains pure and performs no I/O, authorization, standard lookup,
  or persistence.

## Verification

- `pnpm lint`: PASS
- `pnpm typecheck`: PASS
- `pnpm test`: PASS (80 tests in 10 files)
- `pnpm build`: PASS

## Scope Guard

No Backdrop formula, Sandbox UI, Project, Booth, Workpiece, BOQ, pricing,
Formula Builder, assumed productivity/rates, AI, Phase 1F-B, or schema change was
started.
