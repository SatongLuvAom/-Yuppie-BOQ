import type { Metadata } from "next";
import Link from "next/link";

import { BackdropSandbox } from "../../../src/features/backdrop/backdrop-sandbox";

export const metadata: Metadata = {
  title: "Backdrop Core Takeoff Sandbox",
  description: "หน้าทดลองถอด HMR และไม้โครงสำหรับ Backdrop ผนังตรงภายในอาคาร"
};

export default function BackdropSandboxPage() {
  return (
    <div className="backdrop-sandbox">
      <aside className="backdrop-sandbox__rail">
        <Link className="backdrop-sandbox__mark" href="/standards">YUPPIE WORKSHOP</Link>
        <div className="backdrop-sandbox__rail-copy">
          <p className="eyebrow">Core takeoff / v1</p>
          <h2 className="backdrop-sandbox__rail-title">Backdrop ผนังตรง ภายในอาคาร</h2>
          <p className="backdrop-sandbox__rail-description">
            ทดลองถอด HMR 9 มม. และไม้โครงเบญจพรรณจากตำแหน่งโครงจริง ก่อนเทียบกับงานผลิต
          </p>
          <ul className="backdrop-sandbox__scope">
            <li>กรุแผ่นด้านเดียว</li>
            <li>ไม่มีช่องเปิด</li>
            <li>ไม่รวมราคาและค่าแรง</li>
            <li>ผลเป็น Sandbox Estimate</li>
          </ul>
        </div>
      </aside>

      <main className="backdrop-sandbox__main">
        <header className="backdrop-sandbox__header">
          <p className="eyebrow">Phase 1F-B1 / Backdrop sandbox</p>
          <h1>ถอดแผ่นและจัดไม้โครง<br />จากขนาดหน้างาน</h1>
          <p>
            ระบบสร้างแนวโครงทุก 0.40 เมตร รองรอยต่อ HMR และจัดชิ้นตัดลงไม้ซื้อยาว 2.45 เมตรด้วย First Fit Decreasing
          </p>
        </header>
        <BackdropSandbox />
      </main>
    </div>
  );
}
