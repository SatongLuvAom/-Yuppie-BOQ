# Module Boundaries

## System shape

YUPPIE BOQ starts as one deployable Next.js application backed by Supabase.
Workspace packages separate responsibilities without introducing independent
services or distributed-system overhead.

| Module | Owns | Must not own |
| --- | --- | --- |
| `apps/web` | HTTP and page composition | BOQ formulas, persistence rules |
| `packages/domain` | Portable domain types, identities, and storage-independent read DTOs | I/O, CRUD, framework code |
| `packages/calculation` | Future deterministic calculations | React, Next.js, DB, browser APIs |
| `packages/validation` | Runtime input validation | Persistence and UI behavior |
| `packages/db` | Supabase/Postgres adapters and mapping | Business rules and formulas |
| `packages/auth` | Future authentication/authorization adapters | Domain calculations |
| `packages/storage` | Future file/object storage adapters | Domain calculations |
| `packages/ui` | Reusable presentation components | BOQ formulas and data access |
| `packages/config` | Shared tool and application configuration | Business data and defaults |
| `packages/test-fixtures` | Explicitly `DEMO_ONLY` test builders/data | Production defaults |

Supabase migrations own schema, constraints, indexes, and future RLS policies.
They do not define the meaning of a calculation or a standard.

## Dependency rules

1. `domain` has no workspace dependency and exposes type-level contracts only.
2. `calculation` may depend on `domain`; all inputs enter as arguments and all
   outputs are returned without side effects.
3. `validation` may depend on `domain` but domain types never depend on runtime
   validators.
4. `db`, `auth`, and `storage` are outward adapters. Domain and calculation code
   never import them.
5. `ui` remains presentation-only. Product orchestration belongs in `apps/web`.
6. `apps/web` is the composition root and is the only layer permitted to wire
   presentation, application flow, and infrastructure together.
7. No package imports from an app. Cross-package cycles are prohibited.
8. Server adapters map persistence rows to shared read DTOs. UI code consumes
   those DTOs and must not import database row types or `packages/db` types.

Shared read-model ownership and its layer impacts are recorded in
`docs/decisions/ADR-004-read-model-ownership.md`.

## Change rule

Add a dependency only when the owning responsibility requires it. A boundary
change affecting more than one module requires an architecture decision record
under `docs/decisions` before implementation.
