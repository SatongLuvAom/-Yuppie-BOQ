import { createElement } from "../../apps/web/node_modules/react/index.js";
import { renderToStaticMarkup } from "../../apps/web/node_modules/react-dom/server.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createStandardRequestSchema,
  rejectStandardVersionRequestSchema
} from "../../packages/validation/src/index";

import { EmptyState, ErrorState, LoadingState } from "../../apps/web/src/components/standards";
import { formValidationMessage, LifecycleActions, VersionForm } from "../../apps/web/src/features/standards/mutation-forms";
import {
  apiErrorMessage,
  confirmationMessageFor,
  versionBanner
} from "../../apps/web/src/features/standards/presentation";
import { StandardDetailView } from "../../apps/web/src/features/standards/views";
import { collectionKinds, parseStandardsSearchParams } from "../../apps/web/src/features/standards/route-params";
import {
  canApproveVersion,
  canRetireVersion,
  eligibleApprovers,
  type StandardReadModel,
  type StandardsViewerContext,
  type StandardsWorkspaceReadModel,
  type StandardVersionReadModel
} from "../../apps/web/src/server/standards/read-model";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() })
}));
vi.mock("../../apps/web/node_modules/next/navigation.js", () => ({
  useRouter: () => ({ refresh: vi.fn() })
}));

const DEMO_ONLY_ORGANIZATION_ID = "10000000-0000-4000-8000-000000000001";
const DEMO_ONLY_STANDARD_ID = "10000000-0000-4000-8000-000000000002";
const DEMO_ONLY_VERSION_ID = "10000000-0000-4000-8000-000000000003";
const DEMO_ONLY_CREATOR_ID = "10000000-0000-4000-8000-000000000004";
const DEMO_ONLY_EDITOR_ID = "10000000-0000-4000-8000-000000000005";
const DEMO_ONLY_APPROVER_ID = "10000000-0000-4000-8000-000000000006";

function DEMO_ONLY_version(
  overrides: Partial<StandardVersionReadModel> = {}
): StandardVersionReadModel {
  return {
    id: DEMO_ONLY_VERSION_ID,
    standardId: DEMO_ONLY_STANDARD_ID,
    kind: "material",
    versionNumber: 1,
    status: "review",
    displayStatus: "review",
    source: "DEMO_ONLY source",
    createdByMembershipId: DEMO_ONLY_CREATOR_ID,
    createdAt: "2026-07-22T01:00:00Z",
    lastEditedByMembershipId: DEMO_ONLY_EDITOR_ID,
    editorMembershipIds: [DEMO_ONLY_CREATOR_ID, DEMO_ONLY_EDITOR_ID],
    lastEditedAt: "2026-07-22T02:00:00Z",
    reviewerMembershipId: DEMO_ONLY_APPROVER_ID,
    submittedAt: "2026-07-22T03:00:00Z",
    unit: "DEMO_ONLY unit",
    specification: "DEMO_ONLY specification",
    applicability: "DEMO_ONLY applicability",
    ...overrides
  };
}

function DEMO_ONLY_viewer(
  membershipId = DEMO_ONLY_APPROVER_ID,
  roles: StandardsViewerContext["roles"] = ["standards_approver"]
): StandardsViewerContext {
  return {
    organizationId: DEMO_ONLY_ORGANIZATION_ID,
    organizationName: "DEMO_ONLY organization",
    membershipId,
    userId: "10000000-0000-4000-8000-000000000007",
    roles
  };
}

describe("DEMO_ONLY Standards UI behavior", () => {
  beforeEach(() => vi.clearAllMocks());

  it("DEMO_ONLY maps loading, empty and safe error states", () => {
    const loading = renderToStaticMarkup(createElement(LoadingState, { label: "DEMO_ONLY loading" }));
    const empty = renderToStaticMarkup(createElement(EmptyState, { title: "DEMO_ONLY empty", description: "DEMO_ONLY no records" }));
    const error = renderToStaticMarkup(createElement(ErrorState, { title: "DEMO_ONLY error", description: "DEMO_ONLY safe error" }));
    expect(loading).toContain("role=\"status\"");
    expect(empty).toContain("DEMO_ONLY no records");
    expect(error).toContain("role=\"alert\"");
  });

  it("DEMO_ONLY validates form payloads through shared schemas", () => {
    const createMessage = formValidationMessage(createStandardRequestSchema, {
      organizationId: DEMO_ONLY_ORGANIZATION_ID,
      kind: "material",
      code: "",
      name: "DEMO_ONLY material",
      classification: "DEMO_ONLY classification"
    });
    const rejectMessage = formValidationMessage(rejectStandardVersionRequestSchema, {
      organizationId: DEMO_ONLY_ORGANIZATION_ID,
      standardVersionId: DEMO_ONLY_VERSION_ID,
      rationale: ""
    });
    expect(createMessage).toBe("กรุณากรอกรหัส");
    expect(rejectMessage).toBe("กรุณากรอกเหตุผล");
  });

  it("DEMO_ONLY maps server codes to safe Thai messages without raw errors", () => {
    expect(apiErrorMessage({ code: "self_approval_forbidden", message: "DEMO_ONLY raw database detail" }))
      .toBe("ผู้สร้างหรือผู้แก้ไขไม่สามารถอนุมัติงานของตนเอง");
    expect(apiErrorMessage({ code: "unexpected_error", message: "DEMO_ONLY stack" }))
      .not.toContain("DEMO_ONLY stack");
  });

  it("DEMO_ONLY blocks every historical editor from self approval", () => {
    const permission = canApproveVersion(DEMO_ONLY_viewer(DEMO_ONLY_CREATOR_ID), DEMO_ONLY_version());
    const editedPermission = canApproveVersion(DEMO_ONLY_viewer(DEMO_ONLY_EDITOR_ID), DEMO_ONLY_version());
    expect(permission.allowed).toBe(false);
    expect(editedPermission.allowed).toBe(false);
    expect(editedPermission.reason).toContain("งานของตนเอง");
  });

  it("DEMO_ONLY excludes creators and all editors from reviewer choices", () => {
    const eligible = eligibleApprovers(DEMO_ONLY_version(), [
      { membershipId: DEMO_ONLY_CREATOR_ID, label: "DEMO_ONLY creator" },
      { membershipId: DEMO_ONLY_EDITOR_ID, label: "DEMO_ONLY editor" },
      { membershipId: DEMO_ONLY_APPROVER_ID, label: "DEMO_ONLY independent" }
    ]);
    expect(eligible).toEqual([{ membershipId: DEMO_ONLY_APPROVER_ID, label: "DEMO_ONLY independent" }]);
  });

  it("DEMO_ONLY allows approver to retire an approved version independently from review permission", () => {
    const version = DEMO_ONLY_version({ status: "approved", displayStatus: "approved", reviewerMembershipId: undefined });
    expect(canApproveVersion(DEMO_ONLY_viewer(), version).allowed).toBe(false);
    expect(canRetireVersion(DEMO_ONLY_viewer(), version).allowed).toBe(true);
  });

  it("DEMO_ONLY renders required reject reason and disabled self-approval explanation", () => {
    const markup = renderToStaticMarkup(createElement(LifecycleActions, {
      organizationId: DEMO_ONLY_ORGANIZATION_ID,
      version: DEMO_ONLY_version(),
      approvers: [],
      canEdit: false,
      decisionPermission: { allowed: false, reason: "DEMO_ONLY self approval disabled" }
    }));
    expect(markup).toContain("เหตุผลที่ปฏิเสธ");
    expect(markup).toContain("required");
    expect(markup).toContain("DEMO_ONLY self approval disabled");
    expect(markup).toContain("disabled");
  });

  it("DEMO_ONLY renders Draft edit and Submit with only an independent reviewer", () => {
    const version = DEMO_ONLY_version({ status: "draft", displayStatus: "draft", reviewerMembershipId: undefined });
    const standard: StandardReadModel = {
      id: DEMO_ONLY_STANDARD_ID, kind: "material", code: "DEMO_ONLY-MAT",
      name: "DEMO_ONLY material", classification: "DEMO_ONLY classification",
      createdAt: "2026-07-22T01:00:00Z", updatedAt: "2026-07-22T02:00:00Z",
      versions: [version], latestVersion: version
    };
    const editMarkup = renderToStaticMarkup(createElement(VersionForm, {
      organizationId: DEMO_ONLY_ORGANIZATION_ID, standard, version
    }));
    const submitMarkup = renderToStaticMarkup(createElement(LifecycleActions, {
      organizationId: DEMO_ONLY_ORGANIZATION_ID,
      version,
      approvers: [
        { membershipId: DEMO_ONLY_CREATOR_ID, label: "DEMO_ONLY creator" },
        { membershipId: DEMO_ONLY_EDITOR_ID, label: "DEMO_ONLY editor" },
        { membershipId: DEMO_ONLY_APPROVER_ID, label: "DEMO_ONLY independent" }
      ],
      canEdit: true,
      decisionPermission: { allowed: false }
    }));
    expect(editMarkup).toContain("แก้ไขฉบับร่าง");
    expect(editMarkup).toContain("DEMO_ONLY specification");
    expect(submitMarkup).toContain("ส่งตรวจสอบ");
    expect(submitMarkup).toContain("DEMO_ONLY independent");
    expect(submitMarkup).not.toContain("DEMO_ONLY creator");
    expect(submitMarkup).not.toContain("DEMO_ONLY editor");
  });

  it("DEMO_ONLY renders enabled Approve and required Reject controls for independent reviewer", () => {
    const markup = renderToStaticMarkup(createElement(LifecycleActions, {
      organizationId: DEMO_ONLY_ORGANIZATION_ID,
      version: DEMO_ONLY_version(),
      approvers: [],
      canEdit: false,
      decisionPermission: { allowed: true }
    }));
    expect(markup).toContain("วันที่มีผล");
    expect(markup).toContain(">อนุมัติ</button>");
    expect(markup).toContain("เหตุผลที่ปฏิเสธ");
    expect(markup).toContain(">ปฏิเสธ</button>");
  });

  it("DEMO_ONLY renders enabled Retire control for an approved version", () => {
    const version = DEMO_ONLY_version({ status: "approved", displayStatus: "approved" });
    const markup = renderToStaticMarkup(createElement(LifecycleActions, {
      organizationId: DEMO_ONLY_ORGANIZATION_ID,
      version,
      approvers: [],
      canEdit: false,
      decisionPermission: canRetireVersion(DEMO_ONLY_viewer(), version)
    }));
    expect(markup).toContain("เหตุผลที่ยกเลิกใช้งาน");
    expect(markup).toContain(">ยกเลิกใช้งาน</button>");
  });

  it("DEMO_ONLY exposes explicit approve and retire confirmations", () => {
    expect(confirmationMessageFor("approve")).toContain("ยืนยันการอนุมัติ");
    expect(confirmationMessageFor("retire")).toContain("ยืนยันการยกเลิกใช้งาน");
  });

  it("DEMO_ONLY renders rejected, immutable and retired banners", () => {
    expect(versionBanner(DEMO_ONLY_version({ status: "draft", displayStatus: "rejected", returnReason: "DEMO_ONLY revise" })).title).toContain("ปฏิเสธ");
    expect(versionBanner(DEMO_ONLY_version({ status: "approved", displayStatus: "approved" })).description).toContain("Version ใหม่");
    expect(versionBanner(DEMO_ONLY_version({ status: "retired", displayStatus: "retired", retirementReason: "DEMO_ONLY retired" })).title).toContain("ยกเลิกใช้งาน");
  });

  it("DEMO_ONLY renders version history with actual contract fields", () => {
    const version = DEMO_ONLY_version({ status: "draft", displayStatus: "draft" });
    const standard: StandardReadModel = {
      id: DEMO_ONLY_STANDARD_ID,
      kind: "material",
      code: "DEMO_ONLY-MAT",
      name: "DEMO_ONLY material",
      classification: "DEMO_ONLY classification",
      createdAt: "2026-07-22T01:00:00Z",
      updatedAt: "2026-07-22T02:00:00Z",
      versions: [version],
      latestVersion: version
    };
    const model: StandardsWorkspaceReadModel = {
      viewer: DEMO_ONLY_viewer("10000000-0000-4000-8000-000000000008", ["auditor"]),
      standards: [standard], evidence: [], audit: [], approvers: []
    };
    const markup = renderToStaticMarkup(createElement(StandardDetailView, {
      model, standard, params: { tab: "versions" }
    }));
    expect(markup).toContain("ประวัติ Version");
    expect(markup).toContain("V1");
    expect(markup).toContain("DEMO_ONLY source");
  });

  it("DEMO_ONLY parses labor category filters and consistent work-method routes", () => {
    const params = parseStandardsSearchParams({
      category: "DEMO_ONLY technician",
      status: "draft"
    });
    expect(params).toEqual({ category: "DEMO_ONLY technician", status: "draft" });
    expect(collectionKinds["work-methods"]).toBe("work_method");
  });
});
