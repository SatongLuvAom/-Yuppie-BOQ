import type {
  EntityId,
  IsoDate,
  IsoDateTime,
  MembershipRole,
  StandardKind,
  StandardLifecycleStatus,
  StandardVersionReference,
  VersionNumber
} from "./contracts";
import type { DomainRuleViolationCode } from "./rules";

export interface StandardsActorContext {
  readonly organizationId: EntityId;
  readonly membershipId: EntityId;
  readonly roles: readonly MembershipRole[];
}

interface StandardIdentityRequest {
  readonly organizationId: EntityId;
  readonly code: string;
  readonly name: string;
}

export type CreateStandardRequest =
  | (StandardIdentityRequest & {
      readonly kind: "material";
      readonly classification: string;
    })
  | (StandardIdentityRequest & {
      readonly kind: "labor";
      readonly category: string;
    })
  | (StandardIdentityRequest & {
      readonly kind: "work_method";
      readonly intendedScope: string;
    });

interface ExistingStandardIdentityRequest extends StandardIdentityRequest {
  readonly standardId: EntityId;
}

export type UpdateStandardRequest =
  | (ExistingStandardIdentityRequest & {
      readonly kind: "material";
      readonly classification: string;
    })
  | (ExistingStandardIdentityRequest & {
      readonly kind: "labor";
      readonly category: string;
    })
  | (ExistingStandardIdentityRequest & {
      readonly kind: "work_method";
      readonly intendedScope: string;
    });

interface NewStandardVersionRequest {
  readonly organizationId: EntityId;
  readonly standardId: EntityId;
  readonly source: string;
}

export type CreateStandardVersionRequest =
  | (NewStandardVersionRequest & {
      readonly kind: "material";
      readonly unit: string;
      readonly specification: string;
      readonly applicability: string;
    })
  | (NewStandardVersionRequest & {
      readonly kind: "labor";
      readonly unit: string;
      readonly interpretationBasis: string;
      readonly applicability: string;
    })
  | (NewStandardVersionRequest & {
      readonly kind: "work_method";
      readonly methodDescription: string;
      readonly conditions: string;
      readonly applicableStandardVersions: readonly StandardVersionReference[];
    });

interface ExistingStandardVersionRequest extends NewStandardVersionRequest {
  readonly standardVersionId: EntityId;
}

export type UpdateDraftVersionRequest =
  | (ExistingStandardVersionRequest & {
      readonly kind: "material";
      readonly unit: string;
      readonly specification: string;
      readonly applicability: string;
    })
  | (ExistingStandardVersionRequest & {
      readonly kind: "labor";
      readonly unit: string;
      readonly interpretationBasis: string;
      readonly applicability: string;
    })
  | (ExistingStandardVersionRequest & {
      readonly kind: "work_method";
      readonly methodDescription: string;
      readonly conditions: string;
      readonly applicableStandardVersions: readonly StandardVersionReference[];
    });

export interface AddStandardEvidenceRequest {
  readonly organizationId: EntityId;
  readonly standardVersionId: EntityId;
  readonly title: string;
  readonly source: string;
  readonly sourceUri?: string;
  readonly contentHash?: string;
  readonly capturedAt: IsoDateTime;
}

export interface SubmitStandardForReviewRequest {
  readonly organizationId: EntityId;
  readonly standardVersionId: EntityId;
  readonly reviewerMembershipId: EntityId;
}

export interface ApproveStandardVersionRequest {
  readonly organizationId: EntityId;
  readonly standardVersionId: EntityId;
  readonly effectiveDate: IsoDate;
}

export interface RejectStandardVersionRequest {
  readonly organizationId: EntityId;
  readonly standardVersionId: EntityId;
  readonly rationale: string;
}

export interface RetireStandardVersionRequest {
  readonly organizationId: EntityId;
  readonly standardVersionId: EntityId;
  readonly rationale: string;
}

/**
 * A successful repository mutation always includes the append-only audit row
 * created in the same database transaction as the governed write.
 */
export interface StandardsMutationReceipt {
  readonly organizationId: EntityId;
  readonly standardKind: StandardKind;
  readonly standardId: EntityId;
  readonly auditLogId: EntityId;
  readonly standardVersionId?: EntityId;
  readonly versionNumber?: VersionNumber;
  readonly status?: StandardLifecycleStatus;
  readonly evidenceId?: EntityId;
  readonly approvalId?: EntityId;
}

export interface StandardVersionMutationContext {
  readonly organizationId: EntityId;
  readonly standardKind: StandardKind;
  readonly standardId: EntityId;
  readonly standardVersionId: EntityId;
  readonly versionNumber: VersionNumber;
  readonly status: StandardLifecycleStatus;
  readonly source: string;
  readonly evidenceIds: readonly EntityId[];
  readonly createdByMembershipId: EntityId;
  readonly editorMembershipIds: readonly EntityId[];
  readonly reviewerMembershipId?: EntityId;
}

export const STANDARDS_SERVICE_ERROR_CODES = [
  "organization_scope_mismatch",
  "standards_editor_role_required",
  "standards_approver_role_required",
  "validation_failed",
  "not_found",
  "conflict",
  "forbidden",
  "database_error",
  "unexpected_error"
] as const;

export type StandardsServiceErrorCode =
  | (typeof STANDARDS_SERVICE_ERROR_CODES)[number]
  | DomainRuleViolationCode;

export interface StandardsServiceError {
  readonly code: StandardsServiceErrorCode;
  readonly message: string;
}

export type StandardsServiceResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: StandardsServiceError };

export type StandardsRepositoryResult<T> = StandardsServiceResult<T>;

/**
 * Use-case-level persistence port. Implementations must apply each mutation
 * and its audit event atomically under the authenticated caller's RLS context.
 */
export interface StandardsRepository {
  getVersionMutationContext(input: {
    readonly organizationId: EntityId;
    readonly standardVersionId: EntityId;
  }): Promise<StandardsRepositoryResult<StandardVersionMutationContext>>;
  createStandard(
    input: CreateStandardRequest
  ): Promise<StandardsRepositoryResult<StandardsMutationReceipt>>;
  updateStandard(
    input: UpdateStandardRequest
  ): Promise<StandardsRepositoryResult<StandardsMutationReceipt>>;
  createVersion(
    input: CreateStandardVersionRequest
  ): Promise<StandardsRepositoryResult<StandardsMutationReceipt>>;
  updateDraftVersion(
    input: UpdateDraftVersionRequest
  ): Promise<StandardsRepositoryResult<StandardsMutationReceipt>>;
  addEvidence(
    input: AddStandardEvidenceRequest
  ): Promise<StandardsRepositoryResult<StandardsMutationReceipt>>;
  submitForReview(
    input: SubmitStandardForReviewRequest
  ): Promise<StandardsRepositoryResult<StandardsMutationReceipt>>;
  approveVersion(
    input: ApproveStandardVersionRequest
  ): Promise<StandardsRepositoryResult<StandardsMutationReceipt>>;
  rejectVersion(
    input: RejectStandardVersionRequest
  ): Promise<StandardsRepositoryResult<StandardsMutationReceipt>>;
  retireVersion(
    input: RetireStandardVersionRequest
  ): Promise<StandardsRepositoryResult<StandardsMutationReceipt>>;
}
