# Phase 1F-B1: Backdrop Core Takeoff Sandbox

- Status: Completed
- Scope: ผนังตรงภายในอาคาร กรุ HMR 9 มม. ด้านเดียว ไม่มีช่องเปิด
- Rule Set: `backdrop-core-takeoff` version 1
- Build ID: `backdrop-core-takeoff-v1`

## Delivered

- Pure TypeScript engine สร้างตำแหน่งโครง แนวรอยต่อ HMR และชิ้นไม้จริง
- Area Estimate และ vertical Layout Estimate โดยไม่สมมติ Waste
- แบ่งชิ้นไม้เกิน 2.45 ม. และจัด Cut List แบบ First Fit Decreasing
- หน้า `/sandbox/backdrop` แสดงผังโครง HMR ไม้ตัด ไม้ซื้อ เศษ และคำเตือน
- `UNSUPPORTED_OPENING` หยุดการคำนวณเมื่อมีช่องเปิด

## Verification

- `pnpm lint`: PASS
- `pnpm typecheck`: PASS
- `pnpm test`: PASS (92 tests in 13 files)
- `pnpm build`: PASS
- Golden coverage: TC-01, TC-02, TC-03, FFD conservation, quantity, deduplication และ unsupported opening

## Scope Guard

ไม่มีราคา ค่าแรง สี สกรู โป๊ว ช่องเปิด Project, Booth, BOQ, Pricing,
Formula Builder, AI หรือ Phase 1F-B2
