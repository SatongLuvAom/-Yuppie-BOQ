# Database Adapter Boundary

This package will host persistence adapters after their phase is approved.
Phase 1B intentionally adds no API or query abstraction.

Domain actors use `userId`. Database actor columns use an organization-scoped
membership ID; an adapter must join on `(organization_id, membership_id)` and
return that membership's `user_id`. It must never resolve an actor by membership
ID without the organization key.
