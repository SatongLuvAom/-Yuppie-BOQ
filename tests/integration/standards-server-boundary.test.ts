import { describe, expect, it, vi } from "vitest";

import type {
  StandardsMutationReceipt,
  StandardsService
} from "../../packages/domain/src/index";
import {
  createStandardsActionHandlers,
  type StandardsActionHandlers
} from "../../apps/web/src/server/standards/handler-factory";

const DEMO_ONLY_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001";
const DEMO_ONLY_STANDARD_ID = "00000000-0000-4000-8000-000000000002";
const DEMO_ONLY_VERSION_ID = "00000000-0000-4000-8000-000000000003";
const DEMO_ONLY_MEMBERSHIP_ID = "00000000-0000-4000-8000-000000000004";
const DEMO_ONLY_REVIEWER_ID = "00000000-0000-4000-8000-000000000005";
const DEMO_ONLY_USER_ID = "00000000-0000-4000-8000-000000000006";
const DEMO_ONLY_AUDIT_ID = "00000000-0000-4000-8000-000000000007";

const DEMO_ONLY_RECEIPT: StandardsMutationReceipt = {
  organizationId: DEMO_ONLY_ORGANIZATION_ID,
  standardKind: "material",
  standardId: DEMO_ONLY_STANDARD_ID,
  standardVersionId: DEMO_ONLY_VERSION_ID,
  auditLogId: DEMO_ONLY_AUDIT_ID,
  status: "draft"
};

const DEMO_ONLY_REQUESTS = {
  createStandard: {
    organizationId: DEMO_ONLY_ORGANIZATION_ID,
    kind: "material",
    code: "DEMO_ONLY_MATERIAL_CODE",
    name: "DEMO_ONLY_MATERIAL_NAME",
    classification: "DEMO_ONLY_CLASSIFICATION"
  },
  updateStandard: {
    organizationId: DEMO_ONLY_ORGANIZATION_ID,
    standardId: DEMO_ONLY_STANDARD_ID,
    kind: "labor",
    code: "DEMO_ONLY_LABOR_CODE",
    name: "DEMO_ONLY_LABOR_NAME",
    category: "DEMO_ONLY_LABOR_CATEGORY"
  },
  createVersion: {
    organizationId: DEMO_ONLY_ORGANIZATION_ID,
    standardId: DEMO_ONLY_STANDARD_ID,
    kind: "work_method",
    source: "DEMO_ONLY_SOURCE",
    methodDescription: "DEMO_ONLY_METHOD_DESCRIPTION",
    conditions: "DEMO_ONLY_CONDITIONS",
    applicableStandardVersions: []
  },
  updateDraftVersion: {
    organizationId: DEMO_ONLY_ORGANIZATION_ID,
    standardId: DEMO_ONLY_STANDARD_ID,
    standardVersionId: DEMO_ONLY_VERSION_ID,
    kind: "material",
    source: "DEMO_ONLY_SOURCE",
    unit: "DEMO_ONLY_UNIT",
    specification: "DEMO_ONLY_SPECIFICATION",
    applicability: "DEMO_ONLY_APPLICABILITY"
  },
  addEvidence: {
    organizationId: DEMO_ONLY_ORGANIZATION_ID,
    standardVersionId: DEMO_ONLY_VERSION_ID,
    title: "DEMO_ONLY_EVIDENCE_TITLE",
    source: "DEMO_ONLY_EVIDENCE_SOURCE",
    sourceUri: "https://example.invalid/DEMO_ONLY_EVIDENCE",
    contentHash: "DEMO_ONLY_CONTENT_HASH",
    capturedAt: "2026-01-01T00:00:00Z"
  },
  submitForReview: {
    organizationId: DEMO_ONLY_ORGANIZATION_ID,
    standardVersionId: DEMO_ONLY_VERSION_ID,
    reviewerMembershipId: DEMO_ONLY_REVIEWER_ID
  },
  approveVersion: {
    organizationId: DEMO_ONLY_ORGANIZATION_ID,
    standardVersionId: DEMO_ONLY_VERSION_ID,
    effectiveDate: "2026-01-01"
  },
  rejectVersion: {
    organizationId: DEMO_ONLY_ORGANIZATION_ID,
    standardVersionId: DEMO_ONLY_VERSION_ID,
    rationale: "DEMO_ONLY_REJECTION_REASON"
  },
  retireVersion: {
    organizationId: DEMO_ONLY_ORGANIZATION_ID,
    standardVersionId: DEMO_ONLY_VERSION_ID,
    rationale: "DEMO_ONLY_RETIREMENT_REASON"
  }
} as const;

function DEMO_ONLY_service(
  overrides: Partial<StandardsService> = {}
): StandardsService {
  const succeed = vi.fn(async () => ({
    ok: true as const,
    data: DEMO_ONLY_RECEIPT
  }));

  return {
    createStandard: succeed,
    updateStandard: succeed,
    createVersion: succeed,
    updateDraftVersion: succeed,
    addEvidence: succeed,
    submitForReview: succeed,
    approveVersion: succeed,
    rejectVersion: succeed,
    retireVersion: succeed,
    ...overrides
  };
}

function DEMO_ONLY_handlers(
  service = DEMO_ONLY_service()
): StandardsActionHandlers {
  return createStandardsActionHandlers({
    service,
    resolveActor: vi.fn(async () => ({
      data: {
        userId: DEMO_ONLY_USER_ID,
        organizationId: DEMO_ONLY_ORGANIZATION_ID,
        membershipId: DEMO_ONLY_MEMBERSHIP_ID,
        membershipRoles: ["standards_editor", "standards_approver"]
      }
    }))
  });
}

describe("DEMO_ONLY Standards server boundary", () => {
  it.each(Object.entries(DEMO_ONLY_REQUESTS))(
    "DEMO_ONLY validates, authenticates, and delegates %s",
    async (operation, input) => {
      const service = DEMO_ONLY_service();
      const handlers = DEMO_ONLY_handlers(service);
      const response = await handlers[
        operation as keyof StandardsActionHandlers
      ](input);

      expect(response).toEqual({ data: DEMO_ONLY_RECEIPT });
      expect(service[operation as keyof StandardsService]).toHaveBeenCalledWith(
        {
          organizationId: DEMO_ONLY_ORGANIZATION_ID,
          membershipId: DEMO_ONLY_MEMBERSHIP_ID,
          roles: ["standards_editor", "standards_approver"]
        },
        input
      );
    }
  );

  it("DEMO_ONLY returns shared validation details before resolving auth", async () => {
    const resolveActor = vi.fn();
    const handlers = createStandardsActionHandlers({
      service: DEMO_ONLY_service(),
      resolveActor
    });

    const response = await handlers.createStandard({});

    expect(response).toMatchObject({
      error: {
        code: "validation_failed",
        details: expect.arrayContaining([
          expect.objectContaining({ field: "organizationId" })
        ])
      }
    });
    expect(resolveActor).not.toHaveBeenCalled();
  });

  it("DEMO_ONLY returns an auth error without invoking the service", async () => {
    const service = DEMO_ONLY_service();
    const handlers = createStandardsActionHandlers({
      service,
      resolveActor: vi.fn(async () => ({
        error: {
          code: "unauthorized" as const,
          message: "Authentication is required."
        }
      }))
    });

    await expect(
      handlers.createStandard(DEMO_ONLY_REQUESTS.createStandard)
    ).resolves.toEqual({
      error: {
        code: "unauthorized",
        message: "Authentication is required."
      }
    });
    expect(service.createStandard).not.toHaveBeenCalled();
  });

  it("DEMO_ONLY preserves safe service error codes for UI handling", async () => {
    const service = DEMO_ONLY_service({
      approveVersion: vi.fn(async () => ({
        ok: false as const,
        error: {
          code: "self_approval_forbidden" as const,
          message: "A creator or editor cannot approve the same version."
        }
      }))
    });

    await expect(
      DEMO_ONLY_handlers(service).approveVersion(
        DEMO_ONLY_REQUESTS.approveVersion
      )
    ).resolves.toEqual({
      error: {
        code: "self_approval_forbidden",
        message: "A creator or editor cannot approve the same version."
      }
    });
  });

  it("DEMO_ONLY hides unexpected authentication and service details", async () => {
    const handlers = createStandardsActionHandlers({
      service: DEMO_ONLY_service(),
      resolveActor: vi.fn(async () => {
        throw new Error("DEMO_ONLY_INTERNAL_DETAIL");
      })
    });

    const response = await handlers.retireVersion(
      DEMO_ONLY_REQUESTS.retireVersion
    );

    expect(response).toEqual({
      error: {
        code: "unexpected_error",
        message: "The standards operation could not be completed."
      }
    });
    expect(JSON.stringify(response)).not.toContain("DEMO_ONLY_INTERNAL_DETAIL");
  });
});
