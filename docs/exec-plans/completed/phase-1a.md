# Phase 1A — Product Scope and ADRs

Status: Completed and accepted on 2026-07-21

## Goal

กำหนดขอบเขต MVP, governance ของมาตรฐาน และ architecture decisions ที่ต้องตกลงก่อนออกแบบ schema โดยไม่เริ่ม implementation

## Ownership

- Product: `docs/product-specs/phase-1-scope.md`, `standards-workflow.md`, `roles-and-approval.md`
- Architecture: `docs/decisions/ADR-001-standard-versioning.md`, `ADR-002-boq-snapshot.md`, `ADR-003-audit-and-approval.md`
- Root coordinator: integration review และ completed plan

## Completed

- กำหนด MVP boundary, roles, approval flow และ lifecycle `Draft -> Review -> Approved -> Retired`
- กำหนด version/evidence/approval และ immutable BOQ snapshot policy
- บันทึก audit, organization isolation และ dependency direction เป็น ADR สถานะ Accepted
- ปิด Phase 1A Open Decisions ทั้งหมดตาม governance decisions ที่อนุมัติเมื่อ 2026-07-21
- ยืนยันว่า Phase 1B ไม่รวม legacy-data import และ MVP ไม่รองรับ cross-organization sharing, delegation หรือ override
- ยืนยันว่าไม่มี code, schema, migration, Auth/RLS, API, UI หรือ BOQ formula เพิ่มใน Phase 1A
