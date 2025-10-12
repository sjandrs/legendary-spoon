# Phase 1 — Canonical API Parity Baseline

Date: 2025-10-12
Owner: Platform Engineering
Status: In Progress

## Scope
- Finalize route-by-route parity diff (docs/issues/phase1-api-parity-diff.md)
- Lock canonical shapes: pagination {count,next,previous,results}, error schema, status codes
- Prioritized endpoints:
  - Core: accounts, contacts, deals
  - Finance: budgets-v2, payments, invoices, journal-entries, ledger-accounts
  - Operations: work-orders

## Workstreams & Tasks

1) Parity diff finalization (docs)
- Complete “Conventions” and link prioritized endpoints to API.md anchors
- Add per-endpoint “delta → action → test(s) → doc(s)” tables
- Files: docs/issues/phase1-api-parity-diff.md, docs/API.md
- Acceptance: Each prioritized endpoint has explicit delta and linked fix PR/test/doc

2) Canonical error and pagination standardization
- Implement/verify DRF exception handler for unified error payloads
  - Shape: 4xx with {detail}, ValidationError adds {detail, errors:[{path,message}]}
- Ensure pagination shape for prioritized endpoints: {count,next,previous,results}
- Add boundary tests: page=-1, page=9999
- Files: web/settings.py (EXCEPTION_HANDLER), main/exceptions.py; tests/main/tests/test_api_pagination_and_errors.py
- Acceptance: Tests pass on all prioritized endpoints; docs updated with examples

3) Endpoint-by-endpoint fixes (prioritized list)
- Normalize list pagination shape and defaults
- Verify and document filters/search/ordering + default ordering
- Standardize status codes (401 unauth, 403 unauthorized, 2xx authorized)
- Add/extend API tests (happy path + error matrix + pagination boundaries)
- Update API.md examples and anchors
- Files: api_views.py, filters.py, serializers.py, tests, docs/API.md
- Acceptance: Each endpoint has a closed parity issue with linked tests/docs

4) RBAC matrix enforcement
- Audit permission classes on finance/operations endpoints (FinancialDataPermission; owner/manager logic)
- Add 401/403/2xx matrix tests per resource
- Files: api_views.py, permissions.py, tests
- Acceptance: Matrix tests pass; parity issues reflect enforcement

5) JSON Schema coverage and dev validator aliases
- Ensure dev-only validator endpoint includes alias mappings for prioritized resources
- Add/update JSON Schemas; examples in docs
- Files: api_views.py/dev validator; schema locations per repo convention; docs/API.md
- Acceptance: Validator recognizes aliases; example validations succeed in docs

6) Documentation hardening
- For each endpoint: add request/response samples (success + error) and note filters/ordering
- Cross-link parity diff to API.md anchors and tests
- Files: docs/API.md, docs/issues/phase1-api-parity-diff.md
- Acceptance: All prioritized endpoints have examples and anchors; parity doc links tests/PRs

7) Test and coverage uplift (Phase 1 level)
- Expand tests across 401/403/2xx, error schema, pagination, filters/ordering
- Add minimal snapshot-style checks for shape consistency
- Files: main/tests/test_api_pagination_and_errors.py and existing suites
- Acceptance: Backend tests pass; coverage unchanged or improved

## Timeline (10 days)
- D1–2: Parity diff finalized; API conventions confirmed in API.md
- D3–4: Error/pagination standardization + tests
- D5–6: RBAC audit + matrix tests
- D7–8: Endpoint fixes (accounts, contacts, deals, budgets-v2, payments)
- D9: Endpoint fixes (invoices, journal-entries, ledger-accounts, work-orders)
- D10: JSON Schema validator aliases; doc polish; milestone close-out

## Definition of Done
- All nine prioritized endpoints:
  - Pass tests for canonical pagination, error schema, and RBAC matrix
  - Documented with request/response examples and filters/ordering in API.md
  - phase1-api-parity-diff.md contains finalized deltas with links to tests/docs
  - CI quality gates pass (lint/tests/coverage)

## Tracking with VS Code Tasks
- During edits run:
  - spec-compile (for docs consistency)
  - run-tests-backend (fast loop)
  - run-tests-coverage (periodically)
  - run-quality-check (before PR)

Milestone: “Phase 1 - Canonical API Parity Baseline”
- One tracking issue per endpoint; checkboxes:
  - Pagination standardized + tests
  - Error schema standardized + tests
  - RBAC matrix tests 401/403/2xx
  - Filters/ordering documented + tests
  - API.md examples + anchors
  - JSON Schema validator alias (if applicable)
