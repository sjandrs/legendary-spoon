<!-- markdownlint-disable-file -->
# Task Research Notes: Comprehensive Test Failure Fixes — Verified Evidence Pass

## Research Executed

### File Analysis
- c:\Users\sjand\ws\main\api_urls.py
  - Confirmed named route for invoice email send: path("invoices/<int:invoice_id>/send-email/", api_views.send_invoice_email, name="send-invoice-email").
  - Confirmed dev-only JSON validator route: path("dev/validate-json/", api_views.dev_validate_json, name="dev-validate-json").
  - Verified additional endpoint names referenced by tests and docs (search, analytics v2, GTIN check digit, technician APIs, route optimization and its alias).

- c:\Users\sjand\ws\main\api_views.py (focused section)
  - send_invoice_email(request, invoice_id) exists, requires auth, fetches WorkOrderInvoice, calls invoice.send_invoice_email(), logs activity via log_activity(user, "email_sent", ...), returns 200 on success.
  - send_overdue_reminders(request) loops unpaid+overdue invoices, calls send_invoice_email(), logs email_sent per invoice; returns summary payload.

- c:\Users\sjand\ws\main\tests\test_activity_log.py
  - Uses reverse("send-invoice-email", kwargs={"invoice_id": inv_id}) — matches the URL name in api_urls.py.
  - Builds minimal Contact → Project → WorkOrder → WorkOrderInvoice and posts to the endpoint; asserts 200 and that an ActivityLog with action="email_sent" for the invoice exists.
  - Creates DigitalSignature with minimal fields and posts to digitalsignature-verify; asserts ActivityLog update exists (indirect verification of content-type defaults in model save()).
  - Exercises inventory reservation consumption via inventoryreservation-consume; asserts ActivityLog update exists.

- c:\Users\sjand\ws\frontend\src\components\CertificationDashboard.jsx (focused section)
  - Overview section is a region with aria-labelledby="overview-heading" and an <h2 id="overview-heading">Overview</h2> heading.
  - Charts section is a landmark region with screen-reader heading.
  - Status counts and charts are present; doughnut and bar charts are rendered (tests mock Chart.js and assert by test ids/attributes).
  - Earlier in file the top-level page title <h1>Certification Dashboard</h1> is present, aligning with test expectations.

### Code Search Results
- send-invoice-email
  - main/api_urls.py uses exact name expected by tests.
- Certification Dashboard headings
  - Component includes a top-level <h1> and at least two <h2> (“Overview”, and “Certifications (N)”) per test assumptions.

### External Research
- #githubRepo:"django/django url name reverse"
  - Standard Django reverse() usage patterns align with tests using named routes.
- #fetch:https://www.django-rest-framework.org/api-guide/testing/
  - Confirms APITestCase/APIClient patterns used in test_activity_log.py.

### Project Conventions
- Standards referenced: .github/copilot-instructions.md (API patterns, permissions), docs/DEVELOPMENT.md (testing/dev utilities), React a11y patterns reflected in tests.
- Instructions followed: Verification-first minimal-change policy; align code/tests with named URLs and a11y semantics.

## Key Discoveries

### Project Structure
- DRF router plus explicit path() routes live in main/api_urls.py.
- Business endpoints implemented in main/api_views.py adhere to permission requirements and activity logging.
- Frontend CertificationDashboard implements the heading structure and regions required by tests; Chart.js usage is mock-friendly.

### Implementation Patterns
- Email endpoints rely on model-level WorkOrderInvoice.send_invoice_email() and log via log_activity helper.
- Tests construct minimal valid graph (Contact → Project → WorkOrder → WorkOrderInvoice) and assert ActivityLog side effects.
- Frontend tests target headings, regions, and data-testid attributes rather than full chart rendering.

### Complete Examples
```python
# From main/api_urls.py (verified)
path(
    "invoices/<int:invoice_id>/send-email/",
    api_views.send_invoice_email,
    name="send-invoice-email",
)
```

### API and Schema Documentation
- Dev JSON validator route name: dev-validate-json and usage is DEBUG-only per docs/DEVELOPMENT.md.

### Configuration Examples
- Note: Chart.js is mocked in frontend tests; MSW handlers provide API coverage during test runs.

### Technical Requirements
- Backend: Ensure auth-required endpoints return 401 for unauthenticated access; activity logs created for email and inventory operations; BudgetV2 distributions seeded on create (per signals).
- Frontend: CertificationDashboard must expose h1 (“Certification Dashboard”), h2 (“Overview”), and h2 for “Certifications (N)”; accessibility-friendly regions and labels; MSW handlers cover endpoints used by tests.

## Recommended Approach
Proceed to run targeted backend and frontend tests. Given verified alignment (URL names, view function, model method, component headings), expect green for the specific tests reviewed. If failures occur elsewhere, apply minimal, evidence-backed fixes and re-run.

## Implementation Guidance
- **Objectives**: Achieve 100% pass rate; fix only what tests prove broken; preserve API names and a11y semantics already correct.
- **Key Tasks**:
  - Run backend tests focusing on activity logs, invoice email, dev validator, and BudgetV2.
  - Run frontend tests focusing on CertificationDashboard headings, charts, and MSW handlers.
  - Triage any failures; implement minimal fixes; re-run until green.
- **Dependencies**: Django auth & ActivityLog; WorkOrderInvoice model method; React Testing Library; MSW configuration.
- **Success Criteria**: All tests pass; URL name remains send-invoice-email; CertificationDashboard renders required headings/regions; activity logs present for asserted operations.
