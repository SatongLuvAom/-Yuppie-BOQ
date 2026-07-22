import type { MembershipRole } from "@yuppie/domain";

import {
  STANDARDS_ROLE_MEMBERSHIP_MAPPING,
  type OrganizationAuthorizationContext,
  type StandardsWorkspacePermission
} from "./contracts";

const PERMISSION_ROLES: Readonly<
  Record<StandardsWorkspacePermission, readonly MembershipRole[]>
> = {
  "standards:read": [
    "organization_admin",
    "standards_editor",
    "standards_approver",
    "estimator",
    "auditor"
  ],
  "standards:draft:write": ["standards_editor"],
  "standards:review": ["standards_approver"],
  "standards:approve": ["standards_approver"],
  "standards:retire": ["standards_approver"],
  "memberships:manage": ["organization_admin"]
};

export function hasMembershipRole(
  context: OrganizationAuthorizationContext,
  role: MembershipRole
): boolean {
  return context.membershipRoles.includes(role);
}

export function hasStandardsWorkspacePermission(
  context: OrganizationAuthorizationContext,
  permission: StandardsWorkspacePermission
): boolean {
  return PERMISSION_ROLES[permission].some((role) =>
    hasMembershipRole(context, role)
  );
}

export function hasProductRole(
  context: OrganizationAuthorizationContext,
  role: keyof typeof STANDARDS_ROLE_MEMBERSHIP_MAPPING
): boolean {
  return hasMembershipRole(context, STANDARDS_ROLE_MEMBERSHIP_MAPPING[role]);
}

export function mayApproveStandardVersion(
  context: OrganizationAuthorizationContext,
  createdByUserId: string,
  editorUserIds: readonly string[],
  reviewerUserId: string
): boolean {
  return (
    hasStandardsWorkspacePermission(context, "standards:approve") &&
    context.userId === reviewerUserId &&
    context.userId !== createdByUserId &&
    !editorUserIds.includes(context.userId)
  );
}
