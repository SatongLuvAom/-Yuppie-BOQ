import { describe, expect, it } from "vitest";

import {
  hasProductRole,
  hasStandardsWorkspacePermission,
  mayApproveStandardVersion,
  type OrganizationAuthorizationContext
} from "./index";

const DEMO_ONLY_BASE_CONTEXT = {
  userId: "DEMO_ONLY_USER",
  organizationId: "DEMO_ONLY_ORGANIZATION",
  membershipId: "DEMO_ONLY_MEMBERSHIP"
} as const;

function DEMO_ONLY_context(
  membershipRoles: OrganizationAuthorizationContext["membershipRoles"]
): OrganizationAuthorizationContext {
  return { ...DEMO_ONLY_BASE_CONTEXT, membershipRoles };
}

describe("Standards Workspace authorization", () => {
  it("DEMO_ONLY maps Viewer to the accepted read-only Auditor role", () => {
    const viewer = DEMO_ONLY_context(["auditor"]);

    expect(hasProductRole(viewer, "viewer")).toBe(true);
    expect(hasStandardsWorkspacePermission(viewer, "standards:read")).toBe(true);
    expect(
      hasStandardsWorkspacePermission(viewer, "standards:draft:write")
    ).toBe(false);
  });

  it("DEMO_ONLY keeps Admin and approval authority separate", () => {
    const admin = DEMO_ONLY_context(["organization_admin"]);

    expect(hasStandardsWorkspacePermission(admin, "memberships:manage")).toBe(
      true
    );
    expect(hasStandardsWorkspacePermission(admin, "standards:approve")).toBe(
      false
    );
  });

  it("DEMO_ONLY permits only Editors to write Draft content", () => {
    const editor = DEMO_ONLY_context(["standards_editor"]);
    const approver = DEMO_ONLY_context(["standards_approver"]);

    expect(
      hasStandardsWorkspacePermission(editor, "standards:draft:write")
    ).toBe(true);
    expect(
      hasStandardsWorkspacePermission(approver, "standards:draft:write")
    ).toBe(false);
  });

  it("DEMO_ONLY rejects approval by the creator or any editor", () => {
    const approver = DEMO_ONLY_context(["standards_approver"]);

    expect(
      mayApproveStandardVersion(
        approver,
        "DEMO_ONLY_OTHER_USER",
        ["DEMO_ONLY_EDITOR"],
        "DEMO_ONLY_USER"
      )
    ).toBe(true);
    expect(
      mayApproveStandardVersion(
        approver,
        "DEMO_ONLY_USER",
        ["DEMO_ONLY_EDITOR"],
        "DEMO_ONLY_USER"
      )
    ).toBe(false);
    expect(
      mayApproveStandardVersion(
        approver,
        "DEMO_ONLY_OTHER_USER",
        ["DEMO_ONLY_USER"],
        "DEMO_ONLY_USER"
      )
    ).toBe(false);
    expect(
      mayApproveStandardVersion(
        approver,
        "DEMO_ONLY_OTHER_USER",
        ["DEMO_ONLY_EDITOR"],
        "DEMO_ONLY_OTHER_REVIEWER"
      )
    ).toBe(false);
  });
});
