# ADR-004: Shared Read Model Ownership

- Status: Accepted
- Date: 2026-07-22

## Context

Phase 1E introduced Standards read models inside `apps/web` because Phase 1D
exposed shared mutation contracts only. This let the UI ship without changing
the backend contract, but leaves the server-to-UI response shape owned by one
consumer and risks leaking PostgreSQL row names into presentation code.

The repository already treats `packages/domain` as the dependency-stable home
for storage-independent contracts. No separate application-query package exists,
and adding one for the current modular monolith would add a boundary without a
distinct owner or runtime responsibility.

## Decision

- Storage-independent Standards read DTOs live in
  `packages/domain/src/read-models/` and are exported by `@yuppie/domain`.
- Server query code returns those DTOs. UI code consumes the same DTOs and must
  not import Supabase-generated types, SQL row shapes, or `@yuppie/db` types.
- Read DTOs describe transport-safe data only. Database column names, query
  builders, RLS implementation, localized copy, formatting policy, and UI
  permission presentation do not belong in them.
- Database and server adapters map persistence rows to shared DTOs at the
  infrastructure boundary. RLS and server authorization remain authoritative;
  a DTO never grants access by itself.
- Domain entities and read DTOs remain distinct: entities express governed
  concepts, while read DTOs may compose denormalized views needed by consumers.
- Calculation contracts may reference portable domain identifiers and exact
  standard versions, but never depend on a Standards UI read DTO or a database
  row type.

## Dependency Impact

| Layer | Impact |
| --- | --- |
| Domain | Owns readonly, storage-independent DTO definitions; no new workspace dependency |
| Database | Maps rows to DTOs when acting as a read adapter; does not expose row types upward |
| Server/API | Selects authorized data, maps it once, and returns the shared DTO contract |
| UI | Imports shared DTOs from `@yuppie/domain`; keeps labels and display helpers local |
| Calculation | Unchanged: depends on explicit calculation/domain contracts only |

## Consequences

- Server and UI compile against one response contract, so drift is detected by
  TypeScript and contract tests.
- Persistence changes can remain inside adapters when the public read shape is
  unchanged.
- `packages/domain` contains both domain contracts and read DTOs, so folder and
  export naming must keep their different purposes visible.
- A dedicated query-contract package may be reconsidered only if multiple
  applications require an independently versioned API boundary.
