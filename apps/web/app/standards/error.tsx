"use client";

import { ErrorState, StandardsShell } from "../../src/components/standards";

export default function StandardsError({ reset }: { readonly reset: () => void }) {
  return (
    <StandardsShell>
      <ErrorState
        title="แสดงหน้ามาตรฐานไม่ได้"
        description="เกิดข้อผิดพลาดระหว่างโหลดหน้า กรุณาลองใหม่โดยไม่ต้องกรอกข้อมูลซ้ำ"
        action={<button className="button button--primary" onClick={reset} type="button">ลองอีกครั้ง</button>}
      />
    </StandardsShell>
  );
}
