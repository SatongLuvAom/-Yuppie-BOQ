# Supabase Rules

- Supabase is a persistence and access-control adapter, not the owner of business rules.
- Keep migrations forward-only, reviewable, and free of invented domain data.
- Auth and RLS implementation belongs to a later approved phase.
- Do not add sample data; test-only data must be clearly labeled `DEMO_ONLY`.
- Do not edit files outside the task's owned paths.

