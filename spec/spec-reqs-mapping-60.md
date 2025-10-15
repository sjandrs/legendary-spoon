# Canonical REQs Mapping – 60% Alignment

This is a living checklist mapping canonical requirements to implementation artifacts (code, tests, docs).

Legend: [ ] planned | [~] in-progress | [x] complete

## Finance
- [ ] REQ-101 Financial Reports parity
  - Tests: main/tests/test_reports_*.py
  - API: /api/reports/* (balance-sheet, pnl, cash-flow)
  - Docs: docs/API.md (Finance)
- [~] REQ-102 Expense/Budget parity
  - Tests: main/tests/test_budget_v2_api.py, main/tests/test_budget_v2_distributions.py, main/tests/test_budget_v2_model_validation.py
  - API: /api/expenses/, /api/budgets/, /api/budgets-v2/
  - Frontend: frontend/src/components/BudgetV2Editor.jsx, BudgetsV2.jsx
  - Docs: docs/API.md#budget-v2-nested-writes
- [ ] REQ-104 Ledger/Journals parity
  - Tests: main/tests/test_ledger_*.py
  - API: /api/ledger-accounts/, /api/journal-entries/

## Operations
- [~] REQ-203 Inventory integration
  - Tests: main/tests/test_posting_inventory.py
  - API: /api/warehouses/, /api/warehouse-items/
  - Frontend: frontend/src/components/Warehouse.jsx
- [ ] REQ-205 Dashboard analytics
  - Tests: main/tests/test_analytics_*.py
  - API: /api/analytics/dashboard/
  - Frontend: DashboardPage.jsx

## Field Service
- [ ] REQ-501 Scheduling & notifications
  - Tests: main/tests/test_scheduling_*.py
  - API: /api/scheduled-events/, notifications endpoints
  - Frontend: SchedulePage.jsx, WorkOrderList.jsx (On My Way)

## Staff & Security
- [ ] REQ-409 EnhancedUser hierarchy
  - Tests: main/tests/test_enhanced_user_*.py
  - API: /api/enhanced-users/
  - Frontend: Staff.jsx
- [ ] RBAC coverage (Finance/Staff/Operations)
  - Tests assert 401, 403, 200 for roles
  - Docs: docs/DEVELOPMENT.md (Permissions)

## Cross-Cutting
- [ ] Consistent pagination and error schemas
  - Tests: API error shape snapshot tests
  - Docs: docs/API.md (Conventions)

## Notes
- Keep this list in sync with spec/spec-design-master.md and static/kb/user-stories.md.
- Link each [x] to a specific commit or test name as we complete work.
