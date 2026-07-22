"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import type {
  StandardKind,
  StandardReadModel,
  StandardsApproverOption,
  StandardVersionReadModel
} from "@yuppie/domain";
import {
  addStandardEvidenceRequestSchema,
  approveStandardVersionRequestSchema,
  createStandardRequestSchema,
  createStandardVersionRequestSchema,
  rejectStandardVersionRequestSchema,
  retireStandardVersionRequestSchema,
  submitStandardForReviewRequestSchema,
  updateDraftVersionRequestSchema,
  type ValidationIssue,
  type ValidationSchema
} from "@yuppie/validation";

import {
  FormField,
  FormGrid,
  FormSection
} from "../../components/standards";
import {
  addStandardEvidenceAction,
  approveStandardVersionAction,
  createStandardAction,
  createStandardVersionAction,
  rejectStandardVersionAction,
  retireStandardVersionAction,
  submitStandardForReviewAction,
  updateDraftStandardVersionAction
} from "../../server/standards/actions";
import type { StandardsActionResponse } from "../../server/standards/handler-factory";
import { eligibleApprovers } from "../../server/standards/read-model";
import {
  apiErrorMessage,
  confirmationMessageFor,
  standardKindLabels
} from "./presentation";

type MutationState =
  | { readonly tone: "success" | "danger"; readonly message: string }
  | undefined;

function value(form: FormData, name: string): string {
  return String(form.get(name) ?? "");
}

function issueMessage(issue: ValidationIssue): string {
  const fieldNames: Readonly<Record<string, string>> = {
    code: "รหัส",
    name: "ชื่อ",
    classification: "หมวดวัสดุ",
    category: "ประเภทช่าง",
    intendedScope: "ขอบเขตงาน",
    source: "แหล่งข้อมูล",
    unit: "หน่วย",
    specification: "ข้อกำหนด",
    applicability: "ขอบเขตการใช้",
    interpretationBasis: "หลักการตีความ",
    methodDescription: "รายละเอียดวิธีผลิต",
    conditions: "เงื่อนไข",
    title: "ชื่อหลักฐาน",
    capturedAt: "วันที่เก็บหลักฐาน",
    reviewerMembershipId: "ผู้ตรวจ",
    effectiveDate: "วันที่มีผล",
    rationale: "เหตุผล"
  };
  const label = fieldNames[issue.path] ?? "ข้อมูล";
  return issue.code === "required"
    ? `กรุณากรอก${label}`
    : `กรุณาตรวจสอบ${label}`;
}

export function formValidationMessage<T>(schema: ValidationSchema<T>, input: unknown): string | undefined {
  const result = schema.safeParse(input);
  return result.success ? undefined : issueMessage(result.issues[0]);
}

function ActionNotice({ state }: { state: MutationState }) {
  return state ? (
    <p className={`form-field__${state.tone === "danger" ? "error" : "hint"}`} role="status">
      {state.message}
    </p>
  ) : null;
}

function useMutationState() {
  const router = useRouter();
  const [state, setState] = useState<MutationState>();
  const [pending, startTransition] = useTransition();

  const run = (
    validationError: string | undefined,
    operation: () => Promise<StandardsActionResponse<unknown>>,
    successMessage: string
  ) => {
    if (validationError) {
      setState({ tone: "danger", message: validationError });
      return;
    }
    startTransition(async () => {
      const result = await operation();
      if ("error" in result) {
        setState({ tone: "danger", message: apiErrorMessage(result.error) });
        return;
      }
      setState({ tone: "success", message: successMessage });
      router.refresh();
    });
  };
  return { pending, run, state };
}

export function CreateStandardForm({
  organizationId,
  kind
}: {
  readonly organizationId: string;
  readonly kind: StandardKind;
}) {
  const mutation = useMutationState();
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const common = {
      organizationId,
      kind,
      code: value(form, "code"),
      name: value(form, "name")
    };
    const request = kind === "material"
      ? { ...common, kind, classification: value(form, "classification") }
      : kind === "labor"
        ? { ...common, kind, category: value(form, "category") }
        : { ...common, kind, intendedScope: value(form, "intendedScope") };
    mutation.run(
      formValidationMessage(createStandardRequestSchema, request),
      () => createStandardAction(request),
      `สร้าง${standardKindLabels[kind]}แล้ว`
    );
  };

  return (
    <form className="form-stack" onSubmit={onSubmit} noValidate>
      <FormSection title={`เพิ่ม${standardKindLabels[kind]}`} description="สร้างข้อมูลหลักก่อน แล้วจึงสร้าง Version ที่มีรายละเอียดและหลักฐาน">
        <FormGrid>
          <FormField label="รหัส" htmlFor={`${kind}-code`} required>
            <input id={`${kind}-code`} name="code" autoComplete="off" required />
          </FormField>
          <FormField label="ชื่อ" htmlFor={`${kind}-name`} required>
            <input id={`${kind}-name`} name="name" autoComplete="off" required />
          </FormField>
          {kind === "material" ? (
            <FormField label="หมวดวัสดุ" htmlFor="classification" required wide>
              <select id="classification" name="classification" required defaultValue="">
                <option value="" disabled>เลือกหมวดวัสดุ</option>
                {[
                  "งานไม้", "งานเหล็ก", "งานสี", "งานพิมพ์และกราฟิก",
                  "งานไฟฟ้า", "อะคริลิคและพลาสติก", "ผ้าและวัสดุตกแต่ง",
                  "ฮาร์ดแวร์", "อื่น ๆ"
                ].map((category) => <option value={category} key={category}>{category}</option>)}
              </select>
            </FormField>
          ) : null}
          {kind === "labor" ? (
            <FormField label="ประเภทช่าง" htmlFor="category" required wide hint="ตัวอย่าง: ช่างไม้, ช่างสี, ช่างไฟ — ข้อความตัวอย่างจะไม่ถูกบันทึก">
              <input id="category" name="category" placeholder="เช่น ช่างไม้" required />
            </FormField>
          ) : null}
          {kind === "work_method" ? (
            <FormField label="ขอบเขตงาน" htmlFor="intendedScope" required wide>
              <select id="intendedScope" name="intendedScope" required defaultValue="">
                <option value="" disabled>เลือกขอบเขตงานผลิตบูธ</option>
                {["ผนังและ Backdrop", "พื้นและ Stage", "Counter", "Display", "Lightbox", "Signage", "งานโครงสร้างเหล็ก", "งานไฟฟ้าและแสงสว่าง"].map((scope) => <option value={scope} key={scope}>{scope}</option>)}
              </select>
            </FormField>
          ) : null}
        </FormGrid>
      </FormSection>
      <div className="button-group">
        <button className="button button--primary" disabled={mutation.pending} type="submit">
          {mutation.pending ? "กำลังบันทึก…" : "สร้างข้อมูลหลัก"}
        </button>
      </div>
      <ActionNotice state={mutation.state} />
    </form>
  );
}

function versionRequest(
  form: FormData,
  organizationId: string,
  standard: StandardReadModel,
  versionId?: string
) {
  const common = {
    organizationId,
    standardId: standard.id,
    ...(versionId ? { standardVersionId: versionId } : {}),
    kind: standard.kind,
    source: value(form, "source")
  };
  if (standard.kind === "material") {
    return {
      ...common,
      kind: standard.kind,
      unit: value(form, "unit"),
      specification: value(form, "specification"),
      applicability: value(form, "applicability")
    };
  }
  if (standard.kind === "labor") {
    return {
      ...common,
      kind: standard.kind,
      unit: value(form, "unit"),
      interpretationBasis: value(form, "interpretationBasis"),
      applicability: value(form, "applicability")
    };
  }
  return {
    ...common,
    kind: standard.kind,
    methodDescription: value(form, "methodDescription"),
    conditions: value(form, "conditions"),
    applicableStandardVersions: []
  };
}

export function VersionForm({
  organizationId,
  standard,
  version
}: {
  readonly organizationId: string;
  readonly standard: StandardReadModel;
  readonly version?: StandardVersionReadModel;
}) {
  const mutation = useMutationState();
  const isEdit = Boolean(version);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const request = versionRequest(
      new FormData(event.currentTarget),
      organizationId,
      standard,
      version?.id
    );
    const schema = isEdit
      ? updateDraftVersionRequestSchema
      : createStandardVersionRequestSchema;
    mutation.run(
      formValidationMessage(schema, request),
      () => isEdit
        ? updateDraftStandardVersionAction(request as Parameters<typeof updateDraftStandardVersionAction>[0])
        : createStandardVersionAction(request as Parameters<typeof createStandardVersionAction>[0]),
      isEdit ? "บันทึกฉบับร่างแล้ว" : "สร้าง Version ใหม่แล้ว"
    );
  };

  return (
    <form className="form-stack" onSubmit={onSubmit} noValidate>
      <FormSection title={isEdit ? "แก้ไขฉบับร่าง" : "สร้าง Version ใหม่"} description="รายละเอียดส่วนนี้อยู่ภายใต้ Version และต้องผ่านการตรวจสอบก่อนใช้งาน">
        <FormGrid>
          <FormField label="แหล่งข้อมูล" htmlFor="source" required wide>
            <textarea id="source" name="source" defaultValue={version?.source} required />
          </FormField>
          {standard.kind !== "work_method" ? (
            <FormField label={standard.kind === "labor" ? "หน่วยค่าแรง" : "หน่วยวัสดุ"} htmlFor="unit" required>
              <input id="unit" name="unit" defaultValue={version?.unit} required />
            </FormField>
          ) : null}
          {standard.kind === "material" ? (
            <>
              <FormField label="ข้อกำหนดวัสดุ" htmlFor="specification" required wide>
                <textarea id="specification" name="specification" defaultValue={version?.specification} required />
              </FormField>
              <FormField label="ขอบเขตการใช้" htmlFor="applicability" required wide>
                <textarea id="applicability" name="applicability" defaultValue={version?.applicability} required />
              </FormField>
            </>
          ) : null}
          {standard.kind === "labor" ? (
            <>
              <FormField label="หลักการตีความหน่วยค่าแรง" htmlFor="interpretationBasis" required wide>
                <textarea id="interpretationBasis" name="interpretationBasis" defaultValue={version?.interpretationBasis} required />
              </FormField>
              <FormField label="ขอบเขตการใช้" htmlFor="applicability" required wide>
                <textarea id="applicability" name="applicability" defaultValue={version?.applicability} required />
              </FormField>
            </>
          ) : null}
          {standard.kind === "work_method" ? (
            <>
              <FormField label="รายละเอียดวิธีผลิต" htmlFor="methodDescription" required wide>
                <textarea id="methodDescription" name="methodDescription" defaultValue={version?.methodDescription} required />
              </FormField>
              <FormField label="เงื่อนไขการใช้" htmlFor="conditions" required wide>
                <textarea id="conditions" name="conditions" defaultValue={version?.conditions} required />
              </FormField>
            </>
          ) : null}
        </FormGrid>
      </FormSection>
      <div className="button-group">
        <button className="button button--primary" disabled={mutation.pending} type="submit">
          {mutation.pending ? "กำลังบันทึก…" : isEdit ? "บันทึกฉบับร่าง" : "สร้าง Version"}
        </button>
      </div>
      <ActionNotice state={mutation.state} />
    </form>
  );
}

export function EvidenceForm({
  organizationId,
  standardVersionId
}: {
  readonly organizationId: string;
  readonly standardVersionId: string;
}) {
  const mutation = useMutationState();
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const capturedAtInput = value(form, "capturedAt");
    const capturedDate = new Date(capturedAtInput);
    const request = {
      organizationId,
      standardVersionId,
      title: value(form, "title"),
      source: value(form, "source"),
      sourceUri: value(form, "sourceUri") || undefined,
      contentHash: value(form, "contentHash") || undefined,
      capturedAt:
        capturedAtInput && !Number.isNaN(capturedDate.valueOf())
          ? capturedDate.toISOString()
          : capturedAtInput
    };
    mutation.run(
      formValidationMessage(addStandardEvidenceRequestSchema, request),
      () => addStandardEvidenceAction(request),
      "แนบหลักฐานแล้ว"
    );
  };
  return (
    <form className="form-stack" onSubmit={onSubmit} noValidate>
      <FormSection title="แนบหลักฐานอ้างอิง" description="บันทึกที่มาและวันที่เก็บหลักฐาน โดยไม่ลบประวัติเดิม">
        <FormGrid>
          <FormField label="ชื่อหลักฐาน" htmlFor="evidence-title" required>
            <input id="evidence-title" name="title" required />
          </FormField>
          <FormField label="แหล่งข้อมูล" htmlFor="evidence-source" required>
            <input id="evidence-source" name="source" required />
          </FormField>
          <FormField label="ลิงก์อ้างอิง" htmlFor="sourceUri" hint="ต้องเป็น URL แบบเต็ม">
            <input id="sourceUri" name="sourceUri" type="url" inputMode="url" />
          </FormField>
          <FormField label="วันที่เก็บหลักฐาน" htmlFor="capturedAt" required>
            <input id="capturedAt" name="capturedAt" type="datetime-local" required />
          </FormField>
          <FormField label="Content hash" htmlFor="contentHash" wide hint="กรอกเมื่อแหล่งหลักฐานมีค่า hash ที่ตรวจสอบได้">
            <input id="contentHash" name="contentHash" autoComplete="off" />
          </FormField>
        </FormGrid>
      </FormSection>
      <button className="button button--primary" disabled={mutation.pending} type="submit">
        {mutation.pending ? "กำลังแนบ…" : "แนบหลักฐาน"}
      </button>
      <ActionNotice state={mutation.state} />
    </form>
  );
}

export function LifecycleActions({
  organizationId,
  version,
  approvers,
  canEdit,
  decisionPermission
}: {
  readonly organizationId: string;
  readonly version: StandardVersionReadModel;
  readonly approvers: readonly StandardsApproverOption[];
  readonly canEdit: boolean;
  readonly decisionPermission: { readonly allowed: boolean; readonly reason?: string };
}) {
  const submitMutation = useMutationState();
  const decisionMutation = useMutationState();
  const availableApprovers = eligibleApprovers(version, approvers);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const request = {
      organizationId,
      standardVersionId: version.id,
      reviewerMembershipId: value(new FormData(event.currentTarget), "reviewerMembershipId")
    };
    submitMutation.run(
      formValidationMessage(submitStandardForReviewRequestSchema, request),
      () => submitStandardForReviewAction(request),
      "ส่งตรวจสอบแล้ว"
    );
  };
  const decide = (
    event: FormEvent<HTMLFormElement>,
    operation: "approve" | "reject" | "retire"
  ) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if ((operation === "approve" || operation === "retire") &&
      !window.confirm(confirmationMessageFor(operation))) return;
    const common = { organizationId, standardVersionId: version.id };
    if (operation === "approve") {
      const request = { ...common, effectiveDate: value(form, "effectiveDate") };
      decisionMutation.run(
        formValidationMessage(approveStandardVersionRequestSchema, request),
        () => approveStandardVersionAction(request),
        "อนุมัติ Version แล้ว"
      );
      return;
    }
    const request = { ...common, rationale: value(form, "rationale") };
    const schema = operation === "reject"
      ? rejectStandardVersionRequestSchema
      : retireStandardVersionRequestSchema;
    decisionMutation.run(
      formValidationMessage(schema, request),
      () => operation === "reject"
        ? rejectStandardVersionAction(request)
        : retireStandardVersionAction(request),
      operation === "reject" ? "ปฏิเสธและส่งกลับฉบับร่างแล้ว" : "ยกเลิกใช้งานแล้ว"
    );
  };

  if (version.status === "draft") {
    return canEdit ? (
      <form className="form-stack" onSubmit={submit} noValidate>
        <FormSection title="ส่งตรวจสอบ" description="เลือกผู้อนุมัติอิสระที่ไม่ได้สร้างหรือแก้ไข Version นี้">
          <FormField label="ผู้ตรวจ" htmlFor="reviewerMembershipId" required>
            <select id="reviewerMembershipId" name="reviewerMembershipId" required defaultValue="">
              <option value="" disabled>เลือกผู้ตรวจ</option>
              {availableApprovers.map((approver) => (
                <option key={approver.membershipId} value={approver.membershipId}>
                  {approver.label}
                </option>
              ))}
            </select>
          </FormField>
        </FormSection>
        <button className="button button--primary" type="submit" disabled={submitMutation.pending || availableApprovers.length === 0}>
          {submitMutation.pending ? "กำลังส่ง…" : "ส่งตรวจสอบ"}
        </button>
        {availableApprovers.length === 0 ? <p className="form-field__error">ยังไม่มีผู้อนุมัติอิสระที่เลือกได้</p> : null}
        <ActionNotice state={submitMutation.state} />
      </form>
    ) : <p>บัญชีนี้ดูข้อมูลได้อย่างเดียว</p>;
  }

  if (version.status === "review") {
    return (
      <div className="form-stack">
        {!decisionPermission.allowed ? <p className="form-field__error">{decisionPermission.reason}</p> : null}
        <form onSubmit={(event) => decide(event, "approve")} className="form-stack">
          <FormField label="วันที่มีผล" htmlFor={`effectiveDate-${version.id}`} required>
            <input id={`effectiveDate-${version.id}`} name="effectiveDate" type="date" required disabled={!decisionPermission.allowed} />
          </FormField>
          <button className="button button--primary" type="submit" disabled={!decisionPermission.allowed || decisionMutation.pending} title={decisionPermission.reason}>
            อนุมัติ
          </button>
        </form>
        <form onSubmit={(event) => decide(event, "reject")} className="form-stack">
          <FormField label="เหตุผลที่ปฏิเสธ" htmlFor={`rationale-${version.id}`} required>
            <textarea id={`rationale-${version.id}`} name="rationale" required disabled={!decisionPermission.allowed} />
          </FormField>
          <button className="button button--danger" type="submit" disabled={!decisionPermission.allowed || decisionMutation.pending} title={decisionPermission.reason}>
            ปฏิเสธ
          </button>
        </form>
        <ActionNotice state={decisionMutation.state} />
      </div>
    );
  }

  if (version.status === "approved") {
    return (
      <form onSubmit={(event) => decide(event, "retire")} className="form-stack">
        <FormField label="เหตุผลที่ยกเลิกใช้งาน" htmlFor={`retire-${version.id}`} required>
          <textarea id={`retire-${version.id}`} name="rationale" required disabled={!decisionPermission.allowed} />
        </FormField>
        <button className="button button--danger" type="submit" disabled={!decisionPermission.allowed || decisionMutation.pending}>
          ยกเลิกใช้งาน
        </button>
        <ActionNotice state={decisionMutation.state} />
      </form>
    );
  }

  return <p>Version นี้ถูกยกเลิกใช้งานและไม่มี Action เพิ่มเติม</p>;
}
