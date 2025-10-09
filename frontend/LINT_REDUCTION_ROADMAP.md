# Frontend Lint Reduction Roadmap

## Current Status (Baseline & Deltas)
- Original baseline: 285 problems (234 errors / 51 warnings)
- After structural & config fixes: 173 problems (126 errors / 47 warnings)
- Latest pass (post placeholder + setupTests cleanup): 166 problems (122 errors / 44 warnings)
- Net reduction: 119 total issues eliminated (~41.75%)

## Remaining Problem Composition (High-Level Buckets)
| Category | Approx Count | Type | Notes |
|----------|--------------|------|-------|
| Unused vars in tests (render / fireEvent / userEvent / locals) | ~55 | Errors | Fast mechanical cleanup; no behavior risk |
| Unused vars in components (navigation, interim state) | ~25 | Errors | Need prune or prefix with `_` if future use planned |
| Hook dependency warnings (`react-hooks/exhaustive-deps`) | ~30 | Warnings | Requires triage: add deps vs stable callbacks vs intentional ignore |
| Unused eslint-disable directives | ~15 | Warnings | Remove once underlying code cleaned |
| Misc no-unused-vars in forms (e,e1,e2,err placeholders) | ~20 | Errors | Consolidate error handlers or remove placeholders |
| Minor no-case-declarations, no-useless-escape | 3 | Errors | Simple refactors (wrap case block, remove escapes) |
| Residual no-undef in isolated tests (`queryClient`) | 1-2 | Errors | Add mock/import or remove usage |

> Counts are approximate; final numbers will shift as categories are addressed. Priority order chosen to maximize early, low-risk error removal and shrink noise before logic-sensitive refactors.

## Guiding Principles
1. **Safety First:** Only remove code that is verifiably unused (no references, not part of upcoming roadmap features). If uncertain, demote to `_placeholder` variable naming (silences rule while signaling intent) rather than outright deletion.
2. **Batch Size Discipline:** Limit edits to 5–8 files per commit to keep diffs reviewable; each batch should reduce issue count measurably (≥10% of starting batch issues).
3. **Avoid Blanket Disables:** Prefer targeted fixes. Any persistent disable must include justification comment and (if applicable) a follow-up issue reference.
4. **Refactor with Tests:** When adjusting hook dependencies, add/extend component tests covering the affected effect behavior (mount logic, dependency-triggered updates) before refactor.
5. **Track Progress Quantitatively:** Re-run `npm run lint` after every batch; log new totals inside this file (append under Progress Log) to maintain transparency.

## Remediation Phases
### Phase 1: Fast Mechanical Test Cleanup
- Remove unused imported helpers (`render`, `fireEvent`, `within`, `userEvent`) when not referenced.
- Remove unused local assignments (`user`, `container`, `periodSelect`, etc.) or inline usages where trivial.
- Fix isolated `no-undef` (e.g., `queryClient`) by importing or replacing with deterministic stub.
- Goal: Reduce error count by ~35–40 (to <=90 errors overall).

### Phase 2: Component Unused Vars & Placeholders
- Audit component-level unused state/vars; remove or convert to `_IGNORED_*` naming only if placeholder for imminent feature (document rationale inline).
- Consolidate duplicated handler placeholders (`e`, `e1`, `e2`, `err`) into single `error` variable when required inside catch blocks.
- Goal: Reduce remaining unused-var errors by another ~20.

### Phase 3: Hook Dependency Triage
For each `react-hooks/exhaustive-deps` warning:
- Classify: (A) Safe to add dependency, (B) Requires memoization/wrapper (`useCallback`, `useRef`), (C) Intentional one-time effect (justify with comment & disable next-line only), (D) Needs logic refactor.
- Apply changes incrementally; add/adjust tests verifying effect triggers (especially for projections, data fetch, or analytics loads).
- Goal: Reduce warnings from ~30 to <5 (remaining are justified & documented).

### Phase 4: Residual Polish
- Remove stale eslint-disable directives once underlying issues are gone.
- Normalize case block declarations (wrap in braces) & escape usage cleanup.
- Final pass for consistency: ensure no lingering `_IGNORED_` markers without an opened issue.
- Goal: Reach near-zero errors (<=5) and only intentional, documented warnings (<=3).

## Acceptance Criteria
- Lint errors: 0 to 5 (must not include `no-undef` or `no-case-declarations`).
- Warnings: Each has an inline justification or pending improvement issue ID.
- No blanket rule suppressions added beyond those already documented.
- All hook dependency decisions documented with rationale comment OR test additions.
- Roadmap file updated with final tally & confirmation section.

## Risk & Mitigation
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Accidental removal of soon-to-be-used code | Medium | Use `_` prefix instead of deletion when uncertain; code review gate |
| Behavioral change from hook dependency adjustments | High | Add/extend tests before refactor; isolate changes per component |
| Large PRs hard to review | Medium | Enforce small batches; each commit references this roadmap |
| Hidden side effects masked by mocks | Low | Run selective component tests after each refactor batch |

## Tooling Enhancements (Optional Stretch)
- Introduce ESLint rule `no-restricted-globals` to flag variable names like `e1`, `e2` encouraging consolidation.
- Add script to list unused exports (using `ts-prune` analogue for JS or `eslint --rule 'import/no-unused-modules: error'`).
- Pre-commit staged lint autofix: pass `--fix --quiet` for safe rules only.

## Progress Log
| Date | Errors | Warnings | Notes |
|------|--------|----------|-------|
| Initial | 234 | 51 | Raw baseline before cleanup |
| After structural fixes | 126 | 47 | Ignored coverage, removed duplicates, react-refresh override |
| Latest (current) | 122 | 44 | Removed parse errors & mock/setup pruning |

(Continue appending entries as phases complete.)

## Next Immediate Actions
1. Begin Phase 1 batch: prune unused imports in 5–8 test files (`Accounting.test.jsx`, `AdvancedSearch.test.jsx`, etc.).
2. Re-run lint; append new log entry.
3. Start component unused var sweep (Apps/App.jsx large cluster) after test import batch.

---
_This roadmap will be updated after each batch to ensure visibility and accountability. Refer to this document in related PR descriptions ("See LINT_REDUCTION_ROADMAP.md – Phase X")._
