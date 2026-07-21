# YUPPIE BOQ Architecture

Phase 0 establishes a modular-monolith repository. It defines boundaries and
portable domain contracts only; it does not implement BOQ workflows,
calculations, persistence, authentication, or product UI.

## Core direction

```text
apps/web
  -> domain, calculation, validation, db, auth, storage, ui, config

calculation -> domain
validation  -> domain
db/auth/storage -> domain

domain -> no workspace package
ui     -> no business-rule package
config -> no business-rule package
```

Dependencies point toward stable contracts. Infrastructure and presentation
adapt the domain; the domain never imports them.

## Invariants

- `packages/calculation` is pure TypeScript. It must not import React, Next.js,
  database code, browser APIs, or other infrastructure.
- BOQ formulas never live in UI or database code.
- The database enforces storage integrity and access policy, not business rules.
- Standards are versioned and link to evidence and approvals.
- A future issued BOQ revision is represented by an immutable snapshot.
- No assumed prices, labor rates, productivity, allowances, or standards belong
  in repository defaults.
- Every test datum must be visibly labeled `DEMO_ONLY`.

Details:

- [Module boundaries](docs/architecture/module-boundaries.md)
- [Domain contracts](docs/architecture/domain-contracts.md)

