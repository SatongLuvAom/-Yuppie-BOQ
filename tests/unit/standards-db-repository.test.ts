import { describe, expect, it, vi } from "vitest";

import { createSupabaseStandardsRepository } from "../../packages/db/src/index";

const DEMO_ONLY_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001";
const DEMO_ONLY_STANDARD_ID = "00000000-0000-4000-8000-000000000002";
const DEMO_ONLY_VERSION_ID = "00000000-0000-4000-8000-000000000003";
const DEMO_ONLY_REFERENCED_VERSION_ID = "00000000-0000-4000-8000-000000000004";
const DEMO_ONLY_EDITOR_ID = "00000000-0000-4000-8000-000000000005";
const DEMO_ONLY_APPROVER_ID = "00000000-0000-4000-8000-000000000006";
const DEMO_ONLY_EVIDENCE_ID = "00000000-0000-4000-8000-000000000007";
const DEMO_ONLY_AUDIT_ID = "00000000-0000-4000-8000-000000000008";

const DEMO_ONLY_RECEIPT = {
  organization_id: DEMO_ONLY_ORGANIZATION_ID,
  standard_kind: "material",
  standard_id: DEMO_ONLY_STANDARD_ID,
  standard_version_id: DEMO_ONLY_VERSION_ID,
  version_number: 1,
  status: "draft",
  audit_log_id: DEMO_ONLY_AUDIT_ID
};

describe("DEMO_ONLY Supabase Standards repository adapter", () => {
  it("DEMO_ONLY normalizes an audited mutation receipt", async () => {
    const DEMO_ONLY_RPC = vi.fn(async () => ({
      data: DEMO_ONLY_RECEIPT,
      error: null
    }));
    const DEMO_ONLY_REPOSITORY = createSupabaseStandardsRepository({
      rpc: DEMO_ONLY_RPC
    });

    const DEMO_ONLY_RESULT = await DEMO_ONLY_REPOSITORY.createStandard({
      organizationId: DEMO_ONLY_ORGANIZATION_ID,
      kind: "material",
      code: "DEMO_ONLY_CODE",
      name: "DEMO_ONLY_NAME",
      classification: "DEMO_ONLY_CLASSIFICATION"
    });

    expect(DEMO_ONLY_RPC).toHaveBeenCalledWith("standards_create_standard", {
      p_organization_id: DEMO_ONLY_ORGANIZATION_ID,
      p_kind: "material",
      p_code: "DEMO_ONLY_CODE",
      p_name: "DEMO_ONLY_NAME",
      p_classification: "DEMO_ONLY_CLASSIFICATION",
      p_category: null,
      p_intended_scope: null
    });
    expect(DEMO_ONLY_RESULT).toEqual({
      ok: true,
      data: {
        organizationId: DEMO_ONLY_ORGANIZATION_ID,
        standardKind: "material",
        standardId: DEMO_ONLY_STANDARD_ID,
        standardVersionId: DEMO_ONLY_VERSION_ID,
        versionNumber: 1,
        status: "draft",
        auditLogId: DEMO_ONLY_AUDIT_ID
      }
    });
  });

  it("DEMO_ONLY sends only exact referenced version identifiers to the RPC", async () => {
    const DEMO_ONLY_RPC = vi.fn(async () => ({
      data: {
        ...DEMO_ONLY_RECEIPT,
        standard_kind: "work_method"
      },
      error: null
    }));
    const DEMO_ONLY_REPOSITORY = createSupabaseStandardsRepository({
      rpc: DEMO_ONLY_RPC
    });

    await DEMO_ONLY_REPOSITORY.createVersion({
      organizationId: DEMO_ONLY_ORGANIZATION_ID,
      standardId: DEMO_ONLY_STANDARD_ID,
      kind: "work_method",
      source: "DEMO_ONLY_SOURCE",
      methodDescription: "DEMO_ONLY_DESCRIPTION",
      conditions: "DEMO_ONLY_CONDITIONS",
      applicableStandardVersions: [
        {
          organizationId: DEMO_ONLY_ORGANIZATION_ID,
          standardKind: "material",
          standardId: DEMO_ONLY_STANDARD_ID,
          standardVersionId: DEMO_ONLY_REFERENCED_VERSION_ID,
          versionNumber: 1
        }
      ]
    });

    expect(DEMO_ONLY_RPC).toHaveBeenCalledWith("standards_create_version", {
      p_organization_id: DEMO_ONLY_ORGANIZATION_ID,
      p_standard_id: DEMO_ONLY_STANDARD_ID,
      p_kind: "work_method",
      p_source: "DEMO_ONLY_SOURCE",
      p_unit: null,
      p_specification: null,
      p_applicability: null,
      p_interpretation_basis: null,
      p_method_description: "DEMO_ONLY_DESCRIPTION",
      p_conditions: "DEMO_ONLY_CONDITIONS",
      p_referenced_standard_version_ids: [DEMO_ONLY_REFERENCED_VERSION_ID]
    });
  });

  it("DEMO_ONLY normalizes version governance context", async () => {
    const DEMO_ONLY_RPC = vi.fn(async () => ({
      data: {
        organization_id: DEMO_ONLY_ORGANIZATION_ID,
        standard_kind: "material",
        standard_id: DEMO_ONLY_STANDARD_ID,
        standard_version_id: DEMO_ONLY_VERSION_ID,
        version_number: 1,
        status: "review",
        source: "DEMO_ONLY_SOURCE",
        evidence_ids: [DEMO_ONLY_EVIDENCE_ID],
        created_by_membership_id: DEMO_ONLY_EDITOR_ID,
        editor_membership_ids: [DEMO_ONLY_EDITOR_ID],
        reviewer_membership_id: DEMO_ONLY_APPROVER_ID
      },
      error: null
    }));
    const DEMO_ONLY_REPOSITORY = createSupabaseStandardsRepository({
      rpc: DEMO_ONLY_RPC
    });

    const DEMO_ONLY_RESULT =
      await DEMO_ONLY_REPOSITORY.getVersionMutationContext({
        organizationId: DEMO_ONLY_ORGANIZATION_ID,
        standardVersionId: DEMO_ONLY_VERSION_ID
      });

    expect(DEMO_ONLY_RESULT).toEqual({
      ok: true,
      data: {
        organizationId: DEMO_ONLY_ORGANIZATION_ID,
        standardKind: "material",
        standardId: DEMO_ONLY_STANDARD_ID,
        standardVersionId: DEMO_ONLY_VERSION_ID,
        versionNumber: 1,
        status: "review",
        source: "DEMO_ONLY_SOURCE",
        evidenceIds: [DEMO_ONLY_EVIDENCE_ID],
        createdByMembershipId: DEMO_ONLY_EDITOR_ID,
        editorMembershipIds: [DEMO_ONLY_EDITOR_ID],
        reviewerMembershipId: DEMO_ONLY_APPROVER_ID
      }
    });
  });

  it("DEMO_ONLY maps database self-approval failures to a stable UI code", async () => {
    const DEMO_ONLY_RPC = vi.fn(async () => ({
      data: null,
      error: {
        code: "P0001",
        message: "creator or editor cannot approve the same version"
      }
    }));
    const DEMO_ONLY_REPOSITORY = createSupabaseStandardsRepository({
      rpc: DEMO_ONLY_RPC
    });

    const DEMO_ONLY_RESULT = await DEMO_ONLY_REPOSITORY.approveVersion({
      organizationId: DEMO_ONLY_ORGANIZATION_ID,
      standardVersionId: DEMO_ONLY_VERSION_ID,
      effectiveDate: "2026-07-22"
    });

    expect(DEMO_ONLY_RESULT).toEqual({
      ok: false,
      error: {
        code: "self_approval_forbidden",
        message: "A creator or editor cannot approve the same version."
      }
    });
  });

  it("DEMO_ONLY maps a concurrent frozen-version edit to a stable UI code", async () => {
    const DEMO_ONLY_RPC = vi.fn(async () => ({
      data: null,
      error: {
        code: "P0001",
        message: "version details are editable only while draft"
      }
    }));
    const DEMO_ONLY_REPOSITORY = createSupabaseStandardsRepository({
      rpc: DEMO_ONLY_RPC
    });

    const DEMO_ONLY_RESULT =
      await DEMO_ONLY_REPOSITORY.updateDraftVersion({
        organizationId: DEMO_ONLY_ORGANIZATION_ID,
        standardId: DEMO_ONLY_STANDARD_ID,
        standardVersionId: DEMO_ONLY_VERSION_ID,
        kind: "material",
        source: "DEMO_ONLY_SOURCE",
        unit: "DEMO_ONLY_UNIT",
        specification: "DEMO_ONLY_SPECIFICATION",
        applicability: "DEMO_ONLY_APPLICABILITY"
      });

    expect(DEMO_ONLY_RESULT).toEqual({
      ok: false,
      error: {
        code: "version_not_editable",
        message: "Only Draft versions can be edited."
      }
    });
  });
});
