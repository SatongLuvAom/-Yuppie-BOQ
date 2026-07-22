import type { EntityId, MembershipRole } from "@yuppie/domain";

/** Product-facing Standards Workspace roles. */
export const STANDARDS_WORKSPACE_ROLES = [
  "admin",
  "editor",
  "approver",
  "viewer"
] as const;

export type StandardsWorkspaceRole =
  (typeof STANDARDS_WORKSPACE_ROLES)[number];

/**
 * Phase 1C role names map to the accepted organization-scoped domain roles.
 * `viewer` is the Standards Workspace label for the accepted read-only Auditor.
 */
export const STANDARDS_ROLE_MEMBERSHIP_MAPPING = {
  admin: "organization_admin",
  editor: "standards_editor",
  approver: "standards_approver",
  viewer: "auditor"
} as const satisfies Readonly<Record<StandardsWorkspaceRole, MembershipRole>>;

export interface AuthenticatedIdentity {
  readonly userId: EntityId;
}

/** Verified, active organization membership resolved from an auth identity. */
export interface OrganizationAuthorizationContext extends AuthenticatedIdentity {
  readonly organizationId: EntityId;
  readonly membershipId: EntityId;
  readonly membershipRoles: readonly MembershipRole[];
}

export type StandardsWorkspacePermission =
  | "standards:read"
  | "standards:draft:write"
  | "standards:review"
  | "standards:approve"
  | "standards:retire"
  | "memberships:manage";
