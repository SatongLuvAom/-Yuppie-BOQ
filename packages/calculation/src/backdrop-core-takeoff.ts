import type {
  CalculationBuildId,
  CalculationWarning,
  Quantity
} from "@yuppie/domain";

const EPSILON = 1e-9;
const OUTPUT_DECIMAL_PLACES = 6;

export const BACKDROP_CORE_RULE_SET_V1 = {
  id: "backdrop-core-takeoff",
  version: 1,
  buildId: "backdrop-core-takeoff-v1" as CalculationBuildId,
  applicability: {
    backdropType: "straight_indoor_wall",
    claddingSides: 1,
    openingsSupported: false
  },
  hmr: {
    material: "HMR",
    thicknessMm: 9,
    sheetWidthM: 1.22,
    sheetHeightM: 2.44,
    defaultOrientation: "vertical"
  },
  frame: {
    material: "mixed_hardwood",
    sectionWidthCm: 1.7,
    sectionDepthCm: 4.2,
    spacingM: 0.4,
    stockLengthM: 2.45,
    packingAlgorithm: "first_fit_decreasing"
  }
} as const;

export type BackdropCoreRuleSet = typeof BACKDROP_CORE_RULE_SET_V1;

export type BackdropFramePositionReason =
  | "edge"
  | "spacing"
  | "hmr_joint";

export interface BackdropOpeningInput {
  readonly width: Quantity;
  readonly height: Quantity;
}

export interface BackdropTakeoffInput {
  readonly width: Quantity;
  readonly height: Quantity;
  readonly quantity: number;
  readonly openings?: readonly BackdropOpeningInput[];
}

export interface BackdropFramePosition {
  readonly positionM: number;
  readonly reasons: readonly BackdropFramePositionReason[];
}

export type BackdropFrameMemberOrientation = "vertical" | "horizontal";

export interface BackdropFrameMember {
  readonly id: string;
  readonly backdropIndex: number;
  readonly orientation: BackdropFrameMemberOrientation;
  readonly positionM: number;
  readonly lengthM: number;
  readonly reasons: readonly BackdropFramePositionReason[];
}

export interface BackdropWoodCutPiece {
  readonly id: string;
  readonly memberId: string;
  readonly backdropIndex: number;
  readonly orientation: BackdropFrameMemberOrientation;
  readonly positionM: number;
  readonly lengthM: number;
  readonly segmentIndex: number;
  readonly segmentCount: number;
  readonly reasons: readonly BackdropFramePositionReason[];
}

export interface BackdropWoodStockBar {
  readonly id: string;
  readonly cutPieceIds: readonly string[];
  readonly stockLengthM: number;
  readonly usedLengthM: number;
  readonly remainingLengthM: number;
}

export interface BackdropHmrEstimate {
  readonly sheetWidthM: number;
  readonly sheetHeightM: number;
  readonly thicknessMm: number;
  readonly orientation: "vertical";
  readonly surfaceAreaM2: number;
  readonly areaEstimateSheets: number;
  readonly layoutColumnsPerBackdrop: number;
  readonly layoutRowsPerBackdrop: number;
  readonly layoutEstimateSheets: number;
  readonly verticalJointPositionsM: readonly number[];
  readonly horizontalJointPositionsM: readonly number[];
}

export interface BackdropFrameLayout {
  readonly widthM: number;
  readonly heightM: number;
  readonly verticalPositions: readonly BackdropFramePosition[];
  readonly horizontalPositions: readonly BackdropFramePosition[];
}

export interface BackdropWoodTakeoff {
  readonly material: "mixed_hardwood";
  readonly sectionWidthCm: number;
  readonly sectionDepthCm: number;
  readonly stockLengthM: number;
  readonly packingAlgorithm: "first_fit_decreasing";
  readonly members: readonly BackdropFrameMember[];
  readonly cutPieces: readonly BackdropWoodCutPiece[];
  readonly stockBars: readonly BackdropWoodStockBar[];
  readonly totalCutPieces: number;
  readonly totalStockBars: number;
  readonly totalUsedLengthM: number;
  readonly totalRemainingLengthM: number;
}

export type BackdropTakeoffWarningCode =
  | "HEIGHT_EXCEEDS_HMR_SHEET"
  | "WOOD_MEMBER_SPLIT"
  | "HMR_JOINT_SUPPORT_REQUIRED"
  | "SANDBOX_ESTIMATE";

export interface BackdropTakeoffWarning extends CalculationWarning {
  readonly code: BackdropTakeoffWarningCode;
}

export interface BackdropTakeoffResult {
  readonly ruleSetId: typeof BACKDROP_CORE_RULE_SET_V1.id;
  readonly ruleSetVersion: typeof BACKDROP_CORE_RULE_SET_V1.version;
  readonly buildId: CalculationBuildId;
  readonly quantity: number;
  readonly hmr: BackdropHmrEstimate;
  readonly frameLayout: BackdropFrameLayout;
  readonly wood: BackdropWoodTakeoff;
  readonly warnings: readonly BackdropTakeoffWarning[];
}

export type BackdropTakeoffErrorCode =
  | "INVALID_DIMENSION"
  | "INVALID_QUANTITY"
  | "UNSUPPORTED_UNIT"
  | "UNSUPPORTED_OPENING";

export interface BackdropTakeoffError {
  readonly code: BackdropTakeoffErrorCode;
  readonly message: string;
  readonly path?: string;
}

export type BackdropTakeoffOutcome =
  | { readonly ok: true; readonly result: BackdropTakeoffResult }
  | { readonly ok: false; readonly error: BackdropTakeoffError };

interface MutablePosition {
  readonly positionM: number;
  readonly reasons: Set<BackdropFramePositionReason>;
}

interface MutableStockBar {
  readonly id: string;
  readonly cutPieceIds: string[];
  usedLengthM: number;
}

function roundOutput(value: number): number {
  const factor = 10 ** OUTPUT_DECIMAL_PLACES;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function isSamePosition(left: number, right: number): boolean {
  return Math.abs(left - right) <= EPSILON;
}

function addPosition(
  positions: MutablePosition[],
  positionM: number,
  reason: BackdropFramePositionReason
): void {
  const roundedPosition = roundOutput(positionM);
  const existing = positions.find(({ positionM: current }) =>
    isSamePosition(current, roundedPosition)
  );

  if (existing) {
    existing.reasons.add(reason);
    return;
  }

  positions.push({ positionM: roundedPosition, reasons: new Set([reason]) });
}

function positionsAtInterval(lengthM: number, intervalM: number): number[] {
  const positions: number[] = [];
  for (let index = 1; index * intervalM < lengthM - EPSILON; index += 1) {
    positions.push(roundOutput(index * intervalM));
  }
  return positions;
}

function jointPositions(lengthM: number, sheetDimensionM: number): number[] {
  const positions: number[] = [];
  for (
    let index = 1;
    index * sheetDimensionM < lengthM - EPSILON;
    index += 1
  ) {
    positions.push(roundOutput(index * sheetDimensionM));
  }
  return positions;
}

function createFramePositions(
  lengthM: number,
  spacingM: number,
  hmrJointPositionsM: readonly number[]
): BackdropFramePosition[] {
  const positions: MutablePosition[] = [];
  addPosition(positions, 0, "edge");
  addPosition(positions, lengthM, "edge");

  for (const positionM of positionsAtInterval(lengthM, spacingM)) {
    addPosition(positions, positionM, "spacing");
  }
  for (const positionM of hmrJointPositionsM) {
    addPosition(positions, positionM, "hmr_joint");
  }

  return positions
    .sort((left, right) => left.positionM - right.positionM)
    .map(({ positionM, reasons }) => ({
      positionM,
      reasons: [...reasons]
    }));
}

function createFrameMembers(
  quantity: number,
  orientation: BackdropFrameMemberOrientation,
  positions: readonly BackdropFramePosition[],
  memberLengthM: number
): BackdropFrameMember[] {
  const members: BackdropFrameMember[] = [];

  for (let backdropIndex = 1; backdropIndex <= quantity; backdropIndex += 1) {
    for (let positionIndex = 0; positionIndex < positions.length; positionIndex += 1) {
      const position = positions[positionIndex];
      if (!position) {
        continue;
      }
      members.push({
        id: `${orientation}-${backdropIndex}-${positionIndex + 1}`,
        backdropIndex,
        orientation,
        positionM: position.positionM,
        lengthM: roundOutput(memberLengthM),
        reasons: position.reasons
      });
    }
  }

  return members;
}

function splitMember(
  member: BackdropFrameMember,
  stockLengthM: number
): BackdropWoodCutPiece[] {
  const segmentCount = Math.ceil(member.lengthM / stockLengthM - EPSILON);
  const pieces: BackdropWoodCutPiece[] = [];
  let remainingLengthM = member.lengthM;

  for (let segmentIndex = 1; segmentIndex <= segmentCount; segmentIndex += 1) {
    const lengthM = Math.min(stockLengthM, remainingLengthM);
    pieces.push({
      id: `${member.id}-cut-${segmentIndex}`,
      memberId: member.id,
      backdropIndex: member.backdropIndex,
      orientation: member.orientation,
      positionM: member.positionM,
      lengthM: roundOutput(lengthM),
      segmentIndex,
      segmentCount,
      reasons: member.reasons
    });
    remainingLengthM = roundOutput(remainingLengthM - lengthM);
  }

  return pieces;
}

function packFirstFitDecreasing(
  pieces: readonly BackdropWoodCutPiece[],
  stockLengthM: number
): BackdropWoodStockBar[] {
  const sortedPieces = [...pieces].sort(
    (left, right) => right.lengthM - left.lengthM || left.id.localeCompare(right.id)
  );
  const bars: MutableStockBar[] = [];

  for (const piece of sortedPieces) {
    let target = bars.find(
      ({ usedLengthM }) => usedLengthM + piece.lengthM <= stockLengthM + EPSILON
    );
    if (!target) {
      target = {
        id: `stock-${bars.length + 1}`,
        cutPieceIds: [],
        usedLengthM: 0
      };
      bars.push(target);
    }

    target.cutPieceIds.push(piece.id);
    target.usedLengthM = roundOutput(target.usedLengthM + piece.lengthM);
  }

  return bars.map(({ id, cutPieceIds, usedLengthM }) => ({
    id,
    cutPieceIds,
    stockLengthM,
    usedLengthM,
    remainingLengthM: roundOutput(stockLengthM - usedLengthM)
  }));
}

function warning(
  code: BackdropTakeoffWarningCode,
  message: string,
  path?: string
): BackdropTakeoffWarning {
  return {
    id: `backdrop-warning-${code.toLowerCase()}`,
    code,
    message,
    severity: code === "SANDBOX_ESTIMATE" ? "info" : "warning",
    ...(path ? { path } : {})
  };
}

function validateInput(input: BackdropTakeoffInput): BackdropTakeoffError | undefined {
  if (input.openings && input.openings.length > 0) {
    return {
      code: "UNSUPPORTED_OPENING",
      message: "Backdrop Core Sandbox does not support openings.",
      path: "openings"
    };
  }

  if (input.width.unit !== "m" || input.height.unit !== "m") {
    return {
      code: "UNSUPPORTED_UNIT",
      message: "Backdrop width and height must use metres (m).",
      path: input.width.unit !== "m" ? "width.unit" : "height.unit"
    };
  }

  if (!Number.isFinite(input.width.value) || input.width.value <= 0) {
    return {
      code: "INVALID_DIMENSION",
      message: "Backdrop width must be a positive finite number.",
      path: "width.value"
    };
  }

  if (!Number.isFinite(input.height.value) || input.height.value <= 0) {
    return {
      code: "INVALID_DIMENSION",
      message: "Backdrop height must be a positive finite number.",
      path: "height.value"
    };
  }

  if (!Number.isSafeInteger(input.quantity) || input.quantity < 1) {
    return {
      code: "INVALID_QUANTITY",
      message: "Backdrop quantity must be a positive whole number.",
      path: "quantity"
    };
  }

  return undefined;
}

export function calculateBackdropTakeoff(
  input: BackdropTakeoffInput
): BackdropTakeoffOutcome {
  const inputError = validateInput(input);
  if (inputError) {
    return { ok: false, error: inputError };
  }

  const rules = BACKDROP_CORE_RULE_SET_V1;
  const widthM = roundOutput(input.width.value);
  const heightM = roundOutput(input.height.value);
  const verticalJointPositionsM = jointPositions(widthM, rules.hmr.sheetWidthM);
  const horizontalJointPositionsM = jointPositions(heightM, rules.hmr.sheetHeightM);
  const verticalPositions = createFramePositions(
    widthM,
    rules.frame.spacingM,
    verticalJointPositionsM
  );
  const horizontalPositions = createFramePositions(
    heightM,
    rules.frame.spacingM,
    horizontalJointPositionsM
  );
  const members = [
    ...createFrameMembers(input.quantity, "vertical", verticalPositions, heightM),
    ...createFrameMembers(input.quantity, "horizontal", horizontalPositions, widthM)
  ];
  const cutPieces = members.flatMap((member) =>
    splitMember(member, rules.frame.stockLengthM)
  );
  const stockBars = packFirstFitDecreasing(cutPieces, rules.frame.stockLengthM);
  const totalUsedLengthM = roundOutput(
    cutPieces.reduce((sum, piece) => sum + piece.lengthM, 0)
  );
  const totalRemainingLengthM = roundOutput(
    stockBars.reduce((sum, bar) => sum + bar.remainingLengthM, 0)
  );
  const sheetAreaM2 = rules.hmr.sheetWidthM * rules.hmr.sheetHeightM;
  const surfaceAreaM2 = roundOutput(widthM * heightM * input.quantity);
  const layoutColumnsPerBackdrop = Math.ceil(widthM / rules.hmr.sheetWidthM - EPSILON);
  const layoutRowsPerBackdrop = Math.ceil(heightM / rules.hmr.sheetHeightM - EPSILON);
  const warnings: BackdropTakeoffWarning[] = [];

  if (heightM > rules.hmr.sheetHeightM + EPSILON) {
    warnings.push(
      warning(
        "HEIGHT_EXCEEDS_HMR_SHEET",
        "Backdrop height exceeds one vertical HMR sheet and requires a horizontal sheet joint.",
        "height"
      )
    );
  }
  if (members.some(({ lengthM }) => lengthM > rules.frame.stockLengthM + EPSILON)) {
    warnings.push(
      warning(
        "WOOD_MEMBER_SPLIT",
        "One or more frame members exceed the stock length and were split into cut pieces.",
        "wood.cutPieces"
      )
    );
  }
  if (verticalJointPositionsM.length > 0 || horizontalJointPositionsM.length > 0) {
    warnings.push(
      warning(
        "HMR_JOINT_SUPPORT_REQUIRED",
        "HMR sheet joints require frame support; joint positions are included in the frame layout.",
        "frameLayout"
      )
    );
  }
  warnings.push(
    warning(
      "SANDBOX_ESTIMATE",
      "This result is a sandbox estimate for the approved Phase 1F-B1 scope only."
    )
  );

  return {
    ok: true,
    result: {
      ruleSetId: rules.id,
      ruleSetVersion: rules.version,
      buildId: rules.buildId,
      quantity: input.quantity,
      hmr: {
        sheetWidthM: rules.hmr.sheetWidthM,
        sheetHeightM: rules.hmr.sheetHeightM,
        thicknessMm: rules.hmr.thicknessMm,
        orientation: rules.hmr.defaultOrientation,
        surfaceAreaM2,
        areaEstimateSheets: Math.ceil(surfaceAreaM2 / sheetAreaM2 - EPSILON),
        layoutColumnsPerBackdrop,
        layoutRowsPerBackdrop,
        layoutEstimateSheets:
          layoutColumnsPerBackdrop * layoutRowsPerBackdrop * input.quantity,
        verticalJointPositionsM,
        horizontalJointPositionsM
      },
      frameLayout: {
        widthM,
        heightM,
        verticalPositions,
        horizontalPositions
      },
      wood: {
        material: rules.frame.material,
        sectionWidthCm: rules.frame.sectionWidthCm,
        sectionDepthCm: rules.frame.sectionDepthCm,
        stockLengthM: rules.frame.stockLengthM,
        packingAlgorithm: rules.frame.packingAlgorithm,
        members,
        cutPieces,
        stockBars,
        totalCutPieces: cutPieces.length,
        totalStockBars: stockBars.length,
        totalUsedLengthM,
        totalRemainingLengthM
      },
      warnings
    }
  };
}
