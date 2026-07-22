import { describe, expect, it } from "vitest";

import {
  BACKDROP_CORE_RULE_SET_V1,
  calculateBackdropTakeoff
} from "../../packages/calculation/src/index";

const DEMO_ONLY_METRE_UNIT = "m" as const;
const DEMO_ONLY_SINGLE_BACKDROP = 1;
const DEMO_ONLY_DOUBLE_BACKDROP = 2;

function DEMO_ONLY_CALCULATE(
  widthM: number,
  heightM: number,
  quantity = DEMO_ONLY_SINGLE_BACKDROP
) {
  const DEMO_ONLY_OUTCOME = calculateBackdropTakeoff({
    width: { value: widthM, unit: DEMO_ONLY_METRE_UNIT },
    height: { value: heightM, unit: DEMO_ONLY_METRE_UNIT },
    quantity
  });

  expect(DEMO_ONLY_OUTCOME.ok).toBe(true);
  if (!DEMO_ONLY_OUTCOME.ok) {
    throw new Error(`DEMO_ONLY unexpected error: ${DEMO_ONLY_OUTCOME.error.code}`);
  }
  return DEMO_ONLY_OUTCOME.result;
}

function DEMO_ONLY_POSITION_VALUES(
  positions: readonly { readonly positionM: number }[]
): readonly number[] {
  return positions.map(({ positionM }) => positionM);
}

function DEMO_ONLY_EXPECT_STOCK_CONSERVATION(result: ReturnType<typeof DEMO_ONLY_CALCULATE>) {
  const DEMO_ONLY_PURCHASED_LENGTH_M =
    result.wood.totalStockBars * result.wood.stockLengthM;
  expect(result.wood.totalUsedLengthM + result.wood.totalRemainingLengthM).toBeCloseTo(
    DEMO_ONLY_PURCHASED_LENGTH_M,
    6
  );
  expect(result.wood.stockBars.every(
    ({ usedLengthM, remainingLengthM, stockLengthM }) =>
      usedLengthM <= stockLengthM && remainingLengthM >= 0
  )).toBe(true);

  const DEMO_ONLY_PACKED_CUT_IDS = result.wood.stockBars.flatMap(
    ({ cutPieceIds }) => cutPieceIds
  );
  expect(new Set(DEMO_ONLY_PACKED_CUT_IDS).size).toBe(result.wood.totalCutPieces);
  expect([...DEMO_ONLY_PACKED_CUT_IDS].sort()).toEqual(
    result.wood.cutPieces.map(({ id }) => id).sort()
  );
}

describe("DEMO_ONLY Backdrop Core golden takeoff", () => {
  it("DEMO_ONLY TC-01 lays out one 1.22 m x 2.44 m HMR sheet", () => {
    const DEMO_ONLY_WIDTH_M = 1.22;
    const DEMO_ONLY_HEIGHT_M = 2.44;
    const DEMO_ONLY_EXPECTED_VERTICAL_POSITIONS_M = [0, 0.4, 0.8, 1.2, 1.22];
    const DEMO_ONLY_EXPECTED_HORIZONTAL_POSITIONS_M = [
      0,
      0.4,
      0.8,
      1.2,
      1.6,
      2,
      2.4,
      2.44
    ];
    const DEMO_ONLY_RESULT = DEMO_ONLY_CALCULATE(
      DEMO_ONLY_WIDTH_M,
      DEMO_ONLY_HEIGHT_M
    );

    expect(BACKDROP_CORE_RULE_SET_V1.hmr).toMatchObject({
      sheetWidthM: DEMO_ONLY_WIDTH_M,
      sheetHeightM: DEMO_ONLY_HEIGHT_M,
      thicknessMm: 9,
      defaultOrientation: "vertical"
    });
    expect(DEMO_ONLY_RESULT.hmr).toMatchObject({
      areaEstimateSheets: 1,
      layoutEstimateSheets: 1,
      layoutColumnsPerBackdrop: 1,
      layoutRowsPerBackdrop: 1,
      verticalJointPositionsM: [],
      horizontalJointPositionsM: []
    });
    expect(
      DEMO_ONLY_POSITION_VALUES(DEMO_ONLY_RESULT.frameLayout.verticalPositions)
    ).toEqual(DEMO_ONLY_EXPECTED_VERTICAL_POSITIONS_M);
    expect(
      DEMO_ONLY_POSITION_VALUES(DEMO_ONLY_RESULT.frameLayout.horizontalPositions)
    ).toEqual(DEMO_ONLY_EXPECTED_HORIZONTAL_POSITIONS_M);
    expect(DEMO_ONLY_RESULT.frameLayout.verticalPositions.at(-1)).toEqual({
      positionM: DEMO_ONLY_WIDTH_M,
      reasons: ["edge"]
    });
    expect(DEMO_ONLY_RESULT.frameLayout.horizontalPositions.at(-1)).toEqual({
      positionM: DEMO_ONLY_HEIGHT_M,
      reasons: ["edge"]
    });
    expect(DEMO_ONLY_RESULT.warnings.map(({ code }) => code)).toEqual([
      "SANDBOX_ESTIMATE"
    ]);
    DEMO_ONLY_EXPECT_STOCK_CONSERVATION(DEMO_ONLY_RESULT);
  });

  it("DEMO_ONLY TC-02 uses 0.40 m centres, exact edges, HMR-joint supports, and deterministic FFD", () => {
    const DEMO_ONLY_WIDTH_M = 3;
    const DEMO_ONLY_HEIGHT_M = 2.4;
    const DEMO_ONLY_EXPECTED_VERTICAL_POSITIONS_M = [
      0,
      0.4,
      0.8,
      1.2,
      1.22,
      1.6,
      2,
      2.4,
      2.44,
      2.8,
      3
    ];
    const DEMO_ONLY_EXPECTED_HORIZONTAL_POSITIONS_M = [
      0,
      0.4,
      0.8,
      1.2,
      1.6,
      2,
      2.4
    ];
    const DEMO_ONLY_FIRST_RESULT = DEMO_ONLY_CALCULATE(
      DEMO_ONLY_WIDTH_M,
      DEMO_ONLY_HEIGHT_M
    );
    const DEMO_ONLY_SECOND_RESULT = DEMO_ONLY_CALCULATE(
      DEMO_ONLY_WIDTH_M,
      DEMO_ONLY_HEIGHT_M
    );

    expect(DEMO_ONLY_FIRST_RESULT).toEqual(DEMO_ONLY_SECOND_RESULT);
    expect(DEMO_ONLY_FIRST_RESULT.wood.packingAlgorithm).toBe(
      "first_fit_decreasing"
    );
    expect(DEMO_ONLY_FIRST_RESULT.hmr).toMatchObject({
      areaEstimateSheets: 3,
      layoutEstimateSheets: 3,
      layoutColumnsPerBackdrop: 3,
      layoutRowsPerBackdrop: 1,
      verticalJointPositionsM: [1.22, 2.44],
      horizontalJointPositionsM: []
    });
    expect(
      DEMO_ONLY_POSITION_VALUES(
        DEMO_ONLY_FIRST_RESULT.frameLayout.verticalPositions
      )
    ).toEqual(DEMO_ONLY_EXPECTED_VERTICAL_POSITIONS_M);
    expect(
      DEMO_ONLY_POSITION_VALUES(
        DEMO_ONLY_FIRST_RESULT.frameLayout.horizontalPositions
      )
    ).toEqual(DEMO_ONLY_EXPECTED_HORIZONTAL_POSITIONS_M);
    expect(
      DEMO_ONLY_FIRST_RESULT.frameLayout.verticalPositions.find(
        ({ positionM }) => positionM === 1.22
      )?.reasons
    ).toEqual(["hmr_joint"]);
    expect(
      DEMO_ONLY_FIRST_RESULT.frameLayout.verticalPositions.find(
        ({ positionM }) => positionM === DEMO_ONLY_WIDTH_M
      )?.reasons
    ).toEqual(["edge"]);
    expect(
      Math.max(...DEMO_ONLY_FIRST_RESULT.wood.cutPieces.map(({ lengthM }) => lengthM))
    ).toBeLessThanOrEqual(BACKDROP_CORE_RULE_SET_V1.frame.stockLengthM);
    const DEMO_ONLY_EXPECTED_WOOD_TOTALS = {
      totalCutPieces: 25,
      totalStockBars: 20,
      totalUsedLengthM: 47.4,
      totalRemainingLengthM: 1.6
    };
    expect(DEMO_ONLY_FIRST_RESULT.wood).toMatchObject(
      DEMO_ONLY_EXPECTED_WOOD_TOTALS
    );
    DEMO_ONLY_EXPECT_STOCK_CONSERVATION(DEMO_ONLY_FIRST_RESULT);
  });

  it("DEMO_ONLY scales layout quantities and raw member length by requested quantity", () => {
    const DEMO_ONLY_WIDTH_M = 1.22;
    const DEMO_ONLY_HEIGHT_M = 2.44;
    const DEMO_ONLY_SINGLE_RESULT = DEMO_ONLY_CALCULATE(
      DEMO_ONLY_WIDTH_M,
      DEMO_ONLY_HEIGHT_M,
      DEMO_ONLY_SINGLE_BACKDROP
    );
    const DEMO_ONLY_DOUBLE_RESULT = DEMO_ONLY_CALCULATE(
      DEMO_ONLY_WIDTH_M,
      DEMO_ONLY_HEIGHT_M,
      DEMO_ONLY_DOUBLE_BACKDROP
    );

    expect(DEMO_ONLY_DOUBLE_RESULT.quantity).toBe(DEMO_ONLY_DOUBLE_BACKDROP);
    expect(DEMO_ONLY_DOUBLE_RESULT.hmr.surfaceAreaM2).toBeCloseTo(
      DEMO_ONLY_SINGLE_RESULT.hmr.surfaceAreaM2 * DEMO_ONLY_DOUBLE_BACKDROP,
      6
    );
    expect(DEMO_ONLY_DOUBLE_RESULT.hmr.layoutEstimateSheets).toBe(
      DEMO_ONLY_SINGLE_RESULT.hmr.layoutEstimateSheets * DEMO_ONLY_DOUBLE_BACKDROP
    );
    expect(DEMO_ONLY_DOUBLE_RESULT.wood.members).toHaveLength(
      DEMO_ONLY_SINGLE_RESULT.wood.members.length * DEMO_ONLY_DOUBLE_BACKDROP
    );
    expect(DEMO_ONLY_DOUBLE_RESULT.wood.totalUsedLengthM).toBeCloseTo(
      DEMO_ONLY_SINGLE_RESULT.wood.totalUsedLengthM * DEMO_ONLY_DOUBLE_BACKDROP,
      6
    );
    DEMO_ONLY_EXPECT_STOCK_CONSERVATION(DEMO_ONLY_DOUBLE_RESULT);
  });
});
