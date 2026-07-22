"use server";

import {
  calculateBackdropTakeoff,
  type BackdropTakeoffErrorCode,
  type BackdropTakeoffResult
} from "@yuppie/calculation";

export type BackdropSandboxActionState =
  | { readonly status: "idle" }
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "success"; readonly result: BackdropTakeoffResult };

function inputNumber(formData: FormData, field: string): number {
  return Number(String(formData.get(field) ?? ""));
}

function errorMessage(code: BackdropTakeoffErrorCode): string {
  const messages: Readonly<Record<BackdropTakeoffErrorCode, string>> = {
    INVALID_DIMENSION: "กรุณากรอกความกว้างและความสูงเป็นตัวเลขที่มากกว่าศูนย์",
    INVALID_QUANTITY: "จำนวนต้องเป็นเลขจำนวนเต็มตั้งแต่ 1 ชิ้นขึ้นไป",
    UNSUPPORTED_UNIT: "Sandbox รอบนี้รองรับขนาดหน่วยเมตรเท่านั้น",
    UNSUPPORTED_OPENING: "Sandbox รอบนี้ยังไม่รองรับผนังที่มีช่องเปิด"
  };
  return messages[code];
}

export async function calculateBackdropAction(
  _previousState: BackdropSandboxActionState,
  formData: FormData
): Promise<BackdropSandboxActionState> {
  try {
    const outcome = calculateBackdropTakeoff({
      width: { value: inputNumber(formData, "width"), unit: "m" },
      height: { value: inputNumber(formData, "height"), unit: "m" },
      quantity: inputNumber(formData, "quantity")
    });

    return outcome.ok
      ? { status: "success", result: outcome.result }
      : { status: "error", message: errorMessage(outcome.error.code) };
  } catch {
    return {
      status: "error",
      message: "ยังคำนวณไม่ได้ในขณะนี้ กรุณาตรวจข้อมูลแล้วลองอีกครั้ง"
    };
  }
}
