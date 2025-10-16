<!-- markdownlint-disable-file -->
# Task Research Notes: Remaining High-Risk Areas – Validation and Gaps (Delta)

## Research Executed

### File Analysis
- main/api_urls.py
  - Confirms named route `send-invoice-email` at `invoices/<int:invoice_id>/send-email/` and dev validator at `dev/validate-json/` named `dev-validate-json`.
- main/api_views.py
  - `dev_validate_json` is DEBUG-gated, authenticated, returns `{schema, schema_path, valid, errors[]}` using `jsonschema.Draft7Validator`; alias normalization present.
- main/signals.py
  - `@receiver(post_save, sender=BudgetV2)` seeds 12-month `MonthlyDistribution` via `seed_default_distribution()` on create; `MonthlyDistribution` post-save safety enforces 100% total at 12 rows.
- main/models.py
  - Classes present: Deal, BudgetV2, MonthlyDistribution, ScheduledEvent, DigitalSignature. Defaults/guards implemented as expected (DigitalSignature defaults `content_type`, `object_id`, `ip_address`).
- frontend/src/components/CertificationDashboard.jsx
  - Heading and a11y semantics implemented: `<h1 id="page-title">Certification Dashboard</h1>`, region with `<h2 id="overview-heading">Overview</h2>`, and `<h2 id="certifications-heading">Certifications (N)</h2>`; SR-only headings for Charts/Filters; ARIA labels on controls/status.
- frontend/src/__tests__/components/CertificationDashboard.test.jsx
  - Tests mock API and Chart.js, expect the heading structure, a11y labels, filters/sort interactions, and performance-friendly rendering.
- requirements.txt
  - `jsonschema>=4.23.0` present, satisfying dev validator dependency.

### Code Search Results
- send-invoice-email|send_invoice_email
  - URL name confirmed as `send-invoice-email` (hyphenated) in `main/api_urls.py`; tests reverse this name correctly.
- dev/validate-json|dev-validate-json|dev_validate_json
  - Path present in urls; view present and DEBUG-gated; tests post to `/api/dev/validate-json/` and assert response shape.
- CertificationDashboard
  - Component and tests located; heading structure and ARIA attributes present; route wired in `App.jsx`.
- msw|setupTests|msw-server
  - MSW v2 server scaffolding and handlers present in testing utilities; global exposure in `setupTests.js`.

### External Research
- #githubRepo:"encode/django-rest-framework permissions IsAuthenticated"
  - Standard DRF authentication enforcement pattern validated (permission_classes = [IsAuthenticated]).
- #fetch:https://docs.djangoproject.com/en/stable/ref/contrib/contenttypes/
  - Confirms correct usage of `ContentType.objects.get_for_model()` for defaulting generic relations.
- #fetch:https://testing-library.com/docs/dom-testing-library/api-async/#waitfor
  - Reinforces `waitFor` for async assertions in Jest/RTL tests.
- #fetch:https://mswjs.io/docs/getting-started/mocks
  - Confirms handler patterns and unhandled-request detection for comprehensive test mocking.
- #fetch:https://www.w3.org/TR/WCAG21/
  - Baseline WCAG 2.1 AA criteria for headings, landmarks, and control names.

### Project Conventions
- Standards referenced: .github/copilot-instructions.md; docs/DEVELOPMENT.md; frontend/src/__tests__/README.md (MSW and test patterns).
- Instructions followed: Verification-first; update research only; avoid duplication with `20251015-comprehensive-test-failure-fixes-refined-instructions-research.md` (this note is a delta focused on remaining high-risk areas).

## Key Discoveries

### Project Structure
- Backend invariants for URLs, DEBUG-gated dev validator, and BudgetV2 seeding are implemented as expected; no source changes indicated by evidence.
- Frontend CertificationDashboard already meets heading, ARIA, and structural expectations defined by tests; handlers and polyfills for MSW exist.

### Implementation Patterns
- DEV validator returns structured validation using Draft-07 with alias normalization and schema discovery under `.copilot-tracking/research/*{key}.schema.json`.
- MonthlyDistribution totals enforced via signal safety and model validations; BudgetV2 seeding guarded against duplication.
- A11y: regions labeled via `aria-labelledby`; SR-only headings for non-visual sections; buttons named per tests.

### Complete Examples
```python
# main/api_views.py – dev_validate_json (excerpt)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def dev_validate_json(request):
    if not getattr(settings, "DEBUG", False):
        raise Http404()
    # ... alias map, schema lookup under .copilot-tracking/research
    from jsonschema import Draft7Validator
    validator = Draft7Validator(schema_obj)
    errors = [{"path": path, "message": err.message} for err in validator.iter_errors(payload)]
    return Response({"schema": schema_key, "schema_path": str(schema_path.relative_to(base_dir)), "valid": len(errors) == 0, "errors": errors})
```

```jsx
// frontend/src/components/CertificationDashboard.jsx – headings (excerpt)
<div className="certification-dashboard" role="main" aria-labelledby="page-title">
  <h1 id="page-title">Certification Dashboard</h1>
  <div className="overview-section" role="region" aria-labelledby="overview-heading">
    <h2 id="overview-heading">Overview</h2>
    {/* ... */}
  </div>
  <div className="certifications-section" role="region" aria-labelledby="certifications-heading">
    <h2 id="certifications-heading">Certifications ({filteredCertifications.length})</h2>
  </div>
</div>
```

```python
# main/signals.py – BudgetV2 seeding and MonthlyDistribution safety (excerpt)
@receiver(post_save, sender=BudgetV2)
def seed_budget_distributions(sender, instance, created, **kwargs):
    if created and not getattr(instance, "_disable_auto_seed", False):
        if not instance.monthly_distributions.exists():
            instance.seed_default_distribution()

@receiver(post_save, sender=MonthlyDistribution)
def monthly_distribution_post_save(sender, instance, created, **kwargs):
    # when 12 rows exist, enforce total == 100.00 (round 2dp)
```

### API and Schema Documentation
- DEV validator API: POST `/api/dev/validate-json/` with `{ schema: string, payload: object }` (DEBUG-only, auth required); returns `{ valid, errors[], schema_path }`.
- Invoice email endpoint: `reverse('send-invoice-email', kwargs={'invoice_id': id})` hits `main.api_views.send_invoice_email`.

### Configuration Examples
```pip
# requirements.txt – dev validator dependency present
jsonschema>=4.23.0
```

### Technical Requirements
- Backend: maintain URL names and dev validator shape; ensure BudgetV2 seeding idempotency and MonthlyDistribution 100% invariant; confirm auth on Account APIs.
- Frontend: heading hierarchy; accessible control names; MSW handlers to prevent unhandled requests; use `waitFor` for async assertions.

## Recommended Approach
Given current evidence, do not modify code for the verified areas. Proceed with targeted test execution to confirm no hidden regressions. If failures emerge, categorize them (models, URLs/auth, a11y/ARIA, MSW coverage, async patterns) and apply minimal, evidence-backed adjustments aligned with existing conventions.

## Implementation Guidance
- Objectives: Validate remaining high-risk areas via tests; document exact failures and map to minimal fixes; keep documentation in sync.
- Key Tasks:
  - Run backend tests touching: activity log email route, dev validator (DEBUG true/false), BudgetV2 seeding and totals, Account auth enforcement.
  - Run frontend tests for CertificationDashboard: headings/a11y, filters/sort, performance, retry flows; watch for MSW unhandled requests.
  - Update this research note with concrete failure traces and resolved deltas; avoid duplication with the refined-instructions note.
- Dependencies: Django 5.2.x, DRF, jsonschema, Jest + RTL, MSW v2; Windows PowerShell test tasks available in workspace.
- Success Criteria: No backend URL/auth/schema failures; DEV validator passes expected cases; frontend CertificationDashboard tests pass without a11y or MSW warnings; document any deltas applied.
