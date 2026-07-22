import {
  CALCULATION_STANDARD_KINDS,
  type ApprovedStandardReference,
  type CalculationBuildId,
  type CalculationInput,
  type CalculationLine,
  type CalculationResult,
  type CalculationWarning,
  type CalculationStandardKind,
  type CalculationStandardVersionReference,
  type ConversionRule,
  type LaborChargeRate,
  type LaborProductivity,
  type LaborRate,
  type MonetaryAmount,
  type PurchaseUnit,
  type Quantity,
  type RoundingRule,
  type Unit,
  type WasteRule,
  type WorkMethodInput,
  type WorkMethodLaborInput
} from "@yuppie/domain";

import {
  schema,
  type ValidationIssue,
  type ValidationResult,
  type ValidationSchema
} from "./schema";

type InputObject = Readonly<Record<string, unknown>>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function issue(
  issues: ValidationIssue[],
  path: string,
  code: ValidationIssue["code"],
  message: string
): void {
  issues.push({ path, code, message });
}

function objectValue(
  input: unknown,
  path: string,
  issues: ValidationIssue[]
): InputObject | undefined {
  if (typeof input === "object" && input !== null && !Array.isArray(input)) {
    return input as InputObject;
  }
  issue(issues, path, "invalid_type", "Expected an object.");
  return undefined;
}

function textValue(
  input: unknown,
  path: string,
  issues: ValidationIssue[]
): string {
  if (typeof input !== "string") {
    issue(issues, path, input === undefined ? "required" : "invalid_type", "Expected a string.");
    return "";
  }
  const value = input.trim();
  if (!value) issue(issues, path, "required", "A value is required.");
  return value;
}

function numberValue(
  input: unknown,
  path: string,
  issues: ValidationIssue[],
  minimum: number,
  integer = false
): number {
  if (typeof input !== "number" || !Number.isFinite(input)) {
    issue(issues, path, input === undefined ? "required" : "invalid_type", "Expected a finite number.");
    return 0;
  }
  if (input < minimum || (integer && !Number.isSafeInteger(input))) {
    issue(issues, path, "invalid_value", integer ? `Expected an integer of at least ${minimum}.` : `Expected a value of at least ${minimum}.`);
  }
  return input;
}

function uuidValue(input: unknown, path: string, issues: ValidationIssue[]): string {
  const value = textValue(input, path, issues);
  if (value && !UUID_PATTERN.test(value)) {
    issue(issues, path, "invalid_format", "Expected a UUID.");
  }
  return value;
}

function dateValue(input: unknown, path: string, issues: ValidationIssue[]): string {
  const value = textValue(input, path, issues);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    value &&
    (!ISO_DATE_PATTERN.test(value) ||
      Number.isNaN(parsed.valueOf()) ||
      parsed.toISOString().slice(0, 10) !== value)
  ) {
    issue(issues, path, "invalid_format", "Expected an ISO date using YYYY-MM-DD.");
  }
  return value;
}

function arrayValue(input: unknown, path: string, issues: ValidationIssue[]): readonly unknown[] {
  if (!Array.isArray(input)) {
    issue(issues, path, input === undefined ? "required" : "invalid_type", "Expected an array.");
    return [];
  }
  return input;
}

function parseUnit(input: unknown, path: string, issues: ValidationIssue[]): Unit {
  return textValue(input, path, issues);
}

function parseQuantity(input: unknown, path: string, issues: ValidationIssue[]): Quantity {
  const object = objectValue(input, path, issues) ?? {};
  return {
    value: numberValue(object.value, `${path}.value`, issues, 0),
    unit: parseUnit(object.unit, `${path}.unit`, issues)
  };
}

function parseStandardReference<TKind extends CalculationStandardKind = CalculationStandardKind>(
  input: unknown,
  path: string,
  issues: ValidationIssue[],
  expectedOrganizationId?: string,
  expectedKinds?: readonly TKind[]
): CalculationStandardVersionReference<TKind> {
  const object = objectValue(input, path, issues) ?? {};
  const organizationId = uuidValue(object.organizationId, `${path}.organizationId`, issues);
  const standardKind = object.standardKind;
  if (!CALCULATION_STANDARD_KINDS.includes(standardKind as CalculationStandardKind)) {
    issue(issues, `${path}.standardKind`, "invalid_value", "Unsupported standard kind.");
  } else if (expectedKinds && !expectedKinds.includes(standardKind as TKind)) {
    issue(issues, `${path}.standardKind`, "invalid_value", `Expected standard kind: ${expectedKinds.join(" or ")}.`);
  }
  if (expectedOrganizationId && organizationId && organizationId !== expectedOrganizationId) {
    issue(issues, `${path}.organizationId`, "invalid_value", "The reference must belong to the calculation organization.");
  }
  return {
    organizationId,
    standardKind: standardKind as TKind,
    standardId: uuidValue(object.standardId, `${path}.standardId`, issues),
    standardVersionId: uuidValue(object.standardVersionId, `${path}.standardVersionId`, issues),
    versionNumber: numberValue(object.versionNumber, `${path}.versionNumber`, issues, 1, true)
  };
}

function parseApprovedReference<TKind extends CalculationStandardKind = CalculationStandardKind>(
  input: unknown,
  path: string,
  issues: ValidationIssue[],
  expectedOrganizationId?: string,
  expectedKinds?: readonly TKind[]
): ApprovedStandardReference<TKind> {
  const object = objectValue(input, path, issues) ?? {};
  const standardVersion = parseStandardReference(
    object.standardVersion,
    `${path}.standardVersion`,
    issues,
    expectedOrganizationId,
    expectedKinds
  );
  const evidenceIds = arrayValue(object.evidenceIds, `${path}.evidenceIds`, issues).map(
    (value, index) => uuidValue(value, `${path}.evidenceIds.${index}`, issues)
  );
  if (evidenceIds.length === 0) {
    issue(issues, `${path}.evidenceIds`, "required", "At least one evidence reference is required.");
  }
  return {
    standardVersion,
    source: textValue(object.source, `${path}.source`, issues),
    evidenceIds,
    approvalId: uuidValue(object.approvalId, `${path}.approvalId`, issues),
    effectiveDate: dateValue(object.effectiveDate, `${path}.effectiveDate`, issues)
  };
}

function parsePurchaseUnit(input: unknown, path: string, issues: ValidationIssue[]): PurchaseUnit {
  const object = objectValue(input, path, issues) ?? {};
  return {
    code: textValue(object.code, `${path}.code`, issues),
    label: textValue(object.label, `${path}.label`, issues),
    containedQuantity: parseQuantity(object.containedQuantity, `${path}.containedQuantity`, issues)
  };
}

function parseConversionRule(input: unknown, path: string, issues: ValidationIssue[]): ConversionRule {
  const object = objectValue(input, path, issues) ?? {};
  return {
    id: uuidValue(object.id, `${path}.id`, issues),
    fromUnit: parseUnit(object.fromUnit, `${path}.fromUnit`, issues),
    toUnit: parseUnit(object.toUnit, `${path}.toUnit`, issues),
    multiplier: numberValue(object.multiplier, `${path}.multiplier`, issues, Number.MIN_VALUE)
  };
}

function parseWasteRule(input: unknown, path: string, issues: ValidationIssue[]): WasteRule {
  const object = objectValue(input, path, issues) ?? {};
  const id = uuidValue(object.id, `${path}.id`, issues);
  if (object.kind === "fixed_quantity") {
    return { id, kind: "fixed_quantity", quantity: parseQuantity(object.quantity, `${path}.quantity`, issues) };
  }
  if (object.kind !== "percentage") {
    issue(issues, `${path}.kind`, "invalid_value", "Unsupported waste rule kind.");
  }
  const percentage = numberValue(object.percentage, `${path}.percentage`, issues, 0);
  if (percentage > 100) issue(issues, `${path}.percentage`, "invalid_value", "Percentage cannot exceed 100.");
  return { id, kind: "percentage", percentage };
}

function parseRoundingRule(input: unknown, path: string, issues: ValidationIssue[]): RoundingRule {
  const object = objectValue(input, path, issues) ?? {};
  const mode = object.mode;
  if (mode !== "up" && mode !== "down" && mode !== "nearest") {
    issue(issues, `${path}.mode`, "invalid_value", "Unsupported rounding mode.");
  }
  const increment = parseQuantity(object.increment, `${path}.increment`, issues);
  if (increment.value <= 0) issue(issues, `${path}.increment.value`, "invalid_value", "Rounding increment must be greater than zero.");
  return {
    id: uuidValue(object.id, `${path}.id`, issues),
    mode: mode as RoundingRule["mode"],
    increment
  };
}

function parseMonetaryAmount(input: unknown, path: string, issues: ValidationIssue[]): MonetaryAmount {
  const object = objectValue(input, path, issues) ?? {};
  return {
    amount: numberValue(object.amount, `${path}.amount`, issues, 0),
    currencyCode: textValue(object.currencyCode, `${path}.currencyCode`, issues)
  };
}

function parseChargeRate(input: unknown, path: string, issues: ValidationIssue[]): LaborChargeRate {
  const object = objectValue(input, path, issues) ?? {};
  return {
    ...parseMonetaryAmount(object, path, issues),
    perUnit: parseUnit(object.perUnit, `${path}.perUnit`, issues)
  };
}

function parseLaborProductivity(
  input: unknown,
  path: string,
  issues: ValidationIssue[],
  expectedOrganizationId?: string
): LaborProductivity {
  const object = objectValue(input, path, issues) ?? {};
  const appliesToObject = objectValue(object.appliesTo, `${path}.appliesTo`, issues) ?? {};
  const appliesTo = appliesToObject.kind === "work_method"
    ? {
        kind: "work_method" as const,
        workMethod: parseApprovedReference(
          appliesToObject.workMethod,
          `${path}.appliesTo.workMethod`,
          issues,
          expectedOrganizationId,
          ["work_method"]
        )
      }
    : {
        kind: "work_type" as const,
        workType: textValue(appliesToObject.workType, `${path}.appliesTo.workType`, issues)
      };
  if (appliesToObject.kind !== "work_method" && appliesToObject.kind !== "work_type") {
    issue(issues, `${path}.appliesTo.kind`, "invalid_value", "Productivity must target a work method or work type.");
  }
  return {
    standard: parseApprovedReference(
      object.standard,
      `${path}.standard`,
      issues,
      expectedOrganizationId,
      ["labor_productivity"]
    ),
    outputQuantityPerLaborUnit: numberValue(
      object.outputQuantityPerLaborUnit,
      `${path}.outputQuantityPerLaborUnit`,
      issues,
      Number.MIN_VALUE
    ),
    outputUnit: parseUnit(object.outputUnit, `${path}.outputUnit`, issues),
    laborUnit: parseUnit(object.laborUnit, `${path}.laborUnit`, issues),
    appliesTo,
    conditions: textValue(object.conditions, `${path}.conditions`, issues)
  };
}

function parseLaborRate(
  input: unknown,
  path: string,
  issues: ValidationIssue[],
  expectedOrganizationId?: string
): LaborRate {
  const object = objectValue(input, path, issues) ?? {};
  return {
    standard: parseApprovedReference(
      object.standard,
      `${path}.standard`,
      issues,
      expectedOrganizationId,
      ["labor_rate"]
    ),
    teamSize: numberValue(object.teamSize, `${path}.teamSize`, issues, 1, true),
    normalHoursPerDay: numberValue(object.normalHoursPerDay, `${path}.normalHoursPerDay`, issues, Number.MIN_VALUE),
    normalRate: parseChargeRate(object.normalRate, `${path}.normalRate`, issues),
    overtimeHourlyRate: parseMonetaryAmount(object.overtimeHourlyRate, `${path}.overtimeHourlyRate`, issues),
    nightRate: parseChargeRate(object.nightRate, `${path}.nightRate`, issues),
    holidayRate: parseChargeRate(object.holidayRate, `${path}.holidayRate`, issues)
  };
}

function parseLaborInput(
  input: unknown,
  path: string,
  issues: ValidationIssue[],
  expectedOrganizationId: string
): WorkMethodLaborInput {
  const object = objectValue(input, path, issues) ?? {};
  return {
    productivity: parseLaborProductivity(object.productivity, `${path}.productivity`, issues, expectedOrganizationId),
    rate: parseLaborRate(object.rate, `${path}.rate`, issues, expectedOrganizationId)
  };
}

function parseWorkMethod(
  input: unknown,
  path: string,
  issues: ValidationIssue[],
  expectedOrganizationId: string
): WorkMethodInput {
  const object = objectValue(input, path, issues) ?? {};
  return {
    id: uuidValue(object.id, `${path}.id`, issues),
    method: parseApprovedReference(
      object.method,
      `${path}.method`,
      issues,
      expectedOrganizationId,
      ["work_method"]
    ),
    measuredQuantity: parseQuantity(object.measuredQuantity, `${path}.measuredQuantity`, issues),
    ...(object.purchaseUnit === undefined
      ? {}
      : { purchaseUnit: parsePurchaseUnit(object.purchaseUnit, `${path}.purchaseUnit`, issues) }),
    conversionRules: arrayValue(object.conversionRules, `${path}.conversionRules`, issues).map(
      (value, index) => parseConversionRule(value, `${path}.conversionRules.${index}`, issues)
    ),
    wasteRules: arrayValue(object.wasteRules, `${path}.wasteRules`, issues).map(
      (value, index) => parseWasteRule(value, `${path}.wasteRules.${index}`, issues)
    ),
    ...(object.roundingRule === undefined
      ? {}
      : { roundingRule: parseRoundingRule(object.roundingRule, `${path}.roundingRule`, issues) }),
    labor: arrayValue(object.labor, `${path}.labor`, issues).map((value, index) =>
      parseLaborInput(value, `${path}.labor.${index}`, issues, expectedOrganizationId)
    )
  };
}

function parseWarning(input: unknown, path: string, issues: ValidationIssue[]): CalculationWarning {
  const object = objectValue(input, path, issues) ?? {};
  const severity = object.severity;
  if (severity !== "info" && severity !== "warning" && severity !== "error") {
    issue(issues, `${path}.severity`, "invalid_value", "Unsupported warning severity.");
  }
  const warningPath = object.path === undefined
    ? undefined
    : textValue(object.path, `${path}.path`, issues);
  return {
    id: uuidValue(object.id, `${path}.id`, issues),
    code: textValue(object.code, `${path}.code`, issues),
    message: textValue(object.message, `${path}.message`, issues),
    severity: severity as CalculationWarning["severity"],
    ...(warningPath ? { path: warningPath } : {})
  };
}

function parseLine(
  input: unknown,
  path: string,
  issues: ValidationIssue[],
  expectedOrganizationId?: string
): CalculationLine {
  const object = objectValue(input, path, issues) ?? {};
  const kind = object.kind;
  if (kind !== "material_quantity" && kind !== "labor_quantity") {
    issue(issues, `${path}.kind`, "invalid_value", "Unsupported calculation line kind.");
  }
  return {
    id: uuidValue(object.id, `${path}.id`, issues),
    workMethodInputId: uuidValue(
      object.workMethodInputId,
      `${path}.workMethodInputId`,
      issues
    ),
    workMethodVersion: parseStandardReference(
      object.workMethodVersion,
      `${path}.workMethodVersion`,
      issues,
      expectedOrganizationId,
      ["work_method"]
    ),
    kind: kind as CalculationLine["kind"],
    description: textValue(object.description, `${path}.description`, issues),
    quantity: parseQuantity(object.quantity, `${path}.quantity`, issues),
    appliedRuleIds: arrayValue(object.appliedRuleIds, `${path}.appliedRuleIds`, issues).map(
      (value, index) => uuidValue(value, `${path}.appliedRuleIds.${index}`, issues)
    ),
    sourceStandardVersions: arrayValue(
      object.sourceStandardVersions,
      `${path}.sourceStandardVersions`,
      issues
    ).map((value, index) =>
      parseStandardReference(value, `${path}.sourceStandardVersions.${index}`, issues, expectedOrganizationId)
    )
  };
}

function parsed<T>(issues: ValidationIssue[], data: T): ValidationResult<T> {
  return issues.length === 0 ? { success: true, data } : { success: false, issues };
}

function validator<T>(parse: (input: unknown, issues: ValidationIssue[]) => T): ValidationSchema<T> {
  return schema((input) => {
    const issues: ValidationIssue[] = [];
    return parsed(issues, parse(input, issues));
  });
}

export const unitSchema = validator<Unit>((input, issues) => parseUnit(input, "$", issues));
export const quantitySchema = validator<Quantity>((input, issues) => parseQuantity(input, "$", issues));
export const purchaseUnitSchema = validator<PurchaseUnit>((input, issues) => parsePurchaseUnit(input, "$", issues));
export const conversionRuleSchema = validator<ConversionRule>((input, issues) => parseConversionRule(input, "$", issues));
export const wasteRuleSchema = validator<WasteRule>((input, issues) => parseWasteRule(input, "$", issues));
export const roundingRuleSchema = validator<RoundingRule>((input, issues) => parseRoundingRule(input, "$", issues));
export const approvedStandardReferenceSchema = validator<ApprovedStandardReference>(
  (input, issues) => parseApprovedReference(input, "$", issues)
);
export const laborProductivitySchema = validator<LaborProductivity>(
  (input, issues) => parseLaborProductivity(input, "$", issues)
);
export const laborRateSchema = validator<LaborRate>((input, issues) => parseLaborRate(input, "$", issues));
export const workMethodInputSchema = validator<WorkMethodInput>((input, issues) => {
  const object = objectValue(input, "$", issues) ?? {};
  const methodObject = objectValue(object.method, "$.method", issues) ?? {};
  const referenceObject = objectValue(methodObject.standardVersion, "$.method.standardVersion", issues) ?? {};
  const organizationId = uuidValue(referenceObject.organizationId, "$.method.standardVersion.organizationId", issues);
  return parseWorkMethod(input, "$", issues, organizationId);
});
export const calculationBuildIdSchema = validator<CalculationBuildId>(
  (input, issues) => textValue(input, "$", issues)
);
export const calculationInputSchema = validator<CalculationInput>((input, issues) => {
  const object = objectValue(input, "$", issues) ?? {};
  const organizationId = uuidValue(object.organizationId, "$.organizationId", issues);
  return {
    organizationId,
    buildId: textValue(object.buildId, "$.buildId", issues),
    contractVersion: textValue(object.contractVersion, "$.contractVersion", issues),
    workMethods: arrayValue(object.workMethods, "$.workMethods", issues).map((value, index) =>
      parseWorkMethod(value, `$.workMethods.${index}`, issues, organizationId)
    )
  };
});
export const calculationLineSchema = validator<CalculationLine>(
  (input, issues) => parseLine(input, "$", issues)
);
export const calculationWarningSchema = validator<CalculationWarning>(
  (input, issues) => parseWarning(input, "$", issues)
);
export const calculationResultSchema = validator<CalculationResult>((input, issues) => {
  const object = objectValue(input, "$", issues) ?? {};
  const organizationId = uuidValue(object.organizationId, "$.organizationId", issues);
  return {
    organizationId,
    buildId: textValue(object.buildId, "$.buildId", issues),
    contractVersion: textValue(object.contractVersion, "$.contractVersion", issues),
    lines: arrayValue(object.lines, "$.lines", issues).map((value, index) =>
      parseLine(value, `$.lines.${index}`, issues, organizationId)
    ),
    warnings: arrayValue(object.warnings, "$.warnings", issues).map((value, index) =>
      parseWarning(value, `$.warnings.${index}`, issues)
    )
  };
});
