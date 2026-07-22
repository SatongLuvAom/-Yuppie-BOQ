import { describe, expect, it } from "vitest";

import {
  BACKDROP_CORE_RULE_SET_V1,
  calculateBackdropTakeoff,
  type BackdropTakeoffInput,
  type BackdropTakeoffResult
} from "../../packages/calculation/src/index";

const DEMO_ONLY_METRE_UNIT = "m";
const DEMO_ONLY_ONE_BACKDROP = 1;
const DEMO_ONLY_TC_01_WIDTH_M = 1.22;
const DEMO_ONLY_TC_01_HEIGHT_M = 2.44;
const DEMO_ONLY_TC_01_EXPECTED_SHEETS = 1;
const DEMO_ONLY_TC_02_WIDTH_M = 3;
const DEMO_ONLY_TC_02_HEIGHT_M = 2.4;
const DEMO_ONLY_TC_02_EXPECTED_VERTICAL_POSITIONS = [
  0, 0.4, 0.8, 1.2, 1.22, 1.6, 2, 2.4, 2.44, 2.8, 3
];
const DEMO_ONLY_TC_02_EXPECTED_HORIZONTAL_POSITIONS = [
  0, 0.4, 0.8, 1.2, 1.6, 2, 2.4
];
const DEMO_ONLY_TC_03_WIDTH_M = 6;
const DEMO_ONLY_TC_03_HEIGHT_M = 3;
const DEMO_ONLY_TC_03_EXPECTED_AREA_SHEETS = 7;
const DEMO_ONLY_TC_03_EXPECTED_LAYOUT_SHEETS = 10;
const DEMO_ONLY_TC_03_EXPECTED_HORIZONTAL_JOINT_M = 2.44;
const DEMO_ONLY_ZERO_QUANTITY = 0;
const DEMO_ONLY_OPENING_WIDTH_M = 0.1;
const DEMO_ONLY_OPENING_HEIGHT_M = 0.1;

function DEMO_ONLY_INPUT(
  widthM: number,
  heightM: number,
  quantity = DEMO_ONLY_ONE_BACKDROP
): BackdropTakeoffInput {
  return {
    width: { value: widthM, unit: DEMO_ONLY_METRE_UNIT },
    height: { value: heightM, unit: DEMO_ONLY_METRE_UNIT },
    quantity
  };
}

function DEMO_ONLY_SUCCESS_RESULT(
  input: BackdropTakeoffInput
): BackdropTakeoffResult {
  const DEMO_ONLY_OUTCOME = calculateBackdropTakeoff(input);
  expect(DEMO_ONLY_OUTCOME.ok).toBe(true);
  if (!DEMO_ONLY_OUTCOME.ok) {
    throw new Error(`DEMO_ONLY unexpected error: ${DEMO_ONLY_OUTCOME.error.code}`);
  }
  return DEMO_ONLY_OUTCOME.result;
}

describe("DEMO_ONLY Phase 1F-B1 backdrop core takeoff", () => {
  it("DEMO_ONLY TC-01 estimates one HMR sheet for one sheet-sized backdrop", () => {
    const DEMO_ONLY_RESULT = DEMO_ONLY_SUCCESS_RESULT(
      DEMO_ONLY_INPUT(DEMO_ONLY_TC_01_WIDTH_M, DEMO_ONLY_TC_01_HEIGHT_M)
    );

    expect(DEMO_ONLY_RESULT.hmr.areaEstimateSheets).toBe(
      DEMO_ONLY_TC_01_EXPECTED_SHEETS
    );
    expect(DEMO_ONLY_RESULT.hmr.layoutEstimateSheets).toBe(
      DEMO_ONLY_TC_01_EXPECTED_SHEETS
    );
    expect(DEMO_ONLY_RESULT.ruleSetVersion).toBe(
      BACKDROP_CORE_RULE_SET_V1.version
    );
  });

  it("DEMO_ONLY TC-02 creates actual frame positions and an FFD cut list", () => {
    const DEMO_ONLY_RESULT = DEMO_ONLY_SUCCESS_RESULT(
      DEMO_ONLY_INPUT(DEMO_ONLY_TC_02_WIDTH_M, DEMO_ONLY_TC_02_HEIGHT_M)
    );

    expect(
      DEMO_ONLY_RESULT.frameLayout.verticalPositions.map(({ positionM }) => positionM)
    ).toEqual(DEMO_ONLY_TC_02_EXPECTED_VERTICAL_POSITIONS);
    expect(
      DEMO_ONLY_RESULT.frameLayout.horizontalPositions.map(({ positionM }) => positionM)
    ).toEqual(DEMO_ONLY_TC_02_EXPECTED_HORIZONTAL_POSITIONS);
    expect(DEMO_ONLY_RESULT.wood.packingAlgorithm).toBe("first_fit_decreasing");
    expect(DEMO_ONLY_RESULT.wood.cutPieces.length).toBeGreaterThan(
      DEMO_ONLY_RESULT.wood.members.length
    );
    expect(DEMO_ONLY_RESULT.wood.stockBars).not.toHaveLength(DEMO_ONLY_ZERO_QUANTITY);
    expect(
      DEMO_ONLY_RESULT.wood.stockBars.every(
        ({ usedLengthM, stockLengthM }) => usedLengthM <= stockLengthM
      )
    ).toBe(true);
  });

  it("DEMO_ONLY TC-03 adds HMR joint supports and splits overlength wood", () => {
    const DEMO_ONLY_RESULT = DEMO_ONLY_SUCCESS_RESULT(
      DEMO_ONLY_INPUT(DEMO_ONLY_TC_03_WIDTH_M, DEMO_ONLY_TC_03_HEIGHT_M)
    );
    const DEMO_ONLY_WARNING_CODES = DEMO_ONLY_RESULT.warnings.map(({ code }) => code);

    expect(DEMO_ONLY_RESULT.hmr.areaEstimateSheets).toBe(
      DEMO_ONLY_TC_03_EXPECTED_AREA_SHEETS
    );
    expect(DEMO_ONLY_RESULT.hmr.layoutEstimateSheets).toBe(
      DEMO_ONLY_TC_03_EXPECTED_LAYOUT_SHEETS
    );
    expect(DEMO_ONLY_RESULT.hmr.horizontalJointPositionsM).toContain(
      DEMO_ONLY_TC_03_EXPECTED_HORIZONTAL_JOINT_M
    );
    expect(
      DEMO_ONLY_RESULT.frameLayout.horizontalPositions.find(
        ({ positionM }) => positionM === DEMO_ONLY_TC_03_EXPECTED_HORIZONTAL_JOINT_M
      )?.reasons
    ).toContain("hmr_joint");
    expect(
      DEMO_ONLY_RESULT.wood.cutPieces.every(
        ({ lengthM }) => lengthM <= BACKDROP_CORE_RULE_SET_V1.frame.stockLengthM
      )
    ).toBe(true);
    expect(
      DEMO_ONLY_RESULT.wood.cutPieces.some(({ segmentCount }) => segmentCount > 1)
    ).toBe(true);
    expect(DEMO_ONLY_WARNING_CODES).toEqual(
      expect.arrayContaining([
        "HEIGHT_EXCEEDS_HMR_SHEET",
        "WOOD_MEMBER_SPLIT",
        "HMR_JOINT_SUPPORT_REQUIRED",
        "SANDBOX_ESTIMATE"
      ])
    );
  });

  it("DEMO_ONLY does not duplicate an interval-aligned frame edge", () => {
    const DEMO_ONLY_RESULT = DEMO_ONLY_SUCCESS_RESULT(
      DEMO_ONLY_INPUT(DEMO_ONLY_TC_01_WIDTH_M, DEMO_ONLY_TC_02_HEIGHT_M)
    );
    const DEMO_ONLY_EDGE_MATCHES = DEMO_ONLY_RESULT.frameLayout.horizontalPositions.filter(
      ({ positionM }) => positionM === DEMO_ONLY_TC_02_HEIGHT_M
    );

    expect(DEMO_ONLY_EDGE_MATCHES).toHaveLength(DEMO_ONLY_ONE_BACKDROP);
    expect(DEMO_ONLY_EDGE_MATCHES[0]?.reasons).toContain("edge");
  });

  it("DEMO_ONLY stops with UNSUPPORTED_OPENING before calculating", () => {
    const DEMO_ONLY_OUTCOME = calculateBackdropTakeoff({
      ...DEMO_ONLY_INPUT(DEMO_ONLY_TC_01_WIDTH_M, DEMO_ONLY_TC_01_HEIGHT_M),
      openings: [
        {
          width: { value: DEMO_ONLY_OPENING_WIDTH_M, unit: DEMO_ONLY_METRE_UNIT },
          height: { value: DEMO_ONLY_OPENING_HEIGHT_M, unit: DEMO_ONLY_METRE_UNIT }
        }
      ]
    });

    expect(DEMO_ONLY_OUTCOME).toEqual({
      ok: false,
      error: {
        code: "UNSUPPORTED_OPENING",
        message: "Backdrop Core Sandbox does not support openings.",
        path: "openings"
      }
    });
  });

  it("DEMO_ONLY rejects a non-positive quantity", () => {
    const DEMO_ONLY_OUTCOME = calculateBackdropTakeoff(
      DEMO_ONLY_INPUT(
        DEMO_ONLY_TC_01_WIDTH_M,
        DEMO_ONLY_TC_01_HEIGHT_M,
        DEMO_ONLY_ZERO_QUANTITY
      )
    );

    expect(DEMO_ONLY_OUTCOME.ok).toBe(false);
    if (!DEMO_ONLY_OUTCOME.ok) {
      expect(DEMO_ONLY_OUTCOME.error.code).toBe("INVALID_QUANTITY");
    }
  });
});
