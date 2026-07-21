# YUPPIE BOQ Web App

Phase 0 establishes the repository, architecture boundaries, development rules, and CI baseline. It intentionally contains no BOQ workflow, calculation formula, material master, production screen, or representative business data.

## Prerequisites

- Node.js version declared by the repository configuration
- pnpm via Corepack
- A local environment file only when a later task explicitly requires Supabase connectivity

## Commands

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Structure

- `apps/web` — Next.js delivery layer
- `packages/*` — domain contracts and bounded adapters
- `supabase/migrations` — future PostgreSQL schema changes
- `tests/{unit,integration,e2e}` — test layers
- `docs` — architecture, product scope, decisions, plans, and handoffs

## Documentation

- [Phase 0 scope](docs/product-specs/phase-0.md)
- [Architecture](ARCHITECTURE.md)
- [Architecture details](docs/architecture/)
- [Active execution plans](docs/exec-plans/active/)
- [Architecture decisions](docs/decisions/README.md)
- [Handoff templates](docs/handoffs/)
- [Agent rules](AGENTS.md)

