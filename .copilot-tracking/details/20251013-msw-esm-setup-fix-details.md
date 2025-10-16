<!-- markdownlint-disable-file -->
# Task Details: MSW ESM import setup fix

## Research Reference

**Source Research**: #file:../research/20251013-msw-fallback-and-test-warnings-research.md

## Phase 1: Switch setupTests to ESM MSW imports

### Task 1.1: Replace require with ESM imports and wire server lifecycle

Convert MSW setup in the Jest setup file to ESM imports and register the server lifecycle hooks so tests use the real MSW server without fallback warnings.

- Steps:
  1. In `frontend/src/setupTests.js`, replace CommonJS require usage for `msw/node` with ESM:
     - import { setupServer } from 'msw/node'
     - import { http, HttpResponse } from 'msw'
  2. Define `const server = setupServer(...handlers)` and export to global for reuse in tests when needed:
     - `globalThis.msw = { server, http, HttpResponse }`
  3. Register lifecycle hooks:
     - beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
     - afterEach(() => server.resetHandlers())
     - afterAll(() => server.close())
  4. Remove noisy "MSW import failed" warning and the fallback branch.
  5. Keep the existing react-i18next test mock intact.

- Files:
  - frontend/src/setupTests.js - Convert to ESM imports, define server, register hooks, remove fallback warnings
  - frontend/jest.config.js - Verify `setupFilesAfterEnv` still points at `src/setupTests.js`
- Success:
  - No "MSW import failed" warnings in test output
  - MSW handlers correctly intercept via server.listen and tests proceed without fallback
- Research References:
  - #file:../research/20251013-msw-fallback-and-test-warnings-research.md (Lines 26-27) - ESM project structure conflict with require
  - #file:../research/20251013-msw-fallback-and-test-warnings-research.md (Lines 37-38) - MSW Node lifecycle hooks and Jest ESM guidance
  - #file:../research/20251013-msw-fallback-and-test-warnings-research.md (Lines 48-49) - Recommended ESM import approach
- Dependencies:
  - Jest 29 with babel-jest already configured
  - MSW 2.x installed in devDependencies

### Task 1.2: Provide minimal compatibility fallback (optional) and expose msw globals

Keep a minimal, silent fallback only if absolutely necessary in exotic environments, while defaulting to the ESM path. Ensure useful exports exist for tests.

- Steps:
  1. Wrap MSW setup in a try/catch only to set a no-op server if import fails unexpectedly (should not happen locally/CI once ESM is used).
  2. Avoid logging warnings by default; instead, use a single concise note if fallback is actually triggered.
  3. Ensure `globalThis.msw = { server, http, HttpResponse }` is always defined to prevent reference errors in tests.

- Files:
  - frontend/src/setupTests.js - Optional minimal fallback, global exposure
- Success:
  - Tests still run even in rare environments; no noisy logs in the common case
- Research References:
  - #file:../research/20251013-msw-fallback-and-test-warnings-research.md (Lines 33-34) - Prefer ESM imports in setupTests with server export
  - #file:../research/20251013-msw-fallback-and-test-warnings-research.md (Lines 40-41) - Resolver/mapping guidance if resolution issues occur
  - #file:../research/20251013-msw-fallback-and-test-warnings-research.md (Lines 48-49) - ESM-first recommended approach
- Dependencies:
  - Task 1.1 completion

## Phase 2: Ensure Jest resolution compatibility (only if needed)

### Task 2.1: Add moduleNameMapper for 'msw/node' and verify transforms

If the ESM import still fails in certain environments, add a resolver mapping and confirm transforms.

- Steps:
  1. In `frontend/jest.config.js`, add `moduleNameMapper` entry: `'^msw/node$': '<rootDir>/node_modules/msw/node'`.
  2. Ensure `transformIgnorePatterns` includes `msw` so Babel handles it (as already configured).
  3. Re-run tests and confirm no import warnings.

- Files:
  - frontend/jest.config.js - Add moduleNameMapper and verify transformIgnorePatterns
- Success:
  - ESM import of 'msw/node' resolves cleanly; no fallback path triggered
- Research References:
  - #file:../research/20251013-msw-fallback-and-test-warnings-research.md (Lines 40-41) - Configuration examples for resolver mapping
- Dependencies:
  - Phase 1 completion

## Dependencies

- Jest 29 + babel-jest
- MSW 2.x

## Success Criteria

- MSW loads via ESM imports without warnings
- Fallback path is not exercised in normal local/CI runs
- Tests pass without "MSW import failed" logs
