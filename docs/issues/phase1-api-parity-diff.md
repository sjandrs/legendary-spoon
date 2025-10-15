# Phase 1 – API Parity Diff (Route-by-Route)

This document compares current routes to canonical expectations and calls out alignment tasks.

## Conventions
- Pagination: `{count, next, previous, results}` (see examples in API.md → [Conventions](../API.md#conventions))
- Errors: 4xx with `{detail}` or `{detail, errors:[{path,message}]}` for validation lists
- RBAC: 401 unauth, 403 unauthorized, 2xx authorized
- Anchors to API reference:
	- Core: [Accounts](../API.md#accounts), [Contacts](../API.md#contacts), [Deals](../API.md#deals)
	- Finance: [Budgets V2](../API.md#budget-v2), [Payments](../API.md#payments), [Invoices](../API.md#invoices), [Journal Entries](../API.md#journal-entries), [Ledger Accounts](../API.md#ledger-accounts)
	- Operations: [Work Orders](../API.md#work-orders)

## Auth
- /api/auth/login/ — OK
- /api/auth/logout/ — OK
- /api/auth/user/ — OK

## Core CRM
- /api/accounts/ — see API.md → [Accounts](../API.md#accounts); RBAC enforced (owner vs manager). Check pagination/error docs.
- /api/contacts/ — see API.md → [Contacts](../API.md#contacts); RBAC enforced. Check pagination/error docs.
- /api/deals/ — see API.md → [Deals](../API.md#deals); Filters/Search/Ordering present. Verify docs and tests.
- /api/projects/ — RBAC (assigned/created_by); verify ordering and docs.

## Finance
- /api/ledger-accounts/ — Permission: FinancialDataPermission (OK)
- /api/journal-entries/ — Permission: FinancialDataPermission (OK)
- /api/expenses/ — RBAC check (submitted_by vs manager)
- /api/budgets/ — Legacy
- /api/budgets-v2/ — see API.md → [Budget V2](../API.md#budget-v2); Nested writes documented; tests exist; ensure docs anchors
- Reports: /api/reports/balance-sheet/, /api/reports/pnl/, /api/reports/cash-flow/

## Operations
- /api/work-orders/ — Actions: generate-invoice, complete (COGS); verify RBAC
- /api/line-items/ — Standard
- /api/payments/ — allocate action with idempotency; ensure 409 coverage in tests
- /api/warehouses/, /api/warehouse-items/ — Standard

## Search
- /api/search/ — GlobalSearchView wired; verify fallback aliases tested
- /api/search/v2/ — Advanced search endpoint

## Analytics
- /api/analytics/dashboard/ — Cross-module analytics (REQ-205)
- /api/analytics/dashboard-v2/ — Advanced dashboard
- /api/analytics/clv/<id>/, /predict/<id>/, /forecast/ — Ensure docs/tests

## Technician & FSM
- /api/technicians/, /api/certifications/, /coverage-areas/, /technician-availability/
- /api/enhanced-users/
- /api/work-orders/<id>/find-technicians/, /assign-technician/
- /api/scheduled-events/, /notification-logs/, /paperwork-templates/, /appointment-requests/, /digital-signatures/
- Notifications: /api/notifications/send-reminder/, /send-on-way/
- Scheduling helpers: /api/scheduling/route-optimization/, /scheduling/availability-check/
- Legacy alias: /api/optimize-technician-routes/ (kept)

## Infra
- /api/health/ — OK
- /api/kb/, /api/kb/<file>/ — OK
- /api/utils/gtin/check-digit/ — Auth required; docs needed
- /api/dev/validate-json/ — DEBUG-only; add canonical alias map entries as needed

## Tasks
- [ ] Ensure docs/API.md has pagination + error schema conventions section
- [ ] For each resource above, add/verify API parity checklist issue
- [ ] Snapshot tests for representative endpoints (accounts, contacts, deals, budgets-v2, payments)
- [ ] RBAC matrix tests for Finance endpoints
- [ ] Expand dev validator alias map per spec keys

---

## Endpoint tables (delta → action → tests → docs)

### Accounts (/api/accounts/) → [API.md#accounts](../API.md#accounts)
| Delta | Action | Test(s) | Doc(s) |
|---|---|---|---|
| Ensure pagination keys present | DRF PageNumberPagination default | tests/test_api_pagination_and_errors.py::test_accounts_pagination_shape_and_boundaries | API.md Conventions + Accounts |
| 404 on invalid pages | Verify DRF behavior (page=-1, 9999) | tests/test_api_pagination_and_errors.py::test_accounts_pagination_shape_and_boundaries | API.md Conventions |
| RBAC matrix clarified | Verify owner vs manager queryset | Existing tests in main/tests.py (PermissionsTests) and add matrix in Phase 1 | API.md Accounts notes |

### Contacts (/api/contacts/) → [API.md#contacts](../API.md#contacts)
| Delta | Action | Test(s) | Doc(s) |
|---|---|---|---|
| Pagination shape | Inherit default pagination | tests/test_api_pagination_and_errors.py::test_contacts_pagination_shape | API.md Conventions + Contacts |
| RBAC enforcement | Manager sees all; others owner-only | Existing tests + extend matrix in Phase 1 | API.md Contacts notes |

### Deals (/api/deals/) → [API.md#deals](../API.md#deals)
| Delta | Action | Test(s) | Doc(s) |
|---|---|---|---|
| Pagination shape | Inherit default pagination | tests/test_api_pagination_and_errors.py::test_deals_pagination_shape | API.md Conventions + Deals |
| Validation error shape | Custom exception handler flattening | tests/test_api_pagination_and_errors.py::test_validation_error_shape | API.md Error schema |

### Budgets V2 (/api/budgets-v2/) → [API.md#budget-v2](../API.md#budget-v2)
| Delta | Action | Test(s) | Doc(s) |
|---|---|---|---|
| Nested write invariants | Keep atomic replace + validations | Existing tests in repo; extend with boundary cases | API.md Budget V2 examples |
| Error payload standardization | Use {detail, errors[]} for validations | New tests to add under Phase 1 | API.md Error schema examples |

### Payments (/api/payments/) → [API.md#payments](../API.md#payments)
| Delta | Action | Test(s) | Doc(s) |
|---|---|---|---|
| RBAC (Finance) | Ensure FinancialDataPermission | Extend matrix tests (401/403/200) | Payments section with examples |
| allocate action idempotency | Keep 409 on re-post | Existing tests (EnhancedFinancialTests) | API.md Payments allocate |

### Invoices (/api/invoices/) → [API.md#invoices](../API.md#invoices)
| Delta | Action | Test(s) | Doc(s) |
|---|---|---|---|
| Posting endpoint | 201 first; 409 subsequent | Add API tests for post action | API.md Invoices posting |
| Pagination on list | Default paginator | Add list shape test | API.md Conventions |

### Journal Entries (/api/journal-entries/) → [API.md#journal-entries](../API.md#journal-entries)
| Delta | Action | Test(s) | Doc(s) |
|---|---|---|---|
| RBAC (Finance) | FinancialDataPermission | Existing tests + matrix | API.md Journal Entries |

### Ledger Accounts (/api/ledger-accounts/) → [API.md#ledger-accounts](../API.md#ledger-accounts)
| Delta | Action | Test(s) | Doc(s) |
|---|---|---|---|
| RBAC (Finance) | IsManager/Finance perms | Existing tests + matrix | API.md Ledger Accounts |
| Hierarchy endpoint | Ensure route documented | Existing tests | API.md Ledger hierarchy |

### Work Orders (/api/work-orders/) → [API.md#work-orders](../API.md#work-orders)
| Delta | Action | Test(s) | Doc(s) |
|---|---|---|---|
| complete action error shape | 409 on redo / insufficient stock | Existing tests validate | API.md Work Orders complete |
| generate-invoice | 201 create | Existing tests validate | API.md Work Orders generate-invoice |
