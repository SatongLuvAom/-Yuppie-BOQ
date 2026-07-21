/** Storage-independent identifiers used at domain boundaries. */
type EntityId = string;
type IsoDateTime = string;
type VersionNumber = number;

interface Entity {
  readonly id: EntityId;
}

export interface Organization extends Entity {
  readonly name: string;
}

export interface User extends Entity {
  readonly organizationId: EntityId;
  readonly displayName: string;
  readonly roleIds: readonly EntityId[];
}

export interface Role extends Entity {
  readonly organizationId: EntityId;
  readonly name: string;
}

type StandardType =
  | "material_version"
  | "labor_rate"
  | "productivity_standard"
  | "work_method_version";

interface StandardReference {
  readonly type: StandardType;
  readonly id: EntityId;
  readonly version: VersionNumber;
}

interface GovernedStandard extends Entity {
  readonly version: VersionNumber;
  readonly evidenceIds: readonly EntityId[];
  readonly approvalIds: readonly EntityId[];
}

export interface Material extends Entity {
  readonly organizationId: EntityId;
  readonly code: string;
  readonly name: string;
}

export interface MaterialVersion extends GovernedStandard {
  readonly materialId: EntityId;
  readonly unit: string;
}

export interface LaborRate extends GovernedStandard {
  readonly organizationId: EntityId;
  readonly code: string;
  readonly name: string;
  readonly unit: string;
}

export interface ProductivityStandard extends GovernedStandard {
  readonly organizationId: EntityId;
  readonly code: string;
  readonly name: string;
  readonly unit: string;
  readonly workMethodVersionId?: EntityId;
}

export interface WorkMethod extends Entity {
  readonly organizationId: EntityId;
  readonly code: string;
  readonly name: string;
}

export interface WorkMethodVersion extends GovernedStandard {
  readonly workMethodId: EntityId;
  readonly name: string;
}

export interface StandardEvidence extends Entity {
  readonly organizationId: EntityId;
  readonly standard: StandardReference;
  readonly title: string;
  readonly sourceUri?: string;
  readonly recordedAt: IsoDateTime;
}

type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Approval extends Entity {
  readonly organizationId: EntityId;
  readonly standard: StandardReference;
  readonly status: ApprovalStatus;
  readonly decidedByUserId?: EntityId;
  readonly decidedAt?: IsoDateTime;
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

type CalculationWarningSeverity = "info" | "warning" | "error";

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

export interface AuditLog extends Entity {
  readonly organizationId: EntityId;
  readonly actorUserId?: EntityId;
  readonly action: string;
  readonly subjectType: string;
  readonly subjectId: EntityId;
  readonly occurredAt: IsoDateTime;
}
