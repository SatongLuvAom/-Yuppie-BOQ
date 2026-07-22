import Link from "next/link";
import type { ReactNode } from "react";
import type {
  StandardKind,
  StandardReadModel,
  StandardsDisplayStatus,
  StandardsReadResult,
  StandardsWorkspaceReadModel,
  StandardVersionReadModel
} from "@yuppie/domain";

import {
  AdvancedSection,
  DetailTabs,
  EmptyState,
  ErrorState,
  MetricSummary,
  PageHeader,
  StandardsShell,
  StatusBadge,
  StatusBanner,
  Surface,
  TableFrame
} from "../../components/standards";
import {
  canApproveStandards,
  canApproveVersion,
  canEditStandards,
  canRetireVersion,
  dashboardCounts
} from "../../server/standards/read-model";
import {
  formatThaiDate,
  shortMembership,
  standardKindLabels,
  standardKindRoutes,
  statusLabels,
  statusTones,
  versionBanner
} from "./presentation";
import {
  CreateStandardForm,
  EvidenceForm,
  LifecycleActions,
  VersionForm
} from "./mutation-forms";

export interface StandardsSearchParams {
  readonly q?: string;
  readonly category?: string;
  readonly status?: StandardsDisplayStatus;
  readonly tab?: "details" | "evidence" | "versions" | "activity";
  readonly version?: string;
}

const statusOptions: readonly StandardsDisplayStatus[] = [
  "draft", "review", "approved", "rejected", "retired"
];

const categoryOptions: Readonly<Record<StandardKind, readonly string[]>> = {
  material: ["งานไม้", "งานเหล็ก", "งานสี", "งานพิมพ์และกราฟิก", "งานไฟฟ้า", "อะคริลิคและพลาสติก", "ผ้าและวัสดุตกแต่ง", "ฮาร์ดแวร์", "อื่น ๆ"],
  labor: [],
  work_method: ["ผนังและ Backdrop", "พื้นและ Stage", "Counter", "Display", "Lightbox", "Signage", "งานโครงสร้างเหล็ก", "งานไฟฟ้าและแสงสว่าง"]
};

function Workspace({ model, path, children }: {
  readonly model: StandardsWorkspaceReadModel;
  readonly path: string;
  readonly children: ReactNode;
}) {
  return <StandardsShell currentPath={path} organizationName={model.viewer.organizationName}>{children}</StandardsShell>;
}

export function StandardsReadError({ result, path }: {
  readonly result: Extract<StandardsReadResult<unknown>, { readonly ok: false }>;
  readonly path: string;
}) {
  return (
    <StandardsShell currentPath={path}>
      <ErrorState title="เปิดพื้นที่มาตรฐานไม่ได้" description={result.error.message} action={<Link className="button button--primary" href={path}>ลองอีกครั้ง</Link>} />
    </StandardsShell>
  );
}

function StandardStatus({ version }: { readonly version?: StandardVersionReadModel }) {
  return version
    ? <StatusBadge label={statusLabels[version.displayStatus]} tone={statusTones[version.displayStatus]} />
    : <StatusBadge label="ยังไม่มี Version" tone="neutral" />;
}

function StandardTable({ standards }: { readonly standards: readonly StandardReadModel[] }) {
  if (standards.length === 0) {
    return <EmptyState title="ยังไม่มีรายการ" description="เมื่อสร้างข้อมูลหลัก รายการจะแสดงที่นี่โดยไม่มีข้อมูลตัวอย่างปะปน" />;
  }
  return (
    <TableFrame label="รายการมาตรฐาน">
      <table className="data-table">
        <thead><tr><th>รหัสและชื่อ</th><th>หมวด / ขอบเขต</th><th>Version ล่าสุด</th><th>สถานะ</th><th>แก้ไขล่าสุด</th><th /></tr></thead>
        <tbody>
          {standards.map((standard) => (
            <tr key={standard.id}>
              <td><span className="data-table__primary">{standard.name}</span><span className="data-table__secondary">{standard.code}</span></td>
              <td>{standard.classification ?? standard.category ?? standard.intendedScope ?? "—"}</td>
              <td>{standard.latestVersion ? `V${standard.latestVersion.versionNumber}` : "—"}</td>
              <td><StandardStatus version={standard.latestVersion} /></td>
              <td>{formatThaiDate(standard.latestVersion?.lastEditedAt ?? standard.updatedAt)}</td>
              <td><Link className="button button--quiet" href={`/standards/${standardKindRoutes[standard.kind]}/${standard.id}`}>เปิดรายละเอียด</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableFrame>
  );
}

export function StandardsDashboardView({ model }: { readonly model: StandardsWorkspaceReadModel }) {
  const counts = dashboardCounts(model);
  const recent = model.standards.slice(0, 8);
  const canEdit = canEditStandards(model.viewer.roles);
  return (
    <Workspace model={model} path="/standards">
      <PageHeader eyebrow="Standards workspace" title="หน้าหลักมาตรฐาน" description="ภาพรวมข้อมูลมาตรฐานที่ทีมผลิตบูธใช้จัดทำ ตรวจสอบ และอนุมัติ" actions={<Link className="button button--primary" href="/standards/review">ดูรายการรอตรวจสอบ</Link>} />
      <MetricSummary items={[
        { label: "วัสดุทั้งหมด", value: counts.material }, { label: "ค่าแรงทั้งหมด", value: counts.labor },
        { label: "วิธีผลิตทั้งหมด", value: counts.workMethod }, { label: "ฉบับร่าง", value: counts.draft },
        { label: "รอตรวจสอบ", value: counts.review }, { label: "อนุมัติแล้ว", value: counts.approved },
        { label: "ยกเลิกใช้งาน", value: counts.retired }, { label: "งานที่รอคุณตรวจ", value: counts.assignedReview }
      ]} />
      {canEdit ? <Surface title="ปุ่มลัด" description="เริ่มจากข้อมูลหลัก แล้วเพิ่ม Version และหลักฐานในหน้ารายละเอียด"><div className="button-group"><Link className="button button--secondary" href="/standards/materials#new">เพิ่มวัสดุ</Link><Link className="button button--secondary" href="/standards/labor#new">เพิ่มค่าแรง</Link><Link className="button button--secondary" href="/standards/work-methods#new">เพิ่มวิธีผลิต</Link></div></Surface> : null}
      <Surface title="รายการล่าสุด" description="เรียงตามวันที่แก้ไขข้อมูลหลักล่าสุด"><StandardTable standards={recent} /></Surface>
    </Workspace>
  );
}

export function StandardsListView({ model, kind, params }: {
  readonly model: StandardsWorkspaceReadModel;
  readonly kind: StandardKind;
  readonly params: StandardsSearchParams;
}) {
  const path = `/standards/${standardKindRoutes[kind]}`;
  const canEdit = canEditStandards(model.viewer.roles);
  return (
    <Workspace model={model} path={path}>
      <PageHeader eyebrow="รายการมาตรฐาน" title={standardKindLabels[kind]} description={kind === "work_method" ? "วิธีทำงานสำหรับผนัง พื้น Counter, Display, Lightbox, Signage, โครงสร้างและงานไฟ" : `ค้นหา กรอง และจัดการ Workflow ของ${standardKindLabels[kind]}`} actions={canEdit ? <a className="button button--primary" href="#new">เพิ่มรายการ</a> : undefined} />
      <Surface title="ค้นหาและกรอง">
        <form method="get" className="form-grid">
          <div className="form-field"><label htmlFor="q">ค้นหาชื่อหรือรหัส</label><input id="q" name="q" defaultValue={params.q} /></div>
          <div className="form-field"><label htmlFor="status">สถานะ</label><select id="status" name="status" defaultValue={params.status ?? ""}><option value="">ทุกสถานะ</option>{statusOptions.map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}</select></div>
          {kind === "labor" ? <div className="form-field"><label htmlFor="category">ประเภทช่าง</label><input id="category" name="category" defaultValue={params.category} placeholder="เช่น ช่างไม้" /></div> : categoryOptions[kind].length > 0 ? <div className="form-field"><label htmlFor="category">หมวด / ขอบเขต</label><select id="category" name="category" defaultValue={params.category ?? ""}><option value="">ทั้งหมด</option>{categoryOptions[kind].map((category) => <option key={category}>{category}</option>)}</select></div> : null}
          <div className="button-group"><button className="button button--secondary" type="submit">ค้นหา</button><Link className="button button--quiet" href={path}>ล้างตัวกรอง</Link></div>
        </form>
      </Surface>
      <Surface title={`${standardKindLabels[kind]} ${model.standards.length} รายการ`}><StandardTable standards={model.standards} /></Surface>
      {canEdit ? <div id="new"><AdvancedSection summary={`เพิ่ม${standardKindLabels[kind]}`}><CreateStandardForm organizationId={model.viewer.organizationId} kind={kind} /></AdvancedSection></div> : null}
    </Workspace>
  );
}

export function StandardsReviewView({ model }: { readonly model: StandardsWorkspaceReadModel }) {
  const rows = model.standards.flatMap((standard) => standard.versions.map((version) => ({ standard, version })))
    .filter(({ version }) => canApproveVersion(model.viewer, version).allowed);
  return (
    <Workspace model={model} path="/standards/review">
      <PageHeader eyebrow="Approval queue" title="รอตรวจสอบ" description="แสดงเฉพาะรายการที่มอบหมายให้คุณและดำเนินการได้" />
      {!canApproveStandards(model.viewer.roles) ? <ErrorState title="ไม่มีสิทธิ์ตรวจสอบ" description="บัญชีนี้ดูข้อมูลมาตรฐานได้ แต่ไม่ได้รับบทบาทผู้อนุมัติ" /> : rows.length === 0 ? <EmptyState title="ไม่มีงานที่รอตรวจ" description="รายการจะปรากฏเมื่อ Editor ส่ง Version ให้คุณตรวจสอบ" /> : (
        <Surface title={`${rows.length} รายการที่ดำเนินการได้`}><TableFrame label="รายการรอตรวจสอบ"><table className="data-table"><thead><tr><th>ประเภท</th><th>ชื่อ</th><th>Version</th><th>ผู้สร้าง / ผู้แก้ล่าสุด</th><th>หลักฐาน</th><th>วันที่ส่งตรวจ</th><th>สรุปการเปลี่ยนแปลง</th><th /></tr></thead><tbody>{rows.map(({ standard, version }) => <tr key={version.id}><td>{standardKindLabels[standard.kind]}</td><td><span className="data-table__primary">{standard.name}</span><span className="data-table__secondary">{standard.code}</span></td><td>V{version.versionNumber}</td><td>{shortMembership(version.createdByMembershipId)}<br /><span className="data-table__secondary">แก้ล่าสุด: {shortMembership(version.lastEditedByMembershipId)}</span></td><td>{model.evidence.filter(({ standardVersionId }) => standardVersionId === version.id).length} รายการ</td><td>{formatThaiDate(version.submittedAt)}</td><td>แก้ไขล่าสุด {formatThaiDate(version.lastEditedAt)}</td><td><Link className="button button--primary" href={`/standards/${standardKindRoutes[standard.kind]}/${standard.id}?version=${version.id}`}>เปิดตรวจสอบ</Link></td></tr>)}</tbody></table></TableFrame></Surface>
      )}
    </Workspace>
  );
}

export function StandardsEvidenceView({ model }: { readonly model: StandardsWorkspaceReadModel }) {
  const byId = new Map(model.standards.map((standard) => [standard.id, standard]));
  return (
    <Workspace model={model} path="/standards/evidence">
      <PageHeader eyebrow="Evidence register" title="หลักฐานอ้างอิง" description="หลักฐานที่ผูกกับ Version ของมาตรฐานและเก็บประวัติไว้ทั้งหมด" />
      <Surface title={`${model.evidence.length} รายการ`}>
        {model.evidence.length === 0 ? <EmptyState title="ยังไม่มีหลักฐาน" description="แนบหลักฐานจากหน้ารายละเอียดของ Version ฉบับร่าง" /> : <TableFrame label="หลักฐานอ้างอิง"><table className="data-table"><thead><tr><th>ชื่อหลักฐาน</th><th>มาตรฐาน</th><th>Version</th><th>แหล่งข้อมูล</th><th>วันที่เก็บ</th></tr></thead><tbody>{model.evidence.map((item) => { const standard = byId.get(item.standardId); return <tr key={item.id}><td>{item.sourceUri ? <a href={item.sourceUri} rel="noreferrer" target="_blank">{item.title}</a> : item.title}</td><td>{standard ? <Link href={`/standards/${standardKindRoutes[standard.kind]}/${standard.id}?tab=evidence`}>{standard.name}</Link> : standardKindLabels[item.kind]}</td><td>V{item.versionNumber}</td><td>{item.source}</td><td>{formatThaiDate(item.capturedAt)}</td></tr>; })}</tbody></table></TableFrame>}
      </Surface>
    </Workspace>
  );
}

const auditLabels: Readonly<Record<string, string>> = {
  standard_created: "สร้างข้อมูลหลัก", standard_edited: "แก้ไขข้อมูลหลัก",
  version_created: "สร้าง Version", version_edited: "แก้ไขฉบับร่าง",
  evidence_added: "แนบหลักฐาน", submitted_for_review: "ส่งตรวจสอบ",
  changes_requested: "ปฏิเสธและขอแก้ไข", version_approved: "อนุมัติ Version",
  version_retired: "ยกเลิกใช้งาน"
};

export function StandardsAuditView({ model }: { readonly model: StandardsWorkspaceReadModel }) {
  return (
    <Workspace model={model} path="/standards/activity">
      <PageHeader eyebrow="Audit trail" title="ประวัติการดำเนินการ" description="เหตุการณ์ที่ระบบบันทึกภายใต้สิทธิ์ขององค์กรนี้" />
      <Surface title={`${model.audit.length} เหตุการณ์`}>
        {model.audit.length === 0 ? <EmptyState title="ยังไม่มีประวัติ" description="กิจกรรมที่เกิดจาก Mutation จะปรากฏที่นี่" /> : <TableFrame label="ประวัติการดำเนินการ"><table className="data-table"><thead><tr><th>การดำเนินการ</th><th>ผู้ดำเนินการ</th><th>ผลลัพธ์</th><th>วันเวลา</th></tr></thead><tbody>{model.audit.map((item) => <tr key={item.id}><td>{auditLabels[item.action] ?? item.action}</td><td>{shortMembership(item.actorMembershipId)}</td><td>{item.outcome === "succeeded" ? "สำเร็จ" : "ถูกปฏิเสธ"}</td><td>{formatThaiDate(item.occurredAt)}</td></tr>)}</tbody></table></TableFrame>}
      </Surface>
    </Workspace>
  );
}

function DetailValues({ standard, version }: { readonly standard: StandardReadModel; readonly version?: StandardVersionReadModel }) {
  return (
    <div className="compact-list">
      {[{ label: "ชื่อ", value: standard.name }, { label: "รหัส", value: standard.code },
        { label: "ประเภท", value: standardKindLabels[standard.kind] },
        { label: "Version", value: version ? `V${version.versionNumber}` : "—" },
        { label: "สถานะ", value: version ? statusLabels[version.displayStatus] : "ยังไม่มี Version" },
        { label: "วันที่มีผล", value: formatThaiDate(version?.effectiveDate) },
        { label: "แหล่งข้อมูล", value: version?.source ?? "—" },
        ...(standard.kind !== "work_method" ? [{ label: standard.kind === "labor" ? "หน่วยค่าแรง" : "หน่วยวัสดุ", value: version?.unit ?? "—" }] : []),
        ...(standard.kind === "material" ? [{ label: "ข้อกำหนด", value: version?.specification ?? "—" }, { label: "ขอบเขตการใช้", value: version?.applicability ?? "—" }] : []),
        ...(standard.kind === "labor" ? [{ label: "หลักการตีความ", value: version?.interpretationBasis ?? "—" }, { label: "ขอบเขตการใช้", value: version?.applicability ?? "—" }] : []),
        ...(standard.kind === "work_method" ? [{ label: "รายละเอียดวิธีผลิต", value: version?.methodDescription ?? "—" }, { label: "เงื่อนไข", value: version?.conditions ?? "—" }] : [])
      ].map((item) => <div className="compact-list__item" key={item.label}><span className="compact-list__label">{item.label}</span><strong className="compact-list__value">{item.value}</strong></div>)}
    </div>
  );
}

export function StandardDetailView({ model, standard, params }: {
  readonly model: StandardsWorkspaceReadModel;
  readonly standard: StandardReadModel;
  readonly params: StandardsSearchParams;
}) {
  const base = `/standards/${standardKindRoutes[standard.kind]}/${standard.id}`;
  const version = standard.versions.find(({ id }) => id === params.version) ?? standard.latestVersion;
  const tab = params.tab ?? "details";
  const canEdit = canEditStandards(model.viewer.roles);
  const permission = version
    ? version.status === "approved" ? canRetireVersion(model.viewer, version) : canApproveVersion(model.viewer, version)
    : { allowed: false, reason: "ยังไม่มี Version" };
  const banner = version ? versionBanner(version) : undefined;
  const versionEvidence = model.evidence.filter(({ standardVersionId }) => standardVersionId === version?.id);
  const versionAudit = model.audit.filter(({ standardVersionId, subjectId }) => standardVersionId === version?.id || subjectId === standard.id);
  return (
    <Workspace model={model} path={`/standards/${standardKindRoutes[standard.kind]}`}>
      <PageHeader eyebrow={standardKindLabels[standard.kind]} title={standard.name} description={`${standard.code} · ${standard.classification ?? standard.category ?? standard.intendedScope ?? "ไม่ระบุหมวด"}`} actions={<Link className="button button--quiet" href={`/standards/${standardKindRoutes[standard.kind]}`}>กลับหน้ารายการ</Link>} />
      {banner ? <StatusBanner title={banner.title} description={banner.description} tone={banner.tone} /> : null}
      <DetailTabs items={[
        { href: `${base}?tab=details${version ? `&version=${version.id}` : ""}`, label: "รายละเอียด", current: tab === "details" },
        { href: `${base}?tab=evidence${version ? `&version=${version.id}` : ""}`, label: "หลักฐาน", current: tab === "evidence" },
        { href: `${base}?tab=versions${version ? `&version=${version.id}` : ""}`, label: "ประวัติ Version", current: tab === "versions" },
        { href: `${base}?tab=activity${version ? `&version=${version.id}` : ""}`, label: "ประวัติการดำเนินการ", current: tab === "activity" }
      ]} />
      {tab === "details" ? <><Surface title="ข้อมูล Version"><DetailValues standard={standard} version={version} /></Surface>{canEdit && version?.status === "draft" ? <VersionForm organizationId={model.viewer.organizationId} standard={standard} version={version} /> : canEdit && (!version || version.status === "approved" || version.status === "retired") ? <VersionForm organizationId={model.viewer.organizationId} standard={standard} /> : null}</> : null}
      {tab === "evidence" ? <Surface title="หลักฐานอ้างอิง">{versionEvidence.length === 0 ? <EmptyState title="Version นี้ยังไม่มีหลักฐาน" description="Editor สามารถแนบหลักฐานได้ขณะเป็นฉบับร่าง" /> : <div className="compact-list">{versionEvidence.map((item) => <div className="compact-list__item" key={item.id}><div><span className="compact-list__label">{item.source}</span><strong className="compact-list__value">{item.title}</strong><span className="compact-list__meta">เก็บเมื่อ {formatThaiDate(item.capturedAt)}</span></div>{item.sourceUri ? <a className="button button--quiet" href={item.sourceUri} target="_blank" rel="noreferrer">เปิดแหล่งอ้างอิง</a> : null}</div>)}</div>}{canEdit && version?.status === "draft" ? <EvidenceForm organizationId={model.viewer.organizationId} standardVersionId={version.id} /> : null}</Surface> : null}
      {tab === "versions" ? <Surface title="ประวัติ Version">{standard.versions.length === 0 ? <EmptyState title="ยังไม่มี Version" description="สร้าง Version แรกเพื่อเริ่ม Workflow" /> : <TableFrame label="ประวัติ Version"><table className="data-table"><thead><tr><th>Version</th><th>สถานะ</th><th>แหล่งข้อมูล</th><th>ผู้แก้ล่าสุด</th><th>วันที่แก้</th><th /></tr></thead><tbody>{standard.versions.map((item) => <tr key={item.id}><td>V{item.versionNumber}</td><td><StandardStatus version={item} /></td><td>{item.source}</td><td>{shortMembership(item.lastEditedByMembershipId)}</td><td>{formatThaiDate(item.lastEditedAt)}</td><td><Link className="button button--quiet" href={`${base}?tab=details&version=${item.id}`}>ดู Version</Link></td></tr>)}</tbody></table></TableFrame>}</Surface> : null}
      {tab === "activity" ? <Surface title="ประวัติการดำเนินการ">{versionAudit.length === 0 ? <EmptyState title="ยังไม่มีประวัติ" description="เหตุการณ์ของมาตรฐานนี้จะแสดงที่นี่" /> : <div className="compact-list">{versionAudit.map((item) => <div className="compact-list__item" key={item.id}><div><span className="compact-list__label">{formatThaiDate(item.occurredAt)}</span><strong className="compact-list__value">{auditLabels[item.action] ?? item.action}</strong><span className="compact-list__meta">{shortMembership(item.actorMembershipId)}</span></div></div>)}</div>}</Surface> : null}
      {version ? <Surface title="การดำเนินการ" description="Server Action และ RLS ตรวจสิทธิ์และกฎ Lifecycle ซ้ำทุกครั้ง"><LifecycleActions organizationId={model.viewer.organizationId} version={version} approvers={model.approvers} canEdit={canEdit} decisionPermission={permission} /></Surface> : null}
    </Workspace>
  );
}
