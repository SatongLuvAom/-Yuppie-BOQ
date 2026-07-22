# Standards Workspace Security

Phase 1C uses Supabase Auth identity plus active organization membership as the
tenant boundary. `auth.uid()` is resolved to one organization-scoped membership;
RLS then evaluates that membership for every Standards Workspace table.

## Roles and Authority

| Phase 1C label | Persisted role | Authority |
| --- | --- | --- |
| Admin | `organization_admin` | Manage organization metadata, memberships, and role assignments |
| Editor | `standards_editor` | Create and edit Draft content; submit or withdraw own Review |
| Approver | `standards_approver` | Decide Review, approve, request changes, and retire through append-only decisions |
| Viewer | `auditor` | Read-only Standards Workspace access |

Admin does not inherit Editor or Approver authority. The accepted `estimator`
role remains read-only in this workspace.

## Enforcement

- All 16 tenant and Standards tables have RLS enabled. Cross-organization reads,
  writes, references, and decisions resolve to no row or fail policy checks.
- Authenticated table grants are explicit. Evidence and audit history expose no
  client delete privilege; audit history also exposes no direct client insert.
- The existing approval trigger is the trusted atomic path that changes version
  state and appends its audit event. Its decision row must identify the current
  authenticated membership and pass the independent-Approver database rules.
- Approved and Retired content remains protected by the Phase 1B immutability
  triggers. RLS does not duplicate lifecycle business rules.
- Security-definer helpers use a fixed search path and expose only membership and
  role predicates. Anonymous callers receive no table or helper access.
- Organization creation and the first Admin membership are bootstrap operations
  for a trusted server/administrative process; they are not browser operations.

No service-role key, access token, signing key, or provider secret belongs in a
client bundle or committed repository file.

## Verification

`supabase/tests/database/standards_rls.test.sql` exercises real Supabase
PostgreSQL/Auth roles on a GitHub-hosted runner: tenant isolation, Viewer
read-only access, Editor Draft access, independent approval, immutable history,
and audit actor attribution. The dedicated workflow replays migrations before
running pgTAP. PGlite tests remain Phase 1B constraint tests and are not accepted
as RLS verification.
