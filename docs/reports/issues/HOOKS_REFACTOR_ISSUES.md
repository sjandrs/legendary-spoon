## Hook Refactor – Planned GitHub Issues (Phase 2+)

Purpose: Pre-defined issue summaries for remaining B (refactor) & C (justification) class effects plus cleanup tasks. Each issue can be copy-pasted into GitHub with consistent labeling.

### Legend
Label suggestions:
- `refactor` – structural change
- `tech-debt` – existing debt remediation
- `frontend` – scope
- `a11y` – where relevant

### Summary Table
| ID | Title | Type | Component(s) | Scope | Risk | Outcome |
|----|-------|------|--------------|-------|------|---------|
| HR-001 | Refactor AccountForm effect split | refactor | `AccountForm.jsx` | Split load + mode | Low | Single fetch, no double-load |
| HR-002 | Refactor QuoteForm edit/create effects | refactor | `QuoteForm.jsx` | Conditional fetch | Low | Correct deps, one fetch |
| HR-003 | Refactor PageForm data loading | refactor | `PageForm.jsx` | Mode split | Low | Stable deps |
| HR-004 | Refactor BudgetForm fetchBudget | refactor | `BudgetForm.jsx` | Split + wrap | Medium | No double fetch |
| HR-005 | Refactor ExpenseForm fetchExpense | refactor | `ExpenseForm.jsx` | Split + wrap | Medium | Mode accuracy |
| HR-006 | Refactor BlogPostForm fetchPost | refactor | `BlogPostForm.jsx` | Wrap + deps | Medium | Correct edit detection |
| HR-007 | AdvancedSearch effect separation | refactor | `AdvancedSearch.jsx` | Param memo + search | High | Predictable searches |
| HR-008 | SchedulePage orchestrator decomposition | refactor | `SchedulePage.jsx` | Multi-fetch split | High | Stable callbacks, Promise.all |
| HR-009 | SchedulingDashboard data loader split | refactor | `SchedulingDashboard.jsx` | Two fetches → callbacks | High | Clear separation |
| HR-010 | TaskCalendar derived state consolidation | refactor | `TaskCalendar.jsx` | Possibly unify effects | Medium | Simplify dependencies |
| HR-011 | TaskAdministration bootstrap justification | chore | `TaskAdministration.jsx` | Add HOOK-JUSTIFY | Low | Clear intent |
| HR-012 | Remove stale eslint-disable directives | cleanup | `api.js`, `setupTests.js`, test utils | Bulk remove | Low | Zero unused disables |
| HR-013 | Add fetch call count tests (forms) | test | Related test files | Add spies | Low | Guard against regressions |
| HR-014 | Add search trigger count test | test | `AdvancedSearch` tests | Param-driven count | Medium | Prevent double search |
| HR-015 | Add orchestrator network count test | test | `SchedulePage`, `SchedulingDashboard` | Spy aggregated calls | Medium | Maintain load profile |
| HR-016 | Document final refactor outcomes | docs | `HOOKS_DEPENDENCY_REFACTOR_PLAN.md` | Update status matrix | Low | Up-to-date plan |
| HR-017 | Introduce shared fetch hook (deferred) | enhancement | Shared util | Evaluate duplication | Low | DRY potential |
| HR-018 | Evaluate React Query migration | spike | All data-load components | Feasibility | High | Decision record |

### Issue Templates

#### HR-001 – Refactor AccountForm effect split
**Problem:** Combined effect missing deps (`isEditMode`, `loadAccount`) risks stale closure & lint suppression temptation.
**Plan:**
1. `const isEditMode = !!id;`
2. `const loadAccount = useCallback(async () => { ... }, [id]);`
3. `useEffect(() => { if (isEditMode) loadAccount(); }, [isEditMode, loadAccount]);`
4. Add Jest assertion: edit mode triggers one call; create mode triggers none.
**Acceptance:** Lint clean for file; tests pass.

#### HR-007 – AdvancedSearch effect separation
**Problem:** Mixed responsibilities: loading filters & executing searches; missing deps cause stale param evaluation or double triggers if naively added.
**Plan:**
1. Wrap `loadAvailableFilters` (runs once or on external criteria).
2. Construct `searchParamsMemo = useMemo(() => ({...}), [depList]);`
3. `triggerSearch` wrapped in `useCallback` with just `searchParamsMemo`.
4. Two effects: (a) filters (bootstrap) (b) search execution.
5. Add test: Changing one param increments search call count exactly by 1.
**Acceptance:** No exhaustive-deps warning; search call count stable.

#### HR-008 – SchedulePage orchestrator decomposition
**Problem:** Single effect hides multiple data loads; hard to reason about dependencies; risk of partial stale updates.
**Plan:**
1. Extract `loadEvents`, `loadTechnicians`, `loadWorkOrders` each `useCallback`.
2. Orchestrator effect uses `Promise.all` over stable callbacks.
3. Optional: Add defensive abort token pattern if loads are large.
4. Test counts for each load executed exactly once on mount.
**Acceptance:** Lint clean; test passes.

#### HR-012 – Remove stale eslint-disable directives
**Problem:** Noise & potential to mask future legitimate warnings.
**Plan:** Delete directives where rule reports zero problems; re-run lint. If any legitimate console usage is required in dev only, wrap with conditional `if (process.env.NODE_ENV !== 'production')` instead of disable.
**Acceptance:** Zero "Unused eslint-disable directive" warnings.

#### HR-017 – Shared fetch hook (Deferred)
**Rationale:** After refactor, measure duplication (LOC & identical error handling blocks). If >5 similar loaders remain, consolidate.
**Sketch:** `useFetchResource(key, buildRequest, deps)` returning `{ data, loading, error, refetch }`.

#### HR-018 – React Query Migration (Spike)
**Questions:** Cache invalidation needs? Stale time appropriate? Mutation flows? SSR not in scope.
**Deliverable:** Short ADR summarizing go/no-go.

### Cross-Issue Testing Strategy
- Use jest mocks on `api.get/put/post` to count invocations per component mount / param change.
- Add custom matcher wrapper (optional) `expectSingleFetch(fn)` for readability.

### Rollout Order Recommendation
1. HR-001 → HR-006 (form-based, low risk)
2. HR-012 (cleanup) – after forms to avoid churn merge conflicts.
3. HR-007 (AdvancedSearch)
4. HR-008 & HR-009 (orchestrators)
5. HR-010 & HR-011 (calendar + justification)
6. HR-013–HR-016 (tests & docs consolidation)
7. HR-017 / HR-018 (deferred; open only if approved)

### Metrics Collection (Optional)
- Before/after network call counts captured in test snapshots.
- Time-to-first-render (manual log) unaffected or improved.

---
Prepared: 2025-10-08
Next Execution Step: Begin with HR-001 implementation unless reprioritized.
