"use client";

import {
  calculateBackdropTakeoff,
  type BackdropTakeoffErrorCode,
  type BackdropTakeoffResult,
  type BackdropTakeoffWarningCode
} from "@yuppie/calculation";
import { type FormEvent, useState } from "react";

const warningLabels: Readonly<Record<BackdropTakeoffWarningCode, string>> = {
  HEIGHT_EXCEEDS_HMR_SHEET: "ความสูงเกินแผ่น HMR แนวตั้ง ต้องแบ่งแผ่นและมีรอยต่อแนวนอน",
  WOOD_MEMBER_SPLIT: "มีชิ้นโครงยาวเกินไม้ซื้อ ระบบแบ่งเป็นท่อนแล้ว",
  HMR_JOINT_SUPPORT_REQUIRED: "มีรอยต่อ HMR และระบบเพิ่มไม้รองตามแนวรอยต่อแล้ว",
  SANDBOX_ESTIMATE: "ผลนี้เป็น Sandbox Estimate ไม่ใช่ BOQ และไม่รวมราคา"
};

const errorLabels: Readonly<Record<BackdropTakeoffErrorCode, string>> = {
  INVALID_DIMENSION: "กรุณากรอกความกว้างและความสูงเป็นตัวเลขที่มากกว่าศูนย์",
  INVALID_QUANTITY: "จำนวนต้องเป็นเลขจำนวนเต็มตั้งแต่ 1 ชิ้นขึ้นไป",
  UNSUPPORTED_UNIT: "Preview นี้รองรับขนาดหน่วยเมตรเท่านั้น",
  UNSUPPORTED_OPENING: "Preview นี้ยังไม่รองรับผนังที่มีช่องเปิด"
};

function numberValue(form: HTMLFormElement, name: string): number {
  const field = form.elements.namedItem(name);
  return field instanceof HTMLInputElement ? Number(field.value) : Number.NaN;
}

function metres(value: number): string {
  return `${value.toLocaleString("th-TH", { maximumFractionDigits: 3 })} ม.`;
}

function decimal(value: number): string {
  return value.toLocaleString("th-TH", { maximumFractionDigits: 3 });
}

function ResultMetrics({ result }: { readonly result: BackdropTakeoffResult }) {
  const metrics = [
    ["ความกว้าง", metres(result.frameLayout.widthM), "ขนาดต่อชิ้น"],
    ["ความสูง", metres(result.frameLayout.heightM), `จำนวน ${result.quantity} ชิ้น`],
    ["HMR แบบจัดวาง", `${result.hmr.layoutEstimateSheets} แผ่น`, `HMR ${result.hmr.thicknessMm} มม.`],
    ["HMR ตามพื้นที่", `${result.hmr.areaEstimateSheets} แผ่น`, `${decimal(result.hmr.surfaceAreaM2)} ตร.ม.`],
    ["ไม้ซื้อ", `${result.wood.totalStockBars} เส้น`, `${metres(result.wood.stockLengthM)}/เส้น`],
    ["เศษไม้รวม", metres(result.wood.totalRemainingLengthM), "หลังจัดชิ้นลงไม้ซื้อ"]
  ] as const;

  return (
    <div className="metric-grid" aria-label="สรุปผลการคำนวณ">
      {metrics.map(([label, value, hint]) => (
        <div className="metric" key={label}>
          <span className="metric__label">{label}</span>
          <strong className="metric__value">{value}</strong>
          <span className="metric__hint">{hint}</span>
        </div>
      ))}
    </div>
  );
}

function FrameSummary({ result }: { readonly result: BackdropTakeoffResult }) {
  const summaries = [
    ["แนวโครงตั้ง", `${result.frameLayout.verticalPositions.length} แนว`],
    ["แนวโครงนอน", `${result.frameLayout.horizontalPositions.length} แนว`],
    ["ชิ้นโครงก่อนแบ่ง", `${result.wood.members.length} ชิ้น`]
  ] as const;

  return (
    <section className="surface" aria-labelledby="frame-summary-title">
      <div className="surface__header">
        <div>
          <h2 className="surface__title" id="frame-summary-title">โครงไม้</h2>
          <p className="surface__description">
            ไม้เบญจพรรณหน้าตัด {result.wood.sectionWidthCm} × {result.wood.sectionDepthCm} ซม.
          </p>
        </div>
      </div>
      <div className="surface__body preview-frame-summary">
        {summaries.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function Warnings({ result }: { readonly result: BackdropTakeoffResult }) {
  return (
    <section className="surface" aria-labelledby="warning-title">
      <div className="surface__header">
        <div>
          <h2 className="surface__title" id="warning-title">คำเตือน</h2>
          <p className="surface__description">ตรวจทุกข้อก่อนเทียบกับผลถอดของฝ่ายผลิต</p>
        </div>
      </div>
      <div className="surface__body">
        <ul className="backdrop-warning-list">
          {result.warnings.map((warning) => (
            <li key={warning.id}>{warningLabels[warning.code]}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function StockList({ result }: { readonly result: BackdropTakeoffResult }) {
  return (
    <section className="surface" aria-labelledby="stock-title">
      <div className="surface__header">
        <div>
          <h2 className="surface__title" id="stock-title">ไม้ซื้อและเศษรายเส้น</h2>
          <p className="surface__description">จัดชิ้นตัดด้วย First Fit Decreasing</p>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ไม้ซื้อ</th>
              <th>ความยาวใช้</th>
              <th>เศษ</th>
            </tr>
          </thead>
          <tbody>
            {result.wood.stockBars.map((bar) => (
              <tr key={bar.id}>
                <td><span className="data-table__primary">{bar.id}</span></td>
                <td>{metres(bar.usedLengthM)}</td>
                <td>{metres(bar.remainingLengthM)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Results({ result }: { readonly result: BackdropTakeoffResult }) {
  return (
    <div className="backdrop-result-stack">
      <ResultMetrics result={result} />
      <FrameSummary result={result} />
      <Warnings result={result} />
      <StockList result={result} />
      <p className="data-table__secondary">
        Rule Set {result.ruleSetId} v{result.ruleSetVersion} · Build {result.buildId}
      </p>
    </div>
  );
}

export function BackdropPrivatePreview() {
  const [result, setResult] = useState<BackdropTakeoffResult>();
  const [error, setError] = useState<string>();

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const outcome = calculateBackdropTakeoff({
      width: { value: numberValue(form, "width"), unit: "m" },
      height: { value: numberValue(form, "height"), unit: "m" },
      quantity: numberValue(form, "quantity")
    });

    if (!outcome.ok) {
      setResult(undefined);
      setError(errorLabels[outcome.error.code]);
      return;
    }

    setError(undefined);
    setResult(outcome.result);
  }

  return (
    <div className="backdrop-sandbox">
      <aside className="backdrop-sandbox__rail">
        <span className="backdrop-sandbox__mark">YUPPIE WORKSHOP</span>
        <div className="backdrop-sandbox__rail-copy">
          <p className="eyebrow">Private preview</p>
          <h2 className="backdrop-sandbox__rail-title">Backdrop Core Takeoff</h2>
          <p className="backdrop-sandbox__rail-description">
            สำหรับทดลองภายในด้วย Calculation Engine รุ่นเดียวกับ Repository หลัก
          </p>
          <ul className="backdrop-sandbox__scope">
            <li>ไม่ใช้ข้อมูล Production</li>
            <li>ไม่คำนวณราคาและค่าแรง</li>
            <li>ไม่มีช่องเปิด</li>
            <li>ไม่ใช่ BOQ โครงการ</li>
          </ul>
        </div>
      </aside>

      <main className="backdrop-sandbox__main">
        <header className="backdrop-sandbox__header">
          <span className="private-preview-note">จำกัดสิทธิ์สำหรับทดลองภายใน</span>
          <p className="eyebrow">Backdrop sandbox / current engine</p>
          <h1>ถอด HMR และไม้โครง<br />จากขนาด Backdrop</h1>
          <p>กรอกขนาดผนังตรงภายในอาคาร กรุ HMR ด้านเดียว ผลลัพธ์เป็น Sandbox Estimate เท่านั้น</p>
        </header>

        <div className="backdrop-sandbox__workspace">
          <form className="backdrop-sandbox__form form-stack" onSubmit={calculate} noValidate>
            <section className="form-section">
              <div className="form-section__heading">
                <div>
                  <span className="form-section__step">INPUT / METRE</span>
                  <h2 className="form-section__title">ขนาด Backdrop</h2>
                  <p className="form-section__description">ไม่บันทึกข้อมูลที่กรอกลงฐานข้อมูล</p>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="preview-width">ความกว้าง (ม.)</label>
                  <input id="preview-width" name="width" placeholder="กรอกความกว้าง" required step="any" type="number" />
                </div>
                <div className="form-field">
                  <label htmlFor="preview-height">ความสูง (ม.)</label>
                  <input id="preview-height" name="height" placeholder="กรอกความสูง" required step="any" type="number" />
                </div>
                <div className="form-field form-field--wide">
                  <label htmlFor="preview-quantity">จำนวน</label>
                  <input defaultValue="1" id="preview-quantity" min="1" name="quantity" required step="1" type="number" />
                </div>
              </div>
              <div className="button-group">
                <button className="button button--primary" type="submit">คำนวณ</button>
              </div>
              {error ? <p className="form-field__error" role="alert">{error}</p> : null}
            </section>
          </form>

          <div className="backdrop-sandbox__results" aria-live="polite">
            {result ? (
              <Results result={result} />
            ) : (
              <section className="surface state-panel preview-empty">
                <div className="state-panel__content">
                  <span className="state-panel__mark" aria-hidden="true">1F</span>
                  <h2 className="state-panel__title">รอขนาด Backdrop</h2>
                  <p className="state-panel__description">
                    ระบบจะแสดงขนาด จำนวน HMR โครงไม้ เศษไม้ และคำเตือน โดยไม่ใช้ข้อมูล Production
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
