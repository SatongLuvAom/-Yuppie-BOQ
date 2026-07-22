"use client";

import type {
  BackdropFramePosition,
  BackdropTakeoffResult,
  BackdropTakeoffWarningCode
} from "@yuppie/calculation";
import { useActionState } from "react";

import {
  calculateBackdropAction,
  type BackdropSandboxActionState
} from "../../server/backdrop/actions";

const INITIAL_STATE: BackdropSandboxActionState = { status: "idle" };

const warningLabels: Readonly<Record<BackdropTakeoffWarningCode, string>> = {
  HEIGHT_EXCEEDS_HMR_SHEET: "ความสูงเกินแผ่น HMR แนวตั้ง",
  WOOD_MEMBER_SPLIT: "มีชิ้นโครงที่ต้องต่อไม้",
  HMR_JOINT_SUPPORT_REQUIRED: "มีรอยต่อ HMR ที่ต้องเสริมไม้รอง",
  SANDBOX_ESTIMATE: "ผลลัพธ์เป็นค่าประเมินจาก Sandbox"
};

const warningDescriptions: Readonly<Record<BackdropTakeoffWarningCode, string>> = {
  HEIGHT_EXCEEDS_HMR_SHEET: "ต้องแบ่งแผ่นตามความสูงและมีรอยต่อแนวนอน",
  WOOD_MEMBER_SPLIT: "ชิ้นที่ยาวเกินไม้ซื้อถูกแบ่งเป็นท่อนและแสดงใน Cut List แล้ว",
  HMR_JOINT_SUPPORT_REQUIRED: "ระบบเพิ่มไม้รองตรงแนวรอยต่อและไม่นับซ้ำกับโครงเดิม",
  SANDBOX_ESTIMATE: "ใช้ตรวจแนวทางเท่านั้น ยังไม่ใช่ BOQ และไม่รวมราคา ค่าแรง หรือวัสดุอื่น"
};

const reasonLabels = {
  edge: "โครงขอบ",
  spacing: "โครงระยะ 0.40 ม.",
  hmr_joint: "ไม้รองรอยต่อ HMR"
} as const;

function metres(value: number): string {
  return `${value.toLocaleString("th-TH", { maximumFractionDigits: 3 })} ม.`;
}

function decimal(value: number): string {
  return value.toLocaleString("th-TH", { maximumFractionDigits: 3 });
}

function PositionLine({
  axis,
  heightM,
  position,
  widthM
}: {
  readonly axis: "vertical" | "horizontal";
  readonly heightM: number;
  readonly position: BackdropFramePosition;
  readonly widthM: number;
}) {
  const isJoint = position.reasons.includes("hmr_joint");
  const className = isJoint ? "backdrop-grid__joint" : "backdrop-grid__member";

  return axis === "vertical" ? (
    <line
      className={className}
      x1={position.positionM}
      x2={position.positionM}
      y1={0}
      y2={heightM}
    />
  ) : (
    <line
      className={className}
      x1={0}
      x2={widthM}
      y1={heightM - position.positionM}
      y2={heightM - position.positionM}
    />
  );
}

function FrameDiagram({ result }: { readonly result: BackdropTakeoffResult }) {
  const { frameLayout } = result;
  const label = `ผังโครงกว้าง ${metres(frameLayout.widthM)} สูง ${metres(frameLayout.heightM)}`;

  return (
    <svg
      aria-label={label}
      className="backdrop-grid"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox={`-0.08 -0.08 ${frameLayout.widthM + 0.16} ${frameLayout.heightM + 0.16}`}
    >
      <rect
        className="backdrop-grid__frame"
        height={frameLayout.heightM}
        width={frameLayout.widthM}
        x={0}
        y={0}
      />
      {frameLayout.verticalPositions.map((position) => (
        <PositionLine
          axis="vertical"
          heightM={frameLayout.heightM}
          key={`vertical-${position.positionM}`}
          position={position}
          widthM={frameLayout.widthM}
        />
      ))}
      {frameLayout.horizontalPositions.map((position) => (
        <PositionLine
          axis="horizontal"
          heightM={frameLayout.heightM}
          key={`horizontal-${position.positionM}`}
          position={position}
          widthM={frameLayout.widthM}
        />
      ))}
    </svg>
  );
}

function ResultMetrics({ result }: { readonly result: BackdropTakeoffResult }) {
  const metrics = [
    ["HMR แบบจัดวาง", `${result.hmr.layoutEstimateSheets} แผ่น`, "วางแผ่นแนวตั้ง"],
    ["HMR ตามพื้นที่", `${result.hmr.areaEstimateSheets} แผ่น`, `${decimal(result.hmr.surfaceAreaM2)} ตร.ม.`],
    ["ชิ้นไม้ตัด", `${result.wood.totalCutPieces} ชิ้น`, "รวมชิ้นที่แบ่งต่อไม้"],
    ["ไม้ที่ต้องซื้อ", `${result.wood.totalStockBars} เส้น`, `ยาว ${metres(result.wood.stockLengthM)}/เส้น`],
    ["ความยาวใช้", metres(result.wood.totalUsedLengthM), "รวมทุกชิ้นตัด"],
    ["เศษรวม", metres(result.wood.totalRemainingLengthM), "เศษจากการจัด Cut List"]
  ] as const;

  return (
    <div className="metric-grid" aria-label="สรุปผลการถอดวัสดุ">
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

function TakeoffResult({ result }: { readonly result: BackdropTakeoffResult }) {
  return (
    <div className="backdrop-result-stack">
      <ResultMetrics result={result} />

      <section className="surface" aria-labelledby="frame-layout-heading">
        <div className="surface__header">
          <div>
            <h2 className="surface__title" id="frame-layout-heading">ผังตำแหน่งโครง</h2>
            <p className="surface__description">
              เส้นสีส้มคือแนวรองรอยต่อ HMR และเส้นสีน้ำเงินคือตำแหน่งโครงจริง
            </p>
          </div>
          <span className="status-badge tone--info">ชิ้นที่ 1 จาก {result.quantity}</span>
        </div>
        <div className="surface__body">
          <FrameDiagram result={result} />
        </div>
      </section>

      <section className="surface" aria-labelledby="warnings-heading">
        <div className="surface__header">
          <div>
            <h2 className="surface__title" id="warnings-heading">คำเตือนและขอบเขตผลลัพธ์</h2>
            <p className="surface__description">ตรวจรายการนี้ก่อนนำผลไปเทียบกับงานผลิตจริง</p>
          </div>
        </div>
        <div className="surface__body">
          <ul className="backdrop-warning-list">
            {result.warnings.map((warning) => (
              <li key={warning.id}>
                <strong>{warningLabels[warning.code]}</strong><br />
                {warningDescriptions[warning.code]}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="surface" aria-labelledby="cut-list-heading">
        <div className="surface__header">
          <div>
            <h2 className="surface__title" id="cut-list-heading">รายการไม้ตัด</h2>
            <p className="surface__description">ไม้เบญจพรรณหน้าตัด {result.wood.sectionWidthCm} × {result.wood.sectionDepthCm} ซม.</p>
          </div>
          <span className="status-badge tone--neutral">FFD</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ชิ้นตัด</th>
                <th>Backdrop</th>
                <th>แนว</th>
                <th>ตำแหน่ง</th>
                <th>ความยาว</th>
                <th>หน้าที่</th>
              </tr>
            </thead>
            <tbody>
              {result.wood.cutPieces.map((piece) => (
                <tr key={piece.id}>
                  <td>
                    <span className="data-table__primary">{piece.id}</span>
                    <span className="data-table__secondary">ท่อน {piece.segmentIndex}/{piece.segmentCount}</span>
                  </td>
                  <td>{piece.backdropIndex}</td>
                  <td>{piece.orientation === "vertical" ? "ตั้ง" : "นอน"}</td>
                  <td>{metres(piece.positionM)}</td>
                  <td>{metres(piece.lengthM)}</td>
                  <td>{piece.reasons.map((reason) => reasonLabels[reason]).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface" aria-labelledby="stock-list-heading">
        <div className="surface__header">
          <div>
            <h2 className="surface__title" id="stock-list-heading">การจัดชิ้นลงไม้ซื้อ</h2>
            <p className="surface__description">First Fit Decreasing บนไม้ซื้อยาว {metres(result.wood.stockLengthM)}</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ไม้ซื้อ</th>
                <th>ชิ้นที่ลงเส้นนี้</th>
                <th>ความยาวใช้</th>
                <th>เศษ</th>
              </tr>
            </thead>
            <tbody>
              {result.wood.stockBars.map((bar) => (
                <tr key={bar.id}>
                  <td><span className="data-table__primary">{bar.id}</span></td>
                  <td>
                    <div className="backdrop-stock-cuts">
                      {bar.cutPieceIds.map((pieceId) => <span key={pieceId}>{pieceId}</span>)}
                    </div>
                  </td>
                  <td>{metres(bar.usedLengthM)}</td>
                  <td>{metres(bar.remainingLengthM)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="data-table__secondary">
        Rule Set {result.ruleSetId} v{result.ruleSetVersion} · Build {result.buildId}
      </p>
    </div>
  );
}

export function BackdropSandbox() {
  const [state, formAction, pending] = useActionState(
    calculateBackdropAction,
    INITIAL_STATE
  );

  return (
    <div className="backdrop-sandbox__workspace">
      <form className="backdrop-sandbox__form form-stack" action={formAction} noValidate>
        <section className="form-section">
          <div className="form-section__heading">
            <div>
              <span className="form-section__step">INPUT / METRE</span>
              <h2 className="form-section__title">ขนาดผนังตรง</h2>
              <p className="form-section__description">กรอกขนาดสำเร็จของ Backdrop ที่ต้องการทดลองถอด</p>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="backdrop-width">ความกว้าง (ม.)</label>
              <input id="backdrop-width" min="0" name="width" placeholder="กรอกความกว้าง" required step="any" type="number" />
            </div>
            <div className="form-field">
              <label htmlFor="backdrop-height">ความสูง (ม.)</label>
              <input id="backdrop-height" min="0" name="height" placeholder="กรอกความสูง" required step="any" type="number" />
            </div>
            <div className="form-field form-field--wide">
              <label htmlFor="backdrop-quantity">จำนวน (ชิ้น)</label>
              <input defaultValue="1" id="backdrop-quantity" min="1" name="quantity" required step="1" type="number" />
              <p className="form-field__hint">ทุกชิ้นใช้ขนาดและวิธีผลิตเดียวกัน</p>
            </div>
          </div>
          <div className="button-group">
            <button className="button button--primary" disabled={pending} type="submit">
              {pending ? "กำลังคำนวณ…" : "คำนวณ Cut List"}
            </button>
          </div>
          {state.status === "error" ? (
            <p className="form-field__error" role="alert">{state.message}</p>
          ) : null}
        </section>
      </form>

      <div className="backdrop-sandbox__results" aria-live="polite">
        {pending ? (
          <section className="surface state-panel" aria-busy="true">
            <div className="state-panel__content">
              <span className="state-panel__mark" aria-hidden="true">CALC</span>
              <h2 className="state-panel__title">กำลังจัดตำแหน่งโครงและ Cut List</h2>
              <p className="state-panel__description">ระบบกำลังใช้ Rule Set รุ่นที่อนุมัติสำหรับ Sandbox รอบนี้</p>
            </div>
          </section>
        ) : state.status === "success" ? (
          <TakeoffResult result={state.result} />
        ) : (
          <section className="surface state-panel">
            <div className="state-panel__content">
              <span className="state-panel__mark" aria-hidden="true">1F</span>
              <h2 className="state-panel__title">รอขนาด Backdrop</h2>
              <p className="state-panel__description">
                ผลจะแสดงจำนวน HMR ตำแหน่งโครง รายการไม้ตัด ไม้ซื้อ และเศษจากการจัดชิ้น โดยไม่คำนวณราคาและค่าแรง
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
