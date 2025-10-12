---
applyTo: '.copilot-tracking/changes/20251012-phase-2-finance-budget-v2-changes.md'
---
<!-- markdownlint-disable-file -->
# Task Checklist: Phase 2 — Finance & Budget V2 Completion

## Overview

Finalize Budget V2 nested writes, add filters, polish frontend UX, and update tests/docs to meet canonical Phase 2 acceptance.

## Objectives

- Add verified year and cost_center filters to /api/budgets-v2/ and document with examples
- Complete nested writes semantics and frontend UX affordances (normalize-to-100, copy-last-year)

## Research Summary

### Project Files
- main/api_views.py — BudgetV2ViewSet and MonthlyDistributionViewSet; distributions replace route
- main/serializers.py — BudgetV2Serializer with _replace_distributions helper; validation rules
- frontend/src/components/BudgetV2Editor.jsx — Editor component wiring to API
- docs/API.md — Budget V2 docs with nested writes examples

### External References
- #file:../research/20251012-phase-2-finance-budget-v2-research.md — Consolidated Phase 2 research with evidence and code examples
- #githubRepo:"doctype budget test_budget get_accumulated_monthly_budget BudgetValidation" "frappe/erpnext" — Implementation patterns (Stop/Warn/Ignore; accumulated monthly)
- #fetch:https://json-schema.org/draft-07/json-schema-release-notes.html — Schema validation capabilities

### Standards References
- Refer to repository coding standards and existing test/documentation patterns in this project

## Implementation Checklist

### [ ] Phase 1: Backend filters and validation

- [ ] Task 1.1: Implement year and cost_center filters on BudgetV2ViewSet
  - Details: .copilot-tracking/details/20251012-phase-2-finance-budget-v2-details.md (Lines 25-70)

- [ ] Task 1.2: Align serializer error messages to canonical shapes and ensure transactional replace
  - Details: .copilot-tracking/details/20251012-phase-2-finance-budget-v2-details.md (Lines 72-120)

### [ ] Phase 2: Frontend UX improvements

- [ ] Task 2.1: Add normalize-to-100 and copy-last-year to BudgetV2Editor with a11y feedback
  - Details: .copilot-tracking/details/20251012-phase-2-finance-budget-v2-details.md (Lines 122-190)

- [ ] Task 2.2: Add list filters (year, cost center) to BudgetsV2 and sync to URL
  - Details: .copilot-tracking/details/20251012-phase-2-finance-budget-v2-details.md (Lines 192-230)

### [ ] Phase 3: Docs and tests

- [ ] Task 3.1: Backend tests for filters, replace endpoint, and RBAC
  - Details: .copilot-tracking/details/20251012-phase-2-finance-budget-v2-details.md (Lines 232-295)

- [ ] Task 3.2: Frontend Jest/Cypress tests and docs/API.md updates
  - Details: .copilot-tracking/details/20251012-phase-2-finance-budget-v2-details.md (Lines 297-360)

## Dependencies

- django-filter; DRF; existing BudgetV2/MonthlyDistribution models and serializers
- Frontend testing stack (Jest/RTL/MSW, Cypress + cypress-axe)

## Success Criteria

- /api/budgets-v2/ supports year and cost_center filters with tests passing
- Nested writes stable with consistent error messages; 12-month invariant enforced
- Frontend editor provides normalize-to-100 and copy-last-year; list filters work
- Docs updated with examples; all lint/tests PASS in CI
