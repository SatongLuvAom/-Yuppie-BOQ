# Phase 0 Product Scope

## Goal

Create a dependable starting point for the YUPPIE BOQ Web App: repository layout, architectural boundaries, development rules, automated checks, and initial domain contracts.

## In Scope

- Next.js and TypeScript workspace scaffolding managed by pnpm
- Package boundaries for domain, calculation, database, validation, auth, storage, UI, configuration, and test fixtures
- Initial TypeScript types or interfaces named in the Phase 0 execution plan
- ESLint, Vitest, build/type checks, and GitHub Actions
- Documentation for architecture, decisions, plans, and agent handoffs
- Empty locations reserved for future Supabase migrations and test layers

## Non-Goals

- BOQ creation, editing, revision workflows, or calculations
- Formulas, quantity takeoff logic, or business-rule implementation
- Material master, production database schema, CRUD APIs, Auth, or RLS
- Production screens, finished UX, or real integrations
- Seed data, realistic sample data, or assumed domain standards

## Guardrails

- Calculation stays pure TypeScript and cannot depend on React, Next.js, database code, or browser APIs.
- UI cannot own BOQ formulas; database code cannot own business rules.
- Future standards must support version, evidence, and approval records.
- Future BOQs must preserve immutable snapshots for reproducibility.
- Do not invent prices, labor rates, productivity values, allowances, or standards.
- Every test or fixture datum must carry an explicit `DEMO_ONLY` label and must never be treated as operational data.
- Agents edit only the owned paths stated in their task brief.

Phase 0 ends when the repository checks pass. Phase 1 requires a separately approved scope.

