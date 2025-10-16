<!-- markdownlint-disable-file -->
# Task Details: Phase 2 — Finance & Budget V2 Completion

## Research Reference

**Source Research**: #file:../research/20251012-phase-2-finance-budget-v2-research.md

## Phase 1: Backend filters and validation

### Task 1.1: Implement year and cost_center filters on BudgetV2ViewSet

Add django-filter FilterSet for BudgetV2 supporting exact year and cost_center filters. Ensure pagination and ordering are stable.

- Files:
  - main/api_views.py — add FilterSet class and hook into BudgetV2ViewSet (filterset_class)
  - main/tests/test_budget_v2_api.py — add filter tests for year & cost_center on list endpoint
- Success:
  - GET /api/budgets-v2/?year=2026 filters correctly; GET /api/budgets-v2/?cost_center=<id> filters correctly
  - Tests PASS; pagination shape preserved
- Research References:
  - #file:../research/20251012-phase-2-finance-budget-v2-research.md (Lines 33-78) — Internal analysis of BudgetV2 endpoints and tests
  - #githubRepo:"doctype budget test_budget get_accumulated_monthly_budget BudgetValidation" "frappe/erpnext" — patterns for dimensional budgeting
- Dependencies:
  - django-filter configured in REST_FRAMEWORK DEFAULT_FILTER_BACKENDS

### Task 1.2: Align serializer error messages to canonical shapes and ensure transactional replace

Verify BudgetV2Serializer replace operation is transactional and align error messages to `{ detail, errors? }` when raising validation errors.

- Files:
  - main/serializers.py — adjust validation paths to raise DRF ValidationError with detail shape as needed
  - main/tests/test_budget_v2_distributions.py — add negative tests asserting error payload structure
- Success:
  - Invalid distributions return 400 with `{ "detail": "..." }` or `{ "detail": "...", "errors": [...] }`
  - No partial writes when replace fails (row count remains consistent)
- Research References:
  - #file:../research/20251012-phase-2-finance-budget-v2-research.md (Lines 80-135) — Serializer and invariants
- Dependencies:
  - Custom DRF exception handler already normalizes shapes

## Phase 2: Frontend UX improvements

### Task 2.1: Add normalize-to-100 and copy-last-year to BudgetV2Editor with a11y feedback

Enhance the editor to normalize distribution totals to 100.00 (adjusting the final month) and add a button to copy prior year’s distribution from a selected BudgetV2.

- Files:
  - frontend/src/components/BudgetV2Editor.jsx — add two controls (Normalize, Copy Last Year) and helper logic
  - frontend/src/api.js — add optional API method to fetch prior year by cost center
- Success:
  - Clicking Normalize adjusts percentages to 100.00 and shows confirmation
  - Copy Last Year fetches previous year and pre-fills distribution
- Research References:
  - #file:../research/20251012-phase-2-finance-budget-v2-research.md (Lines 137-190) — Frontend wiring and guidance
- Dependencies:
  - GET /api/budgets-v2/?year=<y>&cost_center=<id> must exist (Task 1.1)

### Task 2.2: Add list filters (year, cost center) to BudgetsV2 and sync to URL

Include filter controls and sync state to the URL query parameters.

- Files:
  - frontend/src/components/BudgetsV2.jsx — add filter UI and tie into API calls
- Success:
  - Changing filters updates list and URL; reload respects filters
- Research References:
  - #file:../research/20251012-phase-2-finance-budget-v2-research.md (Lines 137-190)
- Dependencies:
  - API filters implemented

## Phase 3: Docs and tests

### Task 3.1: Backend tests for filters, replace endpoint, and RBAC

Extend backend tests for the new filters and verify RBAC behaviors remain correct.

- Files:
  - main/tests/test_budget_v2_api.py — new tests for year/cost_center filters
  - main/tests/test_permissions_rbac_actions.py — add cases for BudgetV2 if gaps exist
- Success:
  - Tests verify filtered results and permission responses (401/403/2xx)
- Research References:
  - #file:../research/20251012-phase-2-finance-budget-v2-research.md (Lines 192-240)
- Dependencies:
  - Phase 1 completion

### Task 3.2: Frontend Jest/Cypress tests and docs/API.md updates

Add tests for editor behaviors and list filters; update docs with examples for filters and nested writes.

- Files:
  - frontend/src/components/__tests__/BudgetV2Editor.test.jsx — normalize/copy behaviors
  - frontend/src/components/__tests__/BudgetsV2.test.jsx — list filters
  - cypress/e2e/budgets_v2.cy.js — create/edit/normalize/reseed flow with a11y checks
  - docs/API.md — add filter examples and error payloads for Budget V2
- Success:
  - Jest and Cypress tests pass locally and in CI; docs updated with correct anchors
- Research References:
  - #file:../research/20251012-phase-2-finance-budget-v2-research.md (Lines 242-300)
- Dependencies:
  - Phase 2 completion

## Dependencies

- django-filter, DRF, React testing setup, Cypress and cypress-axe

## Success Criteria

- Filters available and documented; nested writes semantics stable; frontend enhancements delivered with tests; quality gates PASS.
