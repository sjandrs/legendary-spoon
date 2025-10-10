---
title: "Converge CRM: Phase 1 & 2 Testing, Security, and UX Hardening"
version: "1.0"
date_created: "2025-09-29"
last_updated: "2025-09-29"
owner: "GitHub Copilot"
tags: ["design", "testing", "security", "ux", "app"]
---

# Introduction

This specification outlines the requirements for comprehensive testing, security hardening, and user experience (UX) refinement for the recently implemented Phase 1 (Accounting Expansion) and Phase 2 (Workflow Automation) features of the Converge CRM platform. The goal is to ensure the new functionality is robust, secure, reliable, and user-friendly before deployment.

## 1. Purpose & Scope

**Purpose:** To systematically validate, secure, and polish all new features, transitioning them from "feature-complete" to "production-ready."

**Scope:** This specification covers three primary areas:
1.  **Unit & Integration Testing:** Backend and frontend test creation.
2.  **Security & Permissions Review:** API endpoint and data access control validation.
3.  **UI/UX & Workflow Enhancement:** Polishing the end-to-end user journey.

The intended audience includes developers, quality assurance engineers, and project managers.

## 2. Definitions

-   **Unit Test:** A test that isolates and verifies a single, small piece of code (e.g., a single function or React component).
-   **Integration Test:** A test that verifies the interaction between multiple components (e.g., an API endpoint interacting with the database, a React component making an API call).
-   **Sales Rep:** A user role with restricted data access, typically limited to records they own.
-   **Sales Manager:** A user role with elevated privileges, including team-wide data visibility and approval capabilities.
-   **E2E (End-to-End) Workflow:** A complete user journey, from start to finish (e.g., from Deal creation to Invoice payment).

## 3. Requirements, Constraints & Guidelines

### Testing Requirements

-   **REQ-TST-001:** All new backend models and business logic must have comprehensive unit test coverage.
-   **REQ-TST-002:** All new API endpoints must have integration tests covering successful requests, error responses, and permission checks.
-   **REQ-TST-003:** The `FinancialReports` class methods (`balance_sheet`, `pnl`, `cash_flow`) must be tested for accuracy with varied data sets.
-   **REQ-TST-004:** The `WorkOrder.adjust_inventory` method must be tested for correct inventory reduction and error handling (e.g., insufficient stock).
-   **REQ-TST-005:** The `WorkOrder.generate_invoice` method must be tested to ensure correct invoice creation and calculation.
-   **REQ-TST-006:** The `deal_status_changed_handler` signal must be tested to confirm a `Project` and `WorkOrder` are created when a `Deal` is 'won'.
-   **REQ-TST-007:** All new React components (`TimeTracking`, `Warehouse`, `DashboardPage`, `EmailCommunication`) must have unit and integration tests.
-   **REQ-TST-008:** Frontend tests must verify correct data rendering, form submissions, client-side calculations, and state updates.

### Security Requirements

-   **REQ-SEC-001:** All Phase 1 and Phase 2 API endpoints must be protected and require authentication.
-   **REQ-SEC-002:** API endpoints returning lists of objects (e.g., `/api/expenses/`, `/api/work-orders/`) must correctly filter data based on user role (`Sales Rep` vs. `Sales Manager`).
-   **REQ-SEC-003:** A `Sales Rep` must be blocked from accessing or viewing data owned by other users via direct API requests (e.g., `/api/accounts/{id}/`).
-   **REQ-SEC-004:** The expense approval workflow must be permission-gated, allowing only users with `Sales Manager` role (or higher) to approve expenses.
-   **REQ-SEC-005:** Sensitive financial report endpoints (`/api/reports/*`) must be restricted to authorized roles (e.g., `Sales Manager`).

### UI/UX Enhancement Guidelines

-   **GUD-UX-001:** All data-fetching components should display a clear loading indicator while data is being fetched.
-   **GUD-UX-002:** User-friendly error messages should be displayed if an API call fails or a workflow action cannot be completed.
-   **GUD-UX-003:** Implement a global notification system (e.g., toast notifications) for key events.
-   **REQ-UX-001:** A notification must be triggered upon successful creation, update, or deletion of major entities (e.g., Time Entry, Expense, Work Order).
-   **REQ-UX-002:** A notification must be triggered for key workflow events, such as "Expense approved," "Inventory for Item X is low," or "Invoice email sent."
-   **GUD-UX-004:** The `DashboardPage` should be enhanced to include at least two new actionable analytics widgets (e.g., "Project Profitability," "Low Stock Items").

## 4. Interfaces & Data Contracts

This effort will primarily test the existing API endpoints implemented in Phase 1 & 2. Key interfaces under review include:

-   `POST /api/time-entries/`
-   `GET /api/warehouses/`
-   `GET /api/analytics/dashboard/`
-   `GET /api/reports/balance-sheet/`
-   `POST /api/expenses/`
-   `PATCH /api/expenses/{id}/` (for approvals)
-   `POST /api/invoices/{id}/send-email/`

## 5. Acceptance Criteria

-   **AC-TST-001:** Given a `WorkOrder` with line items linked to `WarehouseItem`s, when `work_order.adjust_inventory()` is called, then the `quantity` of each `WarehouseItem` is correctly decremented.
-   **AC-TST-002:** Given a `WorkOrder` with line items, when `work_order.generate_invoice()` is called, then a `WorkOrderInvoice` is created with the correct `total_amount` and `due_date`.
-   **AC-TST-003:** Given a `Deal`'s status is updated to 'won', when the `post_save` signal is triggered, then a corresponding `Project` and `WorkOrder` are created and linked to the deal.
-   **AC-SEC-001:** Given a user authenticated as a `Sales Rep`, when a `GET` request is made to `/api/deals/`, then the response only contains deals where `owner` is the authenticated user.
-   **AC-SEC-002:** Given a user authenticated as a `Sales Rep`, when a `PATCH` request is made to `/api/expenses/{id}/` with `{"approved": true}`, then the API returns a 403 Forbidden error.
-   **AC-UX-001:** Given a user successfully submits a new time entry, when the form submission is complete, then a success notification stating "Time entry created successfully" appears on the screen.
-   **AC-UX-002:** Given a `WarehouseItem`'s quantity falls below its `minimum_stock` level, when the `DashboardPage` is loaded, then the item appears in a "Low Stock Alerts" widget.

## 6. Test Automation Strategy

-   **Test Levels**: Unit, Integration.
-   **Backend Frameworks**: Django's `TestCase` and `APITestCase`, `unittest.mock`.
-   **Frontend Frameworks**: `Jest`, `React Testing Library`, `Mock Service Worker (MSW)` to mock API responses.
-   **Test Data Management**:
    -   Backend: Use `setUp` or `setUpTestData` methods in test classes to create necessary users, roles (groups), and CRM objects (Accounts, Deals, etc.).
    -   Frontend: Use mock data fixtures for component-level unit tests and MSW handlers for integration tests.
-   **CI/CD Integration**: All new tests must be added to the existing GitHub Actions workflow and must pass before a pull request can be merged.
-   **Coverage Requirements**: Aim for a minimum of 80% code coverage for all new backend modules and frontend components.

## 7. Rationale & Context

The rapid development of Phase 1 and 2 has introduced significant business-critical logic into the application. This testing and hardening phase is essential to mitigate risks associated with financial calculations, inventory management, and workflow automation. It ensures the features are not only functional but also secure, reliable, and ready for real-world use, preventing costly bugs and security vulnerabilities post-release.

## 8. Dependencies & External Integrations

### Technology Platform Dependencies
-   **PLT-001**: Django REST Framework (for API testing).
-   **PLT-002**: React & Vite (for frontend component testing).
-   **PLT-003**: Jest & React Testing Library (as the core frontend testing stack).

## 9. Examples & Edge Cases

### Backend Test Cases
-   **`adjust_inventory`**:
    -   Test with a `WorkOrder` containing an item not in the warehouse.
    -   Test attempting to deduct more quantity than is available (should raise `ValidationError`).
    -   Test with a `WorkOrder` that has no line items linked to inventory.
-   **Financial Reports**:
    -   Test with a date range containing no transactions.
    -   Test with data that spans across a fiscal year-end.
    -   Test with accounts having zero balances.

### Frontend Test Cases
-   **`TimeTracking.jsx`**:
    -   Test submitting the form with an invalid `hours` value (e.g., negative, non-numeric).
    -   Verify that the "Total Hours" and "Billable Hours" calculations update correctly when a new entry is added.
-   **`Warehouse.jsx`**:
    -   Test the search/filter functionality to ensure it correctly filters the item list.
    -   Verify that the "Low Stock" indicator appears for items where `is_low_stock` is true.

## 10. Validation Criteria

Compliance with this specification will be validated by:
1.  Successful execution of all new unit and integration tests in the CI/CD pipeline.
2.  A code review confirming that all new API endpoints have explicit permission checks.
3.  A manual E2E workflow test confirming that loading, error, and notification states behave as expected.
4.  Code coverage reports meeting or exceeding the 80% threshold for the new features.

## 11. Related Specifications / Further Reading

-   `spec-design-accounting-expansion.md` (for context on the features being tested)
-   [Django Testing Documentation](https://docs.djangoproject.com/en/stable/topics/testing/)
-   [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
