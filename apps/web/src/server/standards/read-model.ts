import type {
  MembershipRole,
  StandardKind,
  StandardLifecycleStatus
} from "@yuppie/domain";

export type StandardsDisplayStatus = StandardLifecycleStatus | "rejected";

export interface StandardsViewerContext {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly membershipId: string;
  readonly userId: string;
  readonly roles: readonly MembershipRole[];
}

export interface StandardsApproverOption {
  readonly membershipId: string;
  readonly label: string;
}

export interface StandardVersionReadModel {
  readonly id: string;
  readonly standardId: string;
  readonly kind: StandardKind;
  readonly versionNumber: number;
  readonly status: StandardLifecycleStatus;
  readonly displayStatus: StandardsDisplayStatus;
  readonly source: string;
  readonly createdByMembershipId: string;
  readonly createdAt: string;
  readonly lastEditedByMembershipId: string;
  readonly editorMembershipIds: readonly string[];
  readonly lastEditedAt: string;
  readonly submittedAt?: string;
  readonly reviewerMembershipId?: string;
  readonly approvedAt?: string;
  readonly effectiveDate?: string;
  readonly returnReason?: string;
  readonly retiredAt?: string;
  readonly retirementReason?: string;
  readonly unit?: string;
  readonly specification?: string;
  readonly applicability?: string;
  readonly interpretationBasis?: string;
  readonly methodDescription?: string;
  readonly conditions?: string;
}

export interface StandardEvidenceReadModel {
  readonly id: string;
  readonly standardId: string;
  readonly standardVersionId: string;
  readonly kind: StandardKind;
  readonly versionNumber: number;
  readonly title: string;
  readonly source: string;
  readonly sourceUri?: string;
  readonly contentHash?: string;
  readonly capturedAt: string;
  readonly addedByMembershipId: string;
  readonly createdAt: string;
}

export interface StandardAuditReadModel {
  readonly id: string;
  readonly action: string;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly standardVersionId?: string;
  readonly actorMembershipId: string;
  readonly outcome: string;
  readonly occurredAt: string;
}

export interface StandardReadModel {
  readonly id: string;
  readonly kind: StandardKind;
  readonly code: string;
  readonly name: string;
  readonly classification?: string;
  readonly category?: string;
  readonly intendedScope?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly versions: readonly StandardVersionReadModel[];
  readonly latestVersion?: StandardVersionReadModel;
}

export interface StandardsWorkspaceReadModel {
  readonly viewer: StandardsViewerContext;
  readonly standards: readonly StandardReadModel[];
  readonly evidence: readonly StandardEvidenceReadModel[];
  readonly audit: readonly StandardAuditReadModel[];
  readonly approvers: readonly StandardsApproverOption[];
  readonly counts?: StandardsDashboardCounts;
}

export type StandardsReadErrorCode =
  | "unauthorized"
  | "membership_required"
  | "read_failed";

export type StandardsReadResult<T> =
  | { readonly ok: true; readonly data: T }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: StandardsReadErrorCode;
        readonly message: string;
      };
    };

export interface StandardsListFilters {
  readonly kind?: StandardKind;
  readonly search?: string;
  readonly category?: string;
  readonly status?: StandardsDisplayStatus;
  readonly standardId?: string;
}

export interface StandardsDashboardCounts {
  readonly material: number;
  readonly labor: number;
  readonly workMethod: number;
  readonly draft: number;
  readonly review: number;
  readonly approved: number;
  readonly retired: number;
  readonly assignedReview: number;
}

export function latestVersion(
  versions: readonly StandardVersionReadModel[]
): StandardVersionReadModel | undefined {
  return [...versions].sort((left, right) => right.versionNumber - left.versionNumber)[0];
}

export function statusForDisplay(
  status: StandardLifecycleStatus,
  returnReason?: string
): StandardsDisplayStatus {
  return status === "draft" && returnReason ? "rejected" : status;
}

export function dashboardCounts(
  model: StandardsWorkspaceReadModel
): StandardsDashboardCounts {
  if (model.counts) return model.counts;
  const versions = model.standards.flatMap((standard) => standard.versions);
  return {
    material: model.standards.filter(({ kind }) => kind === "material").length,
    labor: model.standards.filter(({ kind }) => kind === "labor").length,
    workMethod: model.standards.filter(({ kind }) => kind === "work_method").length,
    draft: versions.filter(({ displayStatus }) => displayStatus === "draft").length,
    review: versions.filter(({ status }) => status === "review").length,
    approved: versions.filter(({ status }) => status === "approved").length,
    retired: versions.filter(({ status }) => status === "retired").length,
    assignedReview: versions.filter(
      ({ status, reviewerMembershipId }) =>
        status === "review" && reviewerMembershipId === model.viewer.membershipId
    ).length
  };
}

export function canEditStandards(roles: readonly MembershipRole[]): boolean {
  return roles.includes("standards_editor");
}

export function canApproveStandards(roles: readonly MembershipRole[]): boolean {
  return roles.includes("standards_approver");
}

export function canApproveVersion(
  viewer: StandardsViewerContext,
  version: StandardVersionReadModel
): { readonly allowed: boolean; readonly reason?: string } {
  if (!canApproveStandards(viewer.roles)) {
    return { allowed: false, reason: "บัญชีนี้ไม่มีสิทธิ์อนุมัติมาตรฐาน" };
  }
  if (version.status !== "review") {
    return { allowed: false, reason: "อนุมัติได้เฉพาะรายการที่รอตรวจสอบ" };
  }
  if (
    version.createdByMembershipId === viewer.membershipId ||
    version.editorMembershipIds.includes(viewer.membershipId)
  ) {
    return { allowed: false, reason: "ผู้สร้างหรือผู้แก้ไขไม่สามารถอนุมัติงานของตนเอง" };
  }
  if (version.reviewerMembershipId !== viewer.membershipId) {
    return { allowed: false, reason: "รายการนี้มอบหมายให้ผู้อนุมัติคนอื่น" };
  }
  return { allowed: true };
}

export function canRetireVersion(
  viewer: StandardsViewerContext,
  version: StandardVersionReadModel
): { readonly allowed: boolean; readonly reason?: string } {
  if (!canApproveStandards(viewer.roles)) {
    return { allowed: false, reason: "บัญชีนี้ไม่มีสิทธิ์ยกเลิกใช้มาตรฐาน" };
  }
  return version.status === "approved"
    ? { allowed: true }
    : { allowed: false, reason: "ยกเลิกใช้ได้เฉพาะ Version ที่อนุมัติแล้ว" };
}

export function eligibleApprovers(
  version: StandardVersionReadModel,
  approvers: readonly StandardsApproverOption[]
): readonly StandardsApproverOption[] {
  const excluded = new Set([
    version.createdByMembershipId,
    ...version.editorMembershipIds
  ]);
  return approvers.filter(({ membershipId }) => !excluded.has(membershipId));
}
