# ADR-001 Migration Checklist – EnhancedUser → CustomUser Consolidation

This checklist operationalizes ADR-001 to eliminate the dual user model by migrating EnhancedUser fields into CustomUser.

## Assumptions
- CustomUser is the active auth user model.
- EnhancedUser contains additional fields (manager/subordinate, department, job title, technician link).
- Minimal downtime target; prefer zero-downtime with feature flag.

## Rollout Plan (Phased)
1. Prepare schema (PR 1)
   - Add new nullable columns to `CustomUser` for all EnhancedUser fields.
   - Add FKs for hierarchical relationships (self-referential manager_id) and technician link (nullable FK).
   - Data constraints deferred; allow nulls initially.
2. Dual-read adapters (PR 1)
   - Update serializers/services to read from CustomUser if present else EnhancedUser.
   - Logging to note which source served data (temporary).
3. Data migration (PR 2)
   - One-off management command: copy EnhancedUser fields → CustomUser columns by user id mapping.
   - Idempotent design; dry-run mode with counts and sample diffs.
4. Dual-write shim (PR 2)
   - On write operations, write to CustomUser and EnhancedUser (if exists) for a single release window.
   - Add metrics to monitor divergence (temporary).
5. Feature flag cutover (PR 3)
   - Default reads to CustomUser; fall back disabled behind flag.
   - Bake in staging for 3–5 days; production canary with monitoring.
6. Decommission (PR 4)
   - Remove EnhancedUser references; drop dual-write; delete EnhancedUser table.
   - Add non-null constraints and indexes on new CustomUser columns as required.

## Detailed Steps
- Schema
  - Migrations: add fields; add indexes for `manager_id`, `department`, `job_title` if used in queries.
  - Ensure reverse relations updated in serializers and admin.
- Data
  - Backfill script: batch in chunks; commit per chunk; record counts; resume capability.
  - Verify: random sample comparison; totals per field; null rates.
- App Code
  - Guards in views/serializers to avoid attribute errors while both models exist.
  - Permission checks updated to use CustomUser fields.
- Tests
  - Unit: serialization of hierarchy, technician link, department/title.
  - Integration: permissions using manager/subordinate relationships.
  - Migration test: run backfill on fixture data and assert equivalence.
- Observability
  - Add counters: dual-read fallbacks used; dual-write divergence.
  - Add log_activity entries for cutover events.

## Rollback Plan
- If issues post-cutover, toggle feature flag to enable fallback reads.
- Re-run backfill if divergence detected; keep EnhancedUser table until decommission.

## Success Criteria
- All reads/writes use CustomUser only; tests green.
- No fallbacks used for 7 days in production.
- EnhancedUser table removed; constraints enforced.

## Operational Notes
- Coordinate with QA for canary validation and regression runs.
- Communicate user-facing impact: none expected; internal admin UI may change.
- Schedule off-peak for decommission migration.
