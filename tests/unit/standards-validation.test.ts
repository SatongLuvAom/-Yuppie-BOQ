import { describe, expect, it } from "vitest";

import {
  addStandardEvidenceRequestSchema,
  approveStandardVersionRequestSchema,
  createStandardRequestSchema,
  createStandardVersionRequestSchema
} from "../../packages/validation/src/index";

const DEMO_ONLY_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001";
const DEMO_ONLY_OTHER_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000002";
const DEMO_ONLY_STANDARD_ID = "00000000-0000-4000-8000-000000000003";
const DEMO_ONLY_VERSION_ID = "00000000-0000-4000-8000-000000000004";

describe("DEMO_ONLY shared Standards request validation", () => {
  it("DEMO_ONLY parses and trims a material identity request", () => {
    const DEMO_ONLY_RESULT = createStandardRequestSchema.safeParse({
      organizationId: DEMO_ONLY_ORGANIZATION_ID,
      kind: "material",
      code: "  DEMO_ONLY_CODE  ",
      name: "DEMO_ONLY_NAME",
      classification: "DEMO_ONLY_CLASSIFICATION",
      ignored: "DEMO_ONLY_IGNORED"
    });

    expect(DEMO_ONLY_RESULT).toEqual({
      success: true,
      data: {
        organizationId: DEMO_ONLY_ORGANIZATION_ID,
        kind: "material",
        code: "DEMO_ONLY_CODE",
        name: "DEMO_ONLY_NAME",
        classification: "DEMO_ONLY_CLASSIFICATION"
      }
    });
  });

  it("DEMO_ONLY rejects malformed identifiers and unsupported standard kinds", () => {
    const DEMO_ONLY_RESULT = createStandardRequestSchema.safeParse({
      organizationId: "DEMO_ONLY_NOT_A_UUID",
      kind: "DEMO_ONLY_UNSUPPORTED_KIND",
      code: "DEMO_ONLY_CODE",
      name: "DEMO_ONLY_NAME"
    });

    expect(DEMO_ONLY_RESULT.success).toBe(false);
    if (!DEMO_ONLY_RESULT.success) {
      expect(DEMO_ONLY_RESULT.issues.map(({ path }) => path)).toContain(
        "organizationId"
      );
      expect(DEMO_ONLY_RESULT.issues.map(({ path }) => path)).toContain("kind");
    }
  });

  it("DEMO_ONLY prevents cross-organization work method references", () => {
    const DEMO_ONLY_RESULT = createStandardVersionRequestSchema.safeParse({
      organizationId: DEMO_ONLY_ORGANIZATION_ID,
      standardId: DEMO_ONLY_STANDARD_ID,
      kind: "work_method",
      source: "DEMO_ONLY_SOURCE",
      methodDescription: "DEMO_ONLY_DESCRIPTION",
      conditions: "DEMO_ONLY_CONDITIONS",
      applicableStandardVersions: [
        {
          organizationId: DEMO_ONLY_OTHER_ORGANIZATION_ID,
          standardKind: "material",
          standardId: DEMO_ONLY_STANDARD_ID,
          standardVersionId: DEMO_ONLY_VERSION_ID,
          versionNumber: 1
        }
      ]
    });

    expect(DEMO_ONLY_RESULT.success).toBe(false);
    if (!DEMO_ONLY_RESULT.success) {
      expect(DEMO_ONLY_RESULT.issues[0]?.path).toBe(
        "applicableStandardVersions.0.organizationId"
      );
    }
  });

  it("DEMO_ONLY requires absolute evidence URI and zoned capture time", () => {
    const DEMO_ONLY_RESULT = addStandardEvidenceRequestSchema.safeParse({
      organizationId: DEMO_ONLY_ORGANIZATION_ID,
      standardVersionId: DEMO_ONLY_VERSION_ID,
      title: "DEMO_ONLY_TITLE",
      source: "DEMO_ONLY_SOURCE",
      sourceUri: "DEMO_ONLY_RELATIVE_URI",
      capturedAt: "DEMO_ONLY_NOT_A_TIMESTAMP"
    });

    expect(DEMO_ONLY_RESULT.success).toBe(false);
    if (!DEMO_ONLY_RESULT.success) {
      expect(DEMO_ONLY_RESULT.issues.map(({ path }) => path)).toEqual([
        "sourceUri",
        "capturedAt"
      ]);
    }
  });

  it("DEMO_ONLY rejects impossible effective dates", () => {
    const DEMO_ONLY_RESULT = approveStandardVersionRequestSchema.safeParse({
      organizationId: DEMO_ONLY_ORGANIZATION_ID,
      standardVersionId: DEMO_ONLY_VERSION_ID,
      effectiveDate: "2026-02-30"
    });

    expect(DEMO_ONLY_RESULT.success).toBe(false);
    if (!DEMO_ONLY_RESULT.success) {
      expect(DEMO_ONLY_RESULT.issues[0]?.path).toBe("effectiveDate");
    }
  });

  it("DEMO_ONLY rejects an impossible Evidence capture date-time", () => {
    const DEMO_ONLY_RESULT = addStandardEvidenceRequestSchema.safeParse({
      organizationId: DEMO_ONLY_ORGANIZATION_ID,
      standardVersionId: DEMO_ONLY_VERSION_ID,
      title: "DEMO_ONLY_TITLE",
      source: "DEMO_ONLY_SOURCE",
      capturedAt: "2026-02-30T00:00:00Z"
    });

    expect(DEMO_ONLY_RESULT.success).toBe(false);
    if (!DEMO_ONLY_RESULT.success) {
      expect(DEMO_ONLY_RESULT.issues[0]?.path).toBe("capturedAt");
    }
  });
});
