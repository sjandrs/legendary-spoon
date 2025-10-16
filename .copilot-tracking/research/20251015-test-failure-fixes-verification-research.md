<!-- markdownlint-disable-file -->
# Task Research Notes: Comprehensive Test Failure Fixes – Verified Implementation Map

## Research Executed

### File Analysis
- main/signals.py
  - Verified BudgetV2 post_save signal `seed_budget_distributions` auto-seeds 12 MonthlyDistribution rows on create (guarded by `_disable_auto_seed` and existing distributions). Also enforces 12-month total = 100.00% via `monthly_distribution_post_save` safety check. ScheduledEvent creation queues Celery tasks and falls back to services; WorkOrder completion handlers present with inventory/invoice flows.

- main/api_urls.py
  - Confirmed route names used by tests: `send-invoice-email` for invoice email action; dev-only validator at `dev/validate-json/` named `dev-validate-json`. All core ViewSets registered, including `digital-signatures`, `budgets-v2`, `scheduled-events`.

- requirements.txt
  - `jsonschema>=4.23.0` is present, satisfying dev JSON validator dependency. Other relevant deps present (celery, redis, weasyprint, googlemaps, twilio).

- frontend/src/__tests__/components/CertificationDashboard.test.jsx
  - Tests expect semantic headings: h1 "Certification Dashboard", h2 "Overview", and an h2 matching `/Certifications (\d+)/`. They also assert accessible status indicators (e.g., a table cell role with text matching /active/i) and that charts render (mocked Doughnut/Bar), plus error and loading states, filtering/sorting controls, and alert dismissal.

### Code Search Results
- dev_validate_json|validate-json|jsonschema
  - Matches in tests and views confirm endpoint and lazy import path:
    - main/tests/test_dev_validator.py → uses POST "/api/dev/validate-json/"
    - main/api_views.py → `def dev_validate_json(request)` and lazy import of `jsonschema.Draft7Validator` with fallback message if not installed
    - main/api_urls.py → `path("dev/validate-json/", ..., name="dev-validate-json")`

### External Research
- #fetch:https://www.django-rest-framework.org/api-guide/permissions/
  - DRF permissions overview; `IsAuthenticated` requires valid authentication for access. Appropriate for securing AccountViewSet list/detail endpoints and returning 401 to unauthenticated requests.
- #fetch:https://python-jsonschema.readthedocs.io/en/stable/
  - `jsonschema` library documentation; `Draft7Validator` usage patterns align with lazily importing for dev-only validation endpoint.

### Project Conventions
- Standards referenced: `.github/copilot-instructions.md` (architecture and patterns), docs/DEVELOPMENT.md (testing and routes), established DRF ViewSet patterns across `main/api_views.py` and role-based filtering.
- Instructions followed: Verified route naming, auth enforcement patterns, signal-driven workflows, and frontend testing expectations to avoid redundant implementation tasks.

## Key Discoveries

### Project Structure
- Backend uses DRF ViewSets registered via `main/api_urls.py` (router + named paths). Signals in `main/signals.py` implement cross-module automation (deal→project/workorder, scheduled events, inventory, invoicing). Requirements include `jsonschema`, enabling dev validator tests.
- Frontend tests for CertificationDashboard assert semantic heading hierarchy, accessible indicators, robust loading/error flows, and controls for filtering/sorting; charts are mocked, focusing on data wiring and structure.

### Implementation Patterns
- Auth: ViewSets typically specify `IsAuthenticated`; data scoping uses role checks (e.g., membership in "Sales Manager"). Activity logging in `perform_create`/`perform_update` is consistent.
- BudgetV2 distributions: server-side constraints enforce 12 rows and 100.00% total; API layer supports atomic replacement with validations.
- Dev JSON validation: DEBUG-gated endpoint with lazy `jsonschema` import; returns informative errors when library absent (now satisfied by requirements).
- URL naming: Tests should reference `send-invoice-email` (hyphenated), matching configured route names.

### Complete Examples
```python
# From main/signals.py (verified)
@receiver(post_save, sender=BudgetV2)
def seed_budget_distributions(sender, instance, created, **kwargs):
    if created and not getattr(instance, "_disable_auto_seed", False):
        if not instance.monthly_distributions.exists():
            instance.seed_default_distribution()

@receiver(post_save, sender=MonthlyDistribution)
def monthly_distribution_post_save(sender, instance, created, **kwargs):
    # When 12 rows exist, enforce total == 100.00
    ...

# From main/api_urls.py (verified)
path(
    "invoices/<int:invoice_id>/send-email/",
    api_views.send_invoice_email,
    name="send-invoice-email",
),
path("dev/validate-json/", api_views.dev_validate_json, name="dev-validate-json"),
```

### API and Schema Documentation
- DRF `IsAuthenticated` ensures 401 for unauthenticated access; align tests with expected status codes.
- `jsonschema` Draft 7 validator usage supports dev-only validation endpoint scenarios; tests should pass with installed dependency.

### Configuration Examples
```ini
# requirements.txt (verified present)
jsonschema>=4.23.0
```

### Technical Requirements
- Backend
  - BudgetV2: Auto-seed distributions on create (already implemented). Maintain invariant of 12 rows totaling 100.00 via model/signal/API validation.
  - Routes: Use `send-invoice-email` route name; dev validator available at `dev/validate-json/` with DEBUG gating.
  - Auth: Account APIs should return 401 when unauthenticated via `IsAuthenticated` (confirm in ViewSet and tests).
- Frontend
  - CertificationDashboard: Must render h1 "Certification Dashboard", h2 "Overview", and h2 for "Certifications (N)"; provide accessible status indicators, loading/error states, and filtering/sorting controls.

## Recommended Approach
Converge instruction updates on validation and verification rather than re-implementation where features exist:
- Phase 1 (Model/Constraints): Mark BudgetV2 distribution seeding as implemented; focus tasks on asserting invariant checks and adding tests where gaps remain. For Deal/ScheduledEvent defaults, validate existing save/manager logic against failing tests; only add code changes if specific gaps are evidenced.
- Phase 2 (Auth/URLs/Validator): Confirm AccountViewSet enforces `IsAuthenticated` and returns 401 unauthenticated; ensure tests use `send-invoice-email` (hyphen) and leverage dev validator with `jsonschema` installed (dependency already present).
- Phase 3 (Frontend A11y/MSW): Align CertificationDashboard with test expectations (headings, ARIA/status text, controls). Expand MSW handlers to cover API usage observed in tests to reduce flakiness.
- Phase 4 (Test Infra): Standardize async patterns (waitFor) in RTL tests; ensure factory/setup utilities satisfy FK/NOT NULL constraints.
- Phase 5 (Validation): Run focused subsets, then full suites; address only evidenced gaps; avoid duplicating logic (e.g., BudgetV2 seeding exists in signal).

## Implementation Guidance
- Objectives: Achieve 100% test pass rate by refining tasks to verification-first steps, adjusting only where research shows missing or misaligned behavior.
- Key Tasks:
  - Backend: Validate (not re-create) BudgetV2 seeding; verify 12×100.00% constraints. Confirm 401 on unauthenticated Account API. Ensure tests reference `send-invoice-email` route name. Exercise dev validator with `jsonschema` installed.
  - Frontend: Ensure CertificationDashboard headings and accessible labels match tests; verify loading/error/controls present; shore up MSW handlers for API calls under test.
  - Testing: Adopt consistent async handling (`waitFor`) and robust factory setup for required relationships/fields.
- Dependencies: DRF `IsAuthenticated`, `jsonschema` (installed), signals for BudgetV2/MonthlyDistribution, frontend test mocks (react-chartjs-2, MSW).
- Success Criteria:
  - Backend: Dev validator tests green; Account unauthenticated tests return 401; BudgetV2 distribution tests pass without code duplication.
  - Frontend: CertificationDashboard tests pass for headings, ARIA/status, charts (mocked), filtering/sorting, alerts. Reduced flakiness via complete MSW handlers and proper async patterns.
