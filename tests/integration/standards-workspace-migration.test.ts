import { readFile } from "node:fs/promises";

import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const migrationUrl = new URL(
  "../../supabase/migrations/202607210001_standards_workspace.sql",
  import.meta.url,
);

const DEMO_ONLY = {
  organizationA: "10000000-0000-4000-8000-000000000001",
  organizationB: "10000000-0000-4000-8000-000000000002",
  editorMembership: "20000000-0000-4000-8000-000000000001",
  approverMembership: "20000000-0000-4000-8000-000000000002",
  dualRoleMembership: "20000000-0000-4000-8000-000000000003",
  readerMembership: "20000000-0000-4000-8000-000000000004",
  otherOrganizationMembership: "20000000-0000-4000-8000-000000000005",
  editorUser: "21000000-0000-4000-8000-000000000001",
  approverUser: "21000000-0000-4000-8000-000000000002",
  dualRoleUser: "21000000-0000-4000-8000-000000000003",
  readerUser: "21000000-0000-4000-8000-000000000004",
  otherOrganizationUser: "21000000-0000-4000-8000-000000000005",
  materialStandard: "30000000-0000-4000-8000-000000000001",
  secondMaterialStandard: "30000000-0000-4000-8000-000000000002",
  workMethodStandard: "30000000-0000-4000-8000-000000000003",
  materialVersion1: "40000000-0000-4000-8000-000000000001",
  materialVersion2: "40000000-0000-4000-8000-000000000002",
  workMethodVersion1: "40000000-0000-4000-8000-000000000003",
  evidence1: "50000000-0000-4000-8000-000000000001",
  evidence2: "50000000-0000-4000-8000-000000000002",
  approval1: "60000000-0000-4000-8000-000000000001",
  approval2: "60000000-0000-4000-8000-000000000002",
  approval3: "60000000-0000-4000-8000-000000000003",
  reference1: "70000000-0000-4000-8000-000000000001",
} as const;

const DEMO_ONLY_EDITED_AT = "2026-07-21T01:00:00.000Z";
const DEMO_ONLY_LATER_EDITED_AT = "2026-07-21T02:00:00.000Z";
const DEMO_ONLY_REVIEWED_AT = "2026-07-21T03:00:00.000Z";
const DEMO_ONLY_DECIDED_AT = "2026-07-21T04:00:00.000Z";

async function seedAccess(db: PGlite): Promise<void> {
  await db.query(
    `insert into organizations (id, name) values
      ($1, 'DEMO_ONLY Organization A'),
      ($2, 'DEMO_ONLY Organization B')`,
    [DEMO_ONLY.organizationA, DEMO_ONLY.organizationB],
  );

  await db.query(
    `insert into organization_memberships
      (id, organization_id, user_id) values
      ($1, $6, $2),
      ($3, $6, $4),
      ($5, $6, $7),
      ($8, $6, $9),
      ($10, $11, $12)`,
    [
      DEMO_ONLY.editorMembership,
      DEMO_ONLY.editorUser,
      DEMO_ONLY.approverMembership,
      DEMO_ONLY.approverUser,
      DEMO_ONLY.dualRoleMembership,
      DEMO_ONLY.organizationA,
      DEMO_ONLY.dualRoleUser,
      DEMO_ONLY.readerMembership,
      DEMO_ONLY.readerUser,
      DEMO_ONLY.otherOrganizationMembership,
      DEMO_ONLY.organizationB,
      DEMO_ONLY.otherOrganizationUser,
    ],
  );

  await db.query(
    `insert into organization_membership_roles
      (organization_id, membership_id, role) values
      ($1, $2, 'standards_editor'),
      ($1, $3, 'standards_approver'),
      ($1, $4, 'standards_editor'),
      ($1, $4, 'standards_approver'),
      ($1, $5, 'auditor'),
      ($6, $7, 'standards_editor')`,
    [
      DEMO_ONLY.organizationA,
      DEMO_ONLY.editorMembership,
      DEMO_ONLY.approverMembership,
      DEMO_ONLY.dualRoleMembership,
      DEMO_ONLY.readerMembership,
      DEMO_ONLY.organizationB,
      DEMO_ONLY.otherOrganizationMembership,
    ],
  );
}

async function createMaterial(
  db: PGlite,
  standardId = DEMO_ONLY.materialStandard,
): Promise<void> {
  await db.query(
    `insert into standards
      (id, organization_id, kind, code, name, created_by_membership_id,
       updated_by_membership_id)
     values ($1, $2, 'material', $3, $4, $5, $5)`,
    [
      standardId,
      DEMO_ONLY.organizationA,
      `DEMO_ONLY_CODE_${standardId}`,
      "DEMO_ONLY Material",
      DEMO_ONLY.editorMembership,
    ],
  );
  await db.query(
    `insert into materials (id, organization_id, classification)
     values ($1, $2, 'DEMO_ONLY classification')`,
    [standardId, DEMO_ONLY.organizationA],
  );
}

async function createMaterialVersion(
  db: PGlite,
  options: {
    standardId?: string;
    versionId?: string;
    versionNumber?: number;
    editorMembershipId?: string;
    withDetail?: boolean;
  } = {},
): Promise<void> {
  const standardId = options.standardId ?? DEMO_ONLY.materialStandard;
  const versionId = options.versionId ?? DEMO_ONLY.materialVersion1;
  const versionNumber = options.versionNumber ?? 1;
  const editorMembershipId =
    options.editorMembershipId ?? DEMO_ONLY.editorMembership;

  await db.query(
    `insert into standard_versions (
      id, organization_id, standard_id, standard_kind, version_number,
      source, created_by_membership_id, last_edited_by_membership_id, last_edited_at
    ) values ($1, $2, $3, 'material', $4, $5, $6, $6, $7)`,
    [
      versionId,
      DEMO_ONLY.organizationA,
      standardId,
      versionNumber,
      "DEMO_ONLY source",
      editorMembershipId,
      DEMO_ONLY_EDITED_AT,
    ],
  );

  if (options.withDetail !== false) {
    await db.query(
      `insert into material_versions (
        id, organization_id, standard_id, version_number, unit,
        specification, applicability, last_edited_by_membership_id, last_edited_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        versionId,
        DEMO_ONLY.organizationA,
        standardId,
        versionNumber,
        "DEMO_ONLY unit",
        "DEMO_ONLY specification",
        "DEMO_ONLY applicability",
        editorMembershipId,
        DEMO_ONLY_EDITED_AT,
      ],
    );
  }
}

async function addEvidence(
  db: PGlite,
  options: {
    evidenceId?: string;
    standardId?: string;
    versionId?: string;
    versionNumber?: number;
    organizationId?: string;
  } = {},
): Promise<void> {
  await db.query(
    `insert into standard_evidence (
      id, organization_id, standard_kind, standard_id, standard_version_id,
      version_number, title, source, captured_at,
      added_by_membership_id
    ) values ($1, $2, 'material', $3, $4, $5, $6, $7, $8, $9)`,
    [
      options.evidenceId ?? DEMO_ONLY.evidence1,
      options.organizationId ?? DEMO_ONLY.organizationA,
      options.standardId ?? DEMO_ONLY.materialStandard,
      options.versionId ?? DEMO_ONLY.materialVersion1,
      options.versionNumber ?? 1,
      "DEMO_ONLY material evidence",
      "DEMO_ONLY source reference",
      DEMO_ONLY_EDITED_AT,
      DEMO_ONLY.editorMembership,
    ],
  );
}

async function submitForReview(
  db: PGlite,
  versionId = DEMO_ONLY.materialVersion1,
  reviewerMembershipId = DEMO_ONLY.approverMembership,
): Promise<void> {
  await db.query(
    `update standard_versions
     set status = 'review',
         submitted_by_membership_id = $1,
         submitted_at = $2,
         reviewer_membership_id = $3,
         reviewed_at = $2
     where organization_id = $4 and id = $5`,
    [
      DEMO_ONLY.editorMembership,
      DEMO_ONLY_REVIEWED_AT,
      reviewerMembershipId,
      DEMO_ONLY.organizationA,
      versionId,
    ],
  );
}

async function approveMaterialVersion(
  db: PGlite,
  options: {
    approvalId?: string;
    standardId?: string;
    versionId?: string;
    versionNumber?: number;
    approverMembershipId?: string;
  } = {},
): Promise<void> {
  await db.query(
    `insert into standard_approvals (
      id, organization_id, standard_kind, standard_id, standard_version_id,
      version_number, decision, decided_by_membership_id, decided_at, effective_date
    ) values ($1, $2, 'material', $3, $4, $5, 'approved', $6, $7, $8)`,
    [
      options.approvalId ?? DEMO_ONLY.approval1,
      DEMO_ONLY.organizationA,
      options.standardId ?? DEMO_ONLY.materialStandard,
      options.versionId ?? DEMO_ONLY.materialVersion1,
      options.versionNumber ?? 1,
      options.approverMembershipId ?? DEMO_ONLY.approverMembership,
      DEMO_ONLY_DECIDED_AT,
      "2026-07-22",
    ],
  );
}

describe("Standards Workspace migration", () => {
  let db: PGlite;

  beforeEach(async () => {
    db = new PGlite();
    await db.waitReady;
    await db.exec(await readFile(migrationUrl, "utf8"));
    await seedAccess(db);
  });

  afterEach(async () => {
    await db.close();
  });

  it("executes the migration and resolves a same-organization actor to its user", async () => {
    const result = await db.query<{ user_id: string }>(
      `select user_id
       from organization_memberships
       where organization_id = $1 and id = $2`,
      [DEMO_ONLY.organizationA, DEMO_ONLY.editorMembership],
    );

    expect(result.rows).toEqual([{ user_id: DEMO_ONLY.editorUser }]);

    await expect(
      db.query(
        `insert into standards
          (id, organization_id, kind, code, name, created_by_membership_id,
           updated_by_membership_id)
         values ($1, $2, 'material', $3, $4, $5, $5)`,
        [
          DEMO_ONLY.materialStandard,
          DEMO_ONLY.organizationA,
          "DEMO_ONLY_CROSS_ORG",
          "DEMO_ONLY Cross Organization",
          DEMO_ONLY.otherOrganizationMembership,
        ],
      ),
    ).rejects.toThrow();
  });

  it("enforces sequential unique versions and one active Draft or Review", async () => {
    await createMaterial(db);
    await createMaterialVersion(db);

    await expect(
      createMaterialVersion(db, {
        versionId: DEMO_ONLY.materialVersion2,
        versionNumber: 3,
        withDetail: false,
      }),
    ).rejects.toThrow(/next sequential integer/);

    await expect(
      createMaterialVersion(db, {
        versionId: DEMO_ONLY.materialVersion2,
        versionNumber: 2,
        withDetail: false,
      }),
    ).rejects.toThrow();

    await addEvidence(db);
    await submitForReview(db);
    await createMaterialVersion(db, {
      versionId: DEMO_ONLY.materialVersion2,
      versionNumber: 2,
    });
    await addEvidence(db, {
      evidenceId: DEMO_ONLY.evidence2,
      versionId: DEMO_ONLY.materialVersion2,
      versionNumber: 2,
    });

    await expect(
      submitForReview(db, DEMO_ONLY.materialVersion2),
    ).rejects.toThrow();
  });

  it("requires the matching subtype detail before Review", async () => {
    await createMaterial(db);
    await createMaterialVersion(db, { withDetail: false });
    await addEvidence(db);

    await expect(submitForReview(db)).rejects.toThrow(
      /matching version detail/,
    );
  });

  it("requires an independent assigned Approver", async () => {
    await createMaterial(db);
    await createMaterialVersion(db);
    await addEvidence(db);

    await db.query(
      `insert into organization_membership_roles
        (organization_id, membership_id, role)
       values ($1, $2, 'standards_approver')`,
      [DEMO_ONLY.organizationA, DEMO_ONLY.editorMembership],
    );
    const creator = await db.query<{ created_by_membership_id: string }>(
      "select created_by_membership_id from standard_versions where id = $1",
      [DEMO_ONLY.materialVersion1],
    );
    expect(creator.rows).toEqual([
      { created_by_membership_id: DEMO_ONLY.editorMembership },
    ]);
    await expect(
      submitForReview(
        db,
        DEMO_ONLY.materialVersion1,
        DEMO_ONLY.editorMembership,
      ),
    ).rejects.toThrow(/creator or editor/);
    await expect(
      submitForReview(
        db,
        DEMO_ONLY.materialVersion1,
        DEMO_ONLY.readerMembership,
      ),
    ).rejects.toThrow(/standards_approver/);

    await db.query(
      `update material_versions
       set specification = 'DEMO_ONLY edited specification',
           last_edited_by_membership_id = $1,
           last_edited_at = $2
       where id = $3`,
      [
        DEMO_ONLY.dualRoleMembership,
        DEMO_ONLY_LATER_EDITED_AT,
        DEMO_ONLY.materialVersion1,
      ],
    );
    await expect(
      submitForReview(
        db,
        DEMO_ONLY.materialVersion1,
        DEMO_ONLY.dualRoleMembership,
      ),
    ).rejects.toThrow(/creator or editor/);
  });

  it("records approval through the assigned reviewer and allows only one eligible Approved version", async () => {
    await createMaterial(db);
    await createMaterialVersion(db);
    await addEvidence(db);
    await submitForReview(db);

    await expect(
      db.query(
        `update standard_versions
         set status = 'approved',
             approved_by_membership_id = $1,
             approved_at = $2,
             effective_date = '2026-07-22'
         where id = $3`,
        [
          DEMO_ONLY.approverMembership,
          DEMO_ONLY_DECIDED_AT,
          DEMO_ONLY.materialVersion1,
        ],
      ),
    ).rejects.toThrow(/standard_approvals/);

    await approveMaterialVersion(db);
    const approvedActor = await db.query<{ user_id: string }>(
      `select membership.user_id
       from standard_approvals approval
       join organization_memberships membership
         on membership.organization_id = approval.organization_id
        and membership.id = approval.decided_by_membership_id
       where approval.id = $1`,
      [DEMO_ONLY.approval1],
    );
    expect(approvedActor.rows).toEqual([{ user_id: DEMO_ONLY.approverUser }]);

    await createMaterialVersion(db, {
      versionId: DEMO_ONLY.materialVersion2,
      versionNumber: 2,
    });
    await addEvidence(db, {
      evidenceId: DEMO_ONLY.evidence2,
      versionId: DEMO_ONLY.materialVersion2,
      versionNumber: 2,
    });
    await submitForReview(db, DEMO_ONLY.materialVersion2);

    await expect(
      approveMaterialVersion(db, {
        approvalId: DEMO_ONLY.approval2,
        versionId: DEMO_ONLY.materialVersion2,
        versionNumber: 2,
      }),
    ).rejects.toThrow();
  });

  it("freezes Approved content and retains Evidence and Audit Log records", async () => {
    await createMaterial(db);
    await createMaterialVersion(db);
    await addEvidence(db);
    await submitForReview(db);
    await approveMaterialVersion(db);

    await expect(
      db.query(
        `update material_versions
         set specification = 'DEMO_ONLY forbidden edit',
             last_edited_at = $1
         where id = $2`,
        [DEMO_ONLY_LATER_EDITED_AT, DEMO_ONLY.materialVersion1],
      ),
    ).rejects.toThrow(/editable only while draft/);
    await expect(
      db.query("delete from standard_evidence where id = $1", [
        DEMO_ONLY.evidence1,
      ]),
    ).rejects.toThrow(/append-only/);
    await expect(
      db.query("delete from audit_logs where standard_version_id = $1", [
        DEMO_ONLY.materialVersion1,
      ]),
    ).rejects.toThrow(/append-only/);
  });

  it("returns Review to Draft only with a recorded changes-request reason", async () => {
    await createMaterial(db);
    await createMaterialVersion(db);
    await addEvidence(db);
    await submitForReview(db);

    await expect(
      db.query(
        `insert into standard_approvals (
          id, organization_id, standard_kind, standard_id, standard_version_id,
          version_number, decision, decided_by_membership_id, decided_at
        ) values ($1, $2, 'material', $3, $4, 1, 'changes_requested', $5, $6)`,
        [
          DEMO_ONLY.approval1,
          DEMO_ONLY.organizationA,
          DEMO_ONLY.materialStandard,
          DEMO_ONLY.materialVersion1,
          DEMO_ONLY.approverMembership,
          DEMO_ONLY_DECIDED_AT,
        ],
      ),
    ).rejects.toThrow(/reason/);

    await db.query(
      `insert into standard_approvals (
        id, organization_id, standard_kind, standard_id, standard_version_id,
        version_number, decision, decided_by_membership_id, decided_at, rationale
      ) values ($1, $2, 'material', $3, $4, 1, 'changes_requested', $5, $6, $7)`,
      [
        DEMO_ONLY.approval2,
        DEMO_ONLY.organizationA,
        DEMO_ONLY.materialStandard,
        DEMO_ONLY.materialVersion1,
        DEMO_ONLY.approverMembership,
        DEMO_ONLY_DECIDED_AT,
        "DEMO_ONLY changes-request reason",
      ],
    );

    const result = await db.query<{
      return_reason: string;
      status: string;
    }>(
      `select status::text, return_reason
       from standard_versions
       where id = $1`,
      [DEMO_ONLY.materialVersion1],
    );
    expect(result.rows).toEqual([
      {
        status: "draft",
        return_reason: "DEMO_ONLY changes-request reason",
      },
    ]);
  });

  it("retires an Approved version immediately only through an Approver decision", async () => {
    await createMaterial(db);
    await createMaterialVersion(db);
    await addEvidence(db);
    await submitForReview(db);
    await approveMaterialVersion(db);
    const approvedBeforeRetirement = await db.query<{ approved_at: string }>(
      "select approved_at::text from standard_versions where id = $1",
      [DEMO_ONLY.materialVersion1],
    );

    await expect(
      db.query(
        `update standard_versions
         set status = 'retired',
             approved_at = $1,
             retired_by_membership_id = $2,
             retired_at = $3,
             retirement_reason = $4
         where id = $5`,
        [
          DEMO_ONLY_LATER_EDITED_AT,
          DEMO_ONLY.approverMembership,
          DEMO_ONLY_DECIDED_AT,
          "DEMO_ONLY retirement reason",
          DEMO_ONLY.materialVersion1,
        ],
      ),
    ).rejects.toThrow(/standard_approvals/);

    await expect(
      db.query(
        `insert into standard_approvals (
          id, organization_id, standard_kind, standard_id, standard_version_id,
          version_number, decision, decided_by_membership_id, decided_at, rationale
        ) values ($1, $2, 'material', $3, $4, 1, 'retired', $5, $6, $7)`,
        [
          DEMO_ONLY.approval2,
          DEMO_ONLY.organizationA,
          DEMO_ONLY.materialStandard,
          DEMO_ONLY.materialVersion1,
          DEMO_ONLY.readerMembership,
          DEMO_ONLY_DECIDED_AT,
          "DEMO_ONLY retirement reason",
        ],
      ),
    ).rejects.toThrow(/standards_approver/);

    await db.query(
      `insert into standard_approvals (
        id, organization_id, standard_kind, standard_id, standard_version_id,
        version_number, decision, decided_by_membership_id, decided_at, rationale
      ) values ($1, $2, 'material', $3, $4, 1, 'retired', $5, $6, $7)`,
      [
        DEMO_ONLY.approval3,
        DEMO_ONLY.organizationA,
        DEMO_ONLY.materialStandard,
        DEMO_ONLY.materialVersion1,
        DEMO_ONLY.approverMembership,
        DEMO_ONLY_DECIDED_AT,
        "DEMO_ONLY retirement reason",
      ],
    );

    const result = await db.query<{
      approved_at: string;
      status: string;
    }>(
      `select status::text, approved_at::text
       from standard_versions
       where id = $1`,
      [DEMO_ONLY.materialVersion1],
    );
    expect(result.rows[0]?.status).toBe("retired");
    expect(result.rows[0]?.approved_at).toBe(
      approvedBeforeRetirement.rows[0]?.approved_at,
    );
  });

  it("freezes Work Method standard references after approval", async () => {
    await createMaterial(db);
    await createMaterialVersion(db);

    await db.query(
      `insert into standards
        (id, organization_id, kind, code, name, created_by_membership_id,
         updated_by_membership_id)
       values ($1, $2, 'work_method', $3, $4, $5, $5)`,
      [
        DEMO_ONLY.workMethodStandard,
        DEMO_ONLY.organizationA,
        "DEMO_ONLY_WORK_METHOD",
        "DEMO_ONLY Work Method",
        DEMO_ONLY.editorMembership,
      ],
    );
    await db.query(
      `insert into work_methods (id, organization_id, intended_scope)
       values ($1, $2, 'DEMO_ONLY intended scope')`,
      [DEMO_ONLY.workMethodStandard, DEMO_ONLY.organizationA],
    );
    await db.query(
      `insert into standard_versions (
        id, organization_id, standard_id, standard_kind, version_number,
        source, created_by_membership_id, last_edited_by_membership_id, last_edited_at
      ) values ($1, $2, $3, 'work_method', 1, $4, $5, $5, $6)`,
      [
        DEMO_ONLY.workMethodVersion1,
        DEMO_ONLY.organizationA,
        DEMO_ONLY.workMethodStandard,
        "DEMO_ONLY source",
        DEMO_ONLY.editorMembership,
        DEMO_ONLY_EDITED_AT,
      ],
    );
    await db.query(
      `insert into work_method_versions (
        id, organization_id, standard_id, version_number, method_description,
        conditions, last_edited_by_membership_id, last_edited_at
      ) values ($1, $2, $3, 1, $4, $5, $6, $7)`,
      [
        DEMO_ONLY.workMethodVersion1,
        DEMO_ONLY.organizationA,
        DEMO_ONLY.workMethodStandard,
        "DEMO_ONLY method description",
        "DEMO_ONLY conditions",
        DEMO_ONLY.editorMembership,
        DEMO_ONLY_EDITED_AT,
      ],
    );
    await db.query(
      `insert into work_method_standard_references (
        id, organization_id, work_method_version_id,
        referenced_standard_version_id, created_by_membership_id
      ) values ($1, $2, $3, $4, $5)`,
      [
        DEMO_ONLY.reference1,
        DEMO_ONLY.organizationA,
        DEMO_ONLY.workMethodVersion1,
        DEMO_ONLY.materialVersion1,
        DEMO_ONLY.editorMembership,
      ],
    );
    await db.query(
      `insert into standard_evidence (
        id, organization_id, standard_kind, standard_id, standard_version_id,
        version_number, title, source, captured_at,
        added_by_membership_id
      ) values ($1, $2, 'work_method', $3, $4, 1, $5, $6, $7, $8)`,
      [
        DEMO_ONLY.evidence1,
        DEMO_ONLY.organizationA,
        DEMO_ONLY.workMethodStandard,
        DEMO_ONLY.workMethodVersion1,
        "DEMO_ONLY work method evidence",
        "DEMO_ONLY source reference",
        DEMO_ONLY_EDITED_AT,
        DEMO_ONLY.editorMembership,
      ],
    );
    await submitForReview(db, DEMO_ONLY.workMethodVersion1);
    await db.query(
      `insert into standard_approvals (
        id, organization_id, standard_kind, standard_id, standard_version_id,
        version_number, decision, decided_by_membership_id, decided_at, effective_date
      ) values ($1, $2, 'work_method', $3, $4, 1, 'approved', $5, $6, '2026-07-22')`,
      [
        DEMO_ONLY.approval1,
        DEMO_ONLY.organizationA,
        DEMO_ONLY.workMethodStandard,
        DEMO_ONLY.workMethodVersion1,
        DEMO_ONLY.approverMembership,
        DEMO_ONLY_DECIDED_AT,
      ],
    );

    await expect(
      db.query(
        "delete from work_method_standard_references where id = $1",
        [DEMO_ONLY.reference1],
      ),
    ).rejects.toThrow(/editable only while draft/);
  });
});
