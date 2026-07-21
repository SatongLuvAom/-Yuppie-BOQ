import { describe, expect, it } from "vitest";

import {
  isStandardLifecycleTransitionAllowed,
  isStandardVersionEditable,
  isStandardVersionEligibleForNewWork,
  validateApprovalActor,
  validateApprovedGovernance,
  validateNewStandardVersion,
  validateRetiredGovernance,
  validateRetirement,
  validateReviewSubmission,
  validateStandardLifecycleTransition,
  validateStandardVersionEdit,
  validateStandardVersionStateLimits,
  type Approval,
  type NewStandardVersionCandidate,
  type StandardEvidence,
  type StandardVersionReference,
  type StandardVersionSummary
} from "../../packages/domain/src/index";

const DEMO_ONLY_ORGANIZATION_ID = "DEMO_ONLY_ORGANIZATION_ID";
const DEMO_ONLY_STANDARD_ID = "DEMO_ONLY_STANDARD_ID";
const DEMO_ONLY_CREATOR_ID = "DEMO_ONLY_CREATOR_ID";
const DEMO_ONLY_EDITOR_ID = "DEMO_ONLY_EDITOR_ID";
const DEMO_ONLY_APPROVER_ID = "DEMO_ONLY_APPROVER_ID";
const DEMO_ONLY_OTHER_APPROVER_ID = "DEMO_ONLY_OTHER_APPROVER_ID";
const DEMO_ONLY_EVIDENCE_ID = "DEMO_ONLY_EVIDENCE_ID";
const DEMO_ONLY_SOURCE = "DEMO_ONLY_SOURCE";
const DEMO_ONLY_TIMESTAMP = "DEMO_ONLY_TIMESTAMP";
const DEMO_ONLY_EFFECTIVE_DATE = "DEMO_ONLY_EFFECTIVE_DATE";
const DEMO_ONLY_INVALID_VERSION = 0;
const DEMO_ONLY_VERSION_ONE = 1;
const DEMO_ONLY_VERSION_TWO = 2;
const DEMO_ONLY_VERSION_THREE = 3;
const DEMO_ONLY_VERSION_FOUR = 4;
const DEMO_ONLY_VERSION_FIVE = 5;
const DEMO_ONLY_VERSION_SIX = 6;

const DEMO_ONLY_STANDARD_VERSION_REFERENCE: StandardVersionReference = {
  organizationId: DEMO_ONLY_ORGANIZATION_ID,
  standardKind: "material",
  standardId: DEMO_ONLY_STANDARD_ID,
  standardVersionId: "DEMO_ONLY_STANDARD_VERSION_ID",
  versionNumber: DEMO_ONLY_VERSION_ONE
};

const DEMO_ONLY_EVIDENCE: StandardEvidence = {
  id: DEMO_ONLY_EVIDENCE_ID,
  organizationId: DEMO_ONLY_ORGANIZATION_ID,
  target: DEMO_ONLY_STANDARD_VERSION_REFERENCE,
  evidenceType: "DEMO_ONLY_EVIDENCE_TYPE",
  sourceReference: "DEMO_ONLY_SOURCE_REFERENCE",
  contentHash: "DEMO_ONLY_CONTENT_HASH",
  capturedAt: DEMO_ONLY_TIMESTAMP,
  addedByUserId: DEMO_ONLY_EDITOR_ID,
  createdAt: DEMO_ONLY_TIMESTAMP
};

const DEMO_ONLY_APPROVAL: Approval = {
  id: "DEMO_ONLY_APPROVAL_ID",
  organizationId: DEMO_ONLY_ORGANIZATION_ID,
  target: DEMO_ONLY_STANDARD_VERSION_REFERENCE,
  decision: "approved",
  decidedByUserId: DEMO_ONLY_APPROVER_ID,
  decidedAt: DEMO_ONLY_TIMESTAMP,
  effectiveDate: DEMO_ONLY_EFFECTIVE_DATE,
  createdAt: DEMO_ONLY_TIMESTAMP
};

function DEMO_ONLY_version(
  versionNumber: number,
  status: StandardVersionSummary["status"]
): StandardVersionSummary {
  return {
    organizationId: DEMO_ONLY_ORGANIZATION_ID,
    standardKind: "material",
    standardId: DEMO_ONLY_STANDARD_ID,
    versionNumber,
    status
  };
}

function DEMO_ONLY_candidate(
  versionNumber: number
): NewStandardVersionCandidate {
  return {
    organizationId: DEMO_ONLY_ORGANIZATION_ID,
    standardKind: "material",
    standardId: DEMO_ONLY_STANDARD_ID,
    versionNumber
  };
}

describe("DEMO_ONLY Standards Workspace lifecycle rules", () => {
  it("DEMO_ONLY exposes evidence and approval persistence contracts", () => {
    expect(DEMO_ONLY_EVIDENCE.target).toBe(DEMO_ONLY_STANDARD_VERSION_REFERENCE);
    expect(DEMO_ONLY_APPROVAL.effectiveDate).toBe(DEMO_ONLY_EFFECTIVE_DATE);
  });

  it("DEMO_ONLY permits only the accepted lifecycle transitions", () => {
    expect(isStandardLifecycleTransitionAllowed("draft", "review")).toBe(true);
    expect(isStandardLifecycleTransitionAllowed("review", "draft")).toBe(true);
    expect(isStandardLifecycleTransitionAllowed("review", "approved")).toBe(true);
    expect(isStandardLifecycleTransitionAllowed("approved", "retired")).toBe(true);
    expect(isStandardLifecycleTransitionAllowed("draft", "approved")).toBe(false);
    expect(validateStandardLifecycleTransition("retired", "draft")).toHaveLength(1);
  });

  it("DEMO_ONLY makes only draft versions editable and only approved versions eligible", () => {
    expect(isStandardVersionEditable("draft")).toBe(true);
    expect(isStandardVersionEditable("review")).toBe(false);
    expect(isStandardVersionEligibleForNewWork("approved")).toBe(true);
    expect(isStandardVersionEligibleForNewWork("retired")).toBe(false);
  });

  it("DEMO_ONLY distinguishes frozen review from immutable approved history", () => {
    expect(validateStandardVersionEdit("review")[0]?.code).toBe(
      "version_not_editable"
    );
    expect(validateStandardVersionEdit("approved")[0]?.code).toBe(
      "immutable_version"
    );
    expect(validateStandardVersionEdit("retired")[0]?.code).toBe(
      "immutable_version"
    );
  });

  it("DEMO_ONLY requires source and evidence before review", () => {
    expect(validateReviewSubmission({ source: "", evidenceIds: [] }).map(
      ({ code }) => code
    )).toEqual(["source_required", "evidence_required"]);
    expect(
      validateReviewSubmission({
        source: DEMO_ONLY_SOURCE,
        evidenceIds: [DEMO_ONLY_EVIDENCE_ID]
      })
    ).toEqual([]);
  });

  it("DEMO_ONLY requires attributable approval and retirement governance", () => {
    expect(validateApprovedGovernance({}).map(({ code }) => code)).toEqual([
      "reviewer_required",
      "reviewed_at_required",
      "approver_required",
      "approved_at_required",
      "effective_date_required"
    ]);
    expect(
      validateApprovedGovernance({
        reviewerUserId: DEMO_ONLY_APPROVER_ID,
        reviewedAt: DEMO_ONLY_TIMESTAMP,
        approvedByUserId: DEMO_ONLY_APPROVER_ID,
        approvedAt: DEMO_ONLY_TIMESTAMP,
        effectiveDate: DEMO_ONLY_EFFECTIVE_DATE
      })
    ).toEqual([]);
    expect(validateRetiredGovernance({}).map(({ code }) => code)).toEqual([
      "retired_by_required",
      "retired_at_required"
    ]);
    expect(
      validateRetiredGovernance({
        retiredByUserId: DEMO_ONLY_APPROVER_ID,
        retiredAt: DEMO_ONLY_TIMESTAMP
      })
    ).toEqual([]);
  });
});

describe("DEMO_ONLY Standards Workspace version rules", () => {
  it("DEMO_ONLY accepts the next unique sequential version", () => {
    const DEMO_ONLY_existing = [
      DEMO_ONLY_version(DEMO_ONLY_VERSION_ONE, "retired"),
      DEMO_ONLY_version(DEMO_ONLY_VERSION_TWO, "approved")
    ];

    expect(
      validateNewStandardVersion(
        DEMO_ONLY_existing,
        DEMO_ONLY_candidate(DEMO_ONLY_VERSION_THREE)
      )
    ).toEqual([]);
  });

  it("DEMO_ONLY rejects reused and skipped version numbers", () => {
    const DEMO_ONLY_existing = [
      DEMO_ONLY_version(DEMO_ONLY_VERSION_ONE, "approved")
    ];

    expect(
      validateNewStandardVersion(
        DEMO_ONLY_existing,
        DEMO_ONLY_candidate(DEMO_ONLY_VERSION_ONE)
      )[0]?.code
    ).toBe("duplicate_version_number");
    expect(
      validateNewStandardVersion(
        DEMO_ONLY_existing,
        DEMO_ONLY_candidate(DEMO_ONLY_VERSION_THREE)
      )[0]?.code
    ).toBe("non_sequential_version_number");
  });

  it("DEMO_ONLY rejects a non-positive version number", () => {
    expect(
      validateNewStandardVersion(
        [],
        DEMO_ONLY_candidate(DEMO_ONLY_INVALID_VERSION)
      )[0]?.code
    ).toBe("invalid_version_number");
  });

  it("DEMO_ONLY enforces one active draft, review, and eligible approved version", () => {
    const DEMO_ONLY_versions = [
      DEMO_ONLY_version(DEMO_ONLY_VERSION_ONE, "draft"),
      DEMO_ONLY_version(DEMO_ONLY_VERSION_TWO, "draft"),
      DEMO_ONLY_version(DEMO_ONLY_VERSION_THREE, "review"),
      DEMO_ONLY_version(DEMO_ONLY_VERSION_FOUR, "review"),
      DEMO_ONLY_version(DEMO_ONLY_VERSION_FIVE, "approved"),
      DEMO_ONLY_version(DEMO_ONLY_VERSION_SIX, "approved")
    ];

    expect(
      validateStandardVersionStateLimits(DEMO_ONLY_versions, {
        organizationId: DEMO_ONLY_ORGANIZATION_ID,
        standardKind: "material",
        standardId: DEMO_ONLY_STANDARD_ID
      }).map(({ code }) => code)
    ).toEqual([
      "active_draft_exists",
      "active_review_exists",
      "eligible_approved_version_exists"
    ]);
  });
});

describe("DEMO_ONLY Standards Workspace authority rules", () => {
  it("DEMO_ONLY rejects approval by the creator or any editor", () => {
    const DEMO_ONLY_common = {
      actorRoles: ["standards_approver"] as const,
      createdByUserId: DEMO_ONLY_CREATOR_ID,
      editorUserIds: [DEMO_ONLY_EDITOR_ID],
      reviewerUserId: DEMO_ONLY_APPROVER_ID
    };

    expect(
      validateApprovalActor({
        ...DEMO_ONLY_common,
        actorUserId: DEMO_ONLY_CREATOR_ID
      })[0]?.code
    ).toBe("self_approval_forbidden");
    expect(
      validateApprovalActor({
        ...DEMO_ONLY_common,
        actorUserId: DEMO_ONLY_EDITOR_ID
      })[0]?.code
    ).toBe("self_approval_forbidden");
    expect(
      validateApprovalActor({
        ...DEMO_ONLY_common,
        actorUserId: DEMO_ONLY_APPROVER_ID
      })
    ).toEqual([]);
  });

  it("DEMO_ONLY rejects an approver who is not the assigned reviewer", () => {
    expect(
      validateApprovalActor({
        actorUserId: DEMO_ONLY_OTHER_APPROVER_ID,
        actorRoles: ["standards_approver"],
        createdByUserId: DEMO_ONLY_CREATOR_ID,
        editorUserIds: [DEMO_ONLY_EDITOR_ID],
        reviewerUserId: DEMO_ONLY_APPROVER_ID
      })[0]?.code
    ).toBe("assigned_reviewer_required");
  });

  it("DEMO_ONLY requires the approver role for approval and retirement", () => {
    expect(
      validateApprovalActor({
        actorUserId: DEMO_ONLY_APPROVER_ID,
        actorRoles: ["standards_editor"],
        createdByUserId: DEMO_ONLY_CREATOR_ID,
        editorUserIds: [DEMO_ONLY_EDITOR_ID],
        reviewerUserId: DEMO_ONLY_APPROVER_ID
      })[0]?.code
    ).toBe("standards_approver_role_required");

    expect(validateRetirement(["standards_editor"], "DEMO_ONLY_REASON")[0]?.code).toBe(
      "standards_approver_role_required"
    );
    expect(validateRetirement(["standards_approver"], "DEMO_ONLY_REASON")).toEqual(
      []
    );
    expect(validateRetirement(["standards_approver"], "")[0]?.code).toBe(
      "retirement_reason_required"
    );
  });
});
