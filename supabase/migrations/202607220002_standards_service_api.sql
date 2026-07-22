-- Phase 1D: authenticated, audited transaction boundaries for Standards services.

create or replace function public.standards_require_actor(
  target_organization_id uuid,
  required_role public.membership_role
) returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_membership_id uuid;
begin
  actor_membership_id := public.current_actor_membership_id(
    target_organization_id
  );

  if actor_membership_id is null
    or not public.current_actor_has_role(target_organization_id, required_role) then
    raise exception using
      errcode = '42501',
      message = 'the authenticated actor lacks the required organization role';
  end if;

  return actor_membership_id;
end;
$$;

create or replace function public.standards_write_audit(
  target_organization_id uuid,
  actor_membership_id uuid,
  audit_action text,
  target_subject_type text,
  target_subject_id uuid,
  target_standard_version_id uuid,
  audit_details jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_audit_id uuid;
begin
  insert into public.audit_logs (
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
    target_organization_id,
    actor_membership_id,
    audit_action,
    target_subject_type,
    target_subject_id,
    target_standard_version_id,
    'succeeded',
    clock_timestamp(),
    coalesce(audit_details, '{}'::jsonb)
  ) returning id into created_audit_id;

  return created_audit_id;
end;
$$;

create or replace function public.standards_get_version_mutation_context(
  p_organization_id uuid,
  p_standard_version_id uuid
) returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  context jsonb;
begin
  if not public.is_organization_member(p_organization_id) then
    raise exception using
      errcode = '42501',
      message = 'the authenticated actor is not an organization member';
  end if;

  select jsonb_build_object(
    'organization_id', version.organization_id,
    'standard_kind', version.standard_kind,
    'standard_id', version.standard_id,
    'standard_version_id', version.id,
    'version_number', version.version_number,
    'status', version.status,
    'source', version.source,
    'evidence_ids', coalesce((
      select jsonb_agg(evidence.id order by evidence.created_at, evidence.id)
      from public.standard_evidence as evidence
      where evidence.organization_id = version.organization_id
        and evidence.standard_version_id = version.id
    ), '[]'::jsonb),
    'created_by_membership_id', version.created_by_membership_id,
    'editor_membership_ids', coalesce((
      select jsonb_agg(editor.editor_membership_id order by editor.first_edited_at)
      from public.standard_version_editors as editor
      where editor.organization_id = version.organization_id
        and editor.standard_version_id = version.id
    ), '[]'::jsonb),
    'reviewer_membership_id', version.reviewer_membership_id
  ) into context
  from public.standard_versions as version
  where version.organization_id = p_organization_id
    and version.id = p_standard_version_id;

  if context is null then
    raise exception using
      errcode = 'P0002',
      message = 'standard version not found';
  end if;

  return context;
end;
$$;

create or replace function public.standards_create_standard(
  p_organization_id uuid,
  p_kind public.standard_kind,
  p_code text,
  p_name text,
  p_classification text default null,
  p_category text default null,
  p_intended_scope text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_membership_id uuid;
  created_standard_id uuid;
  created_audit_id uuid;
begin
  actor_membership_id := public.standards_require_actor(
    p_organization_id,
    'standards_editor'
  );

  insert into public.standards (
    organization_id,
    kind,
    code,
    name,
    created_by_membership_id,
    updated_by_membership_id
  ) values (
    p_organization_id,
    p_kind,
    p_code,
    p_name,
    actor_membership_id,
    actor_membership_id
  ) returning id into created_standard_id;

  case p_kind
    when 'material' then
      insert into public.materials (id, organization_id, classification)
      values (created_standard_id, p_organization_id, p_classification);
    when 'labor' then
      insert into public.labor_standards (id, organization_id, labor_category)
      values (created_standard_id, p_organization_id, p_category);
    when 'work_method' then
      insert into public.work_methods (id, organization_id, intended_scope)
      values (created_standard_id, p_organization_id, p_intended_scope);
  end case;

  created_audit_id := public.standards_write_audit(
    p_organization_id,
    actor_membership_id,
    'standard_created',
    p_kind::text,
    created_standard_id,
    null,
    '{}'::jsonb
  );

  return jsonb_build_object(
    'organization_id', p_organization_id,
    'standard_kind', p_kind,
    'standard_id', created_standard_id,
    'audit_log_id', created_audit_id
  );
end;
$$;

create or replace function public.standards_update_standard(
  p_organization_id uuid,
  p_standard_id uuid,
  p_kind public.standard_kind,
  p_code text,
  p_name text,
  p_classification text default null,
  p_category text default null,
  p_intended_scope text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_membership_id uuid;
  stored_kind public.standard_kind;
  created_audit_id uuid;
begin
  actor_membership_id := public.standards_require_actor(
    p_organization_id,
    'standards_editor'
  );

  select standard.kind into stored_kind
  from public.standards as standard
  where standard.organization_id = p_organization_id
    and standard.id = p_standard_id
  for update;

  if stored_kind is null then
    raise exception using errcode = 'P0002', message = 'standard not found';
  end if;

  if stored_kind <> p_kind then
    raise exception using errcode = '23514', message = 'standard kind mismatch';
  end if;

  if not exists (
    select 1
    from public.standard_versions as version
    where version.organization_id = p_organization_id
      and version.standard_id = p_standard_id
      and version.status = 'draft'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'standard identity can be edited only while it has a draft version';
  end if;

  update public.standards
  set code = p_code,
      name = p_name,
      updated_by_membership_id = actor_membership_id
  where organization_id = p_organization_id
    and id = p_standard_id;

  case p_kind
    when 'material' then
      update public.materials
      set classification = p_classification
      where organization_id = p_organization_id and id = p_standard_id;
    when 'labor' then
      update public.labor_standards
      set labor_category = p_category
      where organization_id = p_organization_id and id = p_standard_id;
    when 'work_method' then
      update public.work_methods
      set intended_scope = p_intended_scope
      where organization_id = p_organization_id and id = p_standard_id;
  end case;

  created_audit_id := public.standards_write_audit(
    p_organization_id,
    actor_membership_id,
    'standard_edited',
    p_kind::text,
    p_standard_id,
    null,
    '{}'::jsonb
  );

  return jsonb_build_object(
    'organization_id', p_organization_id,
    'standard_kind', p_kind,
    'standard_id', p_standard_id,
    'audit_log_id', created_audit_id
  );
end;
$$;

create or replace function public.standards_create_version(
  p_organization_id uuid,
  p_standard_id uuid,
  p_kind public.standard_kind,
  p_source text,
  p_unit text default null,
  p_specification text default null,
  p_applicability text default null,
  p_interpretation_basis text default null,
  p_method_description text default null,
  p_conditions text default null,
  p_referenced_standard_version_ids uuid[] default '{}'::uuid[]
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_membership_id uuid;
  stored_kind public.standard_kind;
  created_standard_version_id uuid := gen_random_uuid();
  created_version_number integer;
  edited_at timestamptz := clock_timestamp();
  created_audit_id uuid;
begin
  actor_membership_id := public.standards_require_actor(
    p_organization_id,
    'standards_editor'
  );

  select standard.kind into stored_kind
  from public.standards as standard
  where standard.organization_id = p_organization_id
    and standard.id = p_standard_id
  for update;

  if stored_kind is null then
    raise exception using errcode = 'P0002', message = 'standard not found';
  end if;

  if stored_kind <> p_kind then
    raise exception using errcode = '23514', message = 'standard kind mismatch';
  end if;

  select coalesce(max(version.version_number), 0) + 1
    into created_version_number
  from public.standard_versions as version
  where version.organization_id = p_organization_id
    and version.standard_id = p_standard_id;

  insert into public.standard_versions (
    id,
    organization_id,
    standard_id,
    standard_kind,
    version_number,
    source,
    created_by_membership_id,
    created_at,
    last_edited_by_membership_id,
    last_edited_at
  ) values (
    created_standard_version_id,
    p_organization_id,
    p_standard_id,
    p_kind,
    created_version_number,
    p_source,
    actor_membership_id,
    edited_at,
    actor_membership_id,
    edited_at
  );

  case p_kind
    when 'material' then
      insert into public.material_versions (
        id,
        organization_id,
        standard_id,
        version_number,
        unit,
        specification,
        applicability,
        last_edited_by_membership_id,
        last_edited_at
      ) values (
        created_standard_version_id,
        p_organization_id,
        p_standard_id,
        created_version_number,
        p_unit,
        p_specification,
        p_applicability,
        actor_membership_id,
        edited_at
      );
    when 'labor' then
      insert into public.labor_versions (
        id,
        organization_id,
        standard_id,
        version_number,
        unit,
        interpretation_basis,
        applicability,
        last_edited_by_membership_id,
        last_edited_at
      ) values (
        created_standard_version_id,
        p_organization_id,
        p_standard_id,
        created_version_number,
        p_unit,
        p_interpretation_basis,
        p_applicability,
        actor_membership_id,
        edited_at
      );
    when 'work_method' then
      insert into public.work_method_versions (
        id,
        organization_id,
        standard_id,
        version_number,
        method_description,
        conditions,
        last_edited_by_membership_id,
        last_edited_at
      ) values (
        created_standard_version_id,
        p_organization_id,
        p_standard_id,
        created_version_number,
        p_method_description,
        p_conditions,
        actor_membership_id,
        edited_at
      );

      insert into public.work_method_standard_references (
        organization_id,
        work_method_version_id,
        referenced_standard_version_id,
        created_by_membership_id
      )
      select
        p_organization_id,
        created_standard_version_id,
        referenced_version_id,
        actor_membership_id
      from unnest(coalesce(p_referenced_standard_version_ids, '{}'::uuid[]))
        as referenced_version_id;
  end case;

  if p_kind <> 'work_method'
    and cardinality(coalesce(p_referenced_standard_version_ids, '{}'::uuid[])) > 0 then
    raise exception using
      errcode = '23514',
      message = 'only work method versions may reference standard versions';
  end if;

  created_audit_id := public.standards_write_audit(
    p_organization_id,
    actor_membership_id,
    'version_created',
    p_kind::text,
    p_standard_id,
    created_standard_version_id,
    jsonb_build_object('version_number', created_version_number)
  );

  return jsonb_build_object(
    'organization_id', p_organization_id,
    'standard_kind', p_kind,
    'standard_id', p_standard_id,
    'standard_version_id', created_standard_version_id,
    'version_number', created_version_number,
    'status', 'draft',
    'audit_log_id', created_audit_id
  );
end;
$$;

create or replace function public.standards_update_draft_version(
  p_organization_id uuid,
  p_standard_id uuid,
  p_standard_version_id uuid,
  p_kind public.standard_kind,
  p_source text,
  p_unit text default null,
  p_specification text default null,
  p_applicability text default null,
  p_interpretation_basis text default null,
  p_method_description text default null,
  p_conditions text default null,
  p_referenced_standard_version_ids uuid[] default '{}'::uuid[]
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_membership_id uuid;
  stored_version public.standard_versions%rowtype;
  edited_at timestamptz := clock_timestamp();
  created_audit_id uuid;
begin
  actor_membership_id := public.standards_require_actor(
    p_organization_id,
    'standards_editor'
  );

  select version.* into stored_version
  from public.standard_versions as version
  where version.organization_id = p_organization_id
    and version.id = p_standard_version_id
    and version.standard_id = p_standard_id
    and version.standard_kind = p_kind
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'standard version not found';
  end if;

  if stored_version.status <> 'draft' then
    raise exception using
      errcode = 'P0001',
      message = 'version details are editable only while draft';
  end if;

  update public.standard_versions
  set source = p_source,
      last_edited_by_membership_id = actor_membership_id,
      last_edited_at = greatest(edited_at, stored_version.last_edited_at + interval '1 microsecond')
  where organization_id = p_organization_id
    and id = p_standard_version_id;

  case p_kind
    when 'material' then
      update public.material_versions
      set unit = p_unit,
          specification = p_specification,
          applicability = p_applicability,
          last_edited_by_membership_id = actor_membership_id,
          last_edited_at = greatest(
            edited_at,
            stored_version.last_edited_at + interval '1 microsecond'
          )
      where organization_id = p_organization_id and id = p_standard_version_id;
    when 'labor' then
      update public.labor_versions
      set unit = p_unit,
          interpretation_basis = p_interpretation_basis,
          applicability = p_applicability,
          last_edited_by_membership_id = actor_membership_id,
          last_edited_at = greatest(
            edited_at,
            stored_version.last_edited_at + interval '1 microsecond'
          )
      where organization_id = p_organization_id and id = p_standard_version_id;
    when 'work_method' then
      update public.work_method_versions
      set method_description = p_method_description,
          conditions = p_conditions,
          last_edited_by_membership_id = actor_membership_id,
          last_edited_at = greatest(
            edited_at,
            stored_version.last_edited_at + interval '1 microsecond'
          )
      where organization_id = p_organization_id and id = p_standard_version_id;

      delete from public.work_method_standard_references
      where organization_id = p_organization_id
        and work_method_version_id = p_standard_version_id;

      insert into public.work_method_standard_references (
        organization_id,
        work_method_version_id,
        referenced_standard_version_id,
        created_by_membership_id
      )
      select
        p_organization_id,
        p_standard_version_id,
        referenced_version_id,
        actor_membership_id
      from unnest(coalesce(p_referenced_standard_version_ids, '{}'::uuid[]))
        as referenced_version_id;
  end case;

  if p_kind <> 'work_method'
    and cardinality(coalesce(p_referenced_standard_version_ids, '{}'::uuid[])) > 0 then
    raise exception using
      errcode = '23514',
      message = 'only work method versions may reference standard versions';
  end if;

  created_audit_id := public.standards_write_audit(
    p_organization_id,
    actor_membership_id,
    'version_edited',
    p_kind::text,
    p_standard_id,
    p_standard_version_id,
    jsonb_build_object('version_number', stored_version.version_number)
  );

  return jsonb_build_object(
    'organization_id', p_organization_id,
    'standard_kind', p_kind,
    'standard_id', p_standard_id,
    'standard_version_id', p_standard_version_id,
    'version_number', stored_version.version_number,
    'status', 'draft',
    'audit_log_id', created_audit_id
  );
end;
$$;

create or replace function public.standards_add_evidence(
  p_organization_id uuid,
  p_standard_version_id uuid,
  p_title text,
  p_source text,
  p_source_uri text,
  p_content_hash text,
  p_captured_at timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_membership_id uuid;
  stored_version public.standard_versions%rowtype;
  created_evidence_id uuid;
  created_audit_id uuid;
begin
  actor_membership_id := public.standards_require_actor(
    p_organization_id,
    'standards_editor'
  );

  select version.* into stored_version
  from public.standard_versions as version
  where version.organization_id = p_organization_id
    and version.id = p_standard_version_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'standard version not found';
  end if;

  insert into public.standard_evidence (
    organization_id,
    standard_kind,
    standard_id,
    standard_version_id,
    version_number,
    title,
    source,
    source_uri,
    content_hash,
    captured_at,
    added_by_membership_id
  ) values (
    p_organization_id,
    stored_version.standard_kind,
    stored_version.standard_id,
    stored_version.id,
    stored_version.version_number,
    p_title,
    p_source,
    p_source_uri,
    p_content_hash,
    p_captured_at,
    actor_membership_id
  ) returning id into created_evidence_id;

  created_audit_id := public.standards_write_audit(
    p_organization_id,
    actor_membership_id,
    'evidence_added',
    stored_version.standard_kind::text,
    stored_version.standard_id,
    stored_version.id,
    jsonb_build_object('evidence_id', created_evidence_id)
  );

  return jsonb_build_object(
    'organization_id', p_organization_id,
    'standard_kind', stored_version.standard_kind,
    'standard_id', stored_version.standard_id,
    'standard_version_id', stored_version.id,
    'version_number', stored_version.version_number,
    'status', stored_version.status,
    'evidence_id', created_evidence_id,
    'audit_log_id', created_audit_id
  );
end;
$$;

create or replace function public.standards_submit_for_review(
  p_organization_id uuid,
  p_standard_version_id uuid,
  p_reviewer_membership_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_membership_id uuid;
  stored_version public.standard_versions%rowtype;
  review_started_at timestamptz := clock_timestamp();
  created_audit_id uuid;
begin
  actor_membership_id := public.standards_require_actor(
    p_organization_id,
    'standards_editor'
  );

  if not exists (
    select 1
    from public.organization_memberships as membership
    where membership.organization_id = p_organization_id
      and membership.id = p_reviewer_membership_id
      and membership.ended_at is null
      and public.has_membership_role(
        p_organization_id,
        membership.id,
        'standards_approver'
      )
  ) then
    raise exception using errcode = '23503', message = 'reviewer membership not found';
  end if;

  select version.* into stored_version
  from public.standard_versions as version
  where version.organization_id = p_organization_id
    and version.id = p_standard_version_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'standard version not found';
  end if;

  update public.standard_versions
  set status = 'review',
      submitted_by_membership_id = actor_membership_id,
      submitted_at = review_started_at,
      reviewer_membership_id = p_reviewer_membership_id,
      reviewed_at = review_started_at,
      returned_to_draft_by_membership_id = null,
      returned_to_draft_at = null,
      return_reason = null
  where organization_id = p_organization_id
    and id = p_standard_version_id;

  created_audit_id := public.standards_write_audit(
    p_organization_id,
    actor_membership_id,
    'submitted_for_review',
    stored_version.standard_kind::text,
    stored_version.standard_id,
    stored_version.id,
    jsonb_build_object('reviewer_membership_id', p_reviewer_membership_id)
  );

  return jsonb_build_object(
    'organization_id', p_organization_id,
    'standard_kind', stored_version.standard_kind,
    'standard_id', stored_version.standard_id,
    'standard_version_id', stored_version.id,
    'version_number', stored_version.version_number,
    'status', 'review',
    'audit_log_id', created_audit_id
  );
end;
$$;

create or replace function public.standards_decide_version(
  p_organization_id uuid,
  p_standard_version_id uuid,
  p_decision public.approval_decision,
  p_effective_date date default null,
  p_rationale text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  decision_actor_membership_id uuid;
  stored_version public.standard_versions%rowtype;
  created_approval_id uuid := gen_random_uuid();
  decision_at timestamptz := clock_timestamp();
  created_audit_id uuid;
  resulting_status public.standard_lifecycle_status;
  audit_action text;
begin
  decision_actor_membership_id := public.standards_require_actor(
    p_organization_id,
    'standards_approver'
  );

  select version.* into stored_version
  from public.standard_versions as version
  where version.organization_id = p_organization_id
    and version.id = p_standard_version_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'standard version not found';
  end if;

  insert into public.standard_approvals (
    id,
    organization_id,
    standard_kind,
    standard_id,
    standard_version_id,
    version_number,
    decision,
    decided_by_membership_id,
    decided_at,
    rationale,
    effective_date
  ) values (
    created_approval_id,
    p_organization_id,
    stored_version.standard_kind,
    stored_version.standard_id,
    stored_version.id,
    stored_version.version_number,
    p_decision,
    decision_actor_membership_id,
    decision_at,
    p_rationale,
    p_effective_date
  );

  resulting_status := case p_decision
    when 'approved' then 'approved'::public.standard_lifecycle_status
    when 'changes_requested' then 'draft'::public.standard_lifecycle_status
    when 'retired' then 'retired'::public.standard_lifecycle_status
  end;
  audit_action := case p_decision
    when 'approved' then 'version_approved'
    when 'changes_requested' then 'changes_requested'
    when 'retired' then 'version_retired'
  end;

  select audit.id into created_audit_id
  from public.audit_logs as audit
  where audit.organization_id = p_organization_id
    and audit.actor_membership_id = decision_actor_membership_id
    and audit.action = audit_action
    and audit.standard_version_id = p_standard_version_id
    and audit.occurred_at = decision_at
  order by audit.id
  limit 1;

  if created_audit_id is null then
    raise exception 'approval audit was not created';
  end if;

  return jsonb_build_object(
    'organization_id', p_organization_id,
    'standard_kind', stored_version.standard_kind,
    'standard_id', stored_version.standard_id,
    'standard_version_id', stored_version.id,
    'version_number', stored_version.version_number,
    'status', resulting_status,
    'approval_id', created_approval_id,
    'audit_log_id', created_audit_id
  );
end;
$$;

create or replace function public.standards_approve_version(
  p_organization_id uuid,
  p_standard_version_id uuid,
  p_effective_date date
) returns jsonb
language sql
security definer
set search_path = ''
as $$
  select public.standards_decide_version(
    p_organization_id,
    p_standard_version_id,
    'approved',
    p_effective_date,
    null
  );
$$;

create or replace function public.standards_reject_version(
  p_organization_id uuid,
  p_standard_version_id uuid,
  p_rationale text
) returns jsonb
language sql
security definer
set search_path = ''
as $$
  select public.standards_decide_version(
    p_organization_id,
    p_standard_version_id,
    'changes_requested',
    null,
    p_rationale
  );
$$;

create or replace function public.standards_retire_version(
  p_organization_id uuid,
  p_standard_version_id uuid,
  p_rationale text
) returns jsonb
language sql
security definer
set search_path = ''
as $$
  select public.standards_decide_version(
    p_organization_id,
    p_standard_version_id,
    'retired',
    null,
    p_rationale
  );
$$;

revoke all on function public.standards_require_actor(
  uuid,
  public.membership_role
) from public, anon, authenticated;
revoke all on function public.standards_write_audit(
  uuid,
  uuid,
  text,
  text,
  uuid,
  uuid,
  jsonb
) from public, anon, authenticated;
revoke all on function public.standards_decide_version(
  uuid,
  uuid,
  public.approval_decision,
  date,
  text
) from public, anon, authenticated;

revoke all on function public.standards_get_version_mutation_context(uuid, uuid)
  from public, anon;
revoke all on function public.standards_create_standard(
  uuid,
  public.standard_kind,
  text,
  text,
  text,
  text,
  text
) from public, anon;
revoke all on function public.standards_update_standard(
  uuid,
  uuid,
  public.standard_kind,
  text,
  text,
  text,
  text,
  text
) from public, anon;
revoke all on function public.standards_create_version(
  uuid,
  uuid,
  public.standard_kind,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  uuid[]
) from public, anon;
revoke all on function public.standards_update_draft_version(
  uuid,
  uuid,
  uuid,
  public.standard_kind,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  uuid[]
) from public, anon;
revoke all on function public.standards_add_evidence(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  timestamptz
) from public, anon;
revoke all on function public.standards_submit_for_review(uuid, uuid, uuid)
  from public, anon;
revoke all on function public.standards_approve_version(uuid, uuid, date)
  from public, anon;
revoke all on function public.standards_reject_version(uuid, uuid, text)
  from public, anon;
revoke all on function public.standards_retire_version(uuid, uuid, text)
  from public, anon;

grant execute on function public.standards_get_version_mutation_context(uuid, uuid)
  to authenticated;
grant execute on function public.standards_create_standard(
  uuid,
  public.standard_kind,
  text,
  text,
  text,
  text,
  text
) to authenticated;
grant execute on function public.standards_update_standard(
  uuid,
  uuid,
  public.standard_kind,
  text,
  text,
  text,
  text,
  text
) to authenticated;
grant execute on function public.standards_create_version(
  uuid,
  uuid,
  public.standard_kind,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  uuid[]
) to authenticated;
grant execute on function public.standards_update_draft_version(
  uuid,
  uuid,
  uuid,
  public.standard_kind,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  uuid[]
) to authenticated;
grant execute on function public.standards_add_evidence(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  timestamptz
) to authenticated;
grant execute on function public.standards_submit_for_review(uuid, uuid, uuid)
  to authenticated;
grant execute on function public.standards_approve_version(uuid, uuid, date)
  to authenticated;
grant execute on function public.standards_reject_version(uuid, uuid, text)
  to authenticated;
grant execute on function public.standards_retire_version(uuid, uuid, text)
  to authenticated;
