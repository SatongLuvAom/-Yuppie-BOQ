import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MembershipRole,
  StandardAuditReadModel,
  StandardEvidenceReadModel,
  StandardKind,
  StandardLifecycleStatus,
  StandardReadModel,
  StandardsApproverOption,
  StandardsDashboardCounts,
  StandardsListFilters,
  StandardsReadResult,
  StandardsViewerContext,
  StandardsWorkspaceReadModel,
  StandardVersionReadModel
} from "@yuppie/domain";

import { createAuthenticatedSupabaseClient } from "../supabase/client";
import {
  latestVersion,
  statusForDisplay
} from "./read-model";

const READ_LIMIT = 100;
export type StandardsQueryScope =
  | "dashboard"
  | "list"
  | "detail"
  | "review"
  | "evidence"
  | "audit";

interface MembershipRow { readonly id: string; readonly organization_id: string }
interface RoleRow { readonly role: MembershipRole }
interface StandardRow {
  readonly id: string;
  readonly kind: StandardKind;
  readonly code: string;
  readonly name: string;
  readonly created_at: string;
  readonly updated_at: string;
}
interface VersionRow {
  readonly id: string;
  readonly standard_id: string;
  readonly standard_kind: StandardKind;
  readonly version_number: number;
  readonly status: StandardLifecycleStatus;
  readonly source: string;
  readonly created_by_membership_id: string;
  readonly created_at: string;
  readonly last_edited_by_membership_id: string;
  readonly last_edited_at: string;
  readonly submitted_at: string | null;
  readonly reviewer_membership_id: string | null;
  readonly approved_at: string | null;
  readonly effective_date: string | null;
  readonly return_reason: string | null;
  readonly retired_at: string | null;
  readonly retirement_reason: string | null;
}
interface DetailRow {
  readonly id: string;
  readonly unit?: string;
  readonly specification?: string;
  readonly applicability?: string;
  readonly interpretation_basis?: string;
  readonly method_description?: string;
  readonly conditions?: string;
}
interface CategoryRow {
  readonly id: string;
  readonly classification?: string;
  readonly labor_category?: string;
  readonly intended_scope?: string;
}
interface EvidenceRow {
  readonly id: string;
  readonly standard_id: string;
  readonly standard_version_id: string;
  readonly standard_kind: StandardKind;
  readonly version_number: number;
  readonly title: string;
  readonly source: string;
  readonly source_uri: string | null;
  readonly content_hash: string | null;
  readonly captured_at: string;
  readonly added_by_membership_id: string;
  readonly created_at: string;
}
interface AuditRow {
  readonly id: string;
  readonly action: string;
  readonly subject_type: string;
  readonly subject_id: string;
  readonly standard_version_id: string | null;
  readonly actor_membership_id: string;
  readonly outcome: string;
  readonly occurred_at: string;
}

function readFailure<T>(): StandardsReadResult<T> {
  return { ok: false, error: { code: "read_failed", message: "ไม่สามารถโหลดข้อมูลมาตรฐานได้ กรุณาลองใหม่อีกครั้ง" } };
}

async function resolveViewer(client: SupabaseClient): Promise<StandardsReadResult<StandardsViewerContext>> {
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) {
    return { ok: false, error: { code: "unauthorized", message: "กรุณาเข้าสู่ระบบเพื่อใช้งานมาตรฐาน" } };
  }
  const { data, error } = await client.from("organization_memberships")
    .select("id, organization_id").eq("user_id", auth.user.id).is("ended_at", null)
    .order("joined_at", { ascending: true }).limit(1).maybeSingle();
  if (error) return readFailure();
  const membership = data as MembershipRow | null;
  if (!membership) {
    return { ok: false, error: { code: "membership_required", message: "บัญชีนี้ยังไม่ได้เป็นสมาชิกองค์กรที่ใช้งานอยู่" } };
  }
  const [organization, roles] = await Promise.all([
    client.from("organizations").select("name").eq("id", membership.organization_id).single(),
    client.from("organization_membership_roles").select("role")
      .eq("organization_id", membership.organization_id).eq("membership_id", membership.id)
  ]);
  if (organization.error || roles.error) return readFailure();
  return { ok: true, data: {
    organizationId: membership.organization_id,
    organizationName: (organization.data as { readonly name: string }).name,
    membershipId: membership.id,
    userId: auth.user.id,
    roles: ((roles.data ?? []) as RoleRow[]).map(({ role }) => role)
  } };
}

function mapVersion(
  row: VersionRow,
  details: ReadonlyMap<string, DetailRow>,
  editors: ReadonlyMap<string, readonly string[]>
): StandardVersionReadModel {
  const detail = details.get(row.id);
  return {
    id: row.id, standardId: row.standard_id, kind: row.standard_kind,
    versionNumber: row.version_number, status: row.status,
    displayStatus: statusForDisplay(row.status, row.return_reason ?? undefined),
    source: row.source, createdByMembershipId: row.created_by_membership_id,
    createdAt: row.created_at, lastEditedByMembershipId: row.last_edited_by_membership_id,
    editorMembershipIds: editors.get(row.id) ?? [row.last_edited_by_membership_id],
    lastEditedAt: row.last_edited_at,
    ...(row.submitted_at ? { submittedAt: row.submitted_at } : {}),
    ...(row.reviewer_membership_id ? { reviewerMembershipId: row.reviewer_membership_id } : {}),
    ...(row.approved_at ? { approvedAt: row.approved_at } : {}),
    ...(row.effective_date ? { effectiveDate: row.effective_date } : {}),
    ...(row.return_reason ? { returnReason: row.return_reason } : {}),
    ...(row.retired_at ? { retiredAt: row.retired_at } : {}),
    ...(row.retirement_reason ? { retirementReason: row.retirement_reason } : {}),
    ...(detail?.unit ? { unit: detail.unit } : {}),
    ...(detail?.specification ? { specification: detail.specification } : {}),
    ...(detail?.applicability ? { applicability: detail.applicability } : {}),
    ...(detail?.interpretation_basis ? { interpretationBasis: detail.interpretation_basis } : {}),
    ...(detail?.method_description ? { methodDescription: detail.method_description } : {}),
    ...(detail?.conditions ? { conditions: detail.conditions } : {})
  };
}

function evidence(row: EvidenceRow): StandardEvidenceReadModel {
  return {
    id: row.id, standardId: row.standard_id, standardVersionId: row.standard_version_id,
    kind: row.standard_kind, versionNumber: row.version_number, title: row.title,
    source: row.source, ...(row.source_uri ? { sourceUri: row.source_uri } : {}),
    ...(row.content_hash ? { contentHash: row.content_hash } : {}),
    capturedAt: row.captured_at, addedByMembershipId: row.added_by_membership_id,
    createdAt: row.created_at
  };
}

function audit(row: AuditRow): StandardAuditReadModel {
  return {
    id: row.id, action: row.action, subjectType: row.subject_type,
    subjectId: row.subject_id, ...(row.standard_version_id ? { standardVersionId: row.standard_version_id } : {}),
    actorMembershipId: row.actor_membership_id, outcome: row.outcome, occurredAt: row.occurred_at
  };
}

function searchTerm(value?: string): string | undefined {
  const normalized = value?.trim().replace(/[%,()]/g, "");
  return normalized ? normalized.slice(0, 80) : undefined;
}

async function exactCounts(
  client: SupabaseClient,
  viewer: StandardsViewerContext
): Promise<StandardsDashboardCounts | undefined> {
  const countStandards = (kind: StandardKind) => client.from("standards")
    .select("id", { count: "exact", head: true }).eq("organization_id", viewer.organizationId).eq("kind", kind);
  const countVersions = (status: StandardLifecycleStatus) => client.from("standard_versions")
    .select("id", { count: "exact", head: true }).eq("organization_id", viewer.organizationId).eq("status", status);
  const results = await Promise.all([
    countStandards("material"), countStandards("labor"), countStandards("work_method"),
    countVersions("draft").is("return_reason", null), countVersions("review"),
    countVersions("approved"), countVersions("retired"),
    client.from("standard_versions").select("id", { count: "exact", head: true })
      .eq("organization_id", viewer.organizationId).eq("status", "review")
      .eq("reviewer_membership_id", viewer.membershipId)
  ]);
  if (results.some(({ error }) => error)) return undefined;
  const counts = results.map(({ count }) => count ?? 0);
  return {
    material: counts[0], labor: counts[1], workMethod: counts[2], draft: counts[3],
    review: counts[4], approved: counts[5], retired: counts[6], assignedReview: counts[7]
  };
}

async function categoryFilterIds(
  client: SupabaseClient,
  organizationId: string,
  kind: StandardKind | undefined,
  category: string | undefined
): Promise<readonly string[] | undefined | null> {
  if (!kind || !category) return undefined;
  const config = kind === "material"
    ? ["materials", "classification"] as const
    : kind === "labor"
      ? ["labor_standards", "labor_category"] as const
      : ["work_methods", "intended_scope"] as const;
  const result = await client.from(config[0]).select("id")
    .eq("organization_id", organizationId).eq(config[1], category).limit(READ_LIMIT);
  if (result.error) return null;
  return (result.data as { readonly id: string }[]).map(({ id }) => id);
}

export async function getStandardsWorkspace(
  filters: StandardsListFilters = {},
  scope: StandardsQueryScope = "list"
): Promise<StandardsReadResult<StandardsWorkspaceReadModel>> {
  let client: SupabaseClient;
  try { client = await createAuthenticatedSupabaseClient(); } catch { return readFailure(); }
  const viewerResult = await resolveViewer(client);
  if (!viewerResult.ok) return viewerResult;
  const viewer = viewerResult.data;
  const organizationId = viewer.organizationId;
  const needsStandards = scope !== "audit";
  const needsVersions = ["dashboard", "list", "detail", "review"].includes(scope);
  const needsEvidence = ["detail", "review", "evidence"].includes(scope);
  const needsAudit = ["detail", "audit"].includes(scope);
  const needsDetails = scope === "detail";
  const needsEditors = scope === "detail" || scope === "review";

  const categoryIds = await categoryFilterIds(client, organizationId, filters.kind, filters.category);
  if (categoryIds === null) return readFailure();
  let standardsRows: StandardRow[] = [];
  if (needsStandards && categoryIds?.length !== 0) {
    let query = client.from("standards").select("id, kind, code, name, created_at, updated_at")
      .eq("organization_id", organizationId).order("updated_at", { ascending: false }).limit(READ_LIMIT);
    if (filters.kind) query = query.eq("kind", filters.kind);
    if (filters.standardId) query = query.eq("id", filters.standardId);
    const search = searchTerm(filters.search);
    if (search) query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    if (categoryIds) query = query.in("id", [...categoryIds]);
    const result = await query;
    if (result.error) return readFailure();
    standardsRows = (result.data ?? []) as StandardRow[];
  }
  const standardIds = standardsRows.map(({ id }) => id);

  let versionRows: VersionRow[] = [];
  if (needsVersions && standardIds.length > 0) {
    let query = client.from("standard_versions")
      .select("id, standard_id, standard_kind, version_number, status, source, created_by_membership_id, created_at, last_edited_by_membership_id, last_edited_at, submitted_at, reviewer_membership_id, approved_at, effective_date, return_reason, retired_at, retirement_reason")
      .eq("organization_id", organizationId).in("standard_id", standardIds)
      .order("version_number", { ascending: false }).limit(READ_LIMIT);
    const status = scope === "review" ? "review" : filters.status;
    if (status === "rejected") {
      query = query.eq("status", "draft").not("return_reason", "is", null);
    } else if (status === "draft") {
      query = query.eq("status", "draft").is("return_reason", null);
    } else if (status) {
      query = query.eq("status", status);
    }
    const result = await query;
    if (result.error) return readFailure();
    versionRows = (result.data ?? []) as VersionRow[];
  }
  const versionIds = versionRows.map(({ id }) => id);

  const categories = new Map<string, CategoryRow>();
  if (needsStandards && standardIds.length > 0 && scope !== "dashboard") {
    const [materials, labor, methods] = await Promise.all([
      client.from("materials").select("id, classification").eq("organization_id", organizationId).in("id", standardIds),
      client.from("labor_standards").select("id, labor_category").eq("organization_id", organizationId).in("id", standardIds),
      client.from("work_methods").select("id, intended_scope").eq("organization_id", organizationId).in("id", standardIds)
    ]);
    if (materials.error || labor.error || methods.error) return readFailure();
    for (const row of [...(materials.data as CategoryRow[]), ...(labor.data as CategoryRow[]), ...(methods.data as CategoryRow[])]) categories.set(row.id, row);
  }

  const details = new Map<string, DetailRow>();
  if (needsDetails && versionIds.length > 0) {
    const [materials, labor, methods] = await Promise.all([
      client.from("material_versions").select("id, unit, specification, applicability").eq("organization_id", organizationId).in("id", versionIds),
      client.from("labor_versions").select("id, unit, interpretation_basis, applicability").eq("organization_id", organizationId).in("id", versionIds),
      client.from("work_method_versions").select("id, method_description, conditions").eq("organization_id", organizationId).in("id", versionIds)
    ]);
    if (materials.error || labor.error || methods.error) return readFailure();
    for (const row of [...(materials.data as DetailRow[]), ...(labor.data as DetailRow[]), ...(methods.data as DetailRow[])]) details.set(row.id, row);
  }

  const editors = new Map<string, string[]>();
  if (needsEditors && versionIds.length > 0) {
    const result = await client.from("standard_version_editors")
      .select("standard_version_id, editor_membership_id").eq("organization_id", organizationId)
      .in("standard_version_id", versionIds).limit(READ_LIMIT);
    if (result.error) return readFailure();
    for (const row of result.data as { readonly standard_version_id: string; readonly editor_membership_id: string }[]) {
      editors.set(row.standard_version_id, [...(editors.get(row.standard_version_id) ?? []), row.editor_membership_id]);
    }
  }
  const versions = versionRows.map((row) => mapVersion(row, details, editors));
  const standards = standardsRows.map((row): StandardReadModel => {
    const category = categories.get(row.id);
    const standardVersions = versions.filter(({ standardId }) => standardId === row.id);
    const newest = latestVersion(standardVersions);
    return {
      id: row.id, kind: row.kind, code: row.code, name: row.name,
      ...(category?.classification ? { classification: category.classification } : {}),
      ...(category?.labor_category ? { category: category.labor_category } : {}),
      ...(category?.intended_scope ? { intendedScope: category.intended_scope } : {}),
      createdAt: row.created_at, updatedAt: row.updated_at, versions: standardVersions,
      ...(newest ? { latestVersion: newest } : {})
    };
  }).filter((standard) => !filters.status || standard.versions.length > 0);

  let evidenceRows: StandardEvidenceReadModel[] = [];
  if (needsEvidence) {
    let query = client.from("standard_evidence")
      .select("id, standard_id, standard_version_id, standard_kind, version_number, title, source, source_uri, content_hash, captured_at, added_by_membership_id, created_at")
      .eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(READ_LIMIT);
    if (filters.standardId) query = query.eq("standard_id", filters.standardId);
    if (scope === "review" && versionIds.length > 0) query = query.in("standard_version_id", versionIds);
    const result = await query;
    if (result.error) return readFailure();
    evidenceRows = ((result.data ?? []) as EvidenceRow[]).map(evidence);
  }

  let auditRows: StandardAuditReadModel[] = [];
  if (needsAudit) {
    let query = client.from("audit_logs")
      .select("id, action, subject_type, subject_id, standard_version_id, actor_membership_id, outcome, occurred_at")
      .eq("organization_id", organizationId).order("occurred_at", { ascending: false }).limit(READ_LIMIT);
    if (filters.standardId) query = query.eq("subject_id", filters.standardId);
    const result = await query;
    if (result.error) return readFailure();
    auditRows = ((result.data ?? []) as AuditRow[]).map(audit);
  }

  let approvers: StandardsApproverOption[] = [];
  if (scope === "detail") {
    const result = await client.from("organization_membership_roles").select("membership_id")
      .eq("organization_id", organizationId).eq("role", "standards_approver").limit(READ_LIMIT);
    if (result.error) return readFailure();
    approvers = (result.data as { readonly membership_id: string }[]).map(({ membership_id }) => ({
      membershipId: membership_id,
      label: membership_id === viewer.membershipId ? "ฉัน" : `สมาชิก ${membership_id.slice(0, 8)}`
    }));
  }
  const counts = scope === "dashboard" ? await exactCounts(client, viewer) : undefined;
  if (scope === "dashboard" && !counts) return readFailure();

  return { ok: true, data: {
    viewer, standards, evidence: evidenceRows, audit: auditRows, approvers,
    ...(counts ? { counts } : {})
  } };
}
