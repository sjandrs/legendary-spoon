# Issue: Massive Unused Variables / Imports Cleanup

## Summary
Current frontend lint run reports 1,533 errors (primary category: `no-unused-vars`) and 21 warnings (mostly `react-hooks/exhaustive-deps`). Noise obscures meaningful regressions and slows code review velocity.

## Scope of Debt
- Test Files: ~75% of unused-var occurrences (redundant imports: `render`, `fireEvent`, `userEvent`, factory helpers, unreferenced selectors).
- Component Files: Repeated `_err` patterns partly solved; remaining include placeholder error captures that should be prefixed with `_` or removed.
- Hook Deps Warnings: Legacy data loaders not yet wrapped in `useCallback` (e.g., `Account*`, `Quote*`, `Reports`, `TaxReport`, `AnalyticsSnapshots`). Some require justification comments.

## Root Causes
1. Bulk scaffolding of tests with over-imported utilities.
2. Evolution of component fetch logic without pruning prior helpers.
3. Missing standard for naming intentionally unused args/vars (`_` prefix policy partially applied).
4. Absence of a codemod/automated pass after major refactors.

## Proposed Multi-Phase Remediation
| Phase | Goal | Actions | Est. Effort |
|-------|------|---------|------------|
| 1 | Test Import Prune | Auto-remove unused imports (JSCodeshift / eslint --fix plugin) on `src/__tests__` | 0.5 day |
| 2 | Intentional Unused Normalization | Prefix deliberate placeholders with `_` (error params, callback placeholders) | 0.5 day |
| 3 | Component Data Loader Stabilization | Introduce `useCallback` wrappers + HOOK-JUSTIFY where one-time | 1 day |
| 4 | Enable Stricter ESLint Gate | Add pre-commit rule blocking new unused occurrences; allow legacy via baseline file | 0.5 day |
| 5 | Final Purge & Baseline Removal | Remove baseline; enforce zero new debt | 0.5 day |

## Automation Strategy
- Write codemod: identify imports whose specifiers absent in AST usage; remove entire import or specifier.
- Script to prefix error params: find `catch (err)` with unused `err` and rename to `_err` unless logged.
- Optional: Introduce ESLint `reportUnusedDisableDirectives` and `@typescript-eslint/no-unused-vars` alignment (future TS migration prep).

## Acceptance Criteria
- Unused-var errors reduced by ≥90% (<=150) post Phase 3.
- All remaining hook dependency warnings either resolved or have HOOK-JUSTIFY comments.
- Pre-commit hook blocks new unused vars (net increase prohibited).
- Documentation updated (`FRONTEND_TESTING.md` lint section) with new rules.

## Metrics & Tracking
- Baseline count: 1,533 unused-var errors (timestamp: current run).
- Add progress table in this issue updated per PR.

| Date | PR | Remaining Errors | Notes |
|------|----|------------------|-------|
| (baseline) | — | 1,533 | Initial capture |

## Risks
- Over-aggressive codemod could delete imports used in dynamic expressions (rare). Mitigation: run with dry-run & git diff review.
- Minor merge conflicts with active feature branches: communicate freeze window for mass cleanup.

## Out of Scope
- Converting test utilities to ESM (tracked separately TEST-UTILS-ESM-001 if needed).
- Refactoring business logic.

## Next Action
Implement Phase 1 codemod & submit PR referencing this issue.

---
Owner: Frontend Tech Debt Initiative
Priority: High (improves signal-to-noise for future refactors)
