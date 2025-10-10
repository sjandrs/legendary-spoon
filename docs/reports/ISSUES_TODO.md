# Remediation & Cleanup Backlog

> Tracking list for follow-up lint/test stabilization tasks after Batch 3 hook normalization.

## Lint / Code Hygiene

### LINT-01: Bulk Test Unused Variable Cleanup
- Scope: All `src/__tests__/components/**/*.test.jsx` reporting `no-unused-vars`.
- Approach: Remove unused imports, prefix intentionally ignored params with `_`, collapse unused assigned variables.
- Automation: Planned codemod (see LINT-06).
- Success Criteria: Reduce test-related lint errors by >70%.

### LINT-02: Runtime Component Unused Identifiers
- Files:
  - `src/components/DigitalSignaturePad.jsx` (dataURLToBlob, error)
  - `src/components/SearchPage.jsx` (response)
  - `src/components/SearchResults.jsx` (post)
  - `src/components/TaskDashboard.jsx` (getActivityLogs import)
  - `src/components/TechnicianForm.jsx` (useState import?)
  - Form components with `_err` pattern (decide keep or rename -> prefix `_` already matches rule, else remove).
- Success: Zero unused-var errors in production components.

### LINT-03: Switch Case Declaration Fix in `App.jsx`
- Issue: `no-case-declarations` at line ~192.
- Action: Wrap each `case` with block braces `{ }` or hoist declarations.

### LINT-04: Undefined Symbol in `BudgetList.test.jsx`
- `Call` not defined. Investigate if meant `callCount` or a factory function.
- Fix to remove `no-undef`.

### LINT-05: Deep Test File Semantic Pruning
- Large files: `SearchPage.test.jsx`, `SchedulingDashboard.test.jsx`, `TaskDashboard.test.jsx`.
- Ensure we don't delete scaffolding needed for forthcoming scenarios.

### LINT-06: Codemod - Trim Unused Test Imports
- Script: `scripts/codemods/trim-unused-test-imports.js`.
- Function: Parse test files, detect unused imported bindings (simple regex + eslint output mapping), propose patch (dry-run mode).
- Output: Summary JSON with per-file removed symbol counts.

## Testing Enhancements

### TEST-01: Fetch-Count Tests (Remaining High-Fetch Components)
- Candidates: `SearchPage`, `SchedulingDashboard`, `TaskDashboard` (if network consolidated), `Warehouse`.
- Pattern: Assert initial single fetch; assert no refetch on noop rerender; assert refetch on parameter change.

### TEST-02: Error Path Coverage
- Add explicit tests for error branches in loaders where currently untested (e.g. DigitalSignaturePad failure flows).

## Documentation

### DOC-01: Add Contributor Pattern Guide
- Location: `docs/HOOK_PATTERNS.md`
- Content: HOOK-JUSTIFY examples, stable callback rationale, fetch-count test template.

## Tooling

### TOOL-01: Lint Delta Reporting
- Add script to diff current ESLint error JSON vs baseline to show progress per category.

---

## Priorities (Proposed)
1. LINT-01 + LINT-04 (high noise, quick wins)
2. LINT-03 + LINT-02 (runtime cleanliness)
3. TEST-01 (extend regression safety net)
4. LINT-06 (automation for sustained velocity)
5. DOC-01 + TOOL-01 (institutionalize practice)

## Exit Criteria
- <10 total lint errors (excluding intentionally deferred warnings)
- All high-fetch components have fetch-count tests
- Documentation published & linked from main README
- Codemod & delta tooling in place for future waves

---
Generated: Batch 3 follow-up (Feature-Bootcamp branch)
