import { describe, expect, it } from "vitest";

import type {
  ApprovedStandardReference,
  CalculationStandardKind,
  LaborProductivity,
  LaborRate
} from "../../packages/domain/src/index";
import {
  calculationInputSchema,
  calculationResultSchema,
  laborProductivitySchema,
  laborRateSchema,
  wasteRuleSchema
} from "../../packages/validation/src/index";

const DEMO_ONLY_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001";
const DEMO_ONLY_METHOD_ID = "00000000-0000-4000-8000-000000000002";
const DEMO_ONLY_METHOD_VERSION_ID = "00000000-0000-4000-8000-000000000003";
const DEMO_ONLY_PRODUCTIVITY_ID = "00000000-0000-4000-8000-000000000004";
const DEMO_ONLY_PRODUCTIVITY_VERSION_ID = "00000000-0000-4000-8000-000000000005";
const DEMO_ONLY_RATE_ID = "00000000-0000-4000-8000-000000000006";
const DEMO_ONLY_RATE_VERSION_ID = "00000000-0000-4000-8000-000000000007";
const DEMO_ONLY_APPROVAL_ID = "00000000-0000-4000-8000-000000000008";
const DEMO_ONLY_EVIDENCE_ID = "00000000-0000-4000-8000-000000000009";
const DEMO_ONLY_INPUT_ID = "00000000-0000-4000-8000-000000000010";
const DEMO_ONLY_LINE_ID = "00000000-0000-4000-8000-000000000011";
const DEMO_ONLY_RULE_ID = "00000000-0000-4000-8000-000000000012";
const DEMO_ONLY_WARNING_ID = "00000000-0000-4000-8000-000000000013";
const DEMO_ONLY_VERSION_NUMBER = 1;
const DEMO_ONLY_EFFECTIVE_DATE = "2026-01-01";
const DEMO_ONLY_POSITIVE_VALUE = 2;
const DEMO_ONLY_ZERO_VALUE = 0;
const DEMO_ONLY_OUTPUT_UNIT = "DEMO_ONLY_OUTPUT_UNIT";
const DEMO_ONLY_LABOR_UNIT = "DEMO_ONLY_LABOR_UNIT";
const DEMO_ONLY_CURRENCY = "DEMO_ONLY_CURRENCY";
const DEMO_ONLY_BUILD_ID = "DEMO_ONLY_BUILD_ID";
const DEMO_ONLY_CONTRACT_VERSION = "DEMO_ONLY_CONTRACT_VERSION";

function DEMO_ONLY_APPROVED_REFERENCE(
  standardKind: CalculationStandardKind,
  standardId: string,
  standardVersionId: string
): ApprovedStandardReference {
  return {
    standardVersion: {
      organizationId: DEMO_ONLY_ORGANIZATION_ID,
      standardKind,
      standardId,
      standardVersionId,
      versionNumber: DEMO_ONLY_VERSION_NUMBER
    },
    source: "DEMO_ONLY_SOURCE",
    evidenceIds: [DEMO_ONLY_EVIDENCE_ID],
    approvalId: DEMO_ONLY_APPROVAL_ID,
    effectiveDate: DEMO_ONLY_EFFECTIVE_DATE
  };
}

const DEMO_ONLY_METHOD_REFERENCE = DEMO_ONLY_APPROVED_REFERENCE(
  "work_method",
  DEMO_ONLY_METHOD_ID,
  DEMO_ONLY_METHOD_VERSION_ID
);

const DEMO_ONLY_PRODUCTIVITY: LaborProductivity = {
  standard: DEMO_ONLY_APPROVED_REFERENCE(
    "labor_productivity",
    DEMO_ONLY_PRODUCTIVITY_ID,
    DEMO_ONLY_PRODUCTIVITY_VERSION_ID
  ),
  outputQuantityPerLaborUnit: DEMO_ONLY_POSITIVE_VALUE,
  outputUnit: DEMO_ONLY_OUTPUT_UNIT,
  laborUnit: DEMO_ONLY_LABOR_UNIT,
  appliesTo: { kind: "work_method", workMethod: DEMO_ONLY_METHOD_REFERENCE },
  conditions: "DEMO_ONLY_CONDITIONS"
};

const DEMO_ONLY_CHARGE_RATE = {
  amount: DEMO_ONLY_POSITIVE_VALUE,
  currencyCode: DEMO_ONLY_CURRENCY,
  perUnit: DEMO_ONLY_LABOR_UNIT
};

const DEMO_ONLY_RATE: LaborRate = {
  standard: DEMO_ONLY_APPROVED_REFERENCE(
    "labor_rate",
    DEMO_ONLY_RATE_ID,
    DEMO_ONLY_RATE_VERSION_ID
  ),
  teamSize: DEMO_ONLY_POSITIVE_VALUE,
  normalHoursPerDay: DEMO_ONLY_POSITIVE_VALUE,
  normalRate: DEMO_ONLY_CHARGE_RATE,
  overtimeHourlyRate: {
    amount: DEMO_ONLY_POSITIVE_VALUE,
    currencyCode: DEMO_ONLY_CURRENCY
  },
  nightRate: DEMO_ONLY_CHARGE_RATE,
  holidayRate: DEMO_ONLY_CHARGE_RATE
};

describe("DEMO_ONLY Phase 1F-A calculation contract validation", () => {
  it("DEMO_ONLY preserves productivity as output quantity per labor unit with governed provenance", () => {
    const DEMO_ONLY_RESULT = laborProductivitySchema.safeParse(DEMO_ONLY_PRODUCTIVITY);

    expect(DEMO_ONLY_RESULT).toEqual({ success: true, data: DEMO_ONLY_PRODUCTIVITY });
  });

  it("DEMO_ONLY rejects missing evidence and non-positive productivity", () => {
    const DEMO_ONLY_RESULT = laborProductivitySchema.safeParse({
      ...DEMO_ONLY_PRODUCTIVITY,
      standard: { ...DEMO_ONLY_PRODUCTIVITY.standard, evidenceIds: [] },
      outputQuantityPerLaborUnit: DEMO_ONLY_ZERO_VALUE
    });

    expect(DEMO_ONLY_RESULT.success).toBe(false);
    if (!DEMO_ONLY_RESULT.success) {
      expect(DEMO_ONLY_RESULT.issues.map(({ path }) => path)).toEqual(
        expect.arrayContaining([
          "$.standard.evidenceIds",
          "$.outputQuantityPerLaborUnit"
        ])
      );
    }
  });

  it("DEMO_ONLY rejects a Labor Standard reference used as a Productivity Standard", () => {
    const DEMO_ONLY_RESULT = laborProductivitySchema.safeParse({
      ...DEMO_ONLY_PRODUCTIVITY,
      standard: {
        ...DEMO_ONLY_PRODUCTIVITY.standard,
        standardVersion: {
          ...DEMO_ONLY_PRODUCTIVITY.standard.standardVersion,
          standardKind: "labor"
        }
      }
    });

    expect(DEMO_ONLY_RESULT.success).toBe(false);
    if (!DEMO_ONLY_RESULT.success) {
      expect(DEMO_ONLY_RESULT.issues.map(({ path }) => path)).toContain(
        "$.standard.standardVersion.standardKind"
      );
    }
  });

  it("DEMO_ONLY keeps staffing and charge rates separate from productivity", () => {
    const DEMO_ONLY_RESULT = laborRateSchema.safeParse(DEMO_ONLY_RATE);

    expect(DEMO_ONLY_RESULT).toEqual({ success: true, data: DEMO_ONLY_RATE });
    expect("productivityMultiplier" in DEMO_ONLY_RATE).toBe(false);
  });

  it("DEMO_ONLY rejects a non-positive team size", () => {
    const DEMO_ONLY_RESULT = laborRateSchema.safeParse({
      ...DEMO_ONLY_RATE,
      teamSize: DEMO_ONLY_ZERO_VALUE
    });

    expect(DEMO_ONLY_RESULT.success).toBe(false);
    if (!DEMO_ONLY_RESULT.success) {
      expect(DEMO_ONLY_RESULT.issues.map(({ path }) => path)).toContain("$.teamSize");
    }
  });

  it("DEMO_ONLY validates a data-only calculation input without executing a formula", () => {
    const DEMO_ONLY_INPUT = {
      organizationId: DEMO_ONLY_ORGANIZATION_ID,
      buildId: DEMO_ONLY_BUILD_ID,
      contractVersion: DEMO_ONLY_CONTRACT_VERSION,
      workMethods: [
        {
          id: DEMO_ONLY_INPUT_ID,
          method: DEMO_ONLY_METHOD_REFERENCE,
          measuredQuantity: {
            value: DEMO_ONLY_POSITIVE_VALUE,
            unit: DEMO_ONLY_OUTPUT_UNIT
          },
          conversionRules: [],
          wasteRules: [],
          labor: [{ productivity: DEMO_ONLY_PRODUCTIVITY, rate: DEMO_ONLY_RATE }]
        }
      ]
    };

    expect(calculationInputSchema.safeParse(DEMO_ONLY_INPUT)).toEqual({
      success: true,
      data: DEMO_ONLY_INPUT
    });
  });

  it("DEMO_ONLY rejects cross-organization standard references", () => {
    const DEMO_ONLY_OTHER_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000099";
    const DEMO_ONLY_RESULT = calculationInputSchema.safeParse({
      organizationId: DEMO_ONLY_OTHER_ORGANIZATION_ID,
      buildId: DEMO_ONLY_BUILD_ID,
      contractVersion: DEMO_ONLY_CONTRACT_VERSION,
      workMethods: [{
        id: DEMO_ONLY_INPUT_ID,
        method: DEMO_ONLY_METHOD_REFERENCE,
        measuredQuantity: { value: DEMO_ONLY_POSITIVE_VALUE, unit: DEMO_ONLY_OUTPUT_UNIT },
        conversionRules: [],
        wasteRules: [],
        labor: []
      }]
    });

    expect(DEMO_ONLY_RESULT.success).toBe(false);
    if (!DEMO_ONLY_RESULT.success) {
      expect(DEMO_ONLY_RESULT.issues.map(({ path }) => path)).toContain(
        "$.workMethods.0.method.standardVersion.organizationId"
      );
    }
  });

  it("DEMO_ONLY validates bounded waste and traceable result lines", () => {
    const DEMO_ONLY_WASTE_RESULT = wasteRuleSchema.safeParse({
      id: DEMO_ONLY_RULE_ID,
      kind: "percentage",
      percentage: DEMO_ONLY_POSITIVE_VALUE
    });
    const DEMO_ONLY_RESULT = calculationResultSchema.safeParse({
      organizationId: DEMO_ONLY_ORGANIZATION_ID,
      buildId: DEMO_ONLY_BUILD_ID,
      contractVersion: DEMO_ONLY_CONTRACT_VERSION,
      lines: [{
        id: DEMO_ONLY_LINE_ID,
        workMethodInputId: DEMO_ONLY_INPUT_ID,
        workMethodVersion: DEMO_ONLY_METHOD_REFERENCE.standardVersion,
        kind: "material_quantity",
        description: "DEMO_ONLY_DESCRIPTION",
        quantity: { value: DEMO_ONLY_POSITIVE_VALUE, unit: DEMO_ONLY_OUTPUT_UNIT },
        appliedRuleIds: [DEMO_ONLY_RULE_ID],
        sourceStandardVersions: [DEMO_ONLY_METHOD_REFERENCE.standardVersion]
      }],
      warnings: [{
        id: DEMO_ONLY_WARNING_ID,
        code: "DEMO_ONLY_WARNING_CODE",
        message: "DEMO_ONLY_WARNING_MESSAGE",
        severity: "warning"
      }]
    });

    expect(DEMO_ONLY_WASTE_RESULT.success).toBe(true);
    expect(DEMO_ONLY_RESULT.success).toBe(true);
  });
});
