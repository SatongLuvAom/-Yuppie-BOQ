# Web App Rules

- Keep this app a thin Next.js delivery layer; respect package boundaries in `ARCHITECTURE.md`.
- UI code must not own BOQ formulas or business rules.
- Do not access database, auth, or storage implementations outside their package adapters.
- Phase 0 permits scaffolding only, not production screens or BOQ workflows.
- Do not edit files outside the task's owned paths.

