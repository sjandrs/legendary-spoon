<!-- markdownlint-disable-file -->
# Task Research Notes: MSW fallback and test warnings/errors

## Research Executed

### File Analysis
- frontend/jest.config.js: jsdom environment; setupFilesAfterEnv points to src/setupTests.js; transformIgnorePatterns includes msw; babel-jest used; ESM hints via extensionsToTreatAsEsm
- frontend/src/setupTests.js: attempts to load MSW using CommonJS require for msw/node; on failure logs a warning and uses fallback server/handlers; contains react-i18next mock and polyfills
- frontend/babel.config.cjs: Babel presets for env (node current) and react automatic runtime
- frontend/package.json: type is module; msw is in devDependencies; Jest 29 and Testing Library 16 present

### Code Search Results
- Observed warning: "MSW import failed: Cannot find module 'msw/node' from 'src/setupTests.js'" during tests, indicating require('msw/node') fails in the current configuration
- AvailabilityCalendar test failures include: missing accessible button named Bulk Edit; missing timezone text (EST/EDT, PST/PDT); label not associated with input for Start Time; missing tabindex, role, aria-label on event elements; missing region landmark named Availability Form

### External Research
- MSW Node integration docs recommend ESM imports for msw/node and server lifecycle hooks in test runners
- Jest ECMAScript Modules documentation recommends using import in setup files for ESM projects and notes that mixing require can fail; top-level await and babel-jest can support ESM
- Community reports for MSW v2 indicate require patterns fail under ESM and switching to ESM imports or dynamic import resolves the issue

### Project Conventions
- Centralized mocking and polyfills in setupTests.js; keep i18n in components and stabilize via test-time mock; Jest configured to transform msw

## Key Discoveries

### Project Structure
The frontend is ESM (type: module) with babel-jest. Using require for msw/node in setupTests.js conflicts with MSW v2’s ESM-first distribution under Jest, causing the import failure and fallback usage.

### Implementation Patterns
- The current MSW fallback is robust and keeps tests running but produces noisy warnings and diverges from real MSW behavior
- The react-i18next deterministic mock is correct and should remain as-is

### Complete Examples
(See MSW Node docs for ESM setup and server lifecycle; prefer ESM import of setupServer from msw/node in setupTests.js and export server/http/HttpResponse to globalThis.)

### API and Schema Documentation
- MSW Node integration confirms ESM import usage for setupServer and describes beforeAll/afterEach/afterAll hooks
- Jest ESM documentation confirms import usage in setup files and notes pitfalls of mixing require in ESM projects

### Configuration Examples
- If resolution fails after switching to ESM imports, add a moduleNameMapper for 'msw/node' to point to the node entry in node_modules and ensure transformIgnorePatterns includes msw (already configured)

### Technical Requirements
- Remove MSW fallback warnings by loading msw/node via ESM imports in setupTests.js
- Keep deterministic i18n behavior through test-time mock without altering components
- Resolve AvailabilityCalendar failures by ensuring expected accessible elements and labels are present during tests: Bulk Edit button; timezone indicators visible; labels associated to inputs via htmlFor/id; event elements include tabindex 0, role button, and aria-label; region landmark named Availability Form

## Recommended Approach
Switch setupTests.js to ESM imports for MSW to allow Jest to resolve msw/node correctly in this ESM project; keep the fallback only as a last resort with minimal logging. If certain environments still fail, add a moduleNameMapper for msw/node. Then address the AvailabilityCalendar suite by updating the component or extending test-layer mocks so that the expected controls and accessibility attributes are present during tests.

## Implementation Guidance
- Objectives: eliminate MSW import warnings; preserve i18n stability; fix AvailabilityCalendar test failures
- Key Tasks: change setupTests.js to use ESM imports for MSW; optionally add moduleNameMapper for msw/node; ensure required buttons, timezone text, associated labels, event accessibility attributes, and region landmark are present in tests
- Dependencies: Jest 29 with babel-jest; MSW 2.x; existing FullCalendar mock; Testing Library
- Success Criteria: no MSW import failed warnings; AvailabilityCalendar tests pass; significant reduction in overall warnings/errors
