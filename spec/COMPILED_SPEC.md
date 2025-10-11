# Converge CRM – Compiled Specification

Generated: 2025-10-11T01:30:49+00:00
Source: C:/Users/sjand/ws/spec

---

## Table of Contents

- [Requirements (EARS)](#requirements-ears)
- [Design Overview](#design-overview)
- [Architecture](#architecture)
- [Data Flow](#data-flow)
- [Interfaces](#interfaces)
- [Error Handling](#error-handling)
- [Implementation Tasks](#implementation-tasks)
- [Introduction](#introduction)
- [1. Purpose & Scope](#1-purpose-scope)
- [2. Definitions](#2-definitions)
- [3. Requirements, Constraints & Guidelines](#3-requirements-constraints-guidelines)
  - [Phase 1: Complete Financial Management Suite](#phase-1-complete-financial-management-suite)
  - [Phase 2: Enhanced Workflow Automation](#phase-2-enhanced-workflow-automation)
- [4. Interfaces & Data Contracts](#4-interfaces-data-contracts)
- [5. Acceptance Criteria](#5-acceptance-criteria)
- [6. Test Automation Strategy](#6-test-automation-strategy)
- [7. Rationale & Context](#7-rationale-context)
- [8. Dependencies & External Integrations](#8-dependencies-external-integrations)
  - [External Systems](#external-systems)
  - [Third-Party Services](#third-party-services)
  - [Infrastructure Dependencies](#infrastructure-dependencies)
  - [Data Dependencies](#data-dependencies)
  - [Technology Platform Dependencies](#technology-platform-dependencies)
  - [Compliance Dependencies](#compliance-dependencies)
- [9. Examples & Edge Cases](#9-examples-edge-cases)
- [10. Validation Criteria](#10-validation-criteria)
- [11. Related Specifications / Further Reading](#11-related-specifications-further-reading)
- [Introduction](#introduction-1)
- [1. Purpose & Scope](#1-purpose-scope-1)
- [2. Definitions](#2-definitions-1)
- [3. Requirements, Constraints & Guidelines](#3-requirements-constraints-guidelines-1)
  - [System-Wide Requirements](#system-wide-requirements)
  - [Backend Constraints](#backend-constraints)
  - [Frontend Constraints](#frontend-constraints)
- [4. Interfaces & Data Contracts](#4-interfaces-data-contracts-1)
  - [Backend API Specification](#backend-api-specification)
- [Converge CRM - API Specification](#converge-crm-api-specification)
- [Authentication API](#authentication-api)
  - [Token Authentication](#token-authentication)
- [CRM Core API](#crm-core-api)
  - [Accounts API](#accounts-api)
  - [Contacts API](#contacts-api)
  - [Deals API](#deals-api)
  - [Quotes API](#quotes-api)
  - [Quote Items API](#quote-items-api)
  - [Interactions API](#interactions-api)
- [Permission Rules](#permission-rules)
  - [Role-Based Access Control](#role-based-access-control)
  - [Activity Logging](#activity-logging)
- [Analytics API](#analytics-api)
  - [Dashboard Analytics](#dashboard-analytics)
  - [Deal Predictions](#deal-predictions)
  - [Customer Lifetime Value](#customer-lifetime-value)
- [Error Handling](#error-handling-1)
  - [Standard Error Responses](#standard-error-responses)
- [Business Logic Validation](#business-logic-validation)
  - [Account Validation](#account-validation)
  - [Deal Validation](#deal-validation)
  - [Quote Validation](#quote-validation)
- [Rate Limiting](#rate-limiting)
  - [API Limits](#api-limits)
  - [Headers](#headers)
  - [Frontend Component Specification](#frontend-component-specification)
- [Converge CRM - Frontend Specification](#converge-crm-frontend-specification)
- [Architecture Overview](#architecture-overview)
- [Component Architecture Patterns](#component-architecture-patterns)
  - [List Components Pattern](#list-components-pattern)
  - [Detail Components Pattern](#detail-components-pattern)
  - [Form Components Pattern](#form-components-pattern)
- [Specific Component Specifications](#specific-component-specifications)
  - [AccountList Component](#accountlist-component)
  - [AccountDetail Component](#accountdetail-component)
  - [AccountForm Component](#accountform-component)
  - [QuoteDetail Component](#quotedetail-component)
  - [QuoteForm Component](#quoteform-component)
- [Navigation Specification](#navigation-specification)
  - [Main Navigation Structure](#main-navigation-structure)
  - [Route Configuration](#route-configuration)
- [API Integration Specification](#api-integration-specification)
  - [Centralized API Client](#centralized-api-client)
- [UI/UX Standards](#uiux-standards)
  - [Design System](#design-system)
  - [Responsive Design](#responsive-design)
  - [Accessibility Standards](#accessibility-standards)
  - [Loading States](#loading-states)
  - [Error Handling](#error-handling-2)
- [5. Acceptance Criteria](#5-acceptance-criteria-1)
- [6. Test Automation Strategy](#6-test-automation-strategy-1)
- [7. Rationale & Context](#7-rationale-context-1)
- [8. Dependencies & External Integrations](#8-dependencies-external-integrations-1)
  - [Backend Dependencies](#backend-dependencies)
  - [Frontend Dependencies](#frontend-dependencies)
- [9. Examples & Edge Cases](#9-examples-edge-cases-1)
- [10. Validation Criteria](#10-validation-criteria-1)
- [11. Related Specifications / Further Reading](#11-related-specifications-further-reading-1)
- [Introduction](#introduction-2)
- [1. Purpose & Scope](#1-purpose-scope-2)
- [2. Definitions](#2-definitions-2)
- [3. Requirements, Constraints & Guidelines](#3-requirements-constraints-guidelines-2)
- [4. Interfaces & Data Contracts](#4-interfaces-data-contracts-2)
- [5. Acceptance Criteria](#5-acceptance-criteria-2)
- [6. Test Automation Strategy](#6-test-automation-strategy-2)
- [7. Rationale & Context](#7-rationale-context-2)
- [8. Dependencies & External Integrations](#8-dependencies-external-integrations-2)
  - [External Systems](#external-systems-1)
  - [Third-Party Services](#third-party-services-1)
  - [Infrastructure Dependencies](#infrastructure-dependencies-1)
  - [Data Dependencies](#data-dependencies-1)
  - [Technology Platform Dependencies](#technology-platform-dependencies-1)
  - [Compliance Dependencies](#compliance-dependencies-1)
- [9. Examples & Edge Cases](#9-examples-edge-cases-2)
- [10. Validation Criteria](#10-validation-criteria-2)
- [11. Related Specifications / Further Reading](#11-related-specifications-further-reading-2)

---

## [1] requirements.md

## Requirements (EARS)

- WHEN a user authenticates with valid credentials, THE SYSTEM SHALL return a token and user profile.
- WHEN a Sales Rep views accounts, THE SYSTEM SHALL filter records to those owned by the user.
- WHEN a Sales Manager views accounts, THE SYSTEM SHALL return all records.
- WHEN a deal is updated to stage 'won', THE SYSTEM SHALL automatically create a Project linked to the deal.
- IF an invoice is overdue, THEN THE SYSTEM SHALL send automated reminder emails to the customer.

## [2] design.md

## Design Overview

## Architecture
- Backend: Django + DRF, token auth, activity logging
- Frontend: React + Vite, Axios client, SPA routing

## Data Flow
- API-driven, REST endpoints consumed by frontend via centralized client

## Interfaces
- REST endpoints as documented in spec-design-master.md

## Error Handling
- Standardized JSON error responses with appropriate HTTP status codes

## [3] tasks.md

## Implementation Tasks

1. Authentication API: implement login/logout endpoints and user retrieval
2. RBAC enforcement: filter querysets based on user role
3. Deal-to-Project automation via signals
4. Invoice reminder email automation
5. Frontend integration for Account, Contact, Deal CRUD
6. Testing: backend DRF tests and frontend RTL tests

## [4] spec-design-accounting-expansion.md

---
title: Converge Accounting & Workflow Expansion Specification
version: 1.0
date_created: 2025-09-29
last_updated: 2025-10-09
owner: Converge Product Team
tags: [design, accounting, workflow, roadmap, expansion]
---

## Introduction

This specification defines a two-phase expansion plan for the Converge CRM accounting and business workflow modules. The goal is to deliver a comprehensive financial management suite (Phase 1) and then enable advanced workflow automation and cross-module integration (Phase 2).

## 1. Purpose & Scope

This document provides requirements, constraints, and design guidelines for expanding the accounting and workflow capabilities of Converge. It is intended for developers, architects, and product managers. Assumes the current accounting foundation is in place (Ledger, WorkOrder, Invoice, Payment, etc.).

## 2. Definitions

- **GL**: General Ledger
- **P&L**: Profit and Loss Statement
- **CRUD**: Create, Read, Update, Delete
- **KPI**: Key Performance Indicator
- **RBAC**: Role-Based Access Control
- **Deal-to-Cash**: Workflow from sales deal closure to payment collection

## 3. Requirements, Constraints & Guidelines

### Phase 1: Complete Financial Management Suite
- **REQ-101**: Implement financial reports: Balance Sheet, P&L, Cash Flow Statement
- **REQ-102**: Enable automatic invoice generation from WorkOrders
- **REQ-103**: Add payment terms, late fees, and reminders to invoices
- **REQ-104**: Implement dedicated expense tracking with receipt upload and categorization
- **REQ-105**: Add budget planning and variance tracking
- **REQ-106**: Provide tax reporting features (e.g., 1099, sales tax tracking)
- **SEC-101**: All financial data must be access-controlled by RBAC
- **CON-101**: Reports must be exportable as PDF and CSV
- **GUD-101**: UI must provide clear navigation between accounting features

### Phase 2: Enhanced Workflow Automation
- **REQ-201**: Implement automatic WorkOrder creation upon Deal closure
- **REQ-202**: Enable project billing: time tracking → billable hours → invoicing
- **REQ-203**: Integrate inventory: WorkOrders adjust Warehouse stock
- **REQ-204**: Add customer communication automation (invoice emails, reminders)
- **REQ-205**: Provide cross-module analytics (sales, project profitability, CLV)
- **PAT-201**: Use event-driven architecture for workflow triggers
- **SEC-201**: All automation actions must be logged for audit

## 4. Interfaces & Data Contracts

| API Endpoint                | Method | Description                                 |
|----------------------------|--------|---------------------------------------------|
| /api/reports/balance-sheet | GET    | Retrieve balance sheet report               |
| /api/reports/pnl           | GET    | Retrieve profit & loss statement            |
| /api/reports/cash-flow     | GET    | Retrieve cash flow statement                |
| /api/expenses/             | CRUD   | Manage expenses and receipts                |
| /api/budgets/              | CRUD   | Manage budgets and track variances          |
| /api/tax-reports/          | GET    | Generate tax-related reports                |
| /api/workorders/auto       | POST   | Auto-create WorkOrder from Deal             |
| /api/billing/time          | POST   | Log billable time for project billing       |
| /api/inventory/adjust      | POST   | Adjust inventory from WorkOrder             |
| /api/communications/email  | POST   | Send automated emails (invoices, reminders) |

**Data Contract Example: Expense**
```json
{
  "id": 123,
  "date": "2025-09-29",
  "amount": 250.00,
  "category": "Travel",
  "description": "Flight to client site",
  "receipt_url": "/media/receipts/123.pdf"
}
```

## 5. Acceptance Criteria

- **AC-101**: Given a set of transactions, when a user requests a Balance Sheet, then the correct report is generated and downloadable
- **AC-102**: When a WorkOrder is completed, an invoice can be generated automatically with correct line items
- **AC-103**: When an expense is logged, a receipt can be uploaded and categorized
- **AC-201**: When a Deal is marked as closed, a WorkOrder is created and linked
- **AC-202**: When time is logged on a Project, it can be billed and invoiced
- **AC-203**: When a WorkOrder is fulfilled, inventory is decremented accordingly
- **AC-204**: When an invoice is overdue, an automated reminder email is sent

## 6. Test Automation Strategy

- **Test Levels**: Unit, Integration, End-to-End
- **Frameworks**: Django TestCase, DRF APIClient, React Testing Library, Playwright
- **Test Data Management**: Use factories for transactions, expenses, and deals
- **CI/CD Integration**: All tests run in GitHub Actions on PRs to main
- **Coverage Requirements**: 90%+ for backend, 80%+ for frontend
- **Performance Testing**: Simulate report generation with large datasets

## 7. Rationale & Context

Phase 1 addresses core business needs for financial management, reducing reliance on external accounting tools. Phase 2 leverages the platform’s modularity to automate business processes, increasing efficiency and data accuracy.

## 8. Dependencies & External Integrations

### External Systems
- **EXT-101**: Email delivery service (e.g., SendGrid) for automated communications

### Third-Party Services
- **SVC-101**: PDF/CSV export library for report generation

### Infrastructure Dependencies
- **INF-101**: Secure file storage for receipts and exports

### Data Dependencies
- **DAT-101**: Accurate and timely transaction data for reporting

### Technology Platform Dependencies
- **PLT-101**: Django 5.x, React 18+, DRF, PostgreSQL

### Compliance Dependencies
- **COM-101**: Financial data retention and audit requirements

## 9. Examples & Edge Cases

```python
# Example: Auto-create WorkOrder from Deal closure
def on_deal_closed(deal):
    work_order = WorkOrder.objects.create(
        deal=deal,
        ... # populate fields
    )
    return work_order

# Edge Case: Expense with missing receipt
expense = Expense.objects.create(
    amount=100,
    category="Meals",
    receipt_url=None  # Should be allowed but flagged for review
)
```

## 10. Validation Criteria

- All endpoints return correct data and enforce permissions
- Reports match accounting standards and are exportable
- Automation triggers are reliable and auditable
- UI/UX meets navigation and accessibility guidelines

## 11. Related Specifications / Further Reading

- [spec-schema-accounting.md](spec-schema-accounting.md) (to be created)
- [Django/DRF documentation](https://www.django-rest-framework.org/)
- [OWASP security guidelines](https://owasp.org/www-project-top-ten/)

## [5] spec-design-master.md

---
title: Converge CRM Master Design Specification
version: 1.0
date_created: 2025-10-09
last_updated: 2025-10-09
owner: Converge Product Team
tags: [design, architecture, master, backend, frontend]
---

## Introduction

This document is the master design specification for the Converge CRM platform. It serves as the authoritative source of truth for all backend and frontend development, defining the architecture, requirements, and interfaces for all system components.

## 1. Purpose & Scope

This specification provides a comprehensive guide for developers, architects, and product managers involved in the development of the Converge CRM. It covers the entire system, from the Django backend to the React frontend, ensuring consistency and adherence to established patterns.

## 2. Definitions

- **CRM**: Customer Relationship Management
- **DRF**: Django REST Framework
- **SPA**: Single Page Application
- **RBAC**: Role-Based Access Control
- **WCAG**: Web Content Accessibility Guidelines

## 3. Requirements, Constraints & Guidelines

### System-Wide Requirements
- **REQ-SYS-001**: All features MUST align with the user stories documented in static/kb/user-stories.md.
- **REQ-SYS-002**: The system MUST enforce strict Role-Based Access Control (RBAC) for all data and features.
- **REQ-SYS-003**: All API endpoints MUST follow RESTful principles and maintain a consistent structure.
- **REQ-SYS-004**: Every significant CRM operation MUST be logged in the ActivityLog for auditing purposes.
- **REQ-SYS-005**: The frontend MUST be fully responsive and comply with WCAG 2.1 AA accessibility standards.
- **REQ-SYS-006**: Resolving any GitHub issue MUST include updating relevant specifications in `spec/` (master or module-specific) to reflect behavior, constraints, and any new operational rules.

### Backend Constraints
- **CON-BE-001**: The backend MUST be a pure API server built with Django and Django REST Framework.
- **CON-BE-002**: Authentication MUST use a custom token-based system, not Django's default session authentication.
- **CON-BE-003**: The database MUST be SQLite in development and PostgreSQL in production.

### Frontend Constraints
- **CON-FE-001**: The frontend MUST be a Single Page Application (SPA) built with React and Vite.
- **CON-FE-002**: State management SHOULD primarily use React Hooks and TanStack Query.
- **CON-FE-003**: All API interactions MUST be handled through a centralized Axios client.
 - **CON-FE-004**: Lint baseline reports MUST include "Quality Gate Result" and "Invocation Parameters" sections for CI traceability.

## 4. Interfaces & Data Contracts

### Backend API Specification

## Converge CRM - API Specification

Django REST Framework API specification for all backend endpoints.

## Authentication API

### Token Authentication
```
POST   /api/login/
Request: {"username": "user@example.com", "password": "password123"}
Response: {"token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b", "user": {...}}

POST   /api/logout/
Headers: Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
Response: {"message": "Successfully logged out"}

GET    /api/user/
Headers: Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
Response: {"id": 1, "username": "user@example.com", "groups": ["Sales Rep"], ...}
```

## CRM Core API

### Accounts API
```
GET    /api/accounts/
Headers: Authorization: Token <token>
Query Params: ?search=<term>&page=<num>&page_size=<size>
Response: {
  "count": 150,
  "next": "http://api/accounts/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Acme Corporation",
      "industry": "Technology",
      "annual_revenue": "5000000.00",
      "website": "https://acme.com",
      "phone": "+1-555-0123",
      "address": "123 Business St, City, State 12345",
      "owner": 1,
      "created_at": "2025-01-01T10:00:00Z",
      "updated_at": "2025-01-01T10:00:00Z",
      "contacts_count": 5,
      "deals_count": 3,
      "total_deal_value": "150000.00"
    }
  ]
}

POST   /api/accounts/
Headers: Authorization: Token <token>
Request: {
  "name": "New Account",
  "industry": "Healthcare",
  "annual_revenue": "2500000.00",
  "website": "https://newaccount.com",
  "phone": "+1-555-0456",
  "address": "456 Medical Dr, City, State 12345"
}
Response: 201 Created + account object with generated ID

GET    /api/accounts/{id}/
Headers: Authorization: Token <token>
Response: Account object with related data

PUT    /api/accounts/{id}/
Headers: Authorization: Token <token>
Request: Full account object
Response: 200 OK + updated account object

PATCH  /api/accounts/{id}/
Headers: Authorization: Token <token>
Request: Partial account object
Response: 200 OK + updated account object

DELETE /api/accounts/{id}/
Headers: Authorization: Token <token>
Response: 204 No Content
```

### Contacts API
```
GET    /api/contacts/
Query Params: ?search=<term>&account=<id>&page=<num>
Response: Paginated contact list with account names

POST   /api/contacts/
Request: {
  "account": 1,
  "first_name": "John",
  "last_name": "Smith",
  "email": "john.smith@acme.com",
  "phone": "+1-555-0789",
  "title": "VP of Sales"
}
Response: 201 Created + contact object

GET    /api/contacts/{id}/
Response: Contact object with account details and interaction history

PUT    /api/contacts/{id}/
Request: Full contact object
Response: 200 OK + updated contact

DELETE /api/contacts/{id}/
Response: 204 No Content
```

### Deals API
```
GET    /api/deals/
Query Params: ?stage=<stage>&account=<id>&owner=<id>&page=<num>
Response: Paginated deal list with account/contact names

POST   /api/deals/
Request: {
  "name": "Q4 Software License Deal",
  "account": 1,
  "primary_contact": 1,
  "value": "50000.00",
  "stage": "qualified",
  "probability": 25,
  "close_date": "2025-12-31"
}
Response: 201 Created + deal object

PUT    /api/deals/{id}/
Request: Updated deal object (stage change may trigger Project creation)
Response: 200 OK + updated deal

# Special stage transition behavior:
# When deal.stage changes to 'won', automatically creates Project:
# - Project.name = Deal.name
# - Project.deal = Deal.id
# - Project.status = 'planning'
# - Project.owner = Deal.owner
```

### Quotes API
```
GET    /api/quotes/
Query Params: ?status=<status>&account=<id>&page=<num>
Response: Paginated quote list

POST   /api/quotes/
Request: {
  "name": "Q4 Software Quote",
  "account": 1,
  "contact": 1,
  "valid_until": "2025-11-30",
  "tax_rate": "8.25",
  "notes": "Annual license with support"
}
Response: 201 Created + quote object

POST   /api/quotes/{id}/convert-to-deal/
Request: {}
Response: {"deal_id": 123, "message": "Quote converted to deal successfully"}
Business Rule: Only works when quote.status = 'accepted'
```

### Quote Items API
```
GET    /api/quote-items/?quote=<id>
Response: Line items for specific quote

POST   /api/quote-items/
Request: {
  "quote": 1,
  "product_name": "Enterprise Software License",
  "description": "Annual license for 50 users",
  "quantity": 50,
  "unit_price": "200.00",
  "discount_percent": "10.00"
}
Response: 201 Created + calculated line_total
Auto-calculation: line_total = quantity * unit_price * (1 - discount_percent/100)
```

### Interactions API
```
GET    /api/interactions/
Query Params: ?account=<id>&contact=<id>&type=<type>&page=<num>
Response: Paginated interaction list ordered by date desc

POST   /api/interactions/
Request: {
  "account": 1,
  "contact": 1,
  "deal": 1,
  "interaction_type": "call",
  "subject": "Discussion about Q4 requirements",
  "notes": "Customer interested in 50-user license. Follow up next week.",
  "date": "2025-10-07T14:30:00Z"
}
Response: 201 Created + interaction object
```

## Permission Rules

### Role-Based Access Control
All ViewSets implement role-based filtering in get_queryset():

```python
def get_queryset(self):
    user = self.request.user
    if user.groups.filter(name='Sales Manager').exists():
        # Managers see all records
        return Model.objects.all()
    elif user.groups.filter(name='Sales Rep').exists():
        # Reps see only their owned records
        return Model.objects.filter(owner=user)
    else:
        # Default: user's records only
        return Model.objects.filter(owner=user)
```

### Activity Logging
All create/update operations automatically log activities:

```python
def perform_create(self, serializer):
    instance = serializer.save(owner=self.request.user)
    ActivityLog.objects.create(
        user=self.request.user,
        action='create',
        content_object=instance,
        description=f'Created {instance._meta.model_name}: {instance}'
    )

def perform_update(self, serializer):
    instance = serializer.save()
    ActivityLog.objects.create(
        user=self.request.user,
        action='update',
        content_object=instance,
        description=f'Updated {instance._meta.model_name}: {instance}'
    )
```

## Analytics API

### Dashboard Analytics
```
GET    /api/analytics/dashboard/
Response: {
  "total_accounts": 150,
  "total_contacts": 500,
  "total_deals": 75,
  "total_deal_value": "2500000.00",
  "deals_by_stage": {
    "lead": 20,
    "qualified": 15,
    "proposal": 12,
    "negotiation": 8,
    "won": 15,
    "lost": 5
  },
  "revenue_by_month": [
    {"month": "2025-01", "revenue": "150000.00"},
    {"month": "2025-02", "revenue": "180000.00"}
  ]
}
```

### Deal Predictions
```
GET    /api/analytics/predict/{deal_id}/
Response: {
  "deal_id": 123,
  "predicted_outcome": "win",
  "confidence_score": 85.3,
  "win_probability": 85.3,
  "loss_probability": 10.2,
  "stall_probability": 4.5,
  "factors": {
    "deal_value": 0.25,
    "engagement_frequency": 0.18,
    "time_in_stage": 0.15
  },
  "recommendation": "High confidence for win. Continue current strategy."
}
```

### Customer Lifetime Value
```
GET    /api/analytics/clv/{contact_id}/
Response: {
  "contact_id": 456,
  "lifetime_value": "125000.00",
  "average_order_value": "5000.00",
  "purchase_frequency": 2.5,
  "customer_tenure_days": 730,
  "predicted_next_purchase": "2025-11-15",
  "churn_risk": 0.15,
  "growth_potential": 0.75
}
```

## Error Handling

### Standard Error Responses
```
400 Bad Request:
{
  "error": "Validation failed",
  "details": {
    "email": ["This field must be unique."],
    "close_date": ["Date cannot be in the past."]
  }
}

401 Unauthorized:
{
  "detail": "Authentication credentials were not provided."
}

403 Forbidden:
{
  "detail": "You do not have permission to perform this action."
}

404 Not Found:
{
  "detail": "Not found."
}

500 Internal Server Error:
{
  "error": "An unexpected error occurred. Please try again."
}
```

## Business Logic Validation

### Account Validation
- name: Required, max 255 characters
- email: Must be valid email format if provided
- annual_revenue: Must be positive decimal if provided
- owner: Auto-assigned to current user on creation

### Deal Validation
- value: Must be positive decimal
- close_date: Cannot be in past
- probability: Must be 0-100 integer
- primary_contact: Must belong to same account
- Stage transitions: Must follow logical progression

### Quote Validation
- valid_until: Must be future date
- tax_rate: Must be 0-100 decimal
- total: Auto-calculated, read-only
- contact: Must belong to same account as quote
- Conversion: Only allowed when status = 'accepted'

## Rate Limiting

### API Limits
- Authenticated users: 1000 requests/hour
- Unauthenticated users: 100 requests/hour
- Bulk operations: 10 requests/minute
- File uploads: 5 uploads/minute

### Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1638360000
```

---

**All endpoints require authentication unless explicitly marked as public. Use the Authorization header with Token authentication for all requests.**


### Frontend Component Specification

## Converge CRM - Frontend Specification

React frontend component architecture and user interface specifications.

## Architecture Overview

**Framework**: React 19.1.1 + Vite 7.1.7
**State Management**: React Hooks + TanStack Query v5.90.2
**Routing**: React Router v7.9.2
**Styling**: Tailwind CSS v4.1.13 + Custom CSS
**API Client**: Axios v1.12.2 with centralized `api.js`
**Charts**: Chart.js v4.5.0 with react-chartjs-2
**Forms**: React Hook Form v7.63.0

## Component Architecture Patterns

### List Components Pattern
Every entity follows this standardized pattern:

```jsx
const EntityList = () => {
  // State Management
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});

  // API Integration
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.getEntities({
          search: searchQuery,
          page: currentPage,
          ...filters
        });
        setData(response.data.results);
      } catch (error) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchData, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, currentPage, filters]);

  // Render Structure
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Entity Management</h1>
        <button className="btn btn-primary">
          Add New Entity
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input flex-1"
            data-testid="search-input"
          />
          {/* Filters specific to entity */}
        </div>
      </div>

      {/* Data Display */}
      {loading && <LoadingSkeleton />}
      {error && <ErrorMessage message={error} />}
      {!loading && data.length === 0 && <EmptyState />}
      {!loading && data.length > 0 && (
        <>
          <EntityGrid data={data} />
          <Pagination
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            totalPages={Math.ceil(totalCount / 20)}
          />
        </>
      )}
    </div>
  );
};
```

### Detail Components Pattern
```jsx
const EntityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch entity data
  useEffect(() => {
    const fetchEntity = async () => {
      try {
        const response = await api.getEntity(id);
        setEntity(response.data);
      } catch (error) {
        navigate('/entities');
      } finally {
        setLoading(false);
      }
    };

    fetchEntity();
  }, [id]);

  // Delete handler
  const handleDelete = async () => {
    try {
      await api.deleteEntity(id);
      navigate('/entities');
      toast.success('Entity deleted successfully');
    } catch (error) {
      toast.error('Failed to delete entity');
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb Navigation */}
      <nav className="text-sm breadcrumbs mb-4">
        <ul>
          <li><Link to="/entities">Entities</Link></li>
          <li>{entity.name}</li>
        </ul>
      </nav>

      {/* Header with Actions */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{entity.name}</h1>
          <p className="text-gray-600">{entity.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/entities/${id}/edit`} className="btn btn-secondary">
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn btn-danger"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Entity Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2">
          <EntityInfoCard entity={entity} />
          <RelatedEntitiesSection entityId={id} />
          <ActivityTimelineSection entityId={id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <EntityStatsCard entity={entity} />
          <QuickActionsCard entityId={id} />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmationModal
          title="Delete Entity"
          message={`Are you sure you want to delete "${entity.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};
```

### Form Components Pattern
```jsx
const EntityForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    // ... other fields
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  // Load existing data for editing
  useEffect(() => {
    if (isEditing) {
      const fetchEntity = async () => {
        try {
          const response = await api.getEntity(id);
          setFormData(response.data);
        } catch (error) {
          navigate('/entities');
        } finally {
          setInitialLoading(false);
        }
      };

      fetchEntity();
    }
  }, [id, isEditing]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      if (isEditing) {
        await api.updateEntity(id, formData);
        toast.success('Entity updated successfully');
      } else {
        const response = await api.createEntity(formData);
        toast.success('Entity created successfully');
        navigate(`/entities/${response.data.id}`);
        return;
      }

      navigate(`/entities/${id}`);
    } catch (error) {
      toast.error('Failed to save entity');
      if (error.response?.data?.details) {
        setErrors(error.response.data.details);
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <LoadingSkeleton />;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Form Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Edit Entity' : 'Create New Entity'}
        </h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form Fields */}
          <FormField
            label="Name"
            name="name"
            value={formData.name}
            onChange={(value) => setFormData({...formData, name: value})}
            error={errors.name}
            required
          />

          <FormField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(value) => setFormData({...formData, email: value})}
            error={errors.email}
          />

          {/* Form Actions */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
            </button>

            <button
              type="button"
              onClick={() => navigate('/entities')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

## Specific Component Specifications

### AccountList Component
```jsx
// File: frontend/src/components/AccountList.jsx
const AccountList = () => {
  // State: accounts, loading, error, searchQuery, currentPage
  // Filters: industry, annual_revenue_range, owner (if manager)
  // Columns: Name, Industry, Revenue, Contacts, Deals, Owner, Actions
  // Actions: View, Edit, Delete (with confirmation)
  // Empty State: "No accounts found. Create your first account to get started."
  // Search: Debounced search across name, industry fields
  // Pagination: 20 accounts per page
};
```

### AccountDetail Component
```jsx
// File: frontend/src/components/AccountDetail.jsx
const AccountDetail = () => {
  // Sections:
  // 1. Account Info Card (name, industry, revenue, website, phone, address)
  // 2. Related Contacts Section (list with links to ContactDetail)
  // 3. Related Deals Section (pipeline visualization)
  // 4. Interactions Timeline (chronological activity feed)
  // 5. Quick Actions Sidebar (create contact, create deal, log interaction)

  // Business Rules:
  // - Show edit/delete only if user owns account or is manager
  // - Delete requires confirmation and checks for related records
  // - Activity timeline shows all interactions for this account
};
```

### AccountForm Component
```jsx
// File: frontend/src/components/AccountForm.jsx
const AccountForm = () => {
  // Fields: name*, industry, annual_revenue, website, phone, address
  // Validation:
  // - name: required, max 255 chars
  // - website: valid URL format
  // - annual_revenue: positive number
  // - phone: valid phone format

  // Features:
  // - Auto-save drafts every 30 seconds
  // - Industry dropdown with common options + custom entry
  // - Revenue field with currency formatting
  // - Address with Google Maps integration (optional)
};
```

### QuoteDetail Component
```jsx
// File: frontend/src/components/QuoteDetail.jsx
const QuoteDetail = () => {
  // Sections:
  // 1. Quote Header (name, account, contact, status, dates)
  // 2. Line Items Table (product, description, qty, price, discount, total)
  // 3. Totals Section (subtotal, tax, discount, grand total)
  // 4. Actions Section (edit, delete, send, convert to deal)

  // Business Rules:
  // - Convert to Deal only available when status = 'accepted'
  // - PDF generation for sending to customer
  // - Status workflow: draft → sent → accepted/rejected
  // - Line totals auto-calculate: qty * price * (1 - discount%)
};
```

### QuoteForm Component
```jsx
// File: frontend/src/components/QuoteForm.jsx
const QuoteForm = () => {
  // Dynamic Line Items Editor:
  // - Add/remove line items dynamically
  // - Product name autocomplete from previous quotes
  // - Real-time total calculations
  // - Quantity/price validation (positive numbers)

  // Cascading Dropdowns:
  // - Account selection → Contact dropdown updates
  // - Contact must belong to selected account

  // Business Logic:
  // - Tax rate configurable per quote
  // - Discount can be percentage or fixed amount
  // - Valid until date defaults to +30 days
};
```

## Navigation Specification

### Main Navigation Structure
```jsx
// File: frontend/src/App.jsx navigation
<nav className="main-navigation">
  <div className="nav-item">
    <Link to="/dashboard">Dashboard</Link>
  </div>

  <div className="nav-dropdown">
    <button>CRM ▼</button>
    <div className="dropdown-menu">
      <Link to="/accounts">Accounts</Link>
      <Link to="/contacts">Contacts</Link>
      <Link to="/deals">Deals</Link>
      <Link to="/quotes">Quotes</Link>
      <Link to="/interactions">Interactions</Link>
      <Link to="/activity-timeline">Activity Timeline</Link>
    </div>
  </div>

  <div className="nav-dropdown">
    <button>Advanced ▼</button>
    <div className="dropdown-menu">
      <Link to="/analytics/deal-predictions">Deal Predictions</Link>
      <Link to="/analytics/customer-lifetime-value">Customer CLV</Link>
      <Link to="/analytics/revenue-forecast">Revenue Forecast</Link>
    </div>
  </div>

  {/* Other navigation items... */}
</nav>
```

### Route Configuration
```jsx
// File: frontend/src/App.jsx routes
<Routes>
  {/* Authentication */}
  <Route path="/login" element={<LoginPage />} />

  {/* CRM Routes */}
  <Route path="/accounts" element={<ProtectedRoute><AccountList /></ProtectedRoute>} />
  <Route path="/accounts/:id" element={<ProtectedRoute><AccountDetail /></ProtectedRoute>} />
  <Route path="/accounts/new" element={<ProtectedRoute><AccountForm /></ProtectedRoute>} />
  <Route path="/accounts/:id/edit" element={<ProtectedRoute><AccountForm /></ProtectedRoute>} />

  <Route path="/contacts" element={<ProtectedRoute><ContactList /></ProtectedRoute>} />
  <Route path="/contacts/:id" element={<ProtectedRoute><ContactDetail /></ProtectedRoute>} />
  <Route path="/contacts/new" element={<ProtectedRoute><ContactForm /></ProtectedRoute>} />
  <Route path="/contacts/:id/edit" element={<ProtectedRoute><ContactForm /></ProtectedRoute>} />

  <Route path="/quotes" element={<ProtectedRoute><QuoteList /></ProtectedRoute>} />
  <Route path="/quotes/:id" element={<ProtectedRoute><QuoteDetail /></ProtectedRoute>} />
  <Route path="/quotes/new" element={<ProtectedRoute><QuoteForm /></ProtectedRoute>} />
  <Route path="/quotes/:id/edit" element={<ProtectedRoute><QuoteForm /></ProtectedRoute>} />

  {/* Analytics Routes */}
  <Route path="/analytics/deal-predictions" element={<ProtectedRoute><DealPredictions /></ProtectedRoute>} />
  <Route path="/analytics/customer-lifetime-value" element={<ProtectedRoute><CustomerLifetimeValue /></ProtectedRoute>} />
  <Route path="/analytics/revenue-forecast" element={<ProtectedRoute><RevenueForecast /></ProtectedRoute>} />
</Routes>
```

## API Integration Specification

### Centralized API Client
```jsx
// File: frontend/src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
});

// Token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Account API methods
export const getAccounts = (params = {}) => api.get('/accounts/', { params });
export const getAccount = (id) => api.get(`/accounts/${id}/`);
export const createAccount = (data) => api.post('/accounts/', data);
export const updateAccount = (id, data) => api.put(`/accounts/${id}/`, data);
export const deleteAccount = (id) => api.delete(`/accounts/${id}/`);

// Quote API methods
export const getQuotes = (params = {}) => api.get('/quotes/', { params });
export const getQuote = (id) => api.get(`/quotes/${id}/`);
export const createQuote = (data) => api.post('/quotes/', data);
export const updateQuote = (id, data) => api.put(`/quotes/${id}/`, data);
export const convertQuoteToDeal = (id) => api.post(`/quotes/${id}/convert-to-deal/`);

export default api;
```

## UI/UX Standards

### Design System
```css
/* Colors */
:root {
  --primary: #3b82f6;      /* Blue */
  --primary-dark: #1d4ed8;
  --secondary: #6b7280;    /* Gray */
  --success: #10b981;      /* Green */
  --warning: #f59e0b;      /* Amber */
  --danger: #ef4444;       /* Red */
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --border: #d1d5db;
}

/* Typography */
.text-3xl { font-size: 1.875rem; font-weight: 700; }
.text-2xl { font-size: 1.5rem; font-weight: 600; }
.text-xl { font-size: 1.25rem; font-weight: 500; }

/* Buttons */
.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors;
}
.btn-primary { @apply bg-primary text-white hover:bg-primary-dark; }
.btn-secondary { @apply bg-secondary text-white hover:bg-gray-600; }
.btn-danger { @apply bg-danger text-white hover:bg-red-600; }

/* Forms */
.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary;
}
.form-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}
.form-error {
  @apply text-sm text-danger mt-1;
}
```

### Responsive Design
- **Mobile First**: All components start with mobile design
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Grid Layout**: Use CSS Grid for complex layouts, Flexbox for simple alignment
- **Touch Targets**: Minimum 44px for touch interactions

### Accessibility Standards
- **WCAG 2.1 AA Compliance**: All components must meet accessibility standards
- **Keyboard Navigation**: Tab, Enter, Escape, Arrow keys support
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: 4.5:1 ratio for normal text, 3:1 for large text
- **Focus Indicators**: Visible focus states for all interactive elements

### Loading States
```jsx
// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
  </div>
);

// Loading Button State
<button disabled={loading} className="btn btn-primary">
  {loading ? (
    <>
      <Spinner className="w-4 h-4 mr-2" />
      Loading...
    </>
  ) : (
    'Submit'
  )}
</button>
```

### Error Handling
```jsx
// Error Message Component
const ErrorMessage = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
    <div className="flex justify-between items-center">
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="text-red-600 hover:text-red-800">
          Retry
        </button>
      )}
    </div>
  </div>
);

// Empty State Component
const EmptyState = ({ title, description, action }) => (
  <div className="text-center py-12">
    <div className="text-6xl text-gray-300 mb-4">📋</div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6">{description}</p>
    {action}
  </div>
);
```

---

**All frontend components must follow these patterns and specifications to ensure consistency, maintainability, and optimal user experience.**


## 5. Acceptance Criteria

- **AC-SYS-001**: All backend and frontend components are implemented according to the specifications in this document.
- **AC-SYS-002**: All user stories are successfully implemented and validated.
- **AC-SYS-003**: All automated tests pass, with a minimum of 70% code coverage for new functionality.
- **AC-SYS-004**: The application is successfully deployed to the target environment.

## 6. Test Automation Strategy

- **Test Levels**: Unit, Integration, and End-to-End (E2E) tests are required.
- **Frameworks**: Django's TestCase for the backend, and Jest with React Testing Library for the frontend. Cypress for E2E tests.
- **CI/CD Integration**: All tests MUST be integrated into the GitHub Actions CI/CD pipeline and run on every pull request.
- **Coverage Requirements**: A minimum of 70% test coverage is required for all new code.

## 7. Rationale & Context

This master specification ensures that all development work is aligned with the architectural vision and business requirements of the Converge CRM platform. By providing a single source of truth, it facilitates consistency, reduces ambiguity, and enables more efficient development and testing.

## 8. Dependencies & External Integrations

### Backend Dependencies
- **PLT-BE-001**: Django 5.2.6
- **PLT-BE-002**: Django REST Framework
- **PLT-BE-003**: PostgreSQL (for production)

### Frontend Dependencies
- **PLT-FE-001**: React 19.1.1
- **PLT-FE-002**: Vite 7.1.7
- **PLT-FE-003**: React Router v7.9.2
- **PLT-FE-004**: Axios v1.12.2
- **PLT-FE-005**: Tailwind CSS v4.1.13

## 9. Examples & Edge Cases

(Examples are provided within the backend and frontend specification sections.)

## 10. Validation Criteria

- **VAL-001**: All Django models match the field specifications and constraints.
- **VAL-002**: All API endpoints implement the required RBAC and activity logging.
- **VAL-003**: All React components adhere to the specified architectural patterns.
- **VAL-004**: The final application successfully passes all acceptance criteria.

## 11. Related Specifications / Further Reading

- [User Stories](../../static/kb/user-stories.md)
- [Development Guide](../../docs/DEVELOPMENT.md)

## [6] spec-process-lint-baseline-gating.md

---
title: Process Spec — ESLint Baseline Diff, Per-Rule Deltas, and Quality Gate
version: 1.0
date_created: 2025-10-10
last_updated: 2025-10-10
owner: Engineering
tags: [process, quality, lint, ci, javascript, powershell]
---

## Introduction

This specification defines the process, tooling, and quality gates for tracking ESLint status against legacy baselines, computing per-rule deltas, and enforcing non-regression in developer workflows and CI. It standardizes how lint debt is measured, reported, and gated to ensure continuous improvement without blocking daily work unnecessarily.

## 1. Purpose & Scope

- Purpose: Provide a deterministic, automated mechanism to compare current ESLint results to established baselines, surface per-rule changes, and fail builds on regressions beyond configured thresholds.
- Scope:
  - Frontend code under `frontend/src` (TypeScript/JavaScript/JSX/TSX).
  - Windows-first local execution (PowerShell 5.1) with cross-platform CI compatibility via Node/ESLint/npx.
  - Artifacts generated under `docs/reports/` for auditability.
- Audience: Frontend engineers, QA, DevOps/CI maintainers, team leads.
- Assumptions: Node and ESLint are installed via the frontend workspace; developers use VS Code tasks or PowerShell to run tools.

## 2. Definitions

- ESLint: JavaScript/TypeScript linter for static analysis of code quality and style.
- Baseline: A JSON file capturing the accepted legacy ESLint violations at a point in time (e.g., `frontend/lint-baseline.json`).
- Snapshot: A JSON file (`docs/reports/lint-snapshot.json`) recording the most recent run’s per-rule counts for delta computation over time.
- Per-rule Delta: The difference in count for a specific ESLint rule between the current run and the previous snapshot.
- Quality Gate: A policy that fails the execution (non-zero exit) when thresholds (total or per-rule) are exceeded.
- CI Parity: Running ESLint locally with the same configuration and scope as CI to ensure consistent results.

## 3. Requirements, Constraints & Guidelines

- REQ-001: The system shall produce a Markdown report at `docs/reports/lint-baseline-diff.md` comparing current ESLint results against one or more baselines.
- REQ-002: The system shall compute per-rule counts and write a snapshot to `docs/reports/lint-snapshot.json` for future delta comparisons.
- REQ-003: The system shall support thresholds `MaxTotalDelta` and `MaxRuleDelta` to enforce a quality gate by exiting with a non-zero code on regression.
- REQ-004: The system shall run on Windows PowerShell 5.1 without requiring policy changes beyond the documented task command.
- REQ-005: The system shall attempt robust ESLint resolution (npx on Windows, fallback to local `.bin`) and gracefully fail with actionable messaging if ESLint is unavailable.
- REQ-006: The system shall parse ESLint JSON output; if unavailable, it shall extract totals from text output as a fallback.
- REQ-007: The report shall include: current totals, baseline comparisons, per-rule top regressions/improvements, and gate result (PASS/FAIL) with reasons.
- REQ-008: The system shall not require network access; all analysis must be local.
- REQ-009: The system shall avoid non-ASCII symbols in PowerShell output strings (e.g., use "delta" instead of the Unicode Δ symbol).
- SEC-001: The tooling shall not collect or transmit source code or secrets; only lint summary data is stored in artifacts.
- CON-001: Analysis scope is limited to `frontend/src` matching extensions `.js,.jsx,.ts,.tsx` unless explicitly configured otherwise.
- GUD-001: Default thresholds should be strict (`0`) in gate tasks to prevent regressions; teams may relax for transitional phases.
- PAT-001: Prefer minimal, deterministic text output in CI; put human-readable detail in Markdown artifacts.

## 4. Interfaces & Data Contracts

4.1 VS Code Tasks

- lint: ci-parity
  - cwd: `frontend`
  - command: `npx eslint --max-warnings=0 --ext .js,.jsx,.ts,.tsx src`
  - outcome: Runs ESLint with local config; fails on any warnings/errors.

- lint: baseline-diff
  - command: `powershell -NoProfile -ExecutionPolicy Bypass -File "${workspaceFolder}\tools\lint_baseline_diff.ps1"`
  - outcome: Generates `docs/reports/lint-baseline-diff.md` and `docs/reports/lint-snapshot.json`; returns 0 regardless of deltas by default.

- lint: gate-baseline
  - command: `powershell -NoProfile -ExecutionPolicy Bypass -File "${workspaceFolder}\tools\lint_baseline_diff.ps1" -MaxTotalDelta 0 -MaxRuleDelta 0`
  - outcome: Same as baseline-diff but fails (non-zero) if total or any rule delta > 0.

4.2 Script Interface (PowerShell)

- Entrypoint: `tools/lint_baseline_diff.ps1`
- Parameters (examples):
  - `-SnapshotOut "docs/reports/lint-snapshot.json"` (optional; defaults to path in the script)
  - `-MaxTotalDelta 0` (optional; default may be relaxed for reporting-only runs)
  - `-MaxRuleDelta 0` (optional)
  - `-TopN 10` (optional; how many top regressions/improvements to show)

4.3 Snapshot JSON Schema (stable contract)

```json
{
  "timestamp": "YYYY-MM-DDTHH:MM:SS",
  "totalProblems": 0,
  "errors": 0,
  "warnings": 0,
  "ruleCounts": {
    "rule-name-1": 123,
    "rule-name-2": 4
  }
}
```

4.4 Markdown Report Structure (machine-readable anchors)

- Title: "ESLint Baseline Diff"
- Sections (in this order):
  1. Current Totals
  2. Baseline Comparisons (vs each known baseline)
  3. Per-Rule Changes
     - Top Regressions (N)
     - Top Improvements (N)
  4. Quality Gate Result
  5. Invocation Parameters (echo)

## 5. Acceptance Criteria

- AC-001: Given no changes vs baseline, when `lint: gate-baseline` runs, then exit code is 0 and report marks status as "NO CHANGE".
- AC-002: Given one new ESLint violation, when `lint: gate-baseline` runs with `MaxTotalDelta 0`, then exit code is non-zero and report includes a "REGRESSED" status and lists the rule in Top Regressions.
- AC-003: Given improvements (negative deltas) and no regressions, when `lint: gate-baseline` runs, then exit code is 0 and the report highlights improvements with negative deltas.
- AC-004: Given ESLint is not installed, when any lint task runs, then a clear error message is emitted explaining how to install or run from `frontend/`, and exit code is non-zero.
- AC-005: Given ESLint JSON output is unavailable, when the script runs, then totals are derived from text output and a report is still generated.

## 6. Test Automation Strategy

- Test Levels: Script-level integration tests; lightweight unit tests for helper functions (optional).
- Frameworks: Pester 5 for PowerShell script tests; Jest for verifying ESLint configuration integrity (optional).
- Test Data Management: Use a small fixture project (subset of `frontend/src`) to generate deterministic lint outputs for CI tests.
- CI/CD Integration: Add a CI job that runs `lint: ci-parity` (fail-fast) and `lint: gate-baseline` (artifact + gate). Store `docs/reports/lint-baseline-diff.md` and `lint-snapshot.json` as build artifacts.
- Coverage Requirements: Not applicable for scripts; ensure Pester asserts cover success, regression, fallback parsing, and missing-ESLint cases.
- Performance Testing: Ensure script completes within 2 minutes on typical developer machines for the full `frontend/src`.

## 7. Rationale & Context

Lint baselines enable teams to adopt stricter rules without blocking progress. However, without automated gates, debt can silently grow. This spec defines a measured approach: report deltas, preserve visibility with artifacts, and enforce non-regression through configurable thresholds. Per-rule deltas add precision by identifying which rules trend in the wrong direction.

## 8. Dependencies & External Integrations

### External Systems
- EXT-001: None.

### Third-Party Services
- SVC-001: None.

### Infrastructure Dependencies
- INF-001: Node.js + npm available in the developer environment and CI agents.

### Data Dependencies
- DAT-001: Baseline files: `frontend/lint-baseline.json`, `frontend/lint-baseline-batch3.json`.
- DAT-002: Snapshot artifact path: `docs/reports/lint-snapshot.json`.

### Technology Platform Dependencies
- PLT-001: PowerShell 5.1 on Windows for local execution.
- PLT-002: ESLint, executed via `npx` with repo-local configuration `frontend/eslint.config.js`.

### Compliance Dependencies
- COM-001: None.

## 9. Examples & Edge Cases

```powershell
# Reporting only (no gate), default snapshot path
powershell -NoProfile -ExecutionPolicy Bypass -File \
  .\tools\lint_baseline_diff.ps1

# Strict gate: fail on any regression in totals or per-rule
powershell -NoProfile -ExecutionPolicy Bypass -File \
  .\tools\lint_baseline_diff.ps1 -MaxTotalDelta 0 -MaxRuleDelta 0

# Custom snapshot output and top-5 summaries
powershell -NoProfile -ExecutionPolicy Bypass -File \
  .\tools\lint_baseline_diff.ps1 -SnapshotOut .\docs\reports\lint-snapshot.json -TopN 5
```

Edge cases:
- ESLint not found (npx missing): emit guidance and exit non-zero.
- ESLint JSON output formatting changes: fallback text parsing yields totals; per-rule deltas are omitted with a warning.
- Unicode in console output: use ASCII-safe strings (e.g., "delta") to avoid PowerShell formatting errors.

## 10. Validation Criteria

- The tasks `lint: ci-parity`, `lint: baseline-diff`, and `lint: gate-baseline` are present and runnable in VS Code.
- Running `lint: baseline-diff` creates both `docs/reports/lint-baseline-diff.md` and `docs/reports/lint-snapshot.json`.
- Running `lint: gate-baseline` fails with non-zero exit on any regression with thresholds set to 0.
- Reports consistently show per-rule top regressions/improvements when ESLint JSON is available.
- On machines without ESLint, the task fails fast with a clear remediation message.

## 11. Related Specifications / Further Reading

- docs/reports/scripts/README.md — Lint scripts documentation and workflows
- docs/DEVELOPMENT.md — Development workflow and quality gates
- docs/reports/LINT_REDUCTION_ROADMAP.md — Progressive plan to reduce lint debt
