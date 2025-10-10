# Reinstate MSW for Jest Test Environment

**Labels:** testing, frontend, tech-debt, priority-medium

## Summary
MSW usage in Jest was temporarily removed in favor of direct `api.get` jest mocks due to ESM/peer dependency conflicts (`@mswjs/interceptors` and Storybook version mismatch). We need to restore MSW to regain higher-fidelity request lifecycle coverage and confidence in network boundary logic.

## Current State
- MSW mappings present but `AccountList.test.jsx` now mocks API calls directly.
- Installing `@mswjs/interceptors` failed because of mixed Storybook major versions (8.x vs 9.x).

## Risks of Deferment
| Risk | Impact |
|------|--------|
| Lower test realism | Missed integration regressions |
| Harder to simulate error conditions | Reduced coverage of edge cases |

## Remediation Plan
1. Align Storybook packages to a single major version.
2. Install `@mswjs/interceptors`.
3. Reintroduce shared MSW server in `src/setupTests.js`.
4. Migrate jest-mock suites back to handlers.
5. Add regression tests for 500 + network error.

## Acceptance Criteria
- All prior MSW suites pass.
- No peer dependency warnings.
- Error and success handlers asserted at least once.

## Definition of Done
Green CI, updated docs, no ad-hoc network mocks in converted suites.
