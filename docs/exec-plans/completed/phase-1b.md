# Phase 1B — Standards Workspace Domain and Schema

Status: Completed on 2026-07-21

## Goal

สร้าง Domain Model และ PostgreSQL schema สำหรับ Organization, Membership และ Material, Labor, Work Method standards โดยไม่เริ่ม Project, BOQ, Calculation, API, UI หรือ Auth/RLS

## Completed

- สร้าง typed contracts และ pure business rules สำหรับ lifecycle, versioning, approval separation และ immutability
- สร้าง normalized migration พร้อม organization-aware foreign keys, constraints, triggers และ indexes
- บังคับ sequential version, active Draft/Review/Approved limits, exact evidence, independent approval และ append-only history
- สร้าง Mermaid ERD, schema decisions, unit tests และ executable PostgreSQL migration tests
- เพิ่ม PGlite เป็น dev-only test runtime เพราะ environment ไม่มี Supabase CLI, `psql` หรือ Docker

## Checks

- Migration integration: 9/9 passed
- `pnpm lint`: passed
- `pnpm typecheck`: passed
- `pnpm test`: 22/22 passed
- `pnpm build`: passed
