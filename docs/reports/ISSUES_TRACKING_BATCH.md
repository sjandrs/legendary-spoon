# Tracking Issues Batch (Generated)

This document contains ready-to-file issue descriptions. Each section now links to an individual issue markdown file under `issues/` plus a meta epic.

## Index
| ID | Title | File |
|----|-------|------|
| 1 | Reinstate MSW for Jest Test Environment | [01-reinstate-msw.md](issues/01-reinstate-msw.md) |
| 2 | Shared Test Harness & API Mock Utilities | [02-shared-test-harness.md](issues/02-shared-test-harness.md) |
| 3 | ESLint Caught Errors Ignore Pattern | [03-eslint-caught-errors-ignore.md](issues/03-eslint-caught-errors-ignore.md) |
| 4 | Codemod Regression Audit | [04-codemod-regression-audit.md](issues/04-codemod-regression-audit.md) |
| 5 | import.meta Stabilization & Documentation | [05-importmeta-stabilization.md](issues/05-importmeta-stabilization.md) |
| 6 | Extended Fetch-Count Regression Coverage | [06-extended-fetch-count-tests.md](issues/06-extended-fetch-count-tests.md) |
| 7 | Storybook / MSW Version Alignment | [07-storybook-version-alignment.md](issues/07-storybook-version-alignment.md) |
| 8 | MSW Error Path Assertions | [08-msw-error-path-assertions.md](issues/08-msw-error-path-assertions.md) |
| META | Testing & Tooling Refinement Epic | [META-testing-refinement-epic.md](issues/META-testing-refinement-epic.md) |

---

---
## 1. Reinstate MSW for Jest Test Environment
**Labels:** testing, frontend, tech-debt, priority-medium

### Summary
MSW usage in Jest was temporarily removed in favor of direct `api.get` jest mocks due to ESM/peer dependency conflicts (`@mswjs/interceptors` and Storybook version mismatch). We need to restore MSW to regain higher-fidelity request lifecycle coverage and confidence in network boundary logic.

### Current State
- MSW mappings in `jest.config.js` exist but `AccountList.test.jsx` now uses manual jest mocks.
- Attempting to install `@mswjs/interceptors` caused peer dependency resolution failure with mixed Storybook major versions (8.x vs 9.x packages present).

### Risks of Deferment
- Reduced realism in tests (no request handler verification or per-request behavior overrides)
- Harder to simulate varied HTTP responses across suites

### Remediation Plan
1. Align Storybook packages to a single major version (prefer upgrading all to 9.x or downgrading builder-vite to 8.x family).
2. Re-attempt `npm install --save-dev @mswjs/interceptors`.
3. Reintroduce shared MSW server setup in `src/setupTests.js` with per-file handlers.
4. Migrate any jest mock–based suites (starting with `AccountList.test.jsx`).
5. Add regression test confirming a 500 and network error path using MSW.

### Acceptance Criteria
- All previous MSW-based suites run green again.
- No peer dependency warnings during install.
- At least one test asserts handler invocation sequencing.

---
## 2. Shared Test Harness & API Mock Utilities
**Labels:** testing, refactor, DX

### Summary
Multiple tests manually mock `api.get` and reconstruct filtering logic. Introduce a unified test harness to reduce duplication and centralize API simulation patterns.

### Proposed Deliverables
- `src/__tests__/utils/mockApi.js` with helpers: `mockGetOnce(data)`, `mockPaged(list, pageSize)`, `mockError(status)`.
- Update 3–5 high-churn suites to use helpers.
- Documentation snippet in `FRONTEND_TESTING.md`.

### Benefits
- Consistent semantics; easier future swap back to MSW.
- Lower maintenance cost when endpoints change.

### Acceptance Criteria
- Helpers imported in converted suites; no duplicated inline implementations.
- Test run passes.

---
## 3. ESLint Caught Errors Ignore Pattern
**Labels:** lint, quality

### Summary
We renamed unused catch parameters to `_err`, but ESLint still reports them. Configure eslint rule to ignore names starting with `_` for caught errors.

### Change
Add to `eslint.config.js` inside base rule config:
```
'no-unused-vars': ['error', {
  varsIgnorePattern: '^[A-Z_]|^_',
  argsIgnorePattern: '^_',
  caughtErrors: 'all',
  caughtErrorsIgnorePattern: '^_'
}]
```

### Acceptance Criteria
- Lint run shows zero unused-var errors for `_err`.
- No increase in suppressed legitimate misses (spot-check 3 files).

---
## 4. Codemod Regression Audit (Undefined Symbol Scan)
**Labels:** codemod, tech-debt, reliability

### Summary
The AST unused import codemod removed some imports still referenced later, creating `no-undef` errors after pruning. Need a scripted audit to detect symbol usage vs. import removal.

### Plan
1. Write a script `scripts/audit/unused-import-regressions.cjs`:
   - Parse each JS/JSX file.
   - Collect identifiers in top-level scope referencing undeclared symbols.
   - Compare against git diff of codemod commit to highlight candidates.
2. Output report JSON + human-readable markdown.
3. Auto-generate restoration suggestions.

### Acceptance Criteria
- Report lists all current `no-undef` from ESLint plus any prospective latent cases.
- Zero false positives on a sample of 10 files.

---
## 5. ImportMeta Stabilization & Dependency Guidance
**Labels:** build, tooling, documentation

### Summary
Added custom Babel plugin `transform-import-meta.cjs` to neutralize `import.meta` references for Jest. Need documentation + guardrails so future dependency bumps do not regress.

### Tasks
- Add section to `FRONTEND_TESTING.md` describing the plugin rationale & limitations.
- Add safeguard test that imports a module containing `import.meta` (fixture) and asserts test runner does not throw.
- Optionally add lint rule or codemod check to flag direct reliance on `import.meta.hot` in source (except Vite entry).

### Acceptance Criteria
- Docs updated; fixture test passes.
- Removing plugin locally causes that fixture test to fail (verified once, not committed).

---
## 6. Extended Fetch-Count Regression Coverage
**Labels:** testing, performance, regression

### Summary
Fetch-count tests currently cover SchedulingDashboard, Warehouse, SearchPage. Extend to additional data-heavy components to prevent accidental double-fetch regressions after hook refactors.

### Candidate Components
- `AccountList`, `Deals`, `TaskDashboard`, `WorkOrderList`, `AnalyticsDashboard`.

### Plan
For each component:
1. Wrap `api.get` (or relevant call) with jest spy.
2. Render component; await first settled state.
3. Assert call count = 1 (or documented expected number).
4. Interact (e.g., open dropdown) and ensure no extra fetch unless expected.

### Acceptance Criteria
- 5 new fetch-count tests added.
- All pass deterministically (<500ms variance).
- Document rationale + maintenance guidance in test README.

---
## 7. MSW / Storybook Version Alignment
**Labels:** dependency, tooling

### Summary
Peer dependency conflict between Storybook 8.x & 9.x blocked installing `@mswjs/interceptors`. Align versions before reinstating MSW.

### Options
1. Upgrade all Storybook packages to 9.x (preferred—future-proof).
2. Downgrade all to latest 8.6.x to match existing base.

### Tasks
- Audit `package.json` for 8.x vs 9.x mix.
- Choose path (document rationale).
- Apply and validate via `npx storybook@latest info` (if used) and `npm ls storybook`.

### Acceptance Criteria
- Single major version in dependency tree.
- `npm install` produces zero peer warnings.

---
## 8. Restore MSW-Based Error Path Assertions (Dependent on #1 & #7)
**Labels:** follow-up, testing

### Summary
Once MSW is restored: reintroduce fine-grained error path assertions currently simplified in jest mock approach.

### Acceptance Criteria
- At least one test per major module (CRM, Scheduling, Warehouse) asserts specific error status handling using MSW context utilities.

---
## Filing Order Recommendation
1. #7 Version Alignment (if blocking) or #1 Reinstate MSW (if easy win)
2. #3 ESLint caught errors
3. #4 Codemod audit
4. #5 ImportMeta documentation
5. #2 Shared test harness
6. #6 Extended fetch-count tests
7. #8 MSW error assertions (post reinstatement)

---
## Cross-Cutting Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Remaining hidden no-undef from codemod | Failing CI later | Run audit script early (#4) |
| Drift between mock harness & MSW semantics | Inconsistent tests | Centralize helpers (#2) |
| Future ESM dependency introducing new import.meta usage | Jest breakage | Fixture test (#5) |
| Double-fetch regressions after refactors | Performance/test flakiness | Broader fetch-count tests (#6) |

---
Generated on: 2025-10-09

---
## Automation
A GitHub Actions workflow `publish-issues.yml` is available to publish these markdown files as GitHub issues.

### Manual Dispatch
1. Go to Actions > "Publish Issues from Markdown".
2. Click "Run workflow".
3. Inputs:
  - `publish`: set to `true` to actually create issues (default dry-run)
  - `include_meta`: set to `true` to also publish the META epic
  - `issue_prefix`: limit to files starting with a prefix (e.g. `01-`)
  - `assignees`: comma-separated GitHub usernames
  - `close_superseded`: set to `true` to close superseded issues listed in YAML `supersedes`

### Environment Logic
The workflow sets environment variables for the script:
| Env | Meaning |
|-----|---------|
| PUBLISH | When `1`, issues are created; otherwise dry-run |
| INCLUDE_META | Include META file if `1` |
| ISSUE_PREFIX | Optional file prefix filter |
| ASSIGNEES | Comma-separated list of assignees |
| CLOSE_SUPERSEDED | When `1`, close issues referenced by `supersedes` |
| VALIDATE | When `1`, perform schema validation only; no network calls (overrides publish) |
| VALIDATION_FAIL_ON | Set to `errors` to exit with code 2 if validation finds any errors (ignored if legacy mode) |
| CACHE_TTL_MIN | Override cache TTL minutes for search/existence (default 60) |
| DISABLE_CACHE | When `1`, disable disk cache (still uses in-memory during run) |
| CLEAR_CACHE | When `1`, clear existing cache files before run |
| CACHE_COMPRESS | When `1`, store cache gzip-compressed (.json.gz) for smaller footprint (disabled in legacy mode) |
| PER_ISSUE_METADATA | When `1`, post an HTML comment to each new issue with source file + hash metadata (disabled in legacy mode) |
| LEGACY_AUTOMATION_MODE | When `1`, disables new behaviors (validation fail exit, cache compression, per-issue metadata) for rollback safety |

### Local Dry Run
```bash
PUBLISH=0 node scripts/automation/publish-issues.mjs
```

### Validation Mode (No API Calls)
Use validation to lint front-matter schema, labels, and supersedes fields without contacting GitHub.
```bash
VALIDATE=1 node scripts/automation/publish-issues.mjs
```
Output: `issues/publish-report.json` entries with `action: validate`, plus any `errors` or `warnings` arrays.
Exit codes:
- 0: Validation succeeded (or legacy mode ignoring errors)
- 2: Validation errors present and `VALIDATION_FAIL_ON=errors` (unless `LEGACY_AUTOMATION_MODE=1`)

### Actual Publish Locally (requires a classic or fine-grained PAT with repo:issues)
```bash
export GITHUB_TOKEN=ghp_yourtoken
export GITHUB_REPOSITORY=owner/repo
PUBLISH=1 node scripts/automation/publish-issues.mjs
```

### Safety & Idempotency / Advanced Features
- Idempotent: Searches for existing title (open or closed) and skips if found.
- Dry-run mode writes `issues/publish-report.json` with proposed actions.
- Labels parsed from YAML front-matter `labels:` (array or comma list) or fallback `**Labels:**` line.
- Front-matter keys supported:
  - `title:` override file-derived title
  - `labels:` array or comma-separated list
  - `supersedes:` array or comma-separated issue numbers or exact titles
- When issues are created, the index table is annotated appending `(#<number>)` in the title column.
- If `CLOSE_SUPERSEDED=1`, each referenced issue is closed with a comment linking the new issue. Number or exact title matches are supported.
- Supersede closure adds a comment: `Closed as superseded by automated publish script.`
- Validation mode (`VALIDATE=1`) performs schema checks only (no network requests) and reports unknown keys, type mismatches, and empty titles.
- Persistent cache (default enabled) stores search & existence results under `.cache/issue-search-cache.json` with TTL (default 60 min).
  - `CACHE_TTL_MIN` override TTL in minutes (default 60).
  - `DISABLE_CACHE=1` disable disk + in-memory persistence (still uses per-run memory caches).
  - `CLEAR_CACHE=1` remove existing cache file before processing.
  - Cache entries auto-expire; stale entries replaced on demand.
  - `CACHE_COMPRESS=1` stores gzip version `.json.gz` (smaller size); falls back to plain JSON if disabled.

### Per-Issue Metadata Comment
When `PER_ISSUE_METADATA=1`, each created issue receives a lightweight HTML comment (not visible in rendered body) of the form:
```
<!-- automation:issue-metadata
source-file:01-reinstate-msw.md
sha256:abcd1234ef567890
generated:2025-10-09T12:34:56.789Z
schema:1
-->
```
This enables future reconciliation (e.g., detecting divergence between source markdown and live issue). The `sha256` is a truncated hash of the file contents at publish time.

### Legacy Automation Mode
Set `LEGACY_AUTOMATION_MODE=1` to temporarily revert to baseline behavior (no fail-on-error exit, no gzip cache, no metadata comments) if new features cause unexpected CI friction. This provides a fast rollback without code changes.

---
