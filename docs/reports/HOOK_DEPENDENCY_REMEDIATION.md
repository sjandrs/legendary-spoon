# React Hook Dependency Remediation Strategy

This document details the triage and remediation process for `react-hooks/exhaustive-deps` warnings in the frontend codebase.

## Objectives
1. Eliminate unsafe stale-closure patterns that can cause data inconsistency.
2. Avoid unnecessary re-renders or refetch storms when adding dependencies.
3. Document intentional one-time effects with clear justification to future maintainers.
4. Provide a repeatable decision workflow developers can follow.

## Decision Workflow
```
For each effect (useEffect/useCallback/useMemo) with a warning:
  1. Inspect effect body: Does it read props/state/closures not in deps?
     - NO  -> Add explicit empty array if truly constant (and confirm no dynamic refs). DONE.
     - YES -> Continue.
  2. Are referenced values stable by design (e.g., refs, constants, memoized selectors)?
     - YES -> Wrap with // stable: <reason> comment and suppress rule per-line if needed.
     - NO  -> Continue.
  3. Can we safely include missing dependencies without causing loops/perf hits?
     - YES -> Add them; if new function identities trigger downstream churn, memoize callbacks at source.
     - NO  -> Continue.
  4. Can we refactor to derive values inside effect from a single stable source (e.g., move logic into a custom hook or useReducer)?
     - YES -> Refactor; effect depends on fewer items.
     - NO  -> Continue.
  5. Intentional one-time side effect (analytics init, initial fetch superseded by React Query, etc.)?
     - YES -> Add explanatory comment + disable-next-line ONLY for that effect.
     - NO  -> Open an issue (logic requires deeper redesign).
```

## Categorization Labels
| Label | Meaning | Action |
|-------|---------|--------|
| A_INCLUDE | Safe to add deps | Add deps directly |
| B_MEMOIZE | Needs stable identity first | Wrap function in `useCallback` / value in `useMemo` then add |
| C_REDUCE | Refactor to reduce dep set | Extract logic / consolidate state |
| D_INTENTIONAL | One-time effect by design | Keep empty deps + comment + one-line disable |
| E_DEFER | Complex – schedule redesign | Track via issue, keep warning temporarily |

## Example Patterns

### 1. Adding Missing Dependencies (A_INCLUDE)
```diff
useEffect(() => {
  fetchData(filters, page);
-}, []);
+}, [filters, page]);
```

If `fetchData` is declared inline and changes identity each render, move it out or memoize.

### 2. Memoizing Callback Then Adding (B_MEMOIZE)
```diff
const handleChange = useCallback((value) => {
  setForm(prev => ({ ...prev, value }));
}, []); // no external deps

useEffect(() => {
  handleChange(defaultValue);
-}, []); // warning
+}, [handleChange, defaultValue]);
```

### 3. Consolidating Dependencies (C_REDUCE)
If many discrete state vars drive an effect, migrate to a `useReducer` producing a single stable `state` object; effect then depends on `state.keySubset`.

### 4. Intentional One-Time (D_INTENTIONAL)
```js
useEffect(() => {
  // INTENTIONAL: Initial telemetry bootstrap; provider re-emits updates separately.
  initTelemetry(sessionUser.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

### 5. Deferred Complex Case (E_DEFER)
If effect mixes subscription setup, async fetch with race cancellation, and derived computations relying on ephemeral mutable objects—collect requirements and file an issue referencing this doc.

## Performance Guardrails
Before adding a broad dependency list:
1. Measure (or estimate) added renders (simple console count or React Profiler snapshot).
2. If added dependencies trigger heavy operations (e.g., large data transforms), memoize those transforms inside `useMemo`.
3. Watch for fetch duplication—prefer React Query or a data hook that already handles dependency invalidation.

## Testing Strategy
Create or extend tests that assert:
1. Effect triggers on each dependency change (positive case).
2. Effect does NOT trigger when unrelated state changes (negative case).
3. One-time intentional effects only run once.

Example (Jest + RTL):
```js
test('refetches when filters change', async () => {
  render(<ReportPanel />);
  await userEvent.click(screen.getByRole('button', { name: /add filter/i }));
  expect(mockFetch).toHaveBeenCalledTimes(2); // initial + after filter change
});
```

## Rollout Plan
1. Inventory: Generate list of all warnings via `eslint --format json | jq` (script optional).
2. Triage: Tag each with label (A–E) inline as a comment block `// HOOK_DEPS: A_INCLUDE`.
3. Execute in small batches (≤5 files) to maintain review clarity.
4. After each batch: run lint + targeted component tests; update roadmap log.
5. Final pass: ensure no raw warnings remain without a label or justification.

## Success Criteria
* Zero unclassified hook dependency warnings.
* Each intentional suppression has explicit business or architectural justification.
* No increase in redundant network calls or render loops confirmed by spot profiling.

---
_Maintainers: Update this document if new patterns (e.g., Suspense data primitives, server components) alter best practices for effect dependencies._
