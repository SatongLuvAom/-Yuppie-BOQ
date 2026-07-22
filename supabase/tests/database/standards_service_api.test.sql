begin;

create extension if not exists pgtap with schema extensions;

select plan(36);

-- Every fixture and assertion in this file is DEMO_ONLY.
insert into auth.users (id, email) values
  ('21000000-0000-4000-8000-000000000001', 'DEMO_ONLY_service_editor@example.invalid'),
  ('21000000-0000-4000-8000-000000000002', 'DEMO_ONLY_service_approver@example.invalid'),
  ('21000000-0000-4000-8000-000000000003', 'DEMO_ONLY_service_viewer@example.invalid');

insert into public.organizations (id, name) values
  ('20000000-0000-4000-8000-000000000001', 'DEMO_ONLY Service Organization'),
  ('20000000-0000-4000-8000-000000000002', 'DEMO_ONLY Other Organization');

insert into public.organization_memberships (
  id,
  organization_id,
  user_id
) values
  (
    '22000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000001'
  ),
  (
    '22000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000002'
  ),
  (
    '22000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000003'
  );

insert into public.organization_membership_roles (
  organization_id,
  membership_id,
  role
) values
  (
    '20000000-0000-4000-8000-000000000001',
    '22000000-0000-4000-8000-000000000001',
    'standards_editor'
  ),
  (
    '20000000-0000-4000-8000-000000000001',
    '22000000-0000-4000-8000-000000000002',
    'standards_approver'
  ),
  (
    '20000000-0000-4000-8000-000000000001',
    '22000000-0000-4000-8000-000000000003',
    'auditor'
  );

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '21000000-0000-4000-8000-000000000001';

select ok(
  (
    public.standards_create_standard(
      p_organization_id => '20000000-0000-4000-8000-000000000001',
      p_kind => 'material',
      p_code => 'DEMO_ONLY_MATERIAL',
      p_name => 'DEMO_ONLY Material',
      p_classification => 'DEMO_ONLY Classification'
    ) ->> 'audit_log_id'
  ) is not null,
  'DEMO_ONLY creating a Material returns its atomic audit receipt'
);

select is(
  (
    select count(*)::integer
    from public.materials as material
    join public.standards as standard on standard.id = material.id
    where standard.code = 'DEMO_ONLY_MATERIAL'
  ),
  1,
  'DEMO_ONLY Material identity and subtype are created together'
);

select is(
  (
    select count(*)::integer
    from public.audit_logs
    where action = 'standard_created'
  ),
  1,
  'DEMO_ONLY standard creation writes one audit event'
);

select ok(
  (
    public.standards_create_version(
      p_organization_id => '20000000-0000-4000-8000-000000000001',
      p_standard_id => (
        select id from public.standards where code = 'DEMO_ONLY_MATERIAL'
      ),
      p_kind => 'material',
      p_source => 'DEMO_ONLY Material Source',
      p_unit => 'DEMO_ONLY Unit',
      p_specification => 'DEMO_ONLY Specification',
      p_applicability => 'DEMO_ONLY Applicability'
    ) ->> 'audit_log_id'
  ) is not null,
  'DEMO_ONLY creating a Material Version returns its audit receipt'
);

select is(
  (
    select count(*)::integer
    from public.material_versions as detail
    join public.standard_versions as version on version.id = detail.id
    where version.status = 'draft'
      and version.standard_id = (
        select id from public.standards where code = 'DEMO_ONLY_MATERIAL'
      )
  ),
  1,
  'DEMO_ONLY Material Version and detail are created atomically as Draft'
);

select ok(
  (
    public.standards_update_standard(
      p_organization_id => '20000000-0000-4000-8000-000000000001',
      p_standard_id => (
        select id from public.standards where code = 'DEMO_ONLY_MATERIAL'
      ),
      p_kind => 'material',
      p_code => 'DEMO_ONLY_MATERIAL_EDITED',
      p_name => 'DEMO_ONLY Material Edited',
      p_classification => 'DEMO_ONLY Classification Edited'
    ) ->> 'audit_log_id'
  ) is not null,
  'DEMO_ONLY editing a standard identity returns its audit receipt'
);

select is(
  (
    select name
    from public.standards
    where code = 'DEMO_ONLY_MATERIAL_EDITED'
  ),
  'DEMO_ONLY Material Edited',
  'DEMO_ONLY standard identity edit is persisted'
);

select ok(
  (
    public.standards_update_draft_version(
      p_organization_id => '20000000-0000-4000-8000-000000000001',
      p_standard_id => (
        select id from public.standards where code = 'DEMO_ONLY_MATERIAL_EDITED'
      ),
      p_standard_version_id => (
        select version.id
        from public.standard_versions as version
        join public.standards as standard on standard.id = version.standard_id
        where standard.code = 'DEMO_ONLY_MATERIAL_EDITED'
      ),
      p_kind => 'material',
      p_source => 'DEMO_ONLY Material Source Edited',
      p_unit => 'DEMO_ONLY Unit Edited',
      p_specification => 'DEMO_ONLY Specification Edited',
      p_applicability => 'DEMO_ONLY Applicability Edited'
    ) ->> 'audit_log_id'
  ) is not null,
  'DEMO_ONLY editing a Draft Version returns its audit receipt'
);

select is(
  (
    select detail.specification
    from public.material_versions as detail
    join public.standard_versions as version on version.id = detail.id
    join public.standards as standard on standard.id = version.standard_id
    where standard.code = 'DEMO_ONLY_MATERIAL_EDITED'
  ),
  'DEMO_ONLY Specification Edited',
  'DEMO_ONLY Draft Version content edit is persisted'
);

select ok(
  (
    public.standards_add_evidence(
      p_organization_id => '20000000-0000-4000-8000-000000000001',
      p_standard_version_id => (
        select version.id
        from public.standard_versions as version
        join public.standards as standard on standard.id = version.standard_id
        where standard.code = 'DEMO_ONLY_MATERIAL_EDITED'
      ),
      p_title => 'DEMO_ONLY Material Evidence',
      p_source => 'DEMO_ONLY Evidence Source',
      p_source_uri => null,
      p_content_hash => null,
      p_captured_at => now()
    ) ->> 'evidence_id'
  ) is not null,
  'DEMO_ONLY adding Evidence returns its immutable Evidence ID'
);

select is(
  (
    select count(*)::integer
    from public.audit_logs
    where action = 'evidence_added'
  ),
  1,
  'DEMO_ONLY Evidence mutation creates an audit event'
);

select is(
  jsonb_array_length(
    public.standards_get_version_mutation_context(
      '20000000-0000-4000-8000-000000000001',
      (
        select version.id
        from public.standard_versions as version
        join public.standards as standard on standard.id = version.standard_id
        where standard.code = 'DEMO_ONLY_MATERIAL_EDITED'
      )
    ) -> 'evidence_ids'
  ),
  1,
  'DEMO_ONLY mutation context returns exact-version Evidence'
);

select ok(
  (
    public.standards_submit_for_review(
      '20000000-0000-4000-8000-000000000001',
      (
        select version.id
        from public.standard_versions as version
        join public.standards as standard on standard.id = version.standard_id
        where standard.code = 'DEMO_ONLY_MATERIAL_EDITED'
      ),
      '22000000-0000-4000-8000-000000000002'
    ) ->> 'audit_log_id'
  ) is not null,
  'DEMO_ONLY submit for Review returns its audit receipt'
);

select is(
  (
    select version.status::text
    from public.standard_versions as version
    join public.standards as standard on standard.id = version.standard_id
    where standard.code = 'DEMO_ONLY_MATERIAL_EDITED'
  ),
  'review',
  'DEMO_ONLY submit moves the Version to Review'
);

select is(
  (
    select count(*)::integer
    from public.audit_logs
    where action = 'submitted_for_review'
  ),
  1,
  'DEMO_ONLY submit creates an audit event'
);

set local request.jwt.claim.sub = '21000000-0000-4000-8000-000000000003';

select throws_ok(
  $$
    select public.standards_create_standard(
      p_organization_id => '20000000-0000-4000-8000-000000000001',
      p_kind => 'material',
      p_code => 'DEMO_ONLY_VIEWER_WRITE',
      p_name => 'DEMO_ONLY Viewer Write',
      p_classification => 'DEMO_ONLY Viewer Classification'
    )
  $$,
  '42501',
  'the authenticated actor lacks the required organization role',
  'DEMO_ONLY Viewer cannot call an Editor mutation RPC'
);

select throws_ok(
  $$
    select public.standards_get_version_mutation_context(
      '20000000-0000-4000-8000-000000000002',
      (
        select id from public.standard_versions limit 1
      )
    )
  $$,
  '42501',
  'the authenticated actor is not an organization member',
  'DEMO_ONLY mutation context cannot cross organizations'
);

set local request.jwt.claim.sub = '21000000-0000-4000-8000-000000000002';

select ok(
  (
    public.standards_approve_version(
      '20000000-0000-4000-8000-000000000001',
      (
        select version.id
        from public.standard_versions as version
        join public.standards as standard on standard.id = version.standard_id
        where standard.code = 'DEMO_ONLY_MATERIAL_EDITED'
      ),
      '2026-07-22'
    ) ->> 'audit_log_id'
  ) is not null,
  'DEMO_ONLY independent Approver receives an approval audit receipt'
);

select is(
  (
    select version.status::text
    from public.standard_versions as version
    join public.standards as standard on standard.id = version.standard_id
    where standard.code = 'DEMO_ONLY_MATERIAL_EDITED'
  ),
  'approved',
  'DEMO_ONLY approval moves the Version to Approved'
);

select is(
  (
    select count(*)::integer
    from public.audit_logs
    where action = 'version_approved'
  ),
  1,
  'DEMO_ONLY approval uses the existing append-only audit trigger'
);

set local request.jwt.claim.sub = '21000000-0000-4000-8000-000000000001';

select throws_ok(
  $$
    select public.standards_update_draft_version(
      p_organization_id => '20000000-0000-4000-8000-000000000001',
      p_standard_id => (
        select id from public.standards where code = 'DEMO_ONLY_MATERIAL_EDITED'
      ),
      p_standard_version_id => (
        select version.id
        from public.standard_versions as version
        join public.standards as standard on standard.id = version.standard_id
        where standard.code = 'DEMO_ONLY_MATERIAL_EDITED'
      ),
      p_kind => 'material',
      p_source => 'DEMO_ONLY Forbidden Source',
      p_unit => 'DEMO_ONLY Forbidden Unit',
      p_specification => 'DEMO_ONLY Forbidden Specification',
      p_applicability => 'DEMO_ONLY Forbidden Applicability'
    )
  $$,
  'P0001',
  'version details are editable only while draft',
  'DEMO_ONLY Approved Version cannot be edited'
);

set local request.jwt.claim.sub = '21000000-0000-4000-8000-000000000002';

select ok(
  (
    public.standards_retire_version(
      '20000000-0000-4000-8000-000000000001',
      (
        select version.id
        from public.standard_versions as version
        join public.standards as standard on standard.id = version.standard_id
        where standard.code = 'DEMO_ONLY_MATERIAL_EDITED'
      ),
      'DEMO_ONLY Retirement Rationale'
    ) ->> 'audit_log_id'
  ) is not null,
  'DEMO_ONLY retirement returns its audit receipt'
);

select is(
  (
    select version.status::text
    from public.standard_versions as version
    join public.standards as standard on standard.id = version.standard_id
    where standard.code = 'DEMO_ONLY_MATERIAL_EDITED'
  ),
  'retired',
  'DEMO_ONLY retirement moves the Version to Retired'
);

select is(
  (
    select count(*)::integer
    from public.audit_logs
    where action = 'version_retired'
  ),
  1,
  'DEMO_ONLY retirement creates an append-only audit event'
);

set local request.jwt.claim.sub = '21000000-0000-4000-8000-000000000001';

select ok(
  (
    public.standards_create_standard(
      p_organization_id => '20000000-0000-4000-8000-000000000001',
      p_kind => 'labor',
      p_code => 'DEMO_ONLY_LABOR',
      p_name => 'DEMO_ONLY Labor',
      p_category => 'DEMO_ONLY Labor Category'
    ) ->> 'audit_log_id'
  ) is not null,
  'DEMO_ONLY creating a Labor Standard returns its audit receipt'
);

select ok(
  (
    public.standards_create_version(
      p_organization_id => '20000000-0000-4000-8000-000000000001',
      p_standard_id => (
        select id from public.standards where code = 'DEMO_ONLY_LABOR'
      ),
      p_kind => 'labor',
      p_source => 'DEMO_ONLY Labor Source',
      p_unit => 'DEMO_ONLY Labor Unit',
      p_applicability => 'DEMO_ONLY Labor Applicability',
      p_interpretation_basis => 'DEMO_ONLY Interpretation Basis'
    ) ->> 'audit_log_id'
  ) is not null,
  'DEMO_ONLY creating a Labor Version returns its audit receipt'
);

select is(
  (
    select count(*)::integer from public.labor_versions
  ),
  1,
  'DEMO_ONLY Labor Version stores only its governed definition fields'
);

select ok(
  (
    public.standards_add_evidence(
      p_organization_id => '20000000-0000-4000-8000-000000000001',
      p_standard_version_id => (
        select version.id
        from public.standard_versions as version
        join public.standards as standard on standard.id = version.standard_id
        where standard.code = 'DEMO_ONLY_LABOR'
      ),
      p_title => 'DEMO_ONLY Labor Evidence',
      p_source => 'DEMO_ONLY Labor Evidence Source',
      p_source_uri => null,
      p_content_hash => null,
      p_captured_at => now()
    ) ->> 'audit_log_id'
  ) is not null,
  'DEMO_ONLY Labor Evidence mutation returns its audit receipt'
);

select ok(
  (
    public.standards_submit_for_review(
      '20000000-0000-4000-8000-000000000001',
      (
        select version.id
        from public.standard_versions as version
        join public.standards as standard on standard.id = version.standard_id
        where standard.code = 'DEMO_ONLY_LABOR'
      ),
      '22000000-0000-4000-8000-000000000002'
    ) ->> 'audit_log_id'
  ) is not null,
  'DEMO_ONLY Labor submit returns its audit receipt'
);

set local request.jwt.claim.sub = '21000000-0000-4000-8000-000000000002';

select ok(
  (
    public.standards_reject_version(
      '20000000-0000-4000-8000-000000000001',
      (
        select version.id
        from public.standard_versions as version
        join public.standards as standard on standard.id = version.standard_id
        where standard.code = 'DEMO_ONLY_LABOR'
      ),
      'DEMO_ONLY Rejection Rationale'
    ) ->> 'audit_log_id'
  ) is not null,
  'DEMO_ONLY Reject returns its decision and audit receipt'
);

select is(
  (
    select version.status::text
    from public.standard_versions as version
    join public.standards as standard on standard.id = version.standard_id
    where standard.code = 'DEMO_ONLY_LABOR'
  ),
  'draft',
  'DEMO_ONLY Reject returns the Version to Draft'
);

select is(
  (
    select count(*)::integer
    from public.audit_logs
    where action = 'changes_requested'
  ),
  1,
  'DEMO_ONLY Reject creates an append-only audit event'
);

set local request.jwt.claim.sub = '21000000-0000-4000-8000-000000000001';

select ok(
  (
    public.standards_create_standard(
      p_organization_id => '20000000-0000-4000-8000-000000000001',
      p_kind => 'work_method',
      p_code => 'DEMO_ONLY_WORK_METHOD',
      p_name => 'DEMO_ONLY Work Method',
      p_intended_scope => 'DEMO_ONLY Intended Scope'
    ) ->> 'audit_log_id'
  ) is not null,
  'DEMO_ONLY creating a Work Method returns its audit receipt'
);

select ok(
  (
    public.standards_create_version(
      p_organization_id => '20000000-0000-4000-8000-000000000001',
      p_standard_id => (
        select id from public.standards where code = 'DEMO_ONLY_WORK_METHOD'
      ),
      p_kind => 'work_method',
      p_source => 'DEMO_ONLY Work Method Source',
      p_method_description => 'DEMO_ONLY Method Description',
      p_conditions => 'DEMO_ONLY Conditions',
      p_referenced_standard_version_ids => '{}'::uuid[]
    ) ->> 'audit_log_id'
  ) is not null,
  'DEMO_ONLY creating a Work Method Version returns its audit receipt'
);

select is(
  (
    select count(*)::integer from public.work_method_versions
  ),
  1,
  'DEMO_ONLY Work Method Version stores its governed definition fields'
);

select is(
  (
    select count(*)::integer
    from public.audit_logs
    where action in (
      'standard_created',
      'standard_edited',
      'version_created',
      'version_edited',
      'evidence_added',
      'submitted_for_review',
      'version_approved',
      'changes_requested',
      'version_retired'
    )
  ),
  15,
  'DEMO_ONLY every successful Phase 1D mutation has an audit event'
);

reset role;
select * from finish();
rollback;
