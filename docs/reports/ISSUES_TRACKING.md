# Pending Technical Debt & Refactor Issues

This document enumerates proposed GitHub issues to track remaining quality / refactor work discovered during the hook dependency remediation effort.

---
## ESLINT-001: Bulk Unused Variable & Import Cleanup
**Type:** Maintenance / Code Quality
**Problem:** ~1500+ lint errors dominated by `no-unused-vars` across tests and components obscure meaningful warnings (especially hook dependency warnings) and slow code review.
**Scope:** Remove or rename unused variables/imports; introduce consistent naming (prefix `_` for intentionally unused values); prune dead code branches.
**Acceptance Criteria:**
- Lint run shows < 25 total `no-unused-vars` occurrences (excluding intentionally ignored `_` vars).
- All orphaned imports removed (no single-file introduces new unused import warnings).
- Update developer docs with naming guideline for intentionally ignored vars.

**Non-Goals:** Deep refactors of logic; rewriting test assertions; addressing hook warnings (separate issues).
**Risks:** Accidental removal of test helper variables used in dynamic `eval`/string matching (mitigate by search before deletion).
**Effort:** Medium (3–4 focused passes or scripted autofix + manual review).

---
## HOOKS-ORCH-001: Orchestrator Hook Dependency Refactors
**Type:** Refactor / Stability
**Targets:** `AdvancedSearch.jsx`, `SchedulePage.jsx`, `SchedulingDashboard.jsx`
**Problem:** Complex components have multi-effect orchestration with missing dependencies causing stale closures and unpredictable reload behaviors.
**Strategy:**
1. Introduce stable `useCallback` wrappers for core fetchers (`loadAvailableFilters`, `triggerSearch`, `loadInitialData`, `loadDashboardData`, `loadAnalyticsData`).
2. Split initial bootstrap vs. reactive update effects; ensure each effect has a minimal, explicit dependency array.
3. Add fetch-count + param-change tests verifying: single initial load, subsequent reloads only when relevant inputs change.
4. Replace inline object/array deps with `useMemo` if necessary.

**Acceptance Criteria:**
- Zero exhaustive-deps warnings for targeted files.
- New tests demonstrate no double initial fetch and correct fetch on search parameter change.
- No regression in existing tests.

**Risks:** Over-fetch if dependencies over-included; mitigated by tests capturing call counts.
**Effort:** Medium-high (careful sequencing & test authoring).

---
## HOOKS-CALENDAR-001: TaskCalendar Effect Consolidation
**Type:** Refactor / Stability
**Problem:** Multiple effects (load + task-to-event mapping) operate separately; potential for race conditions or stale mappings if future logic added. Missing dependency warnings remain for downstream forms in other components (TaskCalendar still has separate bootstrap patterns).
**Actions:**
- Convert `loadTasks` to `useCallback` and include in initial bootstrap effect.
- Evaluate combining mapping effect into derivation via `useMemo(events from tasks)` rather than a second `useEffect`.
- Add fetch-count test for initial task load.

**Acceptance Criteria:**
- No exhaustive-deps warnings in `TaskCalendar.jsx`.
- Derivation of events is purely functional (memoized); effect solely for data fetch.

**Effort:** Low-Medium.

---
## TEST-UTILS-ESM-001: Convert CommonJS Test Utilities to ESM
**Type:** Maintenance / Consistency
**Problem:** Remaining `require`, `module`, `__dirname` references and CommonJS patterns force node globals and complicate linting/transform pipeline.
**Solution:** Rewrite affected utilities (`test-utils.js`, `suppress-usage.test.js`, any legacy CJS) to ESM imports/exports; remove node global dependency for tests.
**Acceptance Criteria:**
- All test utilities use `import`/`export`.
- ESLint config no longer needs Node globals for test directory (except where truly interacting with fs/path).
- No `no-undef` errors for `require`/`module` in tests.

**Effort:** Low.

---
## LINT-RULE-ADJUST-001: Refine no-unused-vars Strategy
**Type:** Tooling / Developer Experience
**Problem:** Intentionally ignored variables (e.g. destructured placeholders, stubbed params) raise noise; current pattern only ignores ALL_CAPS.
**Change:** Update ESLint rule to ignore leading underscore variables for both vars and args: `{ "varsIgnorePattern": "^[A-Z_]|^_", "argsIgnorePattern": "^_" }`.
**Acceptance Criteria:**
- Lint passes with intentionally ignored underscore-prefixed identifiers not flagged.
- Documentation updated (CONTRIBUTING or DEVELOPMENT) describing convention.

**Effort:** Low.

---
## Sequencing Recommendation
1. LINT-RULE-ADJUST-001 (fast)
2. HOOKS-ORCH-001 (adds the most stability)
3. HOOKS-CALENDAR-001
4. ESLINT-001 (bulk cleanup once structural warnings gone)
5. TEST-UTILS-ESM-001 (final polish)

---
## Rollback / Safety
Each refactor will be isolated per commit with:
- Before/after lint snapshot (count of warnings)
- Added/updated tests green
- Clear commit message referencing issue key

---
## Metrics to Track
| Metric | Baseline | Target |
|--------|----------|--------|
| Hook exhaustive-deps warnings (orchestrators + calendar) | 10+ | 0 |
| Unused vars errors | ~1500 | <25 (Phase 1), <5 (Phase 2) |
| Double-fetch incidents (new tests) | Unknown | 0 |
| CommonJS test utils | >2 | 0 |

---
## Ready for Issue Creation
Content here can be copy-pasted into individual GitHub issues.
