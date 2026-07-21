/** Storage-independent identifiers used at domain boundaries. */
export type EntityId = string;
export type IsoDate = string;
export type IsoDateTime = string;
export type VersionNumber = number;

export const STANDARD_LIFECYCLE_STATUSES = [
  "draft",
  "review",
  "approved",
  "retired"
] as const;

export type StandardLifecycleStatus =
  (typeof STANDARD_LIFECYCLE_STATUSES)[number];

export const STANDARD_KINDS = ["material", "labor", "work_method"] as const;

export type StandardKind = (typeof STANDARD_KINDS)[number];

export const MEMBERSHIP_ROLES = [
  "organization_admin",
  "standards_editor",
  "standards_approver",
  "estimator",
  "auditor"
] as const;

export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const APPROVAL_DECISIONS = [
  "approved",
  "changes_requested",
  "retired"
] as const;

export type ApprovalDecision = (typeof APPROVAL_DECISIONS)[number];

export interface Entity {
  readonly id: EntityId;
}

export interface Organization extends Entity {
  readonly name: string;
  readonly createdAt: IsoDateTime;
}

export interface OrganizationMembership extends Entity {
  readonly organizationId: EntityId;
  readonly userId: EntityId;
  readonly roles: readonly MembershipRole[];
  readonly createdByUserId: EntityId;
  readonly createdAt: IsoDateTime;
  readonly updatedByUserId: EntityId;
  readonly updatedAt: IsoDateTime;
}

interface StandardIdentity extends Entity {
  readonly organizationId: EntityId;
  readonly kind: StandardKind;
  readonly code: string;
  readonly name: string;
  readonly createdByUserId: EntityId;
  readonly createdAt: IsoDateTime;
  readonly updatedByUserId: EntityId;
  readonly updatedAt: IsoDateTime;
}

export interface Material extends StandardIdentity {
  readonly kind: "material";
  readonly classification: string;
}

export interface LaborStandard extends StandardIdentity {
  readonly kind: "labor";
  readonly category: string;
}

export interface WorkMethod extends StandardIdentity {
  readonly kind: "work_method";
  readonly intendedScope: string;
}

export interface StandardVersionReference {
  readonly organizationId: EntityId;
  readonly standardKind: StandardKind;
  readonly standardId: EntityId;
  readonly standardVersionId: EntityId;
  readonly versionNumber: VersionNumber;
}

/**
 * Shared lifecycle state for every governed standard version.
 *
 * Optional decision fields are populated as the version advances. Approval and
 * retirement history remains authoritative in Approval and AuditLog records.
 */
export interface StandardVersionGovernance extends Entity {
  readonly organizationId: EntityId;
  readonly standardKind: StandardKind;
  readonly standardId: EntityId;
  readonly versionNumber: VersionNumber;
  readonly status: StandardLifecycleStatus;
  readonly source: string;
  readonly evidenceIds: readonly EntityId[];
  readonly createdByUserId: EntityId;
  readonly createdAt: IsoDateTime;
  readonly editorUserIds: readonly EntityId[];
  readonly lastEditedByUserId: EntityId;
  readonly lastEditedAt: IsoDateTime;
  readonly reviewerUserId?: EntityId;
  readonly reviewedAt?: IsoDateTime;
  readonly approvedByUserId?: EntityId;
  readonly approvedAt?: IsoDateTime;
  readonly effectiveDate?: IsoDate;
  readonly retiredByUserId?: EntityId;
  readonly retiredAt?: IsoDateTime;
}

export interface MaterialVersion extends StandardVersionGovernance {
  readonly standardKind: "material";
  readonly materialId: EntityId;
  readonly unit: string;
  readonly specification: string;
  readonly applicability: string;
}

export interface LaborVersion extends StandardVersionGovernance {
  readonly standardKind: "labor";
  readonly laborStandardId: EntityId;
  readonly unit: string;
  readonly interpretationBasis: string;
  readonly applicability: string;
}

export interface WorkMethodVersion extends StandardVersionGovernance {
  readonly standardKind: "work_method";
  readonly workMethodId: EntityId;
  readonly methodDescription: string;
  readonly conditions: string;
  readonly applicableStandardVersions: readonly StandardVersionReference[];
}

export type StandardVersion =
  | MaterialVersion
  | LaborVersion
  | WorkMethodVersion;

export interface StandardEvidence extends Entity {
  readonly organizationId: EntityId;
  readonly target: StandardVersionReference;
  readonly evidenceType: string;
  readonly sourceReference: string;
  readonly contentHash?: string;
  readonly capturedAt: IsoDateTime;
  readonly addedByUserId: EntityId;
  readonly createdAt: IsoDateTime;
}

export interface Approval extends Entity {
  readonly organizationId: EntityId;
  readonly target: StandardVersionReference;
  readonly decision: ApprovalDecision;
  readonly decidedByUserId: EntityId;
  readonly decidedAt: IsoDateTime;
  readonly effectiveDate?: IsoDate;
  readonly rationale?: string;
  readonly createdAt: IsoDateTime;
}

export const STANDARDS_AUDIT_ACTIONS = [
  "membership_created",
  "membership_roles_changed",
  "standard_created",
  "version_created",
  "version_edited",
  "submitted_for_review",
  "changes_requested",
  "version_approved",
  "version_retired",
  "evidence_added"
] as const;

export type StandardsAuditAction = (typeof STANDARDS_AUDIT_ACTIONS)[number];
export type AuditOutcome = "succeeded" | "rejected";

export interface AuditLog extends Entity {
  readonly organizationId: EntityId;
  readonly actorUserId: EntityId;
  readonly action: StandardsAuditAction;
  readonly subjectType: string;
  readonly subjectId: EntityId;
  readonly outcome: AuditOutcome;
  readonly occurredAt: IsoDateTime;
  readonly standardVersion?: StandardVersionReference;
  readonly evidenceId?: EntityId;
  readonly approvalId?: EntityId;
}

/* Phase 0 contracts outside the Standards Workspace remain preliminary. */
export interface User extends Entity {
  readonly organizationId: EntityId;
  readonly displayName: string;
  readonly roleIds: readonly EntityId[];
}

export interface Role extends Entity {
  readonly organizationId: EntityId;
  readonly name: string;
}

export interface ProductivityStandard extends Entity {
  readonly organizationId: EntityId;
  readonly code: string;
  readonly name: string;
  readonly unit: string;
  readonly workMethodVersionId?: EntityId;
  readonly version: VersionNumber;
  readonly evidenceIds: readonly EntityId[];
  readonly approvalIds: readonly EntityId[];
}

export interface Project extends Entity {
  readonly organizationId: EntityId;
  readonly code: string;
  readonly name: string;
}

export interface Booth extends Entity {
  readonly projectId: EntityId;
  readonly code: string;
  readonly name: string;
}

export interface Workpiece extends Entity {
  readonly boothId: EntityId;
  readonly code: string;
  readonly name: string;
}

export interface BOQ extends Entity {
  readonly projectId: EntityId;
  readonly code: string;
  readonly currentRevisionId?: EntityId;
}

export interface BOQRevision extends Entity {
  readonly boqId: EntityId;
  readonly revision: VersionNumber;
  readonly snapshotId?: EntityId;
  readonly createdAt: IsoDateTime;
}

export interface BOQSnapshot<TPayload = unknown> extends Entity {
  readonly boqRevisionId: EntityId;
  readonly schemaVersion: VersionNumber;
  readonly capturedAt: IsoDateTime;
  readonly payload: TPayload;
}

export type CalculationWarningSeverity = "info" | "warning" | "error";

export interface CalculationWarning extends Entity {
  readonly code: string;
  readonly message: string;
  readonly severity: CalculationWarningSeverity;
  readonly path?: string;
}

export interface TakeoffResult<TResult = unknown> extends Entity {
  readonly workpieceId: EntityId;
  readonly capturedAt: IsoDateTime;
  readonly result: TResult;
  readonly warnings: readonly CalculationWarning[];
}
