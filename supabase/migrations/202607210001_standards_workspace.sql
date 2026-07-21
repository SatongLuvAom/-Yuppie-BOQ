-- Phase 1B: Standards Workspace only.
-- Forward-only migration. Auth identities and RLS policies are intentionally deferred.

create type standard_lifecycle_status as enum (
  'draft',
  'review',
  'approved',
  'retired'
);

create type standard_kind as enum (
  'material',
  'labor',
  'work_method'
);

create type membership_role as enum (
  'organization_admin',
  'standards_editor',
  'standards_approver',
  'estimator',
  'auditor'
);

create type approval_decision as enum (
  'approved',
  'changes_requested',
  'retired'
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete restrict,
  user_id uuid not null,
  joined_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, user_id),
  check (ended_at is null or ended_at >= joined_at)
);

create table organization_membership_roles (
  organization_id uuid not null,
  membership_id uuid not null,
  role membership_role not null,
  granted_by_membership_id uuid,
  granted_at timestamptz not null default now(),
  primary key (organization_id, membership_id, role),
  foreign key (organization_id, membership_id)
    references organization_memberships (organization_id, id) on delete restrict,
  foreign key (organization_id, granted_by_membership_id)
    references organization_memberships (organization_id, id) on delete restrict
);

create table standards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete restrict,
  kind standard_kind not null,
  code text not null check (btrim(code) <> ''),
  name text not null check (btrim(name) <> ''),
  created_by_membership_id uuid not null,
  updated_by_membership_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, id, kind),
  unique (organization_id, kind, code),
  foreign key (organization_id, created_by_membership_id)
    references organization_memberships (organization_id, id) on delete restrict,
  foreign key (organization_id, updated_by_membership_id)
    references organization_memberships (organization_id, id) on delete restrict
);

create table materials (
  id uuid primary key,
  organization_id uuid not null,
  kind standard_kind not null default 'material' check (kind = 'material'),
  classification text not null check (btrim(classification) <> ''),
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, id, kind)
    references standards (organization_id, id, kind) on delete restrict
);

create table labor_standards (
  id uuid primary key,
  organization_id uuid not null,
  kind standard_kind not null default 'labor' check (kind = 'labor'),
  labor_category text not null check (btrim(labor_category) <> ''),
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, id, kind)
    references standards (organization_id, id, kind) on delete restrict
);

create table work_methods (
  id uuid primary key,
  organization_id uuid not null,
  kind standard_kind not null default 'work_method' check (kind = 'work_method'),
  intended_scope text not null check (btrim(intended_scope) <> ''),
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, id, kind)
    references standards (organization_id, id, kind) on delete restrict
);

create table standard_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  standard_id uuid not null,
  standard_kind standard_kind not null,
  version_number integer not null check (version_number > 0),
  status standard_lifecycle_status not null default 'draft',
  source text not null check (btrim(source) <> ''),
  created_by_membership_id uuid not null,
  created_at timestamptz not null default now(),
  last_edited_by_membership_id uuid not null,
  last_edited_at timestamptz not null default now(),
  submitted_by_membership_id uuid,
  submitted_at timestamptz,
  reviewer_membership_id uuid,
  reviewed_at timestamptz,
  approved_by_membership_id uuid,
  approved_at timestamptz,
  effective_date date,
  returned_to_draft_by_membership_id uuid,
  returned_to_draft_at timestamptz,
  return_reason text,
  retired_by_membership_id uuid,
  retired_at timestamptz,
  retirement_reason text,
  unique (organization_id, id),
  unique (organization_id, id, standard_kind, standard_id, version_number),
  unique (organization_id, standard_id, version_number),
  foreign key (organization_id, standard_id, standard_kind)
    references standards (organization_id, id, kind) on delete restrict,
  foreign key (organization_id, created_by_membership_id)
    references organization_memberships (organization_id, id) on delete restrict,
  foreign key (organization_id, last_edited_by_membership_id)
    references organization_memberships (organization_id, id) on delete restrict,
  foreign key (organization_id, submitted_by_membership_id)
    references organization_memberships (organization_id, id) on delete restrict,
  foreign key (organization_id, reviewer_membership_id)
    references organization_memberships (organization_id, id) on delete restrict,
  foreign key (organization_id, approved_by_membership_id)
    references organization_memberships (organization_id, id) on delete restrict,
  foreign key (organization_id, returned_to_draft_by_membership_id)
    references organization_memberships (organization_id, id) on delete restrict,
  foreign key (organization_id, retired_by_membership_id)
    references organization_memberships (organization_id, id) on delete restrict,
  check ((submitted_by_membership_id is null) = (submitted_at is null)),
  check ((reviewer_membership_id is null) = (reviewed_at is null)),
  check (
    reviewer_membership_id is null
    or reviewer_membership_id <> created_by_membership_id
  ),
  check ((approved_by_membership_id is null) = (approved_at is null)),
  check ((returned_to_draft_by_membership_id is null) = (returned_to_draft_at is null)),
  check ((retired_by_membership_id is null) = (retired_at is null)),
  check (
    (returned_to_draft_by_membership_id is null and return_reason is null)
    or (returned_to_draft_by_membership_id is not null
      and return_reason is not null
      and btrim(return_reason) <> '')
  ),
  check (
    (status = 'draft'
      and submitted_by_membership_id is null
      and reviewer_membership_id is null
      and approved_by_membership_id is null
      and effective_date is null
      and retired_by_membership_id is null
      and retirement_reason is null)
    or (status = 'review'
      and submitted_by_membership_id is not null
      and reviewer_membership_id is not null
      and approved_by_membership_id is null
      and returned_to_draft_by_membership_id is null
      and retired_by_membership_id is null
      and retirement_reason is null)
    or (status = 'approved'
      and submitted_by_membership_id is not null
      and reviewer_membership_id is not null
      and approved_by_membership_id is not null
      and effective_date is not null
      and returned_to_draft_by_membership_id is null
      and retired_by_membership_id is null
      and retirement_reason is null)
    or (status = 'retired'
      and submitted_by_membership_id is not null
      and reviewer_membership_id is not null
      and approved_by_membership_id is not null
      and effective_date is not null
      and returned_to_draft_by_membership_id is null
      and retired_by_membership_id is not null
      and btrim(retirement_reason) <> '')
  )
);

create unique index standard_versions_one_draft
  on standard_versions (organization_id, standard_id)
  where status = 'draft';

create unique index standard_versions_one_review
  on standard_versions (organization_id, standard_id)
  where status = 'review';

create unique index standard_versions_one_approved
  on standard_versions (organization_id, standard_id)
  where status = 'approved';

create table standard_version_editors (
  organization_id uuid not null,
  standard_version_id uuid not null,
  editor_membership_id uuid not null,
  first_edited_at timestamptz not null,
  primary key (organization_id, standard_version_id, editor_membership_id),
  foreign key (organization_id, standard_version_id)
    references standard_versions (organization_id, id) on delete restrict,
  foreign key (organization_id, editor_membership_id)
    references organization_memberships (organization_id, id) on delete restrict
);

create table material_versions (
  id uuid primary key,
  organization_id uuid not null,
  standard_id uuid not null,
  standard_kind standard_kind not null default 'material' check (standard_kind = 'material'),
  version_number integer not null,
  unit text not null check (btrim(unit) <> ''),
  specification text not null check (btrim(specification) <> ''),
  applicability text not null check (btrim(applicability) <> ''),
  last_edited_by_membership_id uuid not null,
  last_edited_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, id, standard_kind, standard_id, version_number)
    references standard_versions (organization_id, id, standard_kind, standard_id, version_number)
    on delete restrict,
  foreign key (organization_id, last_edited_by_membership_id)
    references organization_memberships (organization_id, id) on delete restrict
);

create table labor_versions (
  id uuid primary key,
  organization_id uuid not null,
  standard_id uuid not null,
  standard_kind standard_kind not null default 'labor' check (standard_kind = 'labor'),
  version_number integer not null,
  unit text not null check (btrim(unit) <> ''),
  interpretation_basis text not null check (btrim(interpretation_basis) <> ''),
  applicability text not null check (btrim(applicability) <> ''),
  last_edited_by_membership_id uuid not null,
  last_edited_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, id, standard_kind, standard_id, version_number)
    references standard_versions (organization_id, id, standard_kind, standard_id, version_number)
    on delete restrict,
  foreign key (organization_id, last_edited_by_membership_id)
    references organization_memberships (organization_id, id) on delete restrict
);

create table work_method_versions (
  id uuid primary key,
  organization_id uuid not null,
  standard_id uuid not null,
  standard_kind standard_kind not null default 'work_method' check (standard_kind = 'work_method'),
  version_number integer not null,
  method_description text not null check (btrim(method_description) <> ''),
  conditions text not null check (btrim(conditions) <> ''),
  last_edited_by_membership_id uuid not null,
  last_edited_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, id, standard_kind, standard_id, version_number)
    references standard_versions (organization_id, id, standard_kind, standard_id, version_number)
    on delete restrict,
  foreign key (organization_id, last_edited_by_membership_id)
    references organization_memberships (organization_id, id) on delete restrict
);

create table work_method_standard_references (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  work_method_version_id uuid not null,
  referenced_standard_version_id uuid not null,
  created_by_membership_id uuid not null,
  created_at timestamptz not null default now(),
  unique (organization_id, work_method_version_id, referenced_standard_version_id),
  foreign key (organization_id, work_method_version_id)
    references work_method_versions (organization_id, id) on delete restrict,
  foreign key (organization_id, referenced_standard_version_id)
    references standard_versions (organization_id, id) on delete restrict,
  foreign key (organization_id, created_by_membership_id)
    references organization_memberships (organization_id, id) on delete restrict,
  check (work_method_version_id <> referenced_standard_version_id)
);

create table standard_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  standard_kind standard_kind not null,
  standard_id uuid not null,
  standard_version_id uuid not null,
  version_number integer not null,
  title text not null check (btrim(title) <> ''),
  source text not null check (btrim(source) <> ''),
  source_uri text,
  content_hash text,
  captured_at timestamptz not null,
  added_by_membership_id uuid not null,
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (
    organization_id,
    standard_version_id,
    standard_kind,
    standard_id,
    version_number
  ) references standard_versions (
    organization_id,
    id,
    standard_kind,
    standard_id,
    version_number
  ) on delete restrict,
  foreign key (organization_id, added_by_membership_id)
    references organization_memberships (organization_id, id) on delete restrict,
  check (content_hash is null or btrim(content_hash) <> ''),
  check (source_uri is null or btrim(source_uri) <> '')
);

create table standard_approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  standard_kind standard_kind not null,
  standard_id uuid not null,
  standard_version_id uuid not null,
  version_number integer not null,
  decision approval_decision not null,
  decided_by_membership_id uuid not null,
  decided_at timestamptz not null default now(),
  rationale text,
  effective_date date,
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (
    organization_id,
    standard_version_id,
    standard_kind,
    standard_id,
    version_number
  ) references standard_versions (
    organization_id,
    id,
    standard_kind,
    standard_id,
    version_number
  ) on delete restrict,
  foreign key (organization_id, decided_by_membership_id)
    references organization_memberships (organization_id, id) on delete restrict,
  check (
    (decision = 'approved' and effective_date is not null)
    or (decision <> 'approved' and effective_date is null)
  ),
  check (
    decision = 'approved'
    or (rationale is not null and btrim(rationale) <> '')
  )
);

create unique index standard_approvals_one_approved_decision
  on standard_approvals (organization_id, standard_version_id)
  where decision = 'approved';

create unique index standard_approvals_one_retirement_decision
  on standard_approvals (organization_id, standard_version_id)
  where decision = 'retired';

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete restrict,
  actor_membership_id uuid not null,
  action text not null check (btrim(action) <> ''),
  subject_type text not null check (btrim(subject_type) <> ''),
  subject_id uuid not null,
  standard_version_id uuid,
  outcome text not null check (btrim(outcome) <> ''),
  occurred_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb,
  foreign key (organization_id, actor_membership_id)
    references organization_memberships (organization_id, id) on delete restrict,
  foreign key (organization_id, standard_version_id)
    references standard_versions (organization_id, id) on delete restrict,
  check (jsonb_typeof(details) = 'object')
);

create or replace function has_membership_role(
  target_organization_id uuid,
  target_membership_id uuid,
  target_role membership_role
) returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from organization_memberships membership
    join organization_membership_roles membership_role
      on membership_role.organization_id = membership.organization_id
     and membership_role.membership_id = membership.id
    where membership.organization_id = target_organization_id
      and membership.id = target_membership_id
      and membership.ended_at is null
      and membership_role.role = target_role
  );
$$;

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger organizations_touch_updated_at
before update on organizations
for each row execute function touch_updated_at();

create trigger organization_memberships_touch_updated_at
before update on organization_memberships
for each row execute function touch_updated_at();

create trigger standards_touch_updated_at
before update on standards
for each row execute function touch_updated_at();

create or replace function reject_append_only_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception '% records are append-only in the MVP', tg_table_name;
end;
$$;

create trigger standard_evidence_append_only
before update or delete on standard_evidence
for each row execute function reject_append_only_mutation();

create trigger standard_approvals_append_only
before update or delete on standard_approvals
for each row execute function reject_append_only_mutation();

create trigger audit_logs_append_only
before update or delete on audit_logs
for each row execute function reject_append_only_mutation();

create or replace function guard_standard_version()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  expected_version integer;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft' then
      raise exception 'a standard version must start in draft';
    end if;

    perform 1
    from standards
    where organization_id = new.organization_id
      and id = new.standard_id
      and kind = new.standard_kind
    for update;

    select coalesce(max(version_number), 0) + 1
      into expected_version
    from standard_versions
    where organization_id = new.organization_id
      and standard_id = new.standard_id;

    if new.version_number <> expected_version then
      raise exception 'version_number must be the next sequential integer: expected %', expected_version;
    end if;

    if not has_membership_role(
      new.organization_id,
      new.created_by_membership_id,
      'standards_editor'
    ) or not has_membership_role(
      new.organization_id,
      new.last_edited_by_membership_id,
      'standards_editor'
    ) then
      raise exception 'version creator and editor require standards_editor role';
    end if;

    return new;
  end if;

  if new.organization_id is distinct from old.organization_id
    or new.id is distinct from old.id
    or new.standard_id is distinct from old.standard_id
    or new.standard_kind is distinct from old.standard_kind
    or new.version_number is distinct from old.version_number
    or new.created_by_membership_id is distinct from old.created_by_membership_id
    or new.created_at is distinct from old.created_at then
    raise exception 'standard version identity and creator are immutable';
  end if;

  if old.status <> 'draft' and (
    new.source is distinct from old.source
    or new.last_edited_by_membership_id is distinct from old.last_edited_by_membership_id
    or new.last_edited_at is distinct from old.last_edited_at
  ) then
    raise exception 'reviewed, approved, and retired version content is immutable';
  end if;

  if new.status = old.status then
    if old.status <> 'draft' and new is distinct from old then
      raise exception 'reviewed, approved, and retired versions cannot be edited';
    end if;

    if old.status = 'draft' and (
      new.source is distinct from old.source
      or new.last_edited_by_membership_id is distinct from old.last_edited_by_membership_id
      or new.last_edited_at is distinct from old.last_edited_at
    ) then
      if new.last_edited_at <= old.last_edited_at or not has_membership_role(
        new.organization_id,
        new.last_edited_by_membership_id,
        'standards_editor'
      ) then
        raise exception 'draft edits require a standards editor and a later edit time';
      end if;
    end if;

    return new;
  end if;

  if old.status = 'draft' and new.status = 'review' then
    if new.submitted_by_membership_id is null
      or new.submitted_at is null
      or new.reviewer_membership_id is null
      or new.reviewed_at is null
      or new.returned_to_draft_by_membership_id is not null
      or new.returned_to_draft_at is not null
      or new.return_reason is not null then
      raise exception 'review requires submitter, independent reviewer, and review timestamps';
    end if;

    if not has_membership_role(
      new.organization_id,
      new.submitted_by_membership_id,
      'standards_editor'
    ) then
      raise exception 'submitting a version requires standards_editor role';
    end if;

    if not has_membership_role(
      new.organization_id,
      new.reviewer_membership_id,
      'standards_approver'
    ) then
      raise exception 'reviewer requires standards_approver role';
    end if;

    if new.reviewer_membership_id = new.created_by_membership_id
      or exists (
        select 1
        from standard_version_editors editor
        where editor.organization_id = new.organization_id
          and editor.standard_version_id = new.id
          and editor.editor_membership_id = new.reviewer_membership_id
      ) then
      raise exception 'creator or editor cannot review and approve the same version';
    end if;

    if not exists (
      select 1
      from standard_evidence evidence
      where evidence.organization_id = new.organization_id
        and evidence.standard_version_id = new.id
        and evidence.standard_kind = new.standard_kind
    ) then
      raise exception 'review requires evidence for the exact standard version';
    end if;

    if (new.standard_kind = 'material' and not exists (
      select 1 from material_versions detail
      where detail.organization_id = new.organization_id and detail.id = new.id
    )) or (new.standard_kind = 'labor' and not exists (
      select 1 from labor_versions detail
      where detail.organization_id = new.organization_id and detail.id = new.id
    )) or (new.standard_kind = 'work_method' and not exists (
      select 1 from work_method_versions detail
      where detail.organization_id = new.organization_id and detail.id = new.id
    )) then
      raise exception 'review requires the matching version detail record';
    end if;

    return new;
  end if;

  if old.status = 'review' and new.status = 'draft' then
    if new.returned_to_draft_by_membership_id is null
      or new.returned_to_draft_at is null
      or new.return_reason is null
      or btrim(new.return_reason) = '' then
      raise exception 'returning to draft requires actor, timestamp, and reason';
    end if;

    if new.returned_to_draft_by_membership_id <> old.submitted_by_membership_id
      and new.returned_to_draft_by_membership_id <> old.reviewer_membership_id then
      raise exception 'only the submitter or assigned reviewer may return review to draft';
    end if;

    if new.submitted_by_membership_id is not null
      or new.submitted_at is not null
      or new.reviewer_membership_id is not null
      or new.reviewed_at is not null then
      raise exception 'review assignment must be cleared when returning to draft';
    end if;

    return new;
  end if;

  if old.status = 'review' and new.status = 'approved' then
    if pg_trigger_depth() < 2 then
      raise exception 'approval must be recorded through standard_approvals';
    end if;

    if new.submitted_by_membership_id is distinct from old.submitted_by_membership_id
      or new.submitted_at is distinct from old.submitted_at
      or new.reviewer_membership_id is distinct from old.reviewer_membership_id
      or new.reviewed_at is distinct from old.reviewed_at
      or new.returned_to_draft_by_membership_id is distinct from old.returned_to_draft_by_membership_id
      or new.returned_to_draft_at is distinct from old.returned_to_draft_at
      or new.return_reason is distinct from old.return_reason
      or new.retired_by_membership_id is distinct from old.retired_by_membership_id
      or new.retired_at is distinct from old.retired_at
      or new.retirement_reason is distinct from old.retirement_reason then
      raise exception 'approval may change only approval governance fields';
    end if;
    return new;
  end if;

  if old.status = 'approved' and new.status = 'retired' then
    if pg_trigger_depth() < 2 then
      raise exception 'retirement must be recorded through standard_approvals';
    end if;

    if new.submitted_by_membership_id is distinct from old.submitted_by_membership_id
      or new.submitted_at is distinct from old.submitted_at
      or new.reviewer_membership_id is distinct from old.reviewer_membership_id
      or new.reviewed_at is distinct from old.reviewed_at
      or new.approved_by_membership_id is distinct from old.approved_by_membership_id
      or new.approved_at is distinct from old.approved_at
      or new.effective_date is distinct from old.effective_date
      or new.returned_to_draft_by_membership_id is distinct from old.returned_to_draft_by_membership_id
      or new.returned_to_draft_at is distinct from old.returned_to_draft_at
      or new.return_reason is distinct from old.return_reason then
      raise exception 'retirement may change only retirement governance fields';
    end if;
    return new;
  end if;

  raise exception 'invalid standard lifecycle transition: % -> %', old.status, new.status;
end;
$$;

create trigger standard_versions_guard
before insert or update on standard_versions
for each row execute function guard_standard_version();

create or replace function remember_standard_version_editor()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into standard_version_editors (
      organization_id,
      standard_version_id,
      editor_membership_id,
      first_edited_at
    ) values (
      new.organization_id,
      new.id,
      new.created_by_membership_id,
      new.created_at
    ) on conflict do nothing;
  end if;

  insert into standard_version_editors (
    organization_id,
    standard_version_id,
    editor_membership_id,
    first_edited_at
  ) values (
    new.organization_id,
    new.id,
    new.last_edited_by_membership_id,
    new.last_edited_at
  ) on conflict do nothing;

  return new;
end;
$$;

create trigger standard_versions_remember_editor
after insert or update of source, last_edited_by_membership_id, last_edited_at
on standard_versions
for each row execute function remember_standard_version_editor();

create or replace function guard_version_detail()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  version_status standard_lifecycle_status;
begin
  if tg_op = 'DELETE' then
    raise exception 'version detail records cannot be deleted';
  end if;

  select status into version_status
  from standard_versions
  where organization_id = new.organization_id
    and id = new.id;

  if version_status is distinct from 'draft' then
    raise exception 'version details are editable only while draft';
  end if;

  if not has_membership_role(
    new.organization_id,
    new.last_edited_by_membership_id,
    'standards_editor'
  ) then
    raise exception 'version detail edits require standards_editor role';
  end if;

  if tg_op = 'UPDATE' then
    if new.organization_id is distinct from old.organization_id
      or new.id is distinct from old.id
      or new.standard_id is distinct from old.standard_id
      or new.standard_kind is distinct from old.standard_kind
      or new.version_number is distinct from old.version_number then
      raise exception 'version detail identity is immutable';
    end if;

    if new.last_edited_at <= old.last_edited_at then
      raise exception 'version detail update requires a later edit time';
    end if;
  end if;

  return new;
end;
$$;

create or replace function sync_version_detail_editor()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update standard_versions
  set last_edited_by_membership_id = new.last_edited_by_membership_id,
      last_edited_at = new.last_edited_at
  where organization_id = new.organization_id
    and id = new.id;
  return new;
end;
$$;

create trigger material_versions_guard
before insert or update or delete on material_versions
for each row execute function guard_version_detail();

create trigger labor_versions_guard
before insert or update or delete on labor_versions
for each row execute function guard_version_detail();

create trigger work_method_versions_guard
before insert or update or delete on work_method_versions
for each row execute function guard_version_detail();

create trigger material_versions_sync_editor
after insert or update on material_versions
for each row execute function sync_version_detail_editor();

create trigger labor_versions_sync_editor
after insert or update on labor_versions
for each row execute function sync_version_detail_editor();

create trigger work_method_versions_sync_editor
after insert or update on work_method_versions
for each row execute function sync_version_detail_editor();

create or replace function guard_work_method_standard_reference()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  source_row work_method_standard_references%rowtype;
  version_status standard_lifecycle_status;
begin
  if tg_op = 'DELETE' then
    source_row := old;
  else
    source_row := new;
  end if;

  select status into version_status
  from standard_versions
  where organization_id = source_row.organization_id
    and id = source_row.work_method_version_id;

  if version_status is distinct from 'draft' then
    raise exception 'work method references are editable only while draft';
  end if;

  if tg_op = 'UPDATE' then
    raise exception 'replace a draft work method reference instead of editing it';
  end if;

  if tg_op = 'INSERT' and not has_membership_role(
    new.organization_id,
    new.created_by_membership_id,
    'standards_editor'
  ) then
    raise exception 'adding a work method reference requires standards_editor role';
  end if;

  return source_row;
end;
$$;

create trigger work_method_standard_references_guard
before insert or update or delete on work_method_standard_references
for each row execute function guard_work_method_standard_reference();

create or replace function guard_evidence_insert()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  version_status standard_lifecycle_status;
begin
  select status into version_status
  from standard_versions
  where organization_id = new.organization_id
    and id = new.standard_version_id;

  if version_status is distinct from 'draft' then
    raise exception 'evidence can be attached only while the version is draft';
  end if;

  if not has_membership_role(
    new.organization_id,
    new.added_by_membership_id,
    'standards_editor'
  ) then
    raise exception 'attaching evidence requires standards_editor role';
  end if;

  return new;
end;
$$;

create trigger standard_evidence_guard_insert
before insert on standard_evidence
for each row execute function guard_evidence_insert();

create or replace function apply_standard_approval()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_version standard_versions%rowtype;
begin
  select * into target_version
  from standard_versions
  where organization_id = new.organization_id
    and id = new.standard_version_id
    and standard_id = new.standard_id
    and standard_kind = new.standard_kind
    and version_number = new.version_number
  for update;

  if not found then
    raise exception 'approval target does not match an exact standard version';
  end if;

  if not has_membership_role(
    new.organization_id,
    new.decided_by_membership_id,
    'standards_approver'
  ) then
    raise exception 'approval decisions require standards_approver role';
  end if;

  if new.decision in ('approved', 'changes_requested')
    and new.decided_by_membership_id <> target_version.reviewer_membership_id then
    raise exception 'the assigned independent reviewer must decide the review';
  end if;

  if new.decision = 'approved' and (
    new.decided_by_membership_id = target_version.created_by_membership_id
    or exists (
      select 1
      from standard_version_editors editor
      where editor.organization_id = new.organization_id
        and editor.standard_version_id = new.standard_version_id
        and editor.editor_membership_id = new.decided_by_membership_id
    )
  ) then
    raise exception 'creator or editor cannot approve the same version';
  end if;

  if new.decision = 'approved' then
    if target_version.status <> 'review' then
      raise exception 'only a review version can be approved';
    end if;

    update standard_versions
    set status = 'approved',
        approved_by_membership_id = new.decided_by_membership_id,
        approved_at = new.decided_at,
        effective_date = new.effective_date
    where organization_id = new.organization_id
      and id = new.standard_version_id;
  elsif new.decision = 'changes_requested' then
    if target_version.status <> 'review' then
      raise exception 'changes can be requested only for a review version';
    end if;

    update standard_versions
    set status = 'draft',
        submitted_by_membership_id = null,
        submitted_at = null,
        reviewer_membership_id = null,
        reviewed_at = null,
        returned_to_draft_by_membership_id = new.decided_by_membership_id,
        returned_to_draft_at = new.decided_at,
        return_reason = new.rationale
    where organization_id = new.organization_id
      and id = new.standard_version_id;
  elsif new.decision = 'retired' then
    if target_version.status <> 'approved' then
      raise exception 'only an approved version can be retired';
    end if;

    update standard_versions
    set status = 'retired',
        retired_by_membership_id = new.decided_by_membership_id,
        retired_at = new.decided_at,
        retirement_reason = new.rationale
    where organization_id = new.organization_id
      and id = new.standard_version_id;
  end if;

  insert into audit_logs (
    organization_id,
    actor_membership_id,
    action,
    subject_type,
    subject_id,
    standard_version_id,
    outcome,
    occurred_at,
    details
  ) values (
    new.organization_id,
    new.decided_by_membership_id,
    case new.decision
      when 'approved' then 'version_approved'
      when 'changes_requested' then 'changes_requested'
      when 'retired' then 'version_retired'
    end,
    new.standard_kind::text,
    new.standard_id,
    new.standard_version_id,
    'succeeded',
    new.decided_at,
    jsonb_build_object('decision', new.decision::text)
  );

  return new;
end;
$$;

create trigger standard_approvals_apply
before insert on standard_approvals
for each row execute function apply_standard_approval();

create or replace function guard_standard_version_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'standard versions cannot be deleted';
end;
$$;

create trigger standard_versions_no_delete
before delete on standard_versions
for each row execute function guard_standard_version_delete();

create index organization_membership_roles_granted_by_idx
  on organization_membership_roles (organization_id, granted_by_membership_id)
  where granted_by_membership_id is not null;

create index standards_created_by_idx
  on standards (organization_id, created_by_membership_id);

create index standards_updated_by_idx
  on standards (organization_id, updated_by_membership_id);

create index standard_versions_last_editor_idx
  on standard_versions (organization_id, last_edited_by_membership_id);

create index standard_versions_standard_kind_idx
  on standard_versions (organization_id, standard_id, standard_kind);

create index standard_versions_creator_idx
  on standard_versions (organization_id, created_by_membership_id);

create index standard_versions_submitter_idx
  on standard_versions (organization_id, submitted_by_membership_id)
  where submitted_by_membership_id is not null;

create index standard_versions_reviewer_idx
  on standard_versions (organization_id, reviewer_membership_id)
  where reviewer_membership_id is not null;

create index standard_versions_approver_idx
  on standard_versions (organization_id, approved_by_membership_id)
  where approved_by_membership_id is not null;

create index standard_versions_returned_by_idx
  on standard_versions (organization_id, returned_to_draft_by_membership_id)
  where returned_to_draft_by_membership_id is not null;

create index standard_versions_retired_by_idx
  on standard_versions (organization_id, retired_by_membership_id)
  where retired_by_membership_id is not null;

create index standard_version_editors_member_idx
  on standard_version_editors (organization_id, editor_membership_id);

create index work_method_references_target_idx
  on work_method_standard_references (organization_id, referenced_standard_version_id);

create index material_versions_last_editor_idx
  on material_versions (organization_id, last_edited_by_membership_id);

create index labor_versions_last_editor_idx
  on labor_versions (organization_id, last_edited_by_membership_id);

create index work_method_versions_last_editor_idx
  on work_method_versions (organization_id, last_edited_by_membership_id);

create index work_method_references_created_by_idx
  on work_method_standard_references (organization_id, created_by_membership_id);

create index standard_evidence_version_idx
  on standard_evidence (
    organization_id,
    standard_version_id,
    standard_kind,
    standard_id,
    version_number,
    created_at
  );

create index standard_evidence_added_by_idx
  on standard_evidence (organization_id, added_by_membership_id);

create index standard_approvals_version_idx
  on standard_approvals (
    organization_id,
    standard_version_id,
    standard_kind,
    standard_id,
    version_number,
    decided_at
  );

create index standard_approvals_actor_idx
  on standard_approvals (organization_id, decided_by_membership_id);

create index audit_logs_organization_time_idx
  on audit_logs (organization_id, occurred_at desc);

create index audit_logs_subject_idx
  on audit_logs (organization_id, subject_type, subject_id, occurred_at desc);

create index audit_logs_actor_idx
  on audit_logs (organization_id, actor_membership_id, occurred_at desc);

create index audit_logs_standard_version_idx
  on audit_logs (organization_id, standard_version_id)
  where standard_version_id is not null;
