import type {
  MembershipRole,
  StandardLifecycleStatus,
  StandardVersionReadModel,
  StandardsApproverOption,
  StandardsDashboardCounts,
  StandardsDisplayStatus,
  StandardsWorkspaceReadModel,
  StandardsViewerContext
} from "@yuppie/domain";

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
