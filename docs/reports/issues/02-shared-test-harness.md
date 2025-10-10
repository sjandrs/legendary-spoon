# Shared Test Harness & API Mock Utilities

**Labels:** testing, refactor, DX

## Summary
Multiple test files replicate ad-hoc `api.get` mocks. Centralize mocking patterns to cut duplication and ease migration back to MSW.

## Deliverables
- `src/__tests__/utils/mockApi.js` with helpers: `mockGetOnce`, `mockPaged`, `mockError`.
- Refactor 3–5 suites to use helpers.
- Add usage notes to `FRONTEND_TESTING.md`.

## Benefits
Consistency, lower maintenance, smoother MSW reintroduction.

## Acceptance Criteria
- Helpers used in refactored suites.
- No duplicated inline mock logic in updated files.
- Test run remains green.
