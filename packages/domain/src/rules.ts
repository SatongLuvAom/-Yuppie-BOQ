import type {
  EntityId,
  MembershipRole,
  StandardLifecycleStatus,
  StandardVersionGovernance,
  StandardVersionReference,
  VersionNumber
} from "./contracts";

export const DOMAIN_RULE_VIOLATION_CODES = [
  "invalid_lifecycle_transition",
  "invalid_version_number",
  "duplicate_version_number",
  "non_sequential_version_number",
  "active_draft_exists",
  "active_review_exists",
  "eligible_approved_version_exists",
  "version_not_editable",
  "immutable_version",
  "source_required",
  "evidence_required",
  "reviewer_required",
  "reviewed_at_required",
  "approver_required",
  "approved_at_required",
  "effective_date_required",
  "retired_by_required",
  "retired_at_required",
  "standards_approver_role_required",
  "self_approval_forbidden",
  "assigned_reviewer_required",
  "retirement_reason_required"
] as const;

export type DomainRuleViolationCode =
  (typeof DOMAIN_RULE_VIOLATION_CODES)[number];

export interface DomainRuleViolation {
  readonly code: DomainRuleViolationCode;
  readonly message: string;
}

export interface StandardVersionSummary {
  readonly organizationId: EntityId;
  readonly standardKind: StandardVersionReference["standardKind"];
  readonly standardId: EntityId;
  readonly versionNumber: VersionNumber;
  readonly status: StandardLifecycleStatus;
}

export interface NewStandardVersionCandidate {
  readonly organizationId: EntityId;
  readonly standardKind: StandardVersionReference["standardKind"];
  readonly standardId: EntityId;
  readonly versionNumber: VersionNumber;
}

const ALLOWED_TRANSITIONS: Readonly<
  Record<StandardLifecycleStatus, readonly StandardLifecycleStatus[]>
> = {
  draft: ["review"],
  review: ["draft", "approved"],
  approved: ["retired"],
  retired: []
};

function violation(
  code: DomainRuleViolationCode,
  message: string
): DomainRuleViolation {
  return { code, message };
}

function sameStandard(
  version: StandardVersionSummary,
  target: Pick<
    NewStandardVersionCandidate,
    "organizationId" | "standardKind" | "standardId"
  >
): boolean {
  return (
    version.organizationId === target.organizationId &&
    version.standardKind === target.standardKind &&
    version.standardId === target.standardId
  );
}

export function isStandardLifecycleTransitionAllowed(
  from: StandardLifecycleStatus,
  to: StandardLifecycleStatus
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function validateStandardLifecycleTransition(
  from: StandardLifecycleStatus,
  to: StandardLifecycleStatus
): readonly DomainRuleViolation[] {
  return isStandardLifecycleTransitionAllowed(from, to)
    ? []
    : [
        violation(
          "invalid_lifecycle_transition",
          `Transition from ${from} to ${to} is not allowed.`
        )
      ];
}

export function isStandardVersionEligibleForNewWork(
  status: StandardLifecycleStatus
): boolean {
  return status === "approved";
}

export function isStandardVersionEditable(
  status: StandardLifecycleStatus
): boolean {
  return status === "draft";
}

export function validateStandardVersionEdit(
  status: StandardLifecycleStatus
): readonly DomainRuleViolation[] {
  if (status === "approved" || status === "retired") {
    return [
      violation(
        "immutable_version",
        `${status} standard versions are immutable.`
      )
    ];
  }

  return status === "draft"
    ? []
    : [
        violation(
          "version_not_editable",
          "A version in review must return to draft before editing."
        )
      ];
}

export function validateNewStandardVersion(
  existingVersions: readonly StandardVersionSummary[],
  candidate: NewStandardVersionCandidate
): readonly DomainRuleViolation[] {
  if (
    !Number.isSafeInteger(candidate.versionNumber) ||
    candidate.versionNumber < 1
  ) {
    return [
      violation(
        "invalid_version_number",
        "Version numbers must be positive safe integers."
      )
    ];
  }

  const versionsForStandard = existingVersions.filter((version) =>
    sameStandard(version, candidate)
  );

  if (
    versionsForStandard.some(
      (version) => version.versionNumber === candidate.versionNumber
    )
  ) {
    return [
      violation(
        "duplicate_version_number",
        "Version numbers cannot be reused for the same standard."
      )
    ];
  }

  const expectedVersionNumber =
    versionsForStandard.reduce(
      (largest, version) => Math.max(largest, version.versionNumber),
      0
    ) + 1;

  return candidate.versionNumber === expectedVersionNumber
    ? []
    : [
        violation(
          "non_sequential_version_number",
          `The next version number must be ${expectedVersionNumber}.`
        )
      ];
}

export function validateStandardVersionStateLimits(
  versions: readonly StandardVersionSummary[],
  target: Pick<
    NewStandardVersionCandidate,
    "organizationId" | "standardKind" | "standardId"
  >
): readonly DomainRuleViolation[] {
  const targetVersions = versions.filter((version) =>
    sameStandard(version, target)
  );
  const violations: DomainRuleViolation[] = [];

  if (targetVersions.filter(({ status }) => status === "draft").length > 1) {
    violations.push(
      violation(
        "active_draft_exists",
        "A standard can have at most one active draft version."
      )
    );
  }

  if (targetVersions.filter(({ status }) => status === "review").length > 1) {
    violations.push(
      violation(
        "active_review_exists",
        "A standard can have at most one active review version."
      )
    );
  }

  if (
    targetVersions.filter(({ status }) =>
      isStandardVersionEligibleForNewWork(status)
    ).length > 1
  ) {
    violations.push(
      violation(
        "eligible_approved_version_exists",
        "A standard can have at most one approved version eligible for new work."
      )
    );
  }

  return violations;
}

export function validateReviewSubmission(
  version: Pick<StandardVersionGovernance, "source" | "evidenceIds">
): readonly DomainRuleViolation[] {
  const violations: DomainRuleViolation[] = [];

  if (version.source.trim().length === 0) {
    violations.push(
      violation("source_required", "A source is required for review.")
    );
  }

  if (version.evidenceIds.length === 0) {
    violations.push(
      violation("evidence_required", "Evidence is required for review.")
    );
  }

  return violations;
}

export function validateApprovedGovernance(
  version: Pick<
    StandardVersionGovernance,
    | "reviewerUserId"
    | "reviewedAt"
    | "approvedByUserId"
    | "approvedAt"
    | "effectiveDate"
  >
): readonly DomainRuleViolation[] {
  const violations: DomainRuleViolation[] = [];

  if (!version.reviewerUserId) {
    violations.push(violation("reviewer_required", "A reviewer is required."));
  }
  if (!version.reviewedAt) {
    violations.push(
      violation("reviewed_at_required", "A review timestamp is required.")
    );
  }
  if (!version.approvedByUserId) {
    violations.push(violation("approver_required", "An approver is required."));
  }
  if (!version.approvedAt) {
    violations.push(
      violation("approved_at_required", "An approval timestamp is required.")
    );
  }
  if (!version.effectiveDate) {
    violations.push(
      violation("effective_date_required", "An effective date is required.")
    );
  }

  return violations;
}

export function validateRetiredGovernance(
  version: Pick<StandardVersionGovernance, "retiredByUserId" | "retiredAt">
): readonly DomainRuleViolation[] {
  const violations: DomainRuleViolation[] = [];

  if (!version.retiredByUserId) {
    violations.push(
      violation("retired_by_required", "A retiring approver is required.")
    );
  }
  if (!version.retiredAt) {
    violations.push(
      violation("retired_at_required", "A retirement timestamp is required.")
    );
  }

  return violations;
}

export interface ApprovalActorInput {
  readonly actorUserId: EntityId;
  readonly actorRoles: readonly MembershipRole[];
  readonly createdByUserId: EntityId;
  readonly editorUserIds: readonly EntityId[];
  readonly reviewerUserId: EntityId;
}

export function validateApprovalActor(
  input: ApprovalActorInput
): readonly DomainRuleViolation[] {
  const violations: DomainRuleViolation[] = [];

  if (!input.actorRoles.includes("standards_approver")) {
    violations.push(
      violation(
        "standards_approver_role_required",
        "A Standards Approver role is required."
      )
    );
  }

  if (
    input.actorUserId === input.createdByUserId ||
    input.editorUserIds.includes(input.actorUserId)
  ) {
    violations.push(
      violation(
        "self_approval_forbidden",
        "A creator or editor cannot approve the same version."
      )
    );
  }

  if (input.actorUserId !== input.reviewerUserId) {
    violations.push(
      violation(
        "assigned_reviewer_required",
        "Only the assigned independent reviewer may decide the version."
      )
    );
  }

  return violations;
}

export function validateRetirement(
  actorRoles: readonly MembershipRole[],
  rationale: string
): readonly DomainRuleViolation[] {
  const violations: DomainRuleViolation[] = [];

  if (!actorRoles.includes("standards_approver")) {
    violations.push(
      violation(
        "standards_approver_role_required",
        "Only a Standards Approver may retire a standard version."
      )
    );
  }

  if (rationale.trim().length === 0) {
    violations.push(
      violation(
        "retirement_reason_required",
        "A retirement rationale is required."
      )
    );
  }

  return violations;
}
