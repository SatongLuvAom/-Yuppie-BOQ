# Company Inputs Required for Calculation

No value in this document is a default. The company must provide approved,
versioned information with source, evidence, owner, approver, effective date,
and applicability before Phase 1F-B can implement any Backdrop calculation.

## Required Before Formula Design

| Topic | Company decision or data required |
| --- | --- |
| Measurement units | Canonical output and dimension units, allowed symbols, precision, and whether mixed-unit input is permitted |
| Purchase units | Purchase-unit catalog per material category and the governed relationship to measurement units |
| Conversion | Approved conversion rules, direction, applicability conditions, evidence, and treatment when no rule exists |
| Waste | Which material/method conditions permit a waste rule, rule representation, ownership, and approval evidence |
| Rounding | Where rounding occurs, permitted direction/increment policy, precision, and whether purchase rounding differs from display rounding |
| Backdrop inputs | Required dimensions, method/work-type selection, optional attributes, and validity conditions; no formula is requested in this phase |
| Productivity | Output unit, labor unit, team headcount, normal hours/day, applicable method/work type, conditions, and approved source/evidence |
| Labor rates | Rate unit and applicability for normal work, hourly OT, night work, and holiday work; currency and effective-date policy |
| Standard selection | Rule for resolving applicability when more than one Approved standard could match the same method or condition |
| Warnings | Required blocking versus advisory conditions, stable warning ownership, and Thai wording approval process |

## Release and Governance Decisions

- Naming and issuance owner for `CalculationBuildId`.
- Versioning policy and compatibility window for the calculation contract.
- Reviewer/approver roles for calculation-contract and rule changes.
- Evidence required to accept a conversion, waste, rounding, productivity, or
  labor-rate rule for production use.
- Test-case approval process and the authoritative expected results that will
  be supplied before a formula is implemented.

## Can Be Deferred Beyond Formula Entry Criteria

- Historical build re-execution policy beyond retaining build and contract IDs.
- Localization beyond Thai and any presentation-only unit aliases.
- Advanced warning analytics or reporting.
