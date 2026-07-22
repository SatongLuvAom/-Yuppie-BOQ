import { describe, expect, it } from "vitest";

import {
  BACKDROP_CORE_RULE_SET_V1,
  calculateBackdropTakeoff
} from "../../packages/calculation/src/index";

const DEMO_ONLY_METRE_UNIT = "m" as const;
const DEMO_ONLY_SINGLE_BACKDROP = 1;

function DEMO_ONLY_CALCULATE(widthM: number, heightM: number) {
  const DEMO_ONLY_OUTCOME = calculateBackdropTakeoff({
    width: { value: widthM, unit: DEMO_ONLY_METRE_UNIT },
    height: { value: heightM, unit: DEMO_ONLY_METRE_UNIT },
    quantity: DEMO_ONLY_SINGLE_BACKDROP
  });

  expect(DEMO_ONLY_OUTCOME.ok).toBe(true);
  if (!DEMO_ONLY_OUTCOME.ok) {
    throw new Error(`DEMO_ONLY unexpected error: ${DEMO_ONLY_OUTCOME.error.code}`);
  }
  return DEMO_ONLY_OUTCOME.result;
}

describe("DEMO_ONLY Backdrop Core cut-list edges", () => {
  it("DEMO_ONLY TC-03 reports HMR height/joints and wood splits with no overlength cut", () => {
    const DEMO_ONLY_WIDTH_M = 6;
    const DEMO_ONLY_HEIGHT_M = 3;
    const DEMO_ONLY_RESULT = DEMO_ONLY_CALCULATE(
      DEMO_ONLY_WIDTH_M,
      DEMO_ONLY_HEIGHT_M
    );
    const DEMO_ONLY_WARNING_CODES = new Set(
      DEMO_ONLY_RESULT.warnings.map(({ code }) => code)
    );
    const DEMO_ONLY_EXPECTED_WOOD_TOTALS = {
      members: 30,
      cutPieces: 70,
      stockBars: 50,
      usedLengthM: 120,
      remainingLengthM: 2.5
    };

    expect(DEMO_ONLY_RESULT.hmr).toMatchObject({
      areaEstimateSheets: 7,
      layoutEstimateSheets: 10,
      layoutColumnsPerBackdrop: 5,
      layoutRowsPerBackdrop: 2,
      verticalJointPositionsM: [1.22, 2.44, 3.66, 4.88],
      horizontalJointPositionsM: [2.44]
    });
    expect(DEMO_ONLY_WARNING_CODES).toEqual(
      new Set([
        "HEIGHT_EXCEEDS_HMR_SHEET",
        "WOOD_MEMBER_SPLIT",
        "HMR_JOINT_SUPPORT_REQUIRED",
        "SANDBOX_ESTIMATE"
      ])
    );
    expect(DEMO_ONLY_RESULT.wood.cutPieces.every(
      ({ lengthM }) => lengthM <= BACKDROP_CORE_RULE_SET_V1.frame.stockLengthM
    )).toBe(true);
    expect(DEMO_ONLY_RESULT.wood.cutPieces.some(
      ({ segmentCount }) => segmentCount > 1
    )).toBe(true);
    expect(new Set(
      DEMO_ONLY_RESULT.wood.cutPieces
        .filter(({ segmentCount }) => segmentCount > 1)
        .map(({ orientation }) => orientation)
    )).toEqual(new Set(["vertical", "horizontal"]));
    expect(DEMO_ONLY_RESULT.wood.members).toHaveLength(
      DEMO_ONLY_EXPECTED_WOOD_TOTALS.members
    );
    expect(DEMO_ONLY_RESULT.wood.cutPieces).toHaveLength(
      DEMO_ONLY_EXPECTED_WOOD_TOTALS.cutPieces
    );
    expect(DEMO_ONLY_RESULT.wood.stockBars).toHaveLength(
      DEMO_ONLY_EXPECTED_WOOD_TOTALS.stockBars
    );
    expect(DEMO_ONLY_RESULT.wood.totalUsedLengthM).toBe(
      DEMO_ONLY_EXPECTED_WOOD_TOTALS.usedLengthM
    );
    expect(DEMO_ONLY_RESULT.wood.totalRemainingLengthM).toBe(
      DEMO_ONLY_EXPECTED_WOOD_TOTALS.remainingLengthM
    );
    expect(
      DEMO_ONLY_RESULT.wood.totalUsedLengthM +
        DEMO_ONLY_RESULT.wood.totalRemainingLengthM
    ).toBeCloseTo(
      DEMO_ONLY_RESULT.wood.totalStockBars *
        BACKDROP_CORE_RULE_SET_V1.frame.stockLengthM,
      6
    );
  });

  it("DEMO_ONLY rejects an opening before returning any estimate", () => {
    const DEMO_ONLY_WIDTH_M = 3;
    const DEMO_ONLY_HEIGHT_M = 2.4;
    const DEMO_ONLY_OPENING_WIDTH_M = 0.8;
    const DEMO_ONLY_OPENING_HEIGHT_M = 2;
    const DEMO_ONLY_OUTCOME = calculateBackdropTakeoff({
      width: { value: DEMO_ONLY_WIDTH_M, unit: DEMO_ONLY_METRE_UNIT },
      height: { value: DEMO_ONLY_HEIGHT_M, unit: DEMO_ONLY_METRE_UNIT },
      quantity: DEMO_ONLY_SINGLE_BACKDROP,
      openings: [
        {
          width: {
            value: DEMO_ONLY_OPENING_WIDTH_M,
            unit: DEMO_ONLY_METRE_UNIT
          },
          height: {
            value: DEMO_ONLY_OPENING_HEIGHT_M,
            unit: DEMO_ONLY_METRE_UNIT
          }
        }
      ]
    });

    expect(DEMO_ONLY_OUTCOME).toMatchObject({
      ok: false,
      error: { code: "UNSUPPORTED_OPENING", path: "openings" }
    });
    expect("result" in DEMO_ONLY_OUTCOME).toBe(false);
  });

  it("DEMO_ONLY deduplicates HMR support when a joint coincides with the 0.40 m grid", () => {
    const DEMO_ONLY_WIDTH_WITH_COINCIDENT_JOINT_M = 24.5;
    const DEMO_ONLY_HEIGHT_M = 0.4;
    const DEMO_ONLY_COINCIDENT_POSITION_M = 24.4;
    const DEMO_ONLY_RESULT = DEMO_ONLY_CALCULATE(
      DEMO_ONLY_WIDTH_WITH_COINCIDENT_JOINT_M,
      DEMO_ONLY_HEIGHT_M
    );
    const DEMO_ONLY_MATCHES = DEMO_ONLY_RESULT.frameLayout.verticalPositions.filter(
      ({ positionM }) => positionM === DEMO_ONLY_COINCIDENT_POSITION_M
    );

    expect(DEMO_ONLY_MATCHES).toEqual([
      {
        positionM: DEMO_ONLY_COINCIDENT_POSITION_M,
        reasons: ["spacing", "hmr_joint"]
      }
    ]);
    expect(DEMO_ONLY_RESULT.wood.members.filter(
      ({ orientation, positionM }) =>
        orientation === "vertical" &&
        positionM === DEMO_ONLY_COINCIDENT_POSITION_M
    )).toHaveLength(DEMO_ONLY_SINGLE_BACKDROP);
  });
});
