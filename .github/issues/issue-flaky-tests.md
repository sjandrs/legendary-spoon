# Draft: Flaky tests and stabilization plan

- Status: Draft
- Created: 2025-10-08
- Owner: TBD

## Summary
Intermittent test failures observed around async rendering, timers, and network mocking. Flakes increase maintenance cost and reduce trust in CI.

## Symptoms
- Occasional timeouts in `waitFor`
- Intermittent missing elements in DOM assertions
- Tests passing locally but failing in CI

## Likely Root Causes
- Overreliance on manual axios mocks; inconsistent response timing
- Missing `await` on async actions
- Real timers with setTimeouts; no fake timers control

## Plan
- Migrate network mocking to MSW with deterministic handlers
- Audit tests to ensure every async operation is awaited
- Where timers are essential, use Jest fake timers with `jest.useFakeTimers()` and controlled `advanceTimersByTime`

## Acceptance Criteria
- Flake rate measured over 20 CI runs < 1%
- No intermittent timeouts in the migrated suites

## Notes
- Track flakes by file and test name; add to this issue for visibility.
