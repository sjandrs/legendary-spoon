# React Hook Dependency Refactor Plan

Status: Draft (Base mechanical lint noise eliminated – 0 errors, 41 semantic warnings remain)
Date: 2025-10-08
Branch: Feature-Bootcamp

Purpose: Provide a structured, low-risk roadmap to remediate all `react-hooks/exhaustive-deps` warnings while preserving behavior, improving predictability, and removing stale eslint-disable directives. Applies A–E classification to each effect per previously agreed schema.

## Classification Schema

| Code | Meaning | Action Summary |
|------|---------|----------------|
| A | Safe callback / pure fetch wrapper missing from deps | Wrap in `useCallback`, add to deps |
| B | Multi‑responsibility effect or unstable capture | Split effects, memoize params, then treat each as A |
| C | Intentional one‑time run (bootstrap only) | Add explicit comment justification & optionally `// eslint-disable-next-line` scoped |
| D | Effect unnecessary (can derive from state/props) | Replace with lazy init or `useMemo` |
| E | Larger redesign required (defer / create issue) | Open issue, schedule separately |

Current audit produced only A/B/C items. No D/E yet (reassess after refactors).

## High-Level Strategy
1. Implement ALL group A first (mechanical, minimal risk).
2. For each B, isolate responsibilities (derive params separately; keep fetch logic pure & wrapped in `useCallback`).
3. Label any true C (one-time bootstrap) with a standard justification comment block template.
4. Remove unused `eslint-disable` directives once warnings are gone.
5. Re-run lint + focused Jest component tests for touched components.
6. Only then consider potential D/E reclassification (optimization phase, out of current scope unless emergent issues appear).

## Naming & Conventions
- Fetch callbacks: `load<Entity>`, `fetch<Entity>` (consistent with existing usage). Choose one per domain; prefer `fetch` for singular resource, `load` for collections or orchestrators.
- Boolean edit flags: `isEditMode` (computed as `!!id`). Avoid duplicating in dependency arrays if trivially derived from `id`.
- Memoized parameter objects: `const searchParamsMemo = useMemo(() => ({ ... }), [deps]);` – suffix `Memo` for clarity.
- Orchestrator effects: name callback `initialize<Entity>Data` OR keep granular callbacks + one effect.
- Justification comments begin with `// HOOK-JUSTIFY:` to allow grep-based auditing.

## Standard Fetch Hook Pattern (Reusable Snippet)
```jsx
// HOOK: Pure fetch loader – A class
const fetchReports = useCallback(async () => {
  setLoading(true);
  try {
    const { data } = await api.get('/api/reports/');
    setReports(Array.isArray(data.results) ? data.results : data);
  } catch (err) {
    console.error('Failed to load reports', err);
    setError(err);
  } finally {
    setLoading(false);
  }
}, []); // stable (no external reactive deps)

useEffect(() => { fetchReports(); }, [fetchReports]);
```

## Race Cancellation Pattern
For effects that may fire again (search, param changes) use an abort flag:
```jsx
const fetchQuotes = useCallback(async (params) => {
  const token = { cancelled: false };
  fetchQuotes.last = token;
  try {
    const { data } = await api.get('/api/quotes/', { params });
    if (fetchQuotes.last !== token) return; // stale response
    setQuotes(data.results || data);
  } catch (e) { /* handle */ }
}, []);

useEffect(() => { fetchQuotes(currentParams); }, [currentParams, fetchQuotes]);
```
Alternative: Axios cancellation token (future enhancement).

## Metrics & Instrumentation (Optional Phase)
- Add lightweight timing: `performance.now()` deltas logged under `if (process.env.NODE_ENV === 'development')`.
- Count API invocations in tests using existing jest mocks (assert invariance pre/post refactor).
- Target: No component increases network calls on initial mount.

## Test Coverage Matrix (Additions)
| Component | Test Addition | Purpose |
|-----------|---------------|---------|
| AccountDetail | Assert single fetch call | Prevent double-load regression |
| AccountForm | Edit mode: loads once; Create mode: no fetch | Branch fidelity |
| AdvancedSearch | Param change triggers exactly one search | No redundant queries |
| SchedulePage | All resources fetched once (events, techs, etc.) | Orchestrator correctness |
| SchedulingDashboard | Dashboard + analytics each load once, refresh scenario optional | Separation |
| TaskCalendar | Changing task type triggers single re-fetch (if applicable) | Dependency accuracy |
| QuoteForm | Edit path fetch; create path skip | Conditional effect correctness |

## Commit & Rollout Strategy
1. Phase 1: Two commits (batch ~7 A-class components each).
2. Run lint + targeted tests after each commit; abort if network call counts differ.
3. Phase 2: One commit per form component (easier review of mixed responsibilities).
4. Phase 3: Separate commits for AdvancedSearch, SchedulePage, SchedulingDashboard (largest risk).
5. Phase 4/5: Single commit for TaskCalendar + TaskAdministration justification.
6. Phase 6: Cleanup commit removing stale directives & adding final test tweaks.

## Risk Scoring
| Area | Likelihood | Impact | Score (L*I) | Notes |
|------|------------|--------|-------------|-------|
| Simple fetch (A) | Low | Low | 1 | Pure additions of deps |
| Form edit splits (B simple) | Med | Med | 4 | Risk of double fetch or missed fetch |
| Orchestrators (Schedule/SchedulingDashboard) | Med | High | 6 | Multiple resources & timing |
| AdvancedSearch param splitting | High | Med | 6 | Subtle param race risks |
| TaskCalendar derived defaults | Med | Med | 4 | Derived state correctness |

Mitigate higher scores with pre/post assertion tests and console timing logs in dev.

## Bootstrap Justification Template
```jsx
// HOOK-JUSTIFY: One-time bootstrap effect. Initializes static form defaults and does not depend on reactive values.
// Rationale: Inputs are constant; adding them to deps would cause unnecessary re-initialization.
// If future dynamic dependencies emerge, reclassify from C -> B and refactor.
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { initializeDefaults(); }, []);
```

## Rollback Plan
- Each phase limited-scope; if regression detected, revert that commit only.
- Keep original logic commented in commit diff (Git history) enabling quick cherry-pick revert.
- If systemic issue (e.g., unexpected race), pause further phases, open issue `refactor: hooks rollback - <component>` summarizing symptom and stack traces.

## Per-File Action Checklist
| File | Actions | Tests to Touch |
|------|---------|----------------|
| AccountDetail.jsx | Wrap `loadAccountDetails`; add to deps | AccountDetail test (add call count) |
| AccountList.jsx | Wrap `loadAccounts`; add to deps | Existing list test (assert single call) |
| ActivityTimeline.jsx | Wrap `loadActivities` | Add activity fetch count assertion |
| AnalyticsSnapshots.jsx | Wrap `fetchSnapshots` | Add snapshot fetch assertion |
| AppointmentRequestQueue.jsx | Wrap `applyFilter` (rename? `applyAndFetch`?) | Filter application test |
| CertificationForm.jsx | Wrap `fetchCertification` | Edit mode test |
| InteractionList.jsx | Wrap `fetchInteractions`; remove disable directives | Interaction fetch count |
| ProjectTemplateForm.jsx | Wrap `fetchTemplate` | Template edit test |
| QuoteDetail.jsx | Wrap `fetchQuoteDetails` | Detail load test |
| QuoteList.jsx | Wrap `fetchQuotes` | Existing list test ensures single initial fetch |
| Reports.jsx | Wrap `fetchReports` | Reports load test |
| RevenueForecast.jsx | Wrap `fetchForecast` | Forecast load test |
| TaxReport.jsx | Wrap `fetchTaxData` | Tax data load test |
| TechnicianPayroll.jsx | Wrap `fetchPayrollData` | Payroll load test |
| AccountForm.jsx | Split effect; wrap `loadAccount`; deps on id | Add edit vs create fetch count |
| BudgetForm.jsx | Split & wrap; isEditing derived | Budget edit test |
| ExpenseForm.jsx | Split & wrap | Expense edit test |
| PageForm.jsx | Split & wrap | Page edit test |
| QuoteForm.jsx | Split & wrap | Quote edit/create tests |
| BlogPostForm.jsx | Wrap `fetchPost`; conditional effect | Blog post edit test |
| AdvancedSearch.jsx | Separate filter load & search; memo params | Add param change search count test |
| SchedulePage.jsx | Break `loadInitialData` into callbacks + orchestrator | Orchestrator test |
| SchedulingDashboard.jsx | Separate or unify loaders with callbacks | Dashboard & analytics call count |
| TaskAdministration.jsx | Add justification comment | Ensure initialization unchanged |
| TaskCalendar.jsx | Convert to derived memo + unified effect | Task type change triggers fetch once |

## Completion Definition Update
Add to Success Criteria: All per-file checklist items reviewed & checked in PR description.


## Standard Patterns

### Pattern A (Pure Async Loader)
```jsx
const loadAccounts = useCallback(async () => {
  try { setLoading(true); const { data } = await api.get('/api/accounts/'); setAccounts(data.results || data); }
  finally { setLoading(false); }
}, []); // stable – no external reactive inputs

useEffect(() => { loadAccounts(); }, [loadAccounts]);
```

### Pattern B (Split & Stabilize)
Before:
```jsx
useEffect(() => { if (isEditMode) fetchQuoteData(); }, []); // missing deps; fetchQuoteData captures props
```
After:
```jsx
const fetchQuoteData = useCallback(async () => { /* ... */ }, [id]);
useEffect(() => { if (isEditMode) fetchQuoteData(); }, [isEditMode, fetchQuoteData]);
```
If `isEditMode` is `Boolean(id)`, compute `const isEditMode = !!id;` once and rely on memoized `id`.

### Pattern C (Documented One-Time Bootstrap)
```jsx
// Intentional single-run: initializes transient form defaults from static map.
// No reactive dependencies; values are constant for component lifetime.
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { initializeDefaults(); }, []);
```

## Detailed Inventory

| File | Line (approx) | Function / Effect Target | Problem Summary | Class | Planned Action |
|------|---------------|--------------------------|-----------------|-------|----------------|
| `components/AccountDetail.jsx` | useEffect #1 | `loadAccountDetails` missing dep | Pure fetch | A | Wrap in `useCallback([])` + add to deps |
| `components/AccountForm.jsx` | useEffect #1 | `loadAccount` + `isEditMode` omitted | Mixed logic | B | Derive `isEditMode` from `id`; wrap `loadAccount(id)`; deps `[isEditMode, loadAccount]` |
| `components/AccountList.jsx` | useEffect #1 | `loadAccounts` | Pure fetch | A | useCallback + deps |
| `components/ActivityTimeline.jsx` | useEffect #1 | `loadActivities` | Pure fetch | A | Use callback |
| `components/AdvancedSearch.jsx` | effects (filters / search trigger) | `loadAvailableFilters`, `triggerSearch` | Param assembly + fetch intertwined | B | Memoize `searchParams`; wrap each loader; 2 effects: (a) ensure filters loaded once; (b) run search when `searchParams` changes |
| `components/AnalyticsSnapshots.jsx` | useEffect #1 | `fetchSnapshots` | Pure fetch | A | Callback |
| `components/AppointmentRequestQueue.jsx` | useEffect #1 | `applyFilter` | Filtering & fetch | A | Wrap + deps |
| `components/BlogPostForm.jsx` | useEffect #1 | `fetchPost` missing | Conditional load on edit | B | Wrap `fetchPost` w/ id; include `[isEditMode, fetchPost]` |
| `components/BudgetForm.jsx` | useEffect #1 | `fetchBudget`, `isEditing` | Mixed responsibilities | B | Split: (a) derive edit state; (b) fetch when editing |
| `components/CertificationForm.jsx` | useEffect #1 | `fetchCertification` | Pure fetch | A | Callback |
| `components/ExpenseForm.jsx` | useEffect #1 | `fetchExpense`, `isEditing` | Mixed | B | Split, wrap fetch |
| `components/InteractionList.jsx` | useEffect #1 | `fetchInteractions` | Pure fetch | A | Callback |
| `components/PageForm.jsx` | useEffect #1 | `fetchPage`, `isEdit` | Mixed | B | Split & wrap |
| `components/ProjectTemplateForm.jsx` | useEffect #1 | `fetchTemplate` | Pure fetch | A | Callback |
| `components/QuoteDetail.jsx` | useEffect #1 | `fetchQuoteDetails` | Pure fetch | A | Callback |
| `components/QuoteForm.jsx` | useEffect #1 | `fetchQuoteData`, `isEditMode` | Mixed | B | Split |
| `components/QuoteList.jsx` | useEffect #1 | `fetchQuotes` | Pure fetch | A | Callback |
| `components/Reports.jsx` | useEffect #1 | `fetchReports` | Pure fetch | A | Callback |
| `components/RevenueForecast.jsx` | useEffect #1 | `fetchForecast` | Pure fetch | A | Callback |
| `components/SchedulePage.jsx` | useEffect #1 | `loadInitialData` aggregates several resources | Orchestrator pattern | B | Break into `loadEvents`, `loadTechnicians`, etc. + one effect calling `Promise.all` over stable callbacks |
| `components/SchedulingDashboard.jsx` | useEffect #1 | `loadAnalyticsData` & `loadDashboardData` both missing | Two fetches inside one effect | B | Combine into orchestrator with callbacks or separate effects each with own callback |
| `components/TaskAdministration.jsx` | useEffect #1 | default task type initialization | One-time bootstrap | C | Add justification comment |
| `components/TaskCalendar.jsx` | effects #1/#2 | `defaultTask`, `formData.task_type` reactivity | Derived state pattern | B → D? | Evaluate combining into computed default via `useMemo`; likely B now, optional D later |
| `components/TaxReport.jsx` | useEffect #1 | `fetchTaxData` | Pure fetch | A | Callback |
| `components/TechnicianPayroll.jsx` | useEffect #1 | `fetchPayrollData` | Pure fetch | A | Callback |

## Implementation Phases

### Phase 1 (A Group)
Files: AccountDetail, AccountList, ActivityTimeline, AnalyticsSnapshots, AppointmentRequestQueue, CertificationForm, InteractionList, ProjectTemplateForm, QuoteDetail, QuoteList, Reports, RevenueForecast, TaxReport, TechnicianPayroll.

Batch constraints: Limit to ~5 files per commit for review clarity.

### Phase 2 (B Group – Simple Splits)
AccountForm, BudgetForm, ExpenseForm, PageForm, QuoteForm, BlogPostForm.

Strategy: For each file:
1. Identify `id` / mode booleans early: `const isEditMode = !!id;`
2. Wrap fetch in `useCallback` with minimal deps.
3. Place effect: `useEffect(() => { if (isEditMode) fetchX(); }, [isEditMode, fetchX]);`

### Phase 3 (B Group – Orchestrators)
AdvancedSearch, SchedulePage, SchedulingDashboard.

Approach: Replace "do everything effect" with discrete callbacks + one coordinating effect or two independent effects if no inter-dependency.

### Phase 4 (TaskCalendar + Potential D)
Reassess if dual effects can be replaced with a `useMemo` for derived default task + a single effect for loading when type changes. Decide if upgrade to D (replace effect) is justified.

### Phase 5 (C Group Justifications)
TaskAdministration and any newly spotted bootstrap-only effects.

### Phase 6 (Cleanup & Verification)
1. Remove stale `eslint-disable` directives in `api.js`, `InteractionList.jsx`, `setupTests.js`, and `test-utils` shims.
2. Run `npm run lint` – expect 0 warnings.
3. Run focused tests for modified components (Jest + impacted suites).
4. Sanity manual smoke: start dev, load a few edited forms / lists.

## Risk Mitigation
| Risk | Mitigation |
|------|------------|
| Introduced double fetch | Snapshot existing network call counts in key tests; ensure counts unchanged post-refactor |
| Stale closures replaced incorrectly | Keep callback dependency arrays minimal & explicit; review each state variable captured |
| Behavioral drift (edit vs create) | Add/expand a test asserting edit pre-fill still occurs (forms) |
| Race conditions (parallel loads) | Use `Promise.all` only where order irrelevant; add abort guards if needed later |

## Testing Additions
Add/Enhance tests for:
- AccountForm / QuoteForm: edit mode loads existing data exactly once.
- AdvancedSearch: search triggers only when parameters change (count assertions).
- SchedulePage: no extra loads after initial mount unless dependency truly changes.

## Documentation Conventions
Every callback introduced gets a JSDoc-style header (short) if non-trivial.
Every intentional bootstrap effect (C) includes the standard justification block.

## Success Criteria
1. All `react-hooks/exhaustive-deps` warnings eliminated OR intentionally justified (C) with <= 3 remaining justifications.
2. No increase in API call counts (validated via test spies where present).
3. Zero unused eslint-disable directives.
4. All modified component tests pass; no regression in existing suites.

## Post-Refactor Review Checklist
- [ ] Lint: 0 warnings (or only documented C).
- [ ] Tests: pass locally (backend + frontend).
- [ ] Commit granularity: small, reviewable groups.
- [ ] Changelog / PR description references this plan.

## Potential Future (Deferred) Improvements
- Promote repetitive fetch callback patterns to a shared hook factory (e.g., `useFetchResource(endpoint, deps)`), **YAGNI for now** – only if duplication persists after refactor.
- Introduce React Query (if not already standardized) for idempotent fetch caching (would obsolete many manual effects) – future architectural track.

## Issue Tracking
No E-class items currently. If discovered mid-implementation (e.g., deeply intertwined orchestrator needing architectural split), open issue titled: `refactor: hook orchestration – <component>` referencing this document.

---
Prepared by: Automated Assistant (Principal Engineer Mode)
Next Action: Implement Phase 1 (A group).
