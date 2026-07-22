import type {
  CalculationWarning,
  EntityId,
  IsoDate,
  StandardKind
} from "./contracts";

export const CALCULATION_STANDARD_KINDS = [
  "material",
  "labor",
  "work_method",
  "labor_productivity",
  "labor_rate"
] as const satisfies readonly (StandardKind | "labor_productivity" | "labor_rate")[];

export type CalculationStandardKind =
  (typeof CALCULATION_STANDARD_KINDS)[number];

export interface CalculationStandardVersionReference<
  TKind extends CalculationStandardKind = CalculationStandardKind
> {
  readonly organizationId: EntityId;
  readonly standardKind: TKind;
  readonly standardId: EntityId;
  readonly standardVersionId: EntityId;
  readonly versionNumber: number;
}

/**
 * Stable unit code supplied by the caller, for example a catalogued output or
 * labor unit. The contract deliberately does not ship a default unit catalog.
 */
export type Unit = string;

export interface Quantity {
  readonly value: number;
  readonly unit: Unit;
}

/** A purchasable package and the measured quantity contained in one package. */
export interface PurchaseUnit {
  readonly code: string;
  readonly label: string;
  readonly containedQuantity: Quantity;
}

export interface ConversionRule {
  readonly id: EntityId;
  readonly fromUnit: Unit;
  readonly toUnit: Unit;
  readonly multiplier: number;
}

export type WasteRule =
  | {
      readonly id: EntityId;
      readonly kind: "percentage";
      readonly percentage: number;
    }
  | {
      readonly id: EntityId;
      readonly kind: "fixed_quantity";
      readonly quantity: Quantity;
    };

export interface RoundingRule {
  readonly id: EntityId;
  readonly mode: "up" | "down" | "nearest";
  readonly increment: Quantity;
}

/**
 * Exact approved standard provenance captured at a calculation boundary.
 * Values are references only; the calculation package performs no lookups.
 */
export interface ApprovedStandardReference<
  TKind extends CalculationStandardKind = CalculationStandardKind
> {
  readonly standardVersion: CalculationStandardVersionReference<TKind>;
  readonly source: string;
  readonly evidenceIds: readonly EntityId[];
  readonly approvalId: EntityId;
  readonly effectiveDate: IsoDate;
}

export type LaborApplicabilityTarget =
  | {
      readonly kind: "work_method";
      readonly workMethod: ApprovedStandardReference<"work_method">;
    }
  | {
      readonly kind: "work_type";
      readonly workType: string;
    };

/** Output quantity produced per one labor unit. */
export interface LaborProductivity {
  readonly standard: ApprovedStandardReference<"labor_productivity">;
  readonly outputQuantityPerLaborUnit: number;
  readonly outputUnit: Unit;
  readonly laborUnit: Unit;
  readonly appliesTo: LaborApplicabilityTarget;
  readonly conditions: string;
}

export interface MonetaryAmount {
  readonly amount: number;
  readonly currencyCode: string;
}

export interface LaborChargeRate extends MonetaryAmount {
  readonly perUnit: Unit;
}

/**
 * Staffing and charge rates are explicit inputs independent of productivity.
 * In particular, overtime and night rates do not alter productivity.
 */
export interface LaborRate {
  readonly standard: ApprovedStandardReference<"labor_rate">;
  readonly teamSize: number;
  readonly normalHoursPerDay: number;
  readonly normalRate: LaborChargeRate;
  readonly overtimeHourlyRate: MonetaryAmount;
  readonly nightRate: LaborChargeRate;
  readonly holidayRate: LaborChargeRate;
}

export interface WorkMethodLaborInput {
  readonly productivity: LaborProductivity;
  readonly rate: LaborRate;
}

/** Data-only input for a method; it does not describe or execute a formula. */
export interface WorkMethodInput {
  readonly id: EntityId;
  readonly method: ApprovedStandardReference<"work_method">;
  readonly measuredQuantity: Quantity;
  readonly purchaseUnit?: PurchaseUnit;
  readonly conversionRules: readonly ConversionRule[];
  readonly wasteRules: readonly WasteRule[];
  readonly roundingRule?: RoundingRule;
  readonly labor: readonly WorkMethodLaborInput[];
}

export type CalculationBuildId = string;
export type CalculationContractVersion = string;

export interface CalculationInput {
  readonly organizationId: EntityId;
  readonly buildId: CalculationBuildId;
  readonly contractVersion: CalculationContractVersion;
  readonly workMethods: readonly WorkMethodInput[];
}

export interface CalculationLine {
  readonly id: EntityId;
  readonly workMethodInputId: EntityId;
  readonly workMethodVersion: CalculationStandardVersionReference<"work_method">;
  readonly kind: "material_quantity" | "labor_quantity";
  readonly description: string;
  readonly quantity: Quantity;
  readonly appliedRuleIds: readonly EntityId[];
  readonly sourceStandardVersions: readonly CalculationStandardVersionReference[];
}

export interface CalculationResult {
  readonly organizationId: EntityId;
  readonly buildId: CalculationBuildId;
  readonly contractVersion: CalculationContractVersion;
  readonly lines: readonly CalculationLine[];
  readonly warnings: readonly CalculationWarning[];
}
