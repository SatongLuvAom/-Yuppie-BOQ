import { describe, expect, it } from "vitest";

import type {
  StandardReadModel,
  StandardsReadResult,
  StandardsWorkspaceReadModel
} from "../../packages/domain/src/read-models/index";

const DEMO_ONLY_STANDARD: StandardReadModel = {
  id: "DEMO_ONLY_STANDARD_ID",
  kind: "material",
  code: "DEMO_ONLY_CODE",
  name: "DEMO_ONLY_NAME",
  createdAt: "DEMO_ONLY_CREATED_AT",
  updatedAt: "DEMO_ONLY_UPDATED_AT",
  versions: []
};

const DEMO_ONLY_WORKSPACE: StandardsWorkspaceReadModel = {
  viewer: {
    organizationId: "DEMO_ONLY_ORGANIZATION_ID",
    organizationName: "DEMO_ONLY_ORGANIZATION_NAME",
    membershipId: "DEMO_ONLY_MEMBERSHIP_ID",
    userId: "DEMO_ONLY_USER_ID",
    roles: ["auditor"]
  },
  standards: [DEMO_ONLY_STANDARD],
  evidence: [],
  audit: [],
  approvers: []
};

describe("DEMO_ONLY shared Standards read DTOs", () => {
  it("DEMO_ONLY exposes one portable DTO shape for server and UI consumers", () => {
    const DEMO_ONLY_RESULT: StandardsReadResult<StandardsWorkspaceReadModel> = {
      ok: true,
      data: DEMO_ONLY_WORKSPACE
    };

    expect(DEMO_ONLY_RESULT.data.standards).toEqual([DEMO_ONLY_STANDARD]);
  });
});
