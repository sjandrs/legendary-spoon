<!-- markdownlint-disable-file -->
# Task Research: Phase 2 — Finance & Budget V2 Completion

Date: 2025-10-12
Owner: Platform Engineering

## Research Executed

### Internal File Analysis
- main/models.py → BudgetV2, MonthlyDistribution models present with auto-seeding (12 months) and validation hooks.
- main/serializers.py → BudgetV2Serializer with nested writes support and _replace_distributions helper; MonthlyDistributionSerializer exists.
- main/api_views.py → BudgetV2ViewSet and MonthlyDistributionViewSet; route actions for distributions replace documented.
- main/api_urls.py → Router registers budgets-v2 and monthlydistribution endpoints.
- main/tests/ → test_budget_v2_api.py, test_budget_v2_distributions.py, test_budget_v2_model_validation.py, test_budget_v2.py cover model constraints, API nested writes, and reseeding.
- docs/API.md → Budget V2 section with nested writes examples and invariants.
- frontend/src/components → BudgetV2Editor.jsx, BudgetsV2.jsx wired to /api/budgets-v2/ API.

### External Research and Verified Patterns
- ERPNext Budget patterns (Stop/Warn/Ignore; monthly distribution; dimensional budgeting with Cost Center/Project)
  - Evidence via repository tests and controllers:
    - #githubRepo:"doctype budget test_budget get_accumulated_monthly_budget BudgetValidation" "frappe/erpnext"
  - Key behaviors: Accumulated monthly threshold calculation using MonthlyDistribution; applicability flags for PO/MR/Actuals; per-account rows.
- JSON Schema draft-07 stability and capabilities
  - #fetch:https://json-schema.org/draft-07/json-schema-release-notes.html (validation keywords; $comment; readOnly/writeOnly)

### Concrete Code Examples (verified)
```python
# GS1 check digit (from GTIN research; weights 3/1 from the right)
def compute_gtin_check_digit(base: str) -> int:
    total = 0
    for i, ch in enumerate(reversed(base), start=1):
        d = ord(ch) - 48
        total += d * (3 if i % 2 == 1 else 1)
    mod = total % 10
    return 0 if mod == 0 else 10 - mod
```

```json
// Budget V2 payload example (dimensional budgeting)
{
  "name": "FY2026 Marketing Budget",
  "cost_center": 10,
  "project": null,
  "year": 2026,
  "distributions": [
    {"month": 1, "percent": 8.33},
    {"month": 2, "percent": 8.33},
    {"month": 3, "percent": 8.33},
    {"month": 4, "percent": 8.33},
    {"month": 5, "percent": 8.33},
    {"month": 6, "percent": 8.33},
    {"month": 7, "percent": 8.33},
    {"month": 8, "percent": 8.33},
    {"month": 9, "percent": 8.33},
    {"month": 10, "percent": 8.33},
    {"month": 11, "percent": 8.33},
    {"month": 12, "percent": 8.37}
  ]
}
```

### Project Structure Analysis (current repo)
- Endpoints:
  - GET/POST /api/budgets-v2/
  - GET/PUT/PATCH /api/budgets-v2/{id}/
  - POST /api/budgets-v2/{id}/seed-default/ (reseeds 12×8.33%)
  - PUT/PATCH /api/budgets-v2/{id}/distributions/ (atomic replace)
- Server invariants implemented/tests present:
  - Exactly 12 MonthlyDistribution rows per budget; months in 1..12; total percent == 100.00
  - Model-level constraints and signals to keep totals invariant
  - Serializer replace semantics wired via BudgetV2Serializer
- Frontend wiring present with BudgetV2Editor and BudgetsV2 list; success toasts and refresh behavior in place; further UX (lock toggles, copy-last-year) TBD.

### Specifications and Contracts
- Authoritative JSON Schemas: draft-07 for BudgetV2 and MonthlyDistribution (see static/kb/schemas/*), variants informational.
- API response and error shapes adhere to canonical pagination and error schema.
- RBAC: FinancialDataPermission applies to BudgetV2; Managers manage; others restricted.

## Technical Requirements for Phase 2
1) Finalize nested writes semantics and validation messaging consistency across endpoints.
2) Add/verify API filters: year and cost_center on /api/budgets-v2/ with tests and docs examples.
3) Frontend BudgetV2 UX affordances: lock toggles, normalize-to-100, copy-last-year; maintain a11y states.
4) Documentation updates in docs/API.md with request/response and error examples.
5) Tests: backend (valid/invalid create/update, replace, filters, permissions), frontend Jest (editor behavior), Cypress (happy paths), a11y via cypress-axe.
6) CI: Ensure coverage thresholds maintained; tie deliverables to CI gates.

## Recommended Approach
- Treat BudgetV2/MonthlyDistribution as authoritative; avoid breaking changes; where messaging deviates, align serializer errors to canonical structure.
- Implement filterset for BudgetV2ViewSet (year, cost_center). Use django-filter; ensure pagination and ordering stable.
- Add small helper on frontend to normalize distribution to total 100.00 with last-month adjustment; provide a 'Copy last year' action that loads previous budget rows and maps months.
- Write focused tests for filters and distributions replace; keep distribution rounding deterministic (use Decimal).

## Implementation Guidance (by area)
- Backend
  - FilterSet: Add year, cost_center with query params documented and tested.
  - Serializer: Verify/align error messages; keep _replace_distributions transactional; enforce 12-row constraint precedes create/update commit.
  - Permissions: Confirm FinancialDataPermission coverage; add tests for 401/403/2xx.
- Frontend
  - BudgetV2Editor: Add normalize-to-100 and copy-last-year interactions; show a11y-friendly error/success states; wire to API.
  - BudgetsV2: Add filter controls for year and cost center; persist selection in URL/query state.
- Docs/QA
  - Update docs/API.md with filter examples and nested writes; add explicit error examples.
  - Cypress: Add flows for create, edit distributions, reseed, filter list; integrate cypress-axe.

## Sources and Cross-Refs
- Prior research: #file:../research/20251011-dimensional-budgets-v2-research.md
- Prior research: #file:../research/20251011-gtin-and-budgetv2-integration-research.md
- Specs: spec/spec-design-accounting-expansion.md → Budget v2 and MonthlyDistribution
- Docs: docs/API.md → Budget V2 section
