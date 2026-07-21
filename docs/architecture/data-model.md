# Standards Workspace Data Model

Phase 1B models organization-scoped Material, Labor, and Work Method standards.
`standards` and `standard_versions` hold shared identity and governance fields;
the kind-specific tables hold only category content.

```mermaid
erDiagram
  organizations ||--o{ organization_memberships : contains
  organization_memberships ||--o{ organization_membership_roles : receives
  organizations ||--o{ standards : owns
  organization_memberships ||--o{ standards : creates

  standards ||--o| materials : specializes
  standards ||--o| labor_standards : specializes
  standards ||--o| work_methods : specializes
  standards ||--o{ standard_versions : versions

  standard_versions ||--o| material_versions : details
  standard_versions ||--o| labor_versions : details
  standard_versions ||--o| work_method_versions : details
  standard_versions ||--o{ standard_version_editors : edited_by
  organization_memberships ||--o{ standard_version_editors : edits

  standard_versions ||--o{ standard_evidence : supports
  standard_versions ||--o{ standard_approvals : decides
  organization_memberships ||--o{ standard_evidence : adds
  organization_memberships ||--o{ standard_approvals : decides

  work_method_versions ||--o{ work_method_standard_references : source
  standard_versions ||--o{ work_method_standard_references : referenced

  organizations ||--o{ audit_logs : retains
  organization_memberships ||--o{ audit_logs : acts
  standard_versions ||--o{ audit_logs : traces

  organizations {
    uuid id PK
    text name
    timestamptz created_at
    timestamptz updated_at
  }

  organization_memberships {
    uuid id PK
    uuid organization_id FK
    uuid user_id
    timestamptz joined_at
    timestamptz ended_at
  }

  organization_membership_roles {
    uuid organization_id PK,FK
    uuid membership_id PK,FK
    membership_role role PK
  }

  standards {
    uuid id PK
    uuid organization_id FK
    standard_kind kind
    text code
    text name
    uuid created_by_membership_id FK
    uuid updated_by_membership_id FK
  }

  materials {
    uuid id PK,FK
    uuid organization_id FK
    text classification
  }

  labor_standards {
    uuid id PK,FK
    uuid organization_id FK
    text labor_category
  }

  work_methods {
    uuid id PK,FK
    uuid organization_id FK
    text intended_scope
  }

  standard_versions {
    uuid id PK
    uuid organization_id FK
    uuid standard_id FK
    standard_kind standard_kind
    integer version_number
    standard_lifecycle_status status
    text source
    uuid created_by_membership_id FK
    uuid last_edited_by_membership_id FK
    uuid reviewer_membership_id FK
    uuid approved_by_membership_id FK
    date effective_date
    uuid retired_by_membership_id FK
  }

  material_versions {
    uuid id PK,FK
    uuid organization_id FK
    text unit
    text specification
    text applicability
  }

  labor_versions {
    uuid id PK,FK
    uuid organization_id FK
    text unit
    text interpretation_basis
    text applicability
  }

  work_method_versions {
    uuid id PK,FK
    uuid organization_id FK
    text method_description
    text conditions
  }

  standard_version_editors {
    uuid organization_id PK,FK
    uuid standard_version_id PK,FK
    uuid editor_membership_id PK,FK
    timestamptz first_edited_at
  }

  standard_evidence {
    uuid id PK
    uuid organization_id FK
    uuid standard_version_id FK
    standard_kind standard_kind
    text title
    text source
    text source_uri
    timestamptz captured_at
  }

  standard_approvals {
    uuid id PK
    uuid organization_id FK
    uuid standard_version_id FK
    approval_decision decision
    uuid decided_by_membership_id FK
    timestamptz decided_at
    date effective_date
  }

  work_method_standard_references {
    uuid id PK
    uuid organization_id FK
    uuid work_method_version_id FK
    uuid referenced_standard_version_id FK
  }

  audit_logs {
    uuid id PK
    uuid organization_id FK
    uuid actor_membership_id FK
    text action
    text subject_type
    uuid subject_id
    uuid standard_version_id FK
    text outcome
    timestamptz occurred_at
  }
```

All cross-table references include `organization_id`. The only table without it
is `organizations`, which is the tenant root rather than an organization-owned
business record.
