begin;

create extension if not exists pgtap with schema extensions;

select plan(23);

-- Every fixture and assertion in this file is DEMO_ONLY.
insert into auth.users (id, email) values
  ('11000000-0000-4000-8000-000000000001', 'DEMO_ONLY_admin@example.invalid'),
  ('11000000-0000-4000-8000-000000000002', 'DEMO_ONLY_editor@example.invalid'),
  ('11000000-0000-4000-8000-000000000003', 'DEMO_ONLY_approver@example.invalid'),
  ('11000000-0000-4000-8000-000000000004', 'DEMO_ONLY_viewer@example.invalid'),
  ('11000000-0000-4000-8000-000000000005', 'DEMO_ONLY_outsider@example.invalid');

insert into public.organizations (id, name) values
  ('10000000-0000-4000-8000-000000000001', 'DEMO_ONLY Organization A'),
  ('10000000-0000-4000-8000-000000000002', 'DEMO_ONLY Organization B');

insert into public.organization_memberships (
  id,
  organization_id,
  user_id
) values
  (
    '12000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001'
  ),
  (
    '12000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000002'
  ),
  (
    '12000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000003'
  ),
  (
    '12000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000004'
  ),
  (
    '12000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000002',
    '11000000-0000-4000-8000-000000000005'
  );

insert into public.organization_membership_roles (
  organization_id,
  membership_id,
  role
) values
  (
    '10000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000001',
    'organization_admin'
  ),
  (
    '10000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000002',
    'standards_editor'
  ),
  (
    '10000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000003',
    'standards_approver'
  ),
  (
    '10000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000004',
    'auditor'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '12000000-0000-4000-8000-000000000005',
    'standards_editor'
  );

insert into public.standards (
  id,
  organization_id,
  kind,
  code,
  name,
  created_by_membership_id,
  updated_by_membership_id
) values
  (
    '13000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'material',
    'DEMO_ONLY_DRAFT',
    'DEMO_ONLY Draft Material',
    '12000000-0000-4000-8000-000000000002',
    '12000000-0000-4000-8000-000000000002'
  ),
  (
    '13000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'material',
    'DEMO_ONLY_REVIEW',
    'DEMO_ONLY Review Material',
    '12000000-0000-4000-8000-000000000002',
    '12000000-0000-4000-8000-000000000002'
  ),
  (
    '13000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'material',
    'DEMO_ONLY_SELF_APPROVAL',
    'DEMO_ONLY Self Approval Material',
    '12000000-0000-4000-8000-000000000002',
    '12000000-0000-4000-8000-000000000002'
  ),
  (
    '13000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000002',
    'material',
    'DEMO_ONLY_OTHER_ORG',
    'DEMO_ONLY Other Organization Material',
    '12000000-0000-4000-8000-000000000005',
    '12000000-0000-4000-8000-000000000005'
  );

insert into public.materials (id, organization_id, classification) values
  (
    '13000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'DEMO_ONLY Classification'
  ),
  (
    '13000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'DEMO_ONLY Classification'
  ),
  (
    '13000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'DEMO_ONLY Classification'
  ),
  (
    '13000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000002',
    'DEMO_ONLY Classification'
  );

insert into public.standard_versions (
  id,
  organization_id,
  standard_id,
  standard_kind,
  version_number,
  source,
  created_by_membership_id,
  last_edited_by_membership_id
) values
  (
    '14000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    'material',
    1,
    'DEMO_ONLY Draft Source',
    '12000000-0000-4000-8000-000000000002',
    '12000000-0000-4000-8000-000000000002'
  ),
  (
    '14000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000002',
    'material',
    1,
    'DEMO_ONLY Review Source',
    '12000000-0000-4000-8000-000000000002',
    '12000000-0000-4000-8000-000000000002'
  ),
  (
    '14000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000003',
    'material',
    1,
    'DEMO_ONLY Self Approval Source',
    '12000000-0000-4000-8000-000000000002',
    '12000000-0000-4000-8000-000000000002'
  );

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
) values
  (
    '14000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    1,
    'DEMO_ONLY Unit',
    'DEMO_ONLY Specification',
    'DEMO_ONLY Applicability',
    '12000000-0000-4000-8000-000000000002',
    now()
  ),
  (
    '14000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000002',
    1,
    'DEMO_ONLY Unit',
    'DEMO_ONLY Specification',
    'DEMO_ONLY Applicability',
    '12000000-0000-4000-8000-000000000002',
    now()
  ),
  (
    '14000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000003',
    1,
    'DEMO_ONLY Unit',
    'DEMO_ONLY Specification',
    'DEMO_ONLY Applicability',
    '12000000-0000-4000-8000-000000000002',
    now()
  );

insert into public.standard_evidence (
  id,
  organization_id,
  standard_kind,
  standard_id,
  standard_version_id,
  version_number,
  title,
  source,
  captured_at,
  added_by_membership_id
) values
  (
    '15000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'material',
    '13000000-0000-4000-8000-000000000002',
    '14000000-0000-4000-8000-000000000002',
    1,
    'DEMO_ONLY Review Evidence',
    'DEMO_ONLY Evidence Source',
    now(),
    '12000000-0000-4000-8000-000000000002'
  ),
  (
    '15000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'material',
    '13000000-0000-4000-8000-000000000003',
    '14000000-0000-4000-8000-000000000003',
    1,
    'DEMO_ONLY Self Approval Evidence',
    'DEMO_ONLY Evidence Source',
    now(),
    '12000000-0000-4000-8000-000000000002'
  );

update public.standard_versions
set status = 'review',
    submitted_by_membership_id = '12000000-0000-4000-8000-000000000002',
    submitted_at = now(),
    reviewer_membership_id = '12000000-0000-4000-8000-000000000003',
    reviewed_at = now()
where id in (
  '14000000-0000-4000-8000-000000000002',
  '14000000-0000-4000-8000-000000000003'
);

insert into public.standard_version_editors (
  organization_id,
  standard_version_id,
  editor_membership_id,
  first_edited_at
) values (
  '10000000-0000-4000-8000-000000000001',
  '14000000-0000-4000-8000-000000000003',
  '12000000-0000-4000-8000-000000000003',
  now()
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_class
    where relnamespace = 'public'::regnamespace
      and relname in (
        'organizations',
        'organization_memberships',
        'organization_membership_roles',
        'standards',
        'materials',
        'labor_standards',
        'work_methods',
        'standard_versions',
        'standard_version_editors',
        'material_versions',
        'labor_versions',
        'work_method_versions',
        'work_method_standard_references',
        'standard_evidence',
        'standard_approvals',
        'audit_logs'
      )
      and relrowsecurity
  ),
  16,
  'DEMO_ONLY enables RLS on every Standards Workspace table'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '11000000-0000-4000-8000-000000000004';

select is(
  public.current_actor_membership_id(
    '10000000-0000-4000-8000-000000000001'
  ),
  '12000000-0000-4000-8000-000000000004'::uuid,
  'DEMO_ONLY resolves audit actor through active organization membership'
);

select is(
  (select count(*)::integer from public.standards),
  3,
  'DEMO_ONLY Viewer reads standards in their organization'
);

select is(
  (
    select count(*)::integer
    from public.standards
    where organization_id = '10000000-0000-4000-8000-000000000002'
  ),
  0,
  'DEMO_ONLY Viewer cannot read another organization'
);

select is(
  (
    with changed as (
      update public.organizations
      set name = 'DEMO_ONLY Viewer Write'
      where id = '10000000-0000-4000-8000-000000000001'
      returning id
    )
    select count(*)::integer from changed
  ),
  0,
  'DEMO_ONLY Viewer is read-only'
);

select throws_ok(
  $$
    insert into public.standards (
      id,
      organization_id,
      kind,
      code,
      name,
      created_by_membership_id,
      updated_by_membership_id
    ) values (
      '13000000-0000-4000-8000-000000000010',
      '10000000-0000-4000-8000-000000000001',
      'material',
      'DEMO_ONLY_VIEWER_WRITE',
      'DEMO_ONLY Viewer Write',
      '12000000-0000-4000-8000-000000000004',
      '12000000-0000-4000-8000-000000000004'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "standards"',
  'DEMO_ONLY Viewer cannot create a standard'
);

select ok(
  not has_table_privilege('authenticated', 'public.standard_evidence', 'DELETE'),
  'DEMO_ONLY Evidence has no client delete privilege'
);

select ok(
  not has_table_privilege('authenticated', 'public.audit_logs', 'INSERT'),
  'DEMO_ONLY Audit has no direct client insert privilege'
);

select ok(
  not has_table_privilege('authenticated', 'public.audit_logs', 'DELETE'),
  'DEMO_ONLY Audit has no client delete privilege'
);

set local request.jwt.claim.sub = '11000000-0000-4000-8000-000000000001';

select lives_ok(
  $$
    update public.organizations
    set name = 'DEMO_ONLY Organization A Updated'
    where id = '10000000-0000-4000-8000-000000000001'
  $$,
  'DEMO_ONLY Admin manages organization metadata'
);

select throws_ok(
  $$
    insert into public.standard_approvals (
      id,
      organization_id,
      standard_kind,
      standard_id,
      standard_version_id,
      version_number,
      decision,
      decided_by_membership_id,
      effective_date
    ) values (
      '16000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      'material',
      '13000000-0000-4000-8000-000000000002',
      '14000000-0000-4000-8000-000000000002',
      1,
      'approved',
      '12000000-0000-4000-8000-000000000001',
      '2026-07-22'
    )
  $$,
  'P0001',
  'approval decisions require standards_approver role',
  'DEMO_ONLY Admin has no implicit approval authority'
);

set local request.jwt.claim.sub = '11000000-0000-4000-8000-000000000002';

select lives_ok(
  $$
    update public.standard_versions
    set source = 'DEMO_ONLY Draft Source Edited',
        last_edited_by_membership_id = '12000000-0000-4000-8000-000000000002',
        last_edited_at = now() + interval '1 minute'
    where id = '14000000-0000-4000-8000-000000000001'
  $$,
  'DEMO_ONLY Editor edits a Draft version'
);

select throws_ok(
  $$
    insert into public.standards (
      id,
      organization_id,
      kind,
      code,
      name,
      created_by_membership_id,
      updated_by_membership_id
    ) values (
      '13000000-0000-4000-8000-000000000011',
      '10000000-0000-4000-8000-000000000002',
      'material',
      'DEMO_ONLY_CROSS_TENANT',
      'DEMO_ONLY Cross Tenant',
      '12000000-0000-4000-8000-000000000005',
      '12000000-0000-4000-8000-000000000005'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "standards"',
  'DEMO_ONLY Editor cannot write another organization'
);

select throws_ok(
  $$
    insert into public.standard_approvals (
      id,
      organization_id,
      standard_kind,
      standard_id,
      standard_version_id,
      version_number,
      decision,
      decided_by_membership_id,
      effective_date
    ) values (
      '16000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000001',
      'material',
      '13000000-0000-4000-8000-000000000002',
      '14000000-0000-4000-8000-000000000002',
      1,
      'approved',
      '12000000-0000-4000-8000-000000000002',
      '2026-07-22'
    )
  $$,
  'P0001',
  'approval decisions require standards_approver role',
  'DEMO_ONLY Editor cannot approve'
);

set local request.jwt.claim.sub = '11000000-0000-4000-8000-000000000003';

select is(
  (
    with changed as (
      update public.standard_versions
      set status = 'draft',
          submitted_by_membership_id = null,
          submitted_at = null,
          reviewer_membership_id = null,
          reviewed_at = null,
          returned_to_draft_by_membership_id =
            '12000000-0000-4000-8000-000000000003',
          returned_to_draft_at = now(),
          return_reason = 'DEMO_ONLY Direct Change'
      where id = '14000000-0000-4000-8000-000000000002'
      returning id
    )
    select count(*)::integer from changed
  ),
  0,
  'DEMO_ONLY Approver must use an append-only decision'
);

select lives_ok(
  $$
    insert into public.standard_approvals (
      id,
      organization_id,
      standard_kind,
      standard_id,
      standard_version_id,
      version_number,
      decision,
      decided_by_membership_id,
      effective_date
    ) values (
      '16000000-0000-4000-8000-000000000003',
      '10000000-0000-4000-8000-000000000001',
      'material',
      '13000000-0000-4000-8000-000000000002',
      '14000000-0000-4000-8000-000000000002',
      1,
      'approved',
      '12000000-0000-4000-8000-000000000003',
      '2026-07-22'
    )
  $$,
  'DEMO_ONLY independent Approver approves through a decision'
);

select is(
  (
    select status::text
    from public.standard_versions
    where id = '14000000-0000-4000-8000-000000000002'
  ),
  'approved',
  'DEMO_ONLY approval makes the version Approved'
);

select is(
  (
    select actor_membership_id
    from public.audit_logs
    where standard_version_id = '14000000-0000-4000-8000-000000000002'
      and action = 'version_approved'
  ),
  '12000000-0000-4000-8000-000000000003'::uuid,
  'DEMO_ONLY approval audit records the authenticated membership actor'
);

set local request.jwt.claim.sub = '11000000-0000-4000-8000-000000000002';

select throws_ok(
  $$
    update public.material_versions
    set specification = 'DEMO_ONLY Forbidden Approved Edit',
        last_edited_by_membership_id = '12000000-0000-4000-8000-000000000002',
        last_edited_at = now() + interval '2 minutes'
    where id = '14000000-0000-4000-8000-000000000002'
  $$,
  'P0001',
  'version details are editable only while draft',
  'DEMO_ONLY Approved content is immutable'
);

set local request.jwt.claim.sub = '11000000-0000-4000-8000-000000000003';

select throws_ok(
  $$
    insert into public.standard_approvals (
      id,
      organization_id,
      standard_kind,
      standard_id,
      standard_version_id,
      version_number,
      decision,
      decided_by_membership_id,
      effective_date
    ) values (
      '16000000-0000-4000-8000-000000000004',
      '10000000-0000-4000-8000-000000000001',
      'material',
      '13000000-0000-4000-8000-000000000003',
      '14000000-0000-4000-8000-000000000003',
      1,
      'approved',
      '12000000-0000-4000-8000-000000000003',
      '2026-07-22'
    )
  $$,
  'P0001',
  'creator or editor cannot approve the same version',
  'DEMO_ONLY a version editor cannot approve that version'
);

select lives_ok(
  $$
    insert into public.standard_approvals (
      id,
      organization_id,
      standard_kind,
      standard_id,
      standard_version_id,
      version_number,
      decision,
      decided_by_membership_id,
      rationale
    ) values (
      '16000000-0000-4000-8000-000000000005',
      '10000000-0000-4000-8000-000000000001',
      'material',
      '13000000-0000-4000-8000-000000000002',
      '14000000-0000-4000-8000-000000000002',
      1,
      'retired',
      '12000000-0000-4000-8000-000000000003',
      'DEMO_ONLY Retirement Reason'
    )
  $$,
  'DEMO_ONLY Approver retires through a decision'
);

select is(
  (
    select status::text
    from public.standard_versions
    where id = '14000000-0000-4000-8000-000000000002'
  ),
  'retired',
  'DEMO_ONLY retirement makes the version Retired'
);

set local request.jwt.claim.sub = '11000000-0000-4000-8000-000000000002';

select throws_ok(
  $$
    update public.material_versions
    set specification = 'DEMO_ONLY Forbidden Retired Edit',
        last_edited_by_membership_id = '12000000-0000-4000-8000-000000000002',
        last_edited_at = now() + interval '3 minutes'
    where id = '14000000-0000-4000-8000-000000000002'
  $$,
  'P0001',
  'version details are editable only while draft',
  'DEMO_ONLY Retired content is immutable'
);

reset role;
select * from finish();
rollback;
