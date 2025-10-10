# Tracking Issue: Frontend Lint Reduction Initiative

This file serves as a lightweight stand‑in for a GitHub Issue (tool unavailable) to track progress on lint remediation per `LINT_REDUCTION_ROADMAP.md`.

## Context
- Baseline: 285 problems (234 errors / 51 warnings)
- After structural + config cleanup: 173 (126 / 47)
- After initial placeholder + setup fixes: 166 (122 / 44)
- After batch #1 test import cleanup: 162 (118 / 44)
- After batch #2 (in progress) – pending new lint run

Goal: Drive errors to ≤5 (none are `no-undef` / structural) and warnings to justified handful (≤3 intentional suppressions) with documented rationale.

## Category Breakdown (See roadmap for details)
Refer to `LINT_REDUCTION_ROADMAP.md` for canonical category table.

## Executed Batches
| Batch | Date | Scope | Delta | Notes |
|-------|------|-------|-------|-------|
| 0 | Initial | Baseline capture | — | 285 total |
| 1 | Config + structural | Ignore coverage, disable react-refresh in helpers, duplicate pruning | -112 | 285 → 173 |
| 2 | Setup & mock pruning | Removed parse error, jest redeclare, trimmed setupTests | -7 | 173 → 166 |
| 3 | Test imports (first) | 4 suites (Accounting, AnalyticsDashboard, AdvancedSearch, AppointmentRequestQueue) | -4 | 166 → 162 |
| 4 | Test imports (second) | 5 suites (CustomerPortal, DigitalSignaturePad, ExpenseForm, ExpenseList, InteractionList) | pending | Expect additional -5 to -8 errors |

## Next Planned Actions
1. Run lint after Batch 4 edit set → record updated counts.
2. Continue unused test import removal (target: remaining suites with only `render` import unused).
3. Begin component unused variable pruning (start with `App.jsx`, large cluster of menu state vars).
4. Start hook dependency triage (label each with A_INCLUDE / B_MEMOIZE / etc.).
5. Remove obsolete eslint-disable directives after underlying issues resolved.

## Decision Log
| Decision | Rationale | Date |
|----------|-----------|------|
| Keep placeholder nested tests vs delete | Preserves provenance & avoids CI surprises | Earlier phase |
| Disable react-refresh only for test helpers | Avoids global suppression while permitting utility exports | Earlier phase |
| Not auto-fixing hook deps yet | Need classification model to prevent behavioral regressions | Strategy doc created |

## Risks & Mitigations
See roadmap. Added note: Large unreviewed diff risk mitigated by small batch commits and this tracking log.

## Exit Criteria Checklist
- [ ] Errors ≤ 5 (none are accidental unused vars; remaining either intentional or transitional)
- [ ] All hook warnings labeled & justified
- [ ] No stray `no-undef` or `no-case-declarations`
- [ ] All suppressions justified inline + referenced here
- [ ] Roadmap & this tracking file updated with final tallies

--
_Updates to this file should accompany each lint-affecting commit until exit criteria are met._
