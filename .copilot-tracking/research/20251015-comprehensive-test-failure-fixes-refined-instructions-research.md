<!-- markdownlint-disable-file -->
# Task Research Notes: Comprehensive Test Failure Fixes Plan – Refined Instructions for All Tasks

## Research Executed

### File Analysis
- ./.copilot-tracking/plans/20251012-comprehensive-test-failure-fixes-plan.instructions.md
  - Enumerates Phases 1–5 with 15 tasks (backend model constraints, API/URL/auth, frontend structure/a11y, test infra optimization, validation). Several tasks already marked as implemented or verified; others need verification-first steps.
- ./.copilot-tracking/details/20251012-comprehensive-test-failure-fixes-details.md
  - Provides deeper task-by-task rationale and success criteria; emphasizes verification-first approach, URL name correction (“send-invoice-email”), jsonschema presence, and CertificationDashboard heading structure expectations.
- main/models.py
  - Deal.save() assigns default close_date and DealStage; ScheduledEventManager.create() ensures a default Technician; DigitalSignature.save() defaults object_id, content_type to WorkOrder, and ip_address; BudgetV2/MonthlyDistribution models present with validations.
- main/signals.py
  - Present in repo; used for automation. BudgetV2 seeding signal needs verification in this file (ensure a post_save hook calls seed_default_distribution on create).
- main/api_urls.py
  - DRF router + custom routes; invoice email route expected to be named “send-invoice-email” (hyphenated), matching details document.
- main/api_views.py
  - Houses ViewSets and custom endpoints; verify AccountViewSet permissions (IsAuthenticated) and dev JSON validator endpoint behavior in DEBUG.
- requirements.txt
  - Confirm presence of jsonschema dependency used by dev validator tests.
- frontend/src/__tests__/components/CertificationDashboard.test.jsx
  - Expects h1 “Certification Dashboard”; h2 “Overview”; h2 title “Certifications (N)”; keyboard/a11y semantics; uses Chart.js mocks; tests state filters, sorting, retry behavior, and performance assumptions.

### Code Search Results
- send[-_]invoice[-_]email
  - Plan/details indicate the correct URL name is 'send-invoice-email'; mismatched 'send_invoice_email' causes NoReverseMatch in tests.
- dev validate json|jsonschema
  - Requirements and details indicate dev validator endpoint uses jsonschema and is gated by DEBUG.

### External Research
- #githubRepo:"encode/django-rest-framework permissions IsAuthenticated"
  - Confirms standard DRF permission patterns for enforcing authentication with `permission_classes = [IsAuthenticated]`.
- #fetch:https://docs.djangoproject.com/en/stable/ref/contrib/contenttypes/
  - Documents GenericForeignKey and ContentType usage; supports defaulting content types safely when creating generic relations.
- #fetch:https://jsonschema.readthedocs.io/en/stable/
  - Validates expected behaviors and error formats for JSON Schema validation libraries used server-side.
- #fetch:https://testing-library.com/docs/dom-testing-library/api-async/#waitfor
  - Establishes correct async patterns (`waitFor`) for React Testing Library, relevant to front-end tests.
- #fetch:https://mswjs.io/docs/getting-started/mocks
  - Guidance for comprehensive MSW handler coverage to avoid unhandled request errors in tests.
- #fetch:https://www.w3.org/TR/WCAG21/
  - WCAG 2.1 AA criteria supporting heading hierarchy, ARIA labeling, and keyboard navigation requirements.

### Project Conventions
- Standards referenced: .github/copilot-instructions.md; docs/DEVELOPMENT.md; established DRF ViewSet + role-based access; React + Vite with Axios; Jest + RTL + MSW + Cypress; a11y compliance; verification-first workflow in details plan.
- Instructions followed: Verification-first changes; do not alter behavior that already meets tests; add robust defaults only when missing; ensure URL/auth/a11y alignment with existing specs and tests.

## Key Discoveries

### Project Structure
- Backend: Django + DRF; custom auth; extensive models implementing CRM, accounting, field service, and technician mgmt.
- Frontend: React components with centralized API client; tests enforce semantic headings, a11y, and resilient data fetching with retry.
- Testing: Clear expectations for URL names, permissions, and model defaults to prevent NOT NULL failures during test object creation.

### Implementation Patterns
- Defaulting critical FKs via model save() and custom managers prevents NOT NULL constraint failures in tests/fixtures.
- DRF: Enforce `IsAuthenticated` at the ViewSet level; custom endpoints need explicit permission and naming alignment.
- Frontend: Provide explicit headings h1/h2; ensure role/button labels and table cells have accessible names; mock charts; use virtualization/pagination for large datasets in tests.

### Complete Examples
```python
# DigitalSignature defaulting pattern (evidence: main/models.py)
def save(self, *args, **kwargs):
    if not getattr(self, "object_id", None):
        self.object_id = 0
    if not getattr(self, "content_type", None):
        from django.contrib.contenttypes.models import ContentType
        try:
            self.content_type = ContentType.objects.get_for_model(WorkOrder)
        except Exception:
            self.content_type = ContentType.objects.first()
    if not getattr(self, "ip_address", None):
        self.ip_address = "127.0.0.1"
    super().save(*args, **kwargs)
```

```jsx
// CertificationDashboard heading structure expectations (from tests):
// - <h1>Certification Dashboard</h1>
// - <h2>Overview</h2>
// - <h2>Certifications (N)</h2>
```

### API and Schema Documentation
- Dev JSON validator endpoint: POST /api/dev/validate-json/ accepts schema key and payload; in DEBUG returns structured validation results using jsonschema. Must not respond 501 when `jsonschema` is installed.
- Invoice email endpoint route name expected: `send-invoice-email` (hyphenated).

### Configuration Examples
```ini
# DRF ViewSet auth enforcement (AccountViewSet example)
from rest_framework.permissions import IsAuthenticated

class AccountViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
```

```json
// package.json test scripts (frontend) ensure Jest + RTL configured
{ "scripts": { "test": "jest" } }
```

### Technical Requirements
- Backend test pass criteria: 100% (139/139) with model constraints satisfied by robust defaults/signals; correct URL naming; auth enforced.
- Frontend test pass criteria: 100% (1959/1959) with heading/a11y fixes; MSW coverage; stable async patterns; performance constraints respected.

## Recommended Approach
Adopt a verification-first remediation for each task: confirm existing implementation behavior against test expectations; only modify where a concrete gap is evidenced. Prefer low-risk defaults (model save/manager or signals), align URL names and permissions, and tighten frontend semantics/ARIA and MSW coverage. Validate with targeted tests before running the full suite.

## Implementation Guidance
- Objectives: Refine tasks with precise steps, acceptance criteria, and verification commands; eliminate unnecessary code churn; ensure traceable evidence.
- Key Tasks: See the refined per-task instructions below (covers all tasks in Phases 1–5).
- Dependencies: Django ContentTypes, DRF permissions, jsonschema, React Testing Library, MSW, WCAG 2.1 AA.
- Success Criteria: All specified tests pass; URL/auth/a11y contracts satisfied; no regressions; documentation in sync.

---

## Refined Instructions by Task (All Tasks)

Each task below provides: Preconditions, Steps, Evidence Collection, Verification, Acceptance Criteria, Risks/Alternatives, and Rollback/Safety Notes.

### Phase 1: Critical Backend Model Constraint Verification & Fixes

#### Task 1.1: Deal.stage_id Assignment Logic — verify defaults; patch only if failing
- Preconditions
  - Evidence that Deal instances in tests may be created without `stage` and require a default.
  - Confirm current `Deal.save()` logic assigns a default `DealStage` (main/models.py shows create-or-first logic).
- Steps
  1. Grep usages where `Deal` is instantiated in tests/factories without `stage`.
  2. Run targeted tests that previously failed with NOT NULL on `stage_id`.
  3. If failures persist, harden `Deal.save()` default path: ensure `DealStage.objects.order_by("order").first()` or `get_or_create(name="Default", order=1)` always resolves; avoid broad excepts swallowing real errors (log when needed in prod).
  4. Optionally add a minimal migration/fixture to seed a "Default" stage for local dev if that matches project conventions.
- Evidence Collection
  - Screenshot/log of failing trace if any; code snippet of `Deal.save()` defaulting block; list of tests touching Deal creation.
- Verification
  - Run: Tests referencing Deal creation (e.g., permissions_deeper, serializer_backcompat).
  - Confirm no NOT NULL errors on `stage_id` and defaults are consistent.
- Acceptance Criteria
  - All Deal-related tests pass without modifying test data; default stage assignment is deterministic.
- Risks/Alternatives
  - Swallowing exceptions can mask migration issues; prefer specific exception handling.
- Rollback/Safety
  - Changes limited to defaulting logic; reversible. Keep behavior behind `if not self.stage` to avoid overriding explicit stage.

#### Task 1.2: ScheduledEvent.technician_id NOT NULL — confirm manager default behavior
- Preconditions
  - `ScheduledEventManager.create()` attempts to ensure a Technician exists (creates one if needed).
  - Failures may stem from paths bypassing the manager (e.g., direct model constructor) or from constrained test fixtures.
- Steps
  1. Identify tests creating `ScheduledEvent` and confirm they use `.objects.create()` (manager) vs. constructor + `save()`.
  2. If failures show NOT NULL, update test factories to call `.objects.create()` or pass `technician` explicitly.
  3. As a last resort, add a `save()` guard to assign a default technician iff missing (avoid double work if manager covers).
- Evidence Collection
  - Failing traces; factory/fixture code paths; presence of default technician creation in manager.
- Verification
  - Re-run affected activity log/event tests.
- Acceptance Criteria
  - No `technician_id` NOT NULL constraint errors during tests.
- Risks/Alternatives
  - Creating technicians implicitly could conflict with data isolation in tests; prefer factory updates over model changes when possible.
- Rollback/Safety
  - Keep defaulting minimal and conditioned on missing technician only.

#### Task 1.3: DigitalSignature.content_type_id Default Assignment — verify existing fix
- Preconditions
  - `DigitalSignature.save()` already defaults `object_id`, `content_type` to WorkOrder, and `ip_address`.
- Steps
  1. Execute the signature-related tests that previously failed.
  2. If any failure persists, validate that `ContentType.get_for_model(WorkOrder)` is available (migrations applied); fallback to first content type is acceptable in tests.
- Evidence Collection
  - Test outputs; code references in models.py.
- Verification
  - Confirm signature creation without explicit content_type passes.
- Acceptance Criteria
  - All signature tests pass without additional code changes.
- Risks/Alternatives
  - Avoid broad fallbacks in production; tests can use looser defaults.
- Rollback/Safety
  - None needed if no code changes.

#### Task 1.4: BudgetV2 Post-Save Seeding of MonthlyDistribution — verify signal
- Preconditions
  - Details indicate post-save seeding is already implemented; confirm presence in main/signals.py and app config imports signals.
- Steps
  1. Inspect `main/signals.py` for a `post_save` receiver on `BudgetV2` calling `seed_default_distribution()`.
  2. Ensure `main/apps.py` imports signals on app ready.
  3. Run BudgetV2 tests verifying 12 rows sum to 100.00 with rounding handled.
- Evidence Collection
  - Signal code snippet; test logs showing distributions created.
- Verification
  - Confirm exactly 12 MonthlyDistribution rows with total 100.00% on BudgetV2 create.
- Acceptance Criteria
  - BudgetV2 tests pass; no duplicate seeding on update.
- Risks/Alternatives
  - Seeding during migrations/fixtures could double-create; guard with `exists()` in seed method (already present).
- Rollback/Safety
  - None if no changes; otherwise limit signal to `created=True`.

### Phase 2: Backend API Authentication and URL Pattern Fixes

#### Task 2.1: Fix URL Name Mismatch in Activity Log Tests
- Preconditions
  - The actual route name is `send-invoice-email`; tests failing due to `send_invoice_email` usage.
- Steps
  1. Verify the URL name in `main/api_urls.py` for the invoice email endpoint.
  2. Ensure tests (or any reverse() usages) refer to `send-invoice-email`.
  3. If tests are part of external suite and cannot be changed, create a named URL alias that maps `send_invoice_email` to the same view without changing behavior.
- Evidence Collection
  - URLconf snippet; failing NoReverseMatch trace.
- Verification
  - Run the activity log test that triggers invoice emailing.
- Acceptance Criteria
  - No NoReverseMatch for invoice email; activity logged as expected.
- Risks/Alternatives
  - Adding a second URL name may be redundant; prefer aligning to canonical name if tests are local.
- Rollback/Safety
  - Adding a friendly alias is backwards-compatible.

#### Task 2.2: Ensure jsonschema Dependency and Dev Validator Behavior
- Preconditions
  - `jsonschema` should be listed in requirements.txt; dev validator must return 200 with validation results in DEBUG.
- Steps
  1. Confirm `jsonschema` in requirements.txt and installed in the test env.
  2. Inspect dev validator view for DEBUG gating and structured response on success/error.
  3. Adjust error shape to match tests (e.g., `{ valid: bool, errors: [{path, message}], schema_path: str }`).
- Evidence Collection
  - requirements.txt excerpt; view code; sample response payloads.
- Verification
  - Run dev validator tests for happy path and invalid payload.
- Acceptance Criteria
  - 200 OK and correct response shape; no 501 Not Implemented.
- Risks/Alternatives
  - Ensure endpoint is unavailable or 404 when DEBUG=False if that’s expected by CI.
- Rollback/Safety
  - Limit behavior to DEBUG to reduce exposure.

#### Task 2.3: Fix Account API Authentication Enforcement
- Preconditions
  - Some unauthenticated requests previously returned 200; must enforce 401.
- Steps
  1. Confirm `permission_classes = [IsAuthenticated]` on AccountViewSet (main/api_views.py).
  2. Validate authentication settings in DRF settings (if centralized) and custom authentication classes.
  3. Ensure unauthenticated requests fall through to 401 with a consistent error shape.
- Evidence Collection
  - ViewSet snippet; test results for 401.
- Verification
  - Run API error shape test that hits /api/accounts/ unauthenticated.
- Acceptance Criteria
  - Returns 401 with expected error body.
- Risks/Alternatives
  - Anonymous read access may be desired in other endpoints; scope fix to AccountViewSet only.
- Rollback/Safety
  - Add tests to prevent regressions.

### Phase 3: Frontend Component Structure and Accessibility Fixes

#### Task 3.1: Fix CertificationDashboard Heading Structure
- Preconditions
  - Tests assert precise headings: h1 “Certification Dashboard”; h2 “Overview”; h2 “Certifications (N)”.
- Steps
  1. Open `frontend/src/components/CertificationDashboard.jsx` (or current file path) and confirm heading semantics.
  2. Ensure “Overview” section exists with <h2> and the certifications list section title reflects computed count in parentheses.
  3. Keep CSS classes consistent; avoid breaking layout.
- Evidence Collection
  - Component diff; screenshot of rendered output in test.
- Verification
  - Run `CertificationDashboard` tests: “has proper heading structure” and rendering tests.
- Acceptance Criteria
  - All heading assertions pass; no regressions in other tests.
- Risks/Alternatives
  - If component path differs, update accordingly; ensure SSR-safe computations for counts.
- Rollback/Safety
  - Headings are additive; minimal risk.

#### Task 3.2: Add Missing Accessibility Attributes and ARIA Labels
- Preconditions
  - Tests require screen-reader-friendly labels for status indicators and keyboard navigation for controls (e.g., “Clear filters”).
- Steps
  1. Ensure status badges/tags render readable text for SRs (e.g., aria-label or visible text: “Active”, “Expired”, “Expiring Soon”).
  2. Label interactive controls with accessible names matching tests (e.g., role button name: “Filter by status”, “Sort by expiration”, “Clear filters”, “Dismiss alert”).
  3. Ensure table cells expose accessible names (e.g., role="cell" with text content) where tests use `getByRole('cell', { name: /active/i })`.
- Evidence Collection
  - Component snippet showing ARIA/labels; test logs passing.
- Verification
  - Run focused a11y assertions in CertificationDashboard tests.
- Acceptance Criteria
  - A11y-related tests pass without reliance on visual-only cues.
- Risks/Alternatives
  - Avoid redundant ARIA when visible text suffices; follow WCAG best practices.
- Rollback/Safety
  - ARIA additions are non-breaking; keep minimal.

#### Task 3.3: Expand MSW Handler Coverage for Missing API Endpoints
- Preconditions
  - Intermittent test failures often indicate unhandled requests; handlers must cover certification listing, technician certs, creates/updates/deletes.
- Steps
  1. Review `frontend/src/__tests__/utils/msw-handlers.js` (or equivalent) for existing handlers.
  2. Add handlers for `/api/certifications/`, `/api/technician-certifications/` (GET with paging/filter/sort), plus POST/PUT/PATCH/DELETE for mutations.
  3. Return shapes matching tests (e.g., `{ data: { results: [...] } }`).
- Evidence Collection
  - Handler definitions; logs showing no “Unhandled request” warnings.
- Verification
  - Run front-end test suite subset covering CertificationDashboard create/edit/delete and filtering/sorting.
- Acceptance Criteria
  - No MSW unhandled warnings; tests pass consistently.
- Risks/Alternatives
  - Keep handlers in sync with axios baseURL; support query params.
- Rollback/Safety
  - Handlers only affect tests; safe to iterate.

### Phase 4: Test Infrastructure and Component Lifecycle Optimization

#### Task 4.1: Enhance Test Data Factory Constraint Handling
- Preconditions
  - Some model constraints (FKs/NOT NULL) require valid related objects.
- Steps
  1. Audit backend factories/fixtures for Deal/ScheduledEvent/Signature creation; ensure they satisfy required FKs or rely on model defaults.
  2. Centralize helper factory methods to apply consistent defaults (e.g., default DealStage, default Technician).
  3. For frontend mocks, ensure mock data includes required fields used by UI (e.g., status, expiration_date, issuing_authority).
- Evidence Collection
  - Factory code; sample created objects in test logs.
- Verification
  - Re-run failing suites after factory alignment.
- Acceptance Criteria
  - No constraint-related failures; deterministic factory outputs.
- Risks/Alternatives
  - Overly “smart” factories can hide issues; keep defaults explicit and minimal.
- Rollback/Safety
  - Keep factories backward compatible; document defaults.

#### Task 4.2: Optimize Async Test Patterns and Component Mounting
- Preconditions
  - Tests must use `await waitFor(...)` for state updates; avoid brittle timing.
- Steps
  1. Standardize on `waitFor` for assertions following async renders; avoid `setTimeout`-style waiting.
  2. Ensure components mount inside provider wrappers (e.g., renderWithProviders) so contexts are available.
  3. Replace direct DOM queries with role/label-based queries consistent with a11y.
- Evidence Collection
  - Updated tests showing `waitFor` usage; passing outputs.
- Verification
  - Run representative component tests with async interactions.
- Acceptance Criteria
  - Flakiness reduced; consistent pass across runs.
- Risks/Alternatives
  - Be careful not to overuse `waitFor` for conditions that should be immediate.
- Rollback/Safety
  - Keep changes limited to test utilities/patterns.

#### Task 4.3: Fix Business Workflow Integration Test Patterns
- Preconditions
  - Cross-component flows may fail due to missing handlers, improper prop passing, or timing.
- Steps
  1. Ensure event handlers propagate state correctly (e.g., filter dialogs affect list queries with `search`, `issuing_authority`, `sort`).
  2. Confirm MSW handlers mirror these query params and return filtered results.
  3. Validate keyboard flows for opening menus and selecting options align with tests.
- Evidence Collection
  - Interaction logs; handler invocation verification.
- Verification
  - Run integration tests for certification workflows (filter/search/sort, alert dismissal, retry).
- Acceptance Criteria
  - All business workflow tests pass; no console errors.
- Risks/Alternatives
  - Tight coupling to test expectations—document assumptions.
- Rollback/Safety
  - Changes in test utils/components only; keep modular.

### Phase 5: Validation and Performance Verification

#### Task 5.1: Run Complete Test Suite Validation
- Preconditions
  - Backend and frontend subsets are passing locally.
- Steps
  1. Backend: run Django tests (focused first, then full). Frontend: run Jest suite and, optionally, Cypress E2E if part of CI.
  2. Capture coverage to ensure thresholds met (backend via coverage.py; frontend via Jest coverage).
  3. Address any remaining failures by mapping back to the relevant task category (models, API, a11y, infra).
- Evidence Collection
  - Test run outputs; coverage summaries.
- Verification
  - Execute workspace tasks: `run-tests-backend`, `run-tests-frontend`, or `run-tests-all` as defined.
- Acceptance Criteria
  - Backend 139/139; Frontend 1959/1959; coverage thresholds satisfied (e.g., >=70% frontend as configured).
- Risks/Alternatives
  - Flaky tests: rerun and inspect MSW handlers/timeouts.
- Rollback/Safety
  - N/A (test execution only).

#### Task 5.2: Verify Accessibility Compliance and Component Performance
- Preconditions
  - A11y fixes applied; charts mocked; lists not rendering thousands of nodes at once.
- Steps
  1. Ensure heading hierarchy is correct site-wide where tested; buttons/menus have accessible names.
  2. Confirm virtualization/pagination is present or large lists are chunked to meet performance test expectations.
  3. If using Cypress + axe, run a11y checks for target pages.
- Evidence Collection
  - Axe reports (if applicable); Jest performance timing logs from tests.
- Verification
  - Run a11y tests, and the “renders within performance budget” test for CertificationDashboard.
- Acceptance Criteria
  - No a11y violations reported by tests; render completes within the test’s threshold (<500ms as asserted).
- Risks/Alternatives
  - Performance in CI can vary; keep tests resilient (mock heavy ops).
- Rollback/Safety
  - Keep changes small and focused on semantics and mocking.

---

## Implementation Readiness and Next Steps
- Confirm BudgetV2 seeding signal and AccountViewSet permissions; align invoice email URL naming.
- Update CertificationDashboard headings and a11y labels if missing; expand MSW handler coverage.
- Standardize test patterns with waitFor and renderWithProviders; validate integration workflows.
- Run full backend and frontend suites; address any residual failures using the categories above.

## Success Criteria (Consolidated)
- Backend tests: PASS (139/139); model constraint defaults verified; API URL/auth fixed; dev validator returns correct payloads in DEBUG.
- Frontend tests: PASS (1959/1959); headings/a11y satisfied; MSW coverage complete; async patterns stabilized; performance assertions met.
- Documentation: This research file serves as the refined, evidence-backed instruction set for all tasks without altering source files.
