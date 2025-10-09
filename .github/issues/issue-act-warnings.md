# Draft: React act(...) warnings in tests

- Status: Draft
- Created: 2025-10-08
- Owner: TBD

## Summary
React 18 act(...) warnings appear in multiple component tests during async state updates. These warnings indicate updates happening outside React Testing Library's async utilities or missing awaits, risking flaky behavior and masking real regressions.

## Impact
- Flaky tests; non-deterministic failures
- Noise in CI logs hiding real issues
- Potential masking of real race conditions

## Affected Areas (examples)
- UserRoleManagement (pre-migration)
- TaxReport
- DealDetail
- Others to be enumerated as we expand coverage

## Reproduction
1. Run focused Jest on affected test files
2. Observe console warnings similar to: "Warning: An update to X inside a test was not wrapped in act(...)"

## Root Causes
- Missing `await` on async interactions (`userEvent`, `waitFor`, async renders)
- State updates in effects without appropriate flushing
- Real timers used where fake timers or `await` are needed

## Proposed Fix
- Standardize on `renderWithProviders` and consistently await `screen.findBy...` or `waitFor`
- Ensure async interactions use `await userEvent...`
- Prefer MSW handlers for network; avoid manual Promise hacks
- Add a lint rule to ban `findBy` without `await` in tests (optional)

## Acceptance Criteria
- No act warnings in Jest output for the migrated test suites
- CI run shows zero act-related warnings (enforced via grep step if practical)

## Notes
- Add `// SUPPRESS_CONSOLE_ERRORS_OK` only where strictly necessary with justification.
