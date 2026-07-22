import type {
  MembershipRole,
  StandardKind,
  StandardLifecycleStatus
} from "../contracts";

/** Portable Standards Workspace DTOs shared by server and UI adapters. */
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
