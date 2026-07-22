import type {
  StandardKind,
  StandardsDisplayStatus,
  StandardVersionReadModel
} from "@yuppie/domain";

import type {
  StandardsApiError,
  StandardsApiErrorCode
} from "../../server/standards/handler-factory";

export const standardKindLabels: Readonly<Record<StandardKind, string>> = {
  material: "วัสดุมาตรฐาน",
  labor: "ค่าแรงมาตรฐาน",
  work_method: "วิธีการผลิต"
};

export const standardKindRoutes: Readonly<Record<StandardKind, string>> = {
  material: "materials",
  labor: "labor",
  work_method: "work-methods"
};

export const statusLabels: Readonly<Record<StandardsDisplayStatus, string>> = {
  draft: "ฉบับร่าง",
  review: "รอตรวจสอบ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
  retired: "ยกเลิกใช้งาน"
};

export const statusTones = {
  draft: "neutral",
  review: "warning",
  approved: "success",
  rejected: "danger",
  retired: "neutral"
} as const;

const errorMessages: Partial<Record<StandardsApiErrorCode, string>> = {
  unauthorized: "กรุณาเข้าสู่ระบบใหม่แล้วลองอีกครั้ง",
  forbidden: "คุณไม่มีสิทธิ์ดำเนินการนี้",
  organization_scope_mismatch: "ข้อมูลองค์กรไม่ตรงกับบัญชีที่กำลังใช้งาน",
  standards_editor_role_required: "ต้องมีสิทธิ์ผู้แก้ไขมาตรฐาน",
  standards_approver_role_required: "ต้องมีสิทธิ์ผู้อนุมัติมาตรฐาน",
  validation_failed: "กรุณาตรวจสอบข้อมูลที่กรอก",
  not_found: "ไม่พบรายการมาตรฐานที่ต้องการ",
  conflict: "ข้อมูลมีการเปลี่ยนแปลง กรุณาโหลดหน้าใหม่",
  immutable_version: "ฉบับที่อนุมัติหรือยกเลิกแล้วไม่สามารถแก้ไขได้",
  self_approval_forbidden: "ผู้สร้างหรือผู้แก้ไขไม่สามารถอนุมัติงานของตนเอง",
  assigned_reviewer_required: "เฉพาะผู้ตรวจที่ได้รับมอบหมายเท่านั้นที่ดำเนินการได้",
  review_rejection_reason_required: "กรุณาระบุเหตุผลที่ปฏิเสธ",
  retirement_reason_required: "กรุณาระบุเหตุผลที่ยกเลิกใช้งาน",
  database_error: "ระบบบันทึกข้อมูลไม่ได้ กรุณาลองใหม่",
  unexpected_error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
};

export function apiErrorMessage(error: StandardsApiError): string {
  return errorMessages[error.code] ?? "ไม่สามารถดำเนินการได้ กรุณาตรวจสอบข้อมูลและลองใหม่";
}

export function formatThaiDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "—";
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

export function shortMembership(value: string): string {
  return `สมาชิก ${value.slice(0, 8)}`;
}

export function versionBanner(version: StandardVersionReadModel): {
  readonly title: string;
  readonly description: string;
  readonly tone: "neutral" | "info" | "success" | "warning" | "danger";
} {
  if (version.displayStatus === "rejected") {
    return {
      title: "ถูกปฏิเสธและส่งกลับเป็นฉบับร่าง",
      description: version.returnReason ?? "แก้ไขข้อมูลตามคำแนะนำก่อนส่งตรวจใหม่",
      tone: "danger"
    };
  }
  switch (version.status) {
    case "draft":
      return {
        title: "ฉบับร่าง",
        description: "แก้ไขรายละเอียดและแนบหลักฐานให้ครบก่อนส่งตรวจสอบ",
        tone: "neutral"
      };
    case "review":
      return {
        title: "กำลังรอตรวจสอบ",
        description: "รายละเอียดถูกล็อกระหว่างรอผู้ตรวจที่ได้รับมอบหมาย",
        tone: "warning"
      };
    case "approved":
      return {
        title: "อนุมัติแล้วและแก้ไขไม่ได้",
        description: "หากต้องการเปลี่ยนรายละเอียด ให้สร้าง Version ใหม่",
        tone: "success"
      };
    case "retired":
      return {
        title: "ยกเลิกใช้งานแล้ว",
        description: version.retirementReason ?? "Version นี้ไม่ใช้กับงานใหม่",
        tone: "neutral"
      };
  }
}

export function confirmationMessageFor(
  operation: "approve" | "retire"
): string {
  return operation === "approve"
    ? "ยืนยันการอนุมัติ Version นี้? เมื่ออนุมัติแล้วจะแก้ไขไม่ได้"
    : "ยืนยันการยกเลิกใช้งาน Version นี้? การเปลี่ยนแปลงมีผลทันที";
}
