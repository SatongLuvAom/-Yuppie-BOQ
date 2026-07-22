import { describe, expect, it, vi } from "vitest";

import {
  createStandardsService,
  type StandardsActorContext,
  type StandardsMutationReceipt,
  type StandardsRepository,
  type StandardVersionMutationContext
} from "../../packages/domain/src/index";

const DEMO_ONLY_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001";
const DEMO_ONLY_OTHER_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000002";
const DEMO_ONLY_STANDARD_ID = "00000000-0000-4000-8000-000000000003";
const DEMO_ONLY_VERSION_ID = "00000000-0000-4000-8000-000000000004";
const DEMO_ONLY_EDITOR_MEMBERSHIP_ID = "00000000-0000-4000-8000-000000000005";
const DEMO_ONLY_APPROVER_MEMBERSHIP_ID = "00000000-0000-4000-8000-000000000006";
const DEMO_ONLY_OTHER_EDITOR_MEMBERSHIP_ID = "00000000-0000-4000-8000-000000000007";
const DEMO_ONLY_EVIDENCE_ID = "00000000-0000-4000-8000-000000000008";
const DEMO_ONLY_AUDIT_ID = "00000000-0000-4000-8000-000000000009";
const DEMO_ONLY_APPROVAL_ID = "00000000-0000-4000-8000-000000000010";
const DEMO_ONLY_SOURCE = "DEMO_ONLY_SOURCE";
const DEMO_ONLY_REASON = "DEMO_ONLY_REASON";
const DEMO_ONLY_EFFECTIVE_DATE = "2026-07-22";

const DEMO_ONLY_EDITOR: StandardsActorContext = {
  organizationId: DEMO_ONLY_ORGANIZATION_ID,
  membershipId: DEMO_ONLY_EDITOR_MEMBERSHIP_ID,
  roles: ["standards_editor"]
};

const DEMO_ONLY_APPROVER: StandardsActorContext = {
  organizationId: DEMO_ONLY_ORGANIZATION_ID,
  membershipId: DEMO_ONLY_APPROVER_MEMBERSHIP_ID,
  roles: ["standards_approver"]
};

function DEMO_ONLY_receipt(
  status: StandardsMutationReceipt["status"] = "draft"
): StandardsMutationReceipt {
  return {
    organizationId: DEMO_ONLY_ORGANIZATION_ID,
    standardKind: "material",
    standardId: DEMO_ONLY_STANDARD_ID,
    standardVersionId: DEMO_ONLY_VERSION_ID,
    versionNumber: 1,
    status,
    auditLogId: DEMO_ONLY_AUDIT_ID,
    ...(status === "approved" ? { approvalId: DEMO_ONLY_APPROVAL_ID } : {})
  };
}

function DEMO_ONLY_context(
  overrides: Partial<StandardVersionMutationContext> = {}
): StandardVersionMutationContext {
  return {
    organizationId: DEMO_ONLY_ORGANIZATION_ID,
    standardKind: "material",
    standardId: DEMO_ONLY_STANDARD_ID,
    standardVersionId: DEMO_ONLY_VERSION_ID,
    versionNumber: 1,
    status: "draft",
    source: DEMO_ONLY_SOURCE,
    evidenceIds: [DEMO_ONLY_EVIDENCE_ID],
    createdByMembershipId: DEMO_ONLY_EDITOR_MEMBERSHIP_ID,
    editorMembershipIds: [DEMO_ONLY_EDITOR_MEMBERSHIP_ID],
    reviewerMembershipId: DEMO_ONLY_APPROVER_MEMBERSHIP_ID,
    ...overrides
  };
}

function DEMO_ONLY_repository(
  context: StandardVersionMutationContext = DEMO_ONLY_context()
): StandardsRepository & {
  readonly updateDraftVersion: ReturnType<typeof vi.fn>;
  readonly submitForReview: ReturnType<typeof vi.fn>;
  readonly approveVersion: ReturnType<typeof vi.fn>;
  readonly rejectVersion: ReturnType<typeof vi.fn>;
  readonly retireVersion: ReturnType<typeof vi.fn>;
} {
  return {
    getVersionMutationContext: vi.fn(async () => ({ ok: true, data: context })),
    createStandard: vi.fn(async () => ({ ok: true, data: DEMO_ONLY_receipt() })),
    updateStandard: vi.fn(async () => ({ ok: true, data: DEMO_ONLY_receipt() })),
    createVersion: vi.fn(async () => ({ ok: true, data: DEMO_ONLY_receipt() })),
    updateDraftVersion: vi.fn(async () => ({ ok: true, data: DEMO_ONLY_receipt() })),
    addEvidence: vi.fn(async () => ({ ok: true, data: DEMO_ONLY_receipt() })),
    submitForReview: vi.fn(async () => ({ ok: true, data: DEMO_ONLY_receipt("review") })),
    approveVersion: vi.fn(async () => ({ ok: true, data: DEMO_ONLY_receipt("approved") })),
    rejectVersion: vi.fn(async () => ({ ok: true, data: DEMO_ONLY_receipt("draft") })),
    retireVersion: vi.fn(async () => ({ ok: true, data: DEMO_ONLY_receipt("retired") }))
  };
}

describe("DEMO_ONLY Standards service authorization and lifecycle", () => {
  it("DEMO_ONLY rejects an organization mismatch before persistence", async () => {
    const DEMO_ONLY_REPOSITORY = DEMO_ONLY_repository();
    const DEMO_ONLY_SERVICE = createStandardsService(DEMO_ONLY_REPOSITORY);

    const DEMO_ONLY_RESULT = await DEMO_ONLY_SERVICE.createStandard(
      DEMO_ONLY_EDITOR,
      {
        organizationId: DEMO_ONLY_OTHER_ORGANIZATION_ID,
        kind: "material",
        code: "DEMO_ONLY_CODE",
        name: "DEMO_ONLY_NAME",
        classification: "DEMO_ONLY_CLASSIFICATION"
      }
    );

    expect(DEMO_ONLY_RESULT).toEqual({
      ok: false,
      error: {
        code: "organization_scope_mismatch",
        message:
          "The request organization does not match the authenticated membership."
      }
    });
    expect(DEMO_ONLY_REPOSITORY.createStandard).not.toHaveBeenCalled();
  });

  it("DEMO_ONLY prevents editing an approved version", async () => {
    const DEMO_ONLY_REPOSITORY = DEMO_ONLY_repository(
      DEMO_ONLY_context({ status: "approved" })
    );
    const DEMO_ONLY_SERVICE = createStandardsService(DEMO_ONLY_REPOSITORY);

    const DEMO_ONLY_RESULT = await DEMO_ONLY_SERVICE.updateDraftVersion(
      DEMO_ONLY_EDITOR,
      {
        organizationId: DEMO_ONLY_ORGANIZATION_ID,
        standardId: DEMO_ONLY_STANDARD_ID,
        standardVersionId: DEMO_ONLY_VERSION_ID,
        kind: "material",
        source: DEMO_ONLY_SOURCE,
        unit: "DEMO_ONLY_UNIT",
        specification: "DEMO_ONLY_SPECIFICATION",
        applicability: "DEMO_ONLY_APPLICABILITY"
      }
    );

    expect(DEMO_ONLY_RESULT.ok).toBe(false);
    if (!DEMO_ONLY_RESULT.ok) {
      expect(DEMO_ONLY_RESULT.error.code).toBe("immutable_version");
    }
    expect(DEMO_ONLY_REPOSITORY.updateDraftVersion).not.toHaveBeenCalled();
  });

  it("DEMO_ONLY requires evidence and an independent reviewer before review", async () => {
    const DEMO_ONLY_REPOSITORY = DEMO_ONLY_repository(
      DEMO_ONLY_context({ evidenceIds: [] })
    );
    const DEMO_ONLY_SERVICE = createStandardsService(DEMO_ONLY_REPOSITORY);

    const DEMO_ONLY_RESULT = await DEMO_ONLY_SERVICE.submitForReview(
      DEMO_ONLY_EDITOR,
      {
        organizationId: DEMO_ONLY_ORGANIZATION_ID,
        standardVersionId: DEMO_ONLY_VERSION_ID,
        reviewerMembershipId: DEMO_ONLY_EDITOR_MEMBERSHIP_ID
      }
    );

    expect(DEMO_ONLY_RESULT.ok).toBe(false);
    if (!DEMO_ONLY_RESULT.ok) {
      expect(DEMO_ONLY_RESULT.error.code).toBe("evidence_required");
    }
    expect(DEMO_ONLY_REPOSITORY.submitForReview).not.toHaveBeenCalled();
  });

  it("DEMO_ONLY blocks approval by a version editor", async () => {
    const DEMO_ONLY_REPOSITORY = DEMO_ONLY_repository(
      DEMO_ONLY_context({
        status: "review",
        createdByMembershipId: DEMO_ONLY_OTHER_EDITOR_MEMBERSHIP_ID,
        editorMembershipIds: [DEMO_ONLY_APPROVER_MEMBERSHIP_ID]
      })
    );
    const DEMO_ONLY_SERVICE = createStandardsService(DEMO_ONLY_REPOSITORY);

    const DEMO_ONLY_RESULT = await DEMO_ONLY_SERVICE.approveVersion(
      DEMO_ONLY_APPROVER,
      {
        organizationId: DEMO_ONLY_ORGANIZATION_ID,
        standardVersionId: DEMO_ONLY_VERSION_ID,
        effectiveDate: DEMO_ONLY_EFFECTIVE_DATE
      }
    );

    expect(DEMO_ONLY_RESULT.ok).toBe(false);
    if (!DEMO_ONLY_RESULT.ok) {
      expect(DEMO_ONLY_RESULT.error.code).toBe("self_approval_forbidden");
    }
    expect(DEMO_ONLY_REPOSITORY.approveVersion).not.toHaveBeenCalled();
  });

  it("DEMO_ONLY returns the atomic audit receipt after independent approval", async () => {
    const DEMO_ONLY_REPOSITORY = DEMO_ONLY_repository(
      DEMO_ONLY_context({ status: "review" })
    );
    const DEMO_ONLY_SERVICE = createStandardsService(DEMO_ONLY_REPOSITORY);

    const DEMO_ONLY_RESULT = await DEMO_ONLY_SERVICE.approveVersion(
      DEMO_ONLY_APPROVER,
      {
        organizationId: DEMO_ONLY_ORGANIZATION_ID,
        standardVersionId: DEMO_ONLY_VERSION_ID,
        effectiveDate: DEMO_ONLY_EFFECTIVE_DATE
      }
    );

    expect(DEMO_ONLY_RESULT).toEqual({
      ok: true,
      data: DEMO_ONLY_receipt("approved")
    });
    expect(DEMO_ONLY_REPOSITORY.approveVersion).toHaveBeenCalledOnce();
  });

  it("DEMO_ONLY requires a reason when rejecting a review", async () => {
    const DEMO_ONLY_REPOSITORY = DEMO_ONLY_repository(
      DEMO_ONLY_context({ status: "review" })
    );
    const DEMO_ONLY_SERVICE = createStandardsService(DEMO_ONLY_REPOSITORY);

    const DEMO_ONLY_RESULT = await DEMO_ONLY_SERVICE.rejectVersion(
      DEMO_ONLY_APPROVER,
      {
        organizationId: DEMO_ONLY_ORGANIZATION_ID,
        standardVersionId: DEMO_ONLY_VERSION_ID,
        rationale: ""
      }
    );

    expect(DEMO_ONLY_RESULT.ok).toBe(false);
    if (!DEMO_ONLY_RESULT.ok) {
      expect(DEMO_ONLY_RESULT.error.code).toBe(
        "review_rejection_reason_required"
      );
    }
    expect(DEMO_ONLY_REPOSITORY.rejectVersion).not.toHaveBeenCalled();
  });

  it("DEMO_ONLY permits retirement only from approved", async () => {
    const DEMO_ONLY_REPOSITORY = DEMO_ONLY_repository(
      DEMO_ONLY_context({ status: "review" })
    );
    const DEMO_ONLY_SERVICE = createStandardsService(DEMO_ONLY_REPOSITORY);

    const DEMO_ONLY_RESULT = await DEMO_ONLY_SERVICE.retireVersion(
      DEMO_ONLY_APPROVER,
      {
        organizationId: DEMO_ONLY_ORGANIZATION_ID,
        standardVersionId: DEMO_ONLY_VERSION_ID,
        rationale: DEMO_ONLY_REASON
      }
    );

    expect(DEMO_ONLY_RESULT.ok).toBe(false);
    if (!DEMO_ONLY_RESULT.ok) {
      expect(DEMO_ONLY_RESULT.error.code).toBe(
        "invalid_lifecycle_transition"
      );
    }
    expect(DEMO_ONLY_REPOSITORY.retireVersion).not.toHaveBeenCalled();
  });
});
