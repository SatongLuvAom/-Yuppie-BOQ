-- Phase 1C: Supabase Auth linkage and Standards Workspace row-level security.

alter table public.organization_memberships
  add constraint organization_memberships_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete restrict;

create or replace function public.current_actor_membership_id(
  target_organization_id uuid
) returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select membership.id
  from public.organization_memberships as membership
  where membership.organization_id = target_organization_id
    and membership.user_id = auth.uid()
    and membership.ended_at is null
  limit 1;
$$;

create or replace function public.is_organization_member(
  target_organization_id uuid
) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_actor_membership_id(target_organization_id) is not null;
$$;

create or replace function public.is_current_actor_membership(
  target_organization_id uuid,
  target_membership_id uuid
) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_actor_membership_id(target_organization_id)
    = target_membership_id;
$$;

create or replace function public.current_actor_has_role(
  target_organization_id uuid,
  target_role public.membership_role
) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships as membership
    join public.organization_membership_roles as membership_role
      on membership_role.organization_id = membership.organization_id
     and membership_role.membership_id = membership.id
    where membership.organization_id = target_organization_id
      and membership.user_id = auth.uid()
      and membership.ended_at is null
      and membership_role.role = target_role
  );
$$;

revoke all on function public.current_actor_membership_id(uuid)
  from public, anon;
revoke all on function public.is_organization_member(uuid)
  from public, anon;
revoke all on function public.is_current_actor_membership(uuid, uuid)
  from public, anon;
revoke all on function public.current_actor_has_role(uuid, public.membership_role)
  from public, anon;

grant execute on function public.current_actor_membership_id(uuid)
  to authenticated;
grant execute on function public.is_organization_member(uuid)
  to authenticated;
grant execute on function public.is_current_actor_membership(uuid, uuid)
  to authenticated;
grant execute on function public.current_actor_has_role(uuid, public.membership_role)
  to authenticated;

-- The decision row is checked by RLS before commit. Its existing trigger owns the
-- atomic version and audit writes, which clients cannot perform directly.
alter function public.apply_standard_approval() security definer;
alter function public.apply_standard_approval()
  set search_path = pg_catalog, public;
revoke all on function public.apply_standard_approval()
  from public, anon, authenticated;

-- Editor history is derived from guarded version writes, never supplied as a
-- separate client assertion.
alter function public.remember_standard_version_editor() security definer;
alter function public.remember_standard_version_editor()
  set search_path = pg_catalog, public;
revoke all on function public.remember_standard_version_editor()
  from public, anon, authenticated;

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.organization_membership_roles enable row level security;
alter table public.standards enable row level security;
alter table public.materials enable row level security;
alter table public.labor_standards enable row level security;
alter table public.work_methods enable row level security;
alter table public.standard_versions enable row level security;
alter table public.standard_version_editors enable row level security;
alter table public.material_versions enable row level security;
alter table public.labor_versions enable row level security;
alter table public.work_method_versions enable row level security;
alter table public.work_method_standard_references enable row level security;
alter table public.standard_evidence enable row level security;
alter table public.standard_approvals enable row level security;
alter table public.audit_logs enable row level security;

revoke all on table
  public.organizations,
  public.organization_memberships,
  public.organization_membership_roles,
  public.standards,
  public.materials,
  public.labor_standards,
  public.work_methods,
  public.standard_versions,
  public.standard_version_editors,
  public.material_versions,
  public.labor_versions,
  public.work_method_versions,
  public.work_method_standard_references,
  public.standard_evidence,
  public.standard_approvals,
  public.audit_logs
from public, anon, authenticated;

grant select on table
  public.organizations,
  public.organization_memberships,
  public.organization_membership_roles,
  public.standards,
  public.materials,
  public.labor_standards,
  public.work_methods,
  public.standard_versions,
  public.standard_version_editors,
  public.material_versions,
  public.labor_versions,
  public.work_method_versions,
  public.work_method_standard_references,
  public.standard_evidence,
  public.standard_approvals,
  public.audit_logs
to authenticated;

grant update (name) on public.organizations to authenticated;
grant insert on public.organization_memberships to authenticated;
grant update (ended_at) on public.organization_memberships to authenticated;
grant insert, delete on public.organization_membership_roles to authenticated;
grant insert on table
  public.standards,
  public.materials,
  public.labor_standards,
  public.work_methods,
  public.standard_versions,
  public.material_versions,
  public.labor_versions,
  public.work_method_versions,
  public.work_method_standard_references,
  public.standard_evidence,
  public.standard_approvals
to authenticated;
grant update (code, name, updated_by_membership_id)
  on public.standards to authenticated;
grant update (classification) on public.materials to authenticated;
grant update (labor_category) on public.labor_standards to authenticated;
grant update (intended_scope) on public.work_methods to authenticated;
grant update (
  status,
  source,
  last_edited_by_membership_id,
  last_edited_at,
  submitted_by_membership_id,
  submitted_at,
  reviewer_membership_id,
  reviewed_at,
  returned_to_draft_by_membership_id,
  returned_to_draft_at,
  return_reason
) on public.standard_versions to authenticated;
grant update (
  unit,
  specification,
  applicability,
  last_edited_by_membership_id,
  last_edited_at
) on public.material_versions to authenticated;
grant update (
  unit,
  interpretation_basis,
  applicability,
  last_edited_by_membership_id,
  last_edited_at
) on public.labor_versions to authenticated;
grant update (
  method_description,
  conditions,
  last_edited_by_membership_id,
  last_edited_at
) on public.work_method_versions to authenticated;
grant delete on public.work_method_standard_references to authenticated;

create policy organizations_member_select
on public.organizations
for select
to authenticated
using (public.is_organization_member(id));

create policy organizations_admin_update
on public.organizations
for update
to authenticated
using (public.current_actor_has_role(id, 'organization_admin'))
with check (public.current_actor_has_role(id, 'organization_admin'));

create policy organization_memberships_member_select
on public.organization_memberships
for select
to authenticated
using (public.is_organization_member(organization_id));

create policy organization_memberships_admin_insert
on public.organization_memberships
for insert
to authenticated
with check (
  public.current_actor_has_role(organization_id, 'organization_admin')
);

create policy organization_memberships_admin_update
on public.organization_memberships
for update
to authenticated
using (public.current_actor_has_role(organization_id, 'organization_admin'))
with check (public.current_actor_has_role(organization_id, 'organization_admin'));

create policy organization_membership_roles_member_select
on public.organization_membership_roles
for select
to authenticated
using (public.is_organization_member(organization_id));

create policy organization_membership_roles_admin_insert
on public.organization_membership_roles
for insert
to authenticated
with check (
  public.current_actor_has_role(organization_id, 'organization_admin')
  and public.is_current_actor_membership(
    organization_id,
    granted_by_membership_id
  )
);

create policy organization_membership_roles_admin_delete
on public.organization_membership_roles
for delete
to authenticated
using (public.current_actor_has_role(organization_id, 'organization_admin'));

create policy standards_member_select
on public.standards
for select
to authenticated
using (public.is_organization_member(organization_id));

create policy standards_editor_insert
on public.standards
for insert
to authenticated
with check (
  public.current_actor_has_role(organization_id, 'standards_editor')
  and public.is_current_actor_membership(
    organization_id,
    created_by_membership_id
  )
  and public.is_current_actor_membership(
    organization_id,
    updated_by_membership_id
  )
);

create policy standards_editor_update
on public.standards
for update
to authenticated
using (
  public.current_actor_has_role(organization_id, 'standards_editor')
  and exists (
    select 1
    from public.standard_versions as version
    where version.organization_id = standards.organization_id
      and version.standard_id = standards.id
      and version.status = 'draft'
  )
)
with check (
  public.current_actor_has_role(organization_id, 'standards_editor')
  and public.is_current_actor_membership(
    organization_id,
    updated_by_membership_id
  )
);

create policy materials_member_select
on public.materials
for select
to authenticated
using (public.is_organization_member(organization_id));

create policy materials_editor_insert
on public.materials
for insert
to authenticated
with check (public.current_actor_has_role(organization_id, 'standards_editor'));

create policy materials_editor_update
on public.materials
for update
to authenticated
using (
  public.current_actor_has_role(organization_id, 'standards_editor')
  and exists (
    select 1
    from public.standard_versions as version
    where version.organization_id = materials.organization_id
      and version.standard_id = materials.id
      and version.status = 'draft'
  )
)
with check (public.current_actor_has_role(organization_id, 'standards_editor'));

create policy labor_standards_member_select
on public.labor_standards
for select
to authenticated
using (public.is_organization_member(organization_id));

create policy labor_standards_editor_insert
on public.labor_standards
for insert
to authenticated
with check (public.current_actor_has_role(organization_id, 'standards_editor'));

create policy labor_standards_editor_update
on public.labor_standards
for update
to authenticated
using (
  public.current_actor_has_role(organization_id, 'standards_editor')
  and exists (
    select 1
    from public.standard_versions as version
    where version.organization_id = labor_standards.organization_id
      and version.standard_id = labor_standards.id
      and version.status = 'draft'
  )
)
with check (public.current_actor_has_role(organization_id, 'standards_editor'));

create policy work_methods_member_select
on public.work_methods
for select
to authenticated
using (public.is_organization_member(organization_id));

create policy work_methods_editor_insert
on public.work_methods
for insert
to authenticated
with check (public.current_actor_has_role(organization_id, 'standards_editor'));

create policy work_methods_editor_update
on public.work_methods
for update
to authenticated
using (
  public.current_actor_has_role(organization_id, 'standards_editor')
  and exists (
    select 1
    from public.standard_versions as version
    where version.organization_id = work_methods.organization_id
      and version.standard_id = work_methods.id
      and version.status = 'draft'
  )
)
with check (public.current_actor_has_role(organization_id, 'standards_editor'));

create policy standard_versions_member_select
on public.standard_versions
for select
to authenticated
using (public.is_organization_member(organization_id));

create policy standard_versions_editor_insert
on public.standard_versions
for insert
to authenticated
with check (
  status = 'draft'
  and public.current_actor_has_role(organization_id, 'standards_editor')
  and public.is_current_actor_membership(
    organization_id,
    created_by_membership_id
  )
  and public.is_current_actor_membership(
    organization_id,
    last_edited_by_membership_id
  )
);

create policy standard_versions_editor_update
on public.standard_versions
for update
to authenticated
using (
  public.current_actor_has_role(organization_id, 'standards_editor')
  and (
    status = 'draft'
    or (
      status = 'review'
      and public.is_current_actor_membership(
        organization_id,
        submitted_by_membership_id
      )
    )
  )
)
with check (
  public.current_actor_has_role(organization_id, 'standards_editor')
  and (
    (
      status = 'draft'
      and (
        public.is_current_actor_membership(
          organization_id,
          last_edited_by_membership_id
        )
        or public.is_current_actor_membership(
          organization_id,
          returned_to_draft_by_membership_id
        )
      )
    )
    or (
      status = 'review'
      and public.is_current_actor_membership(
        organization_id,
        submitted_by_membership_id
      )
    )
  )
);

create policy standard_version_editors_member_select
on public.standard_version_editors
for select
to authenticated
using (public.is_organization_member(organization_id));

create policy material_versions_member_select
on public.material_versions
for select
to authenticated
using (public.is_organization_member(organization_id));

create policy material_versions_editor_insert
on public.material_versions
for insert
to authenticated
with check (
  public.current_actor_has_role(organization_id, 'standards_editor')
  and public.is_current_actor_membership(
    organization_id,
    last_edited_by_membership_id
  )
);

create policy material_versions_editor_update
on public.material_versions
for update
to authenticated
using (public.current_actor_has_role(organization_id, 'standards_editor'))
with check (
  public.current_actor_has_role(organization_id, 'standards_editor')
  and public.is_current_actor_membership(
    organization_id,
    last_edited_by_membership_id
  )
);

create policy labor_versions_member_select
on public.labor_versions
for select
to authenticated
using (public.is_organization_member(organization_id));

create policy labor_versions_editor_insert
on public.labor_versions
for insert
to authenticated
with check (
  public.current_actor_has_role(organization_id, 'standards_editor')
  and public.is_current_actor_membership(
    organization_id,
    last_edited_by_membership_id
  )
);

create policy labor_versions_editor_update
on public.labor_versions
for update
to authenticated
using (public.current_actor_has_role(organization_id, 'standards_editor'))
with check (
  public.current_actor_has_role(organization_id, 'standards_editor')
  and public.is_current_actor_membership(
    organization_id,
    last_edited_by_membership_id
  )
);

create policy work_method_versions_member_select
on public.work_method_versions
for select
to authenticated
using (public.is_organization_member(organization_id));

create policy work_method_versions_editor_insert
on public.work_method_versions
for insert
to authenticated
with check (
  public.current_actor_has_role(organization_id, 'standards_editor')
  and public.is_current_actor_membership(
    organization_id,
    last_edited_by_membership_id
  )
);

create policy work_method_versions_editor_update
on public.work_method_versions
for update
to authenticated
using (public.current_actor_has_role(organization_id, 'standards_editor'))
with check (
  public.current_actor_has_role(organization_id, 'standards_editor')
  and public.is_current_actor_membership(
    organization_id,
    last_edited_by_membership_id
  )
);

create policy work_method_standard_references_member_select
on public.work_method_standard_references
for select
to authenticated
using (public.is_organization_member(organization_id));

create policy work_method_standard_references_editor_insert
on public.work_method_standard_references
for insert
to authenticated
with check (
  public.current_actor_has_role(organization_id, 'standards_editor')
  and public.is_current_actor_membership(
    organization_id,
    created_by_membership_id
  )
);

create policy work_method_standard_references_editor_delete
on public.work_method_standard_references
for delete
to authenticated
using (public.current_actor_has_role(organization_id, 'standards_editor'));

create policy standard_evidence_member_select
on public.standard_evidence
for select
to authenticated
using (public.is_organization_member(organization_id));

create policy standard_evidence_editor_insert
on public.standard_evidence
for insert
to authenticated
with check (
  public.current_actor_has_role(organization_id, 'standards_editor')
  and public.is_current_actor_membership(
    organization_id,
    added_by_membership_id
  )
);

create policy standard_approvals_member_select
on public.standard_approvals
for select
to authenticated
using (public.is_organization_member(organization_id));

create policy standard_approvals_approver_insert
on public.standard_approvals
for insert
to authenticated
with check (
  public.current_actor_has_role(organization_id, 'standards_approver')
  and public.is_current_actor_membership(
    organization_id,
    decided_by_membership_id
  )
);

create policy audit_logs_member_select
on public.audit_logs
for select
to authenticated
using (public.is_organization_member(organization_id));
