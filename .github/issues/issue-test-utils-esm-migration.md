# Issue: Test Utilities ESM Migration

## Summary
Some test utilities and mock patterns rely on legacy CommonJS interop leading to noisy `no-import-assign` and complicating tree-shaking / tooling alignment with modern Vite + Jest config.

## Goals
- Convert test utilities and API mocks to consistent ESM style.
- Eliminate patterns requiring reassignment of imported members.
- Simplify Jest mock factories and support future TS migration.

## Migration Steps
1. Identify CommonJS style exports in `src/__tests__/helpers` and `frontend/api` mock patterns.
2. Replace `module.exports` or mutable namespace usage with named exports.
3. Update tests to import named functions and jest.mock factory returning stable spies.
4. Introduce a lint rule (optional) disallowing direct mutation of imported bindings.

## Acceptance Criteria
- Zero `no-import-assign` occurrences in test suite.
- All mocks use factory pattern: `jest.mock('path', () => ({ fn: jest.fn() }))`.
- Documentation update: `FRONTEND_TESTING.md` section "Mocking Patterns".

## Benefits
- Cleaner diff review (no manual patching of imported modules).
- Easier static analysis and codemod applicability.
- Reduced risk of hidden state between tests.

## Risks
- Minor refactor churn touching many test files simultaneously (coordinate branch).

## Next Action
Inventory current CJS patterns and produce migration diff for 3–5 exemplar files.

---
Owner: Testing Architecture Initiative
Priority: Medium
