---
title: Converge CRM Master Design Specification
version: 1.0
date_created: 2025-10-09
last_updated: 2025-10-11
owner: Converge Product Team
tags: [design, architecture, master, backend, frontend]
---

# Introduction {#intro}

This document is the master design specification for the Converge CRM platform. It serves as the authoritative source of truth for all backend and frontend development, defining the architecture, requirements, and interfaces for all system components.

## 1. Purpose & Scope

This specification provides a comprehensive guide for developers, architects, and product managers involved in the development of the Converge CRM. It covers the entire system, from the Django backend to the React frontend, ensuring consistency and adherence to established patterns.

## 2. Definitions

- **CRM**: Customer Relationship Management
- **DRF**: Django REST Framework
- **SPA**: Single Page Application
- **RBAC**: Role-Based Access Control
- **WCAG**: Web Content Accessibility Guidelines

## 3. Requirements, Constraints & Guidelines {#requirements}

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

### User Stories Framework {#user-stories}
- Coverage: 130+ user stories covering all platform capabilities across CRM, Accounting, Workflow, Analytics, Technician Ops, and Infrastructure.
- Source of Truth: static/kb/user-stories.md (complete user story framework that drives development and testing).
- Implementation Status: Phase 1–4 backend user stories implemented and tested; 23/23 tests passing as of 2025-10-10.

Development workflow mapping
- REQ-US-001: Every feature change MUST reference an existing user story or add a new one with business justification.
- REQ-US-002: User stories MUST map to RESTful endpoints defined in main/api_views.py.
- REQ-US-003: Acceptance criteria from user stories MUST translate to automated tests in main/tests.py (or module-specific tests).
- REQ-US-004: Frontend components MUST implement user story behavior and error handling patterns.
- REQ-US-005: Each story SHALL include measurable outcomes enabling stakeholder validation.

User story categories (canonical ranges)
- CRM Core (CRM-001→CRM-015): Account management, contact tracking, deal pipeline, interaction logging.
- Financial Management (ALM-001→EPP-010): Ledger, journal automation, work orders, payment processing.
- Workflow Automation: Time tracking, inventory management, project templates, automated workflows.
- Analytics & AI (PAI-001→PAI-015): Predictive analytics, CLV intelligence, revenue forecasting, BI.
- Technician Operations (ETO-001→ETO-015): Certifications, coverage areas, availability, compliance.
- Infrastructure (NTF-001→SLM-010): Notifications, security, logging, content management.

Guidance
- PAT-US-001: All code changes SHALL align with user stories in static/kb/user-stories.md and this master spec.
- PAT-US-002: When a new story is introduced, update static/kb/user-stories.md and link here under the appropriate category.
- PAT-US-003: Keep acceptance criteria atomic and testable (Given/When/Then preferred); ensure API/doc updates accompany behavior changes.

## Architecture & Domain Model Overview {#architecture}

### Platform Architecture
- Backend: Django 5 + Django REST Framework, custom token authentication (`main/api_auth_views.py`).
- Frontend: React + Vite SPA with centralized Axios client (`frontend/src/api.js`).
- Database: SQLite in development, PostgreSQL in production. Custom `CustomUser` model extends `AbstractUser`.
Minimal core graph for Work Order Service Management, aligned to implementation in `main/models.py` and industry models.

```python
# Customer context
Account 1:N Contact

# Execution context
Project -> Account, Contact
WorkOrder -> Project

# Work contents and scheduling
LineItem -> WorkOrder
ScheduledEvent -> WorkOrder, Technician

# Technician constraints and qualifications
TechnicianAvailability -> Technician
CoverageArea -> Technician
TechnicianCertification -> Technician, Certification
WorkOrderCertificationRequirement -> WorkOrder, Certification

# Inventory and billing
InventoryReservation -> ScheduledEvent, WarehouseItem
WorkOrderInvoice -> WorkOrder
Payment -> WorkOrderInvoice  # simplified view; payment may be polymorphic in code

# Communications and approvals
NotificationLog -> (WorkOrder | ScheduledEvent)  # generic link
DigitalSignature -> (WorkOrder) [via PaperworkTemplate optional]
# Supporting
TimeEntry -> Project
```

#### Work Order Lifecycle (high-level)
1) Create WorkOrder (via cases/agreements/deals) with parts/services (LineItem) and customer context (Account/Contact via Project)
2) Schedule and assign (ScheduledEvent → Technician) using availability, coverage, and certification constraints
3) Execute work; capture signatures and send notifications; consume reserved inventory
4) Complete and bill (generate WorkOrderInvoice, accept Payment); update analytics

#### Minimal ER Diagram {#er-diagram}
```mermaid
erDiagram
  ACCOUNT ||--o{ CONTACT : has
  PROJECT }o--|| ACCOUNT : belongs_to
  PROJECT }o--|| CONTACT : primary_contact
  WORK_ORDER }o--|| PROJECT : belongs_to

  WORK_ORDER ||--o{ LINE_ITEM : includes

  SCHEDULED_EVENT }o--|| WORK_ORDER : scheduled_for
  SCHEDULED_EVENT }o--|| TECHNICIAN : assigned_to

  TECHNICIAN ||--o{ TECHNICIAN_AVAILABILITY : has
  TECHNICIAN ||--o{ COVERAGE_AREA : covers

  CERTIFICATION ||--o{ TECHNICIAN_CERTIFICATION : grants
  TECHNICIAN ||--o{ TECHNICIAN_CERTIFICATION : holds
  WORK_ORDER ||--o{ WORK_ORDER_CERT_REQ : requires
  CERTIFICATION ||--o{ WORK_ORDER_CERT_REQ : is_required

  SCHEDULED_EVENT ||--o{ INVENTORY_RESERVATION : reserves
  WAREHOUSE_ITEM ||--o{ INVENTORY_RESERVATION : allocated

  WORK_ORDER ||--o{ WORK_ORDER_INVOICE : billed_as
  WORK_ORDER_INVOICE ||--o{ PAYMENT : paid_by

  WORK_ORDER ||..o{ NOTIFICATION_LOG : notifies
  WORK_ORDER ||..o{ DIGITAL_SIGNATURE : approves
  PAPERWORK_TEMPLATE ||..o{ DIGITAL_SIGNATURE : based_on
```

### Integrated Domain Layers (CRM → FSM → Accounting) {#integrated-domain}

This section aligns the platform model to the optimum integrated pattern defined in research, ensuring seamless quote→order→delivery→invoice→payment→posting flow.

1) CRM backbone (sell-to-cash initiation)
  - Account 1:N Contact
  - Account 1:N Deal (Opportunity)
  - Deal 1:1 Quote; Quote 1:N QuoteItem
  - Deal 1:N Invoice; Invoice 1:N InvoiceItem; Payment → Invoice

2) Field Service (service delivery execution)
  - Project → Account, Contact, Deal (optional)
  - WorkOrder → Project; WorkOrder 1:N LineItem (parts/services)
  - ScheduledEvent → WorkOrder, Technician (recurrence supported)
  - Technician → Availability, CoverageArea; Technician ↔ Certification via TechnicianCertification
  - WorkOrder ↔ Certification via WorkOrderCertificationRequirement
  - InventoryReservation → ScheduledEvent, WarehouseItem (reserve/consume on completion)
  - DigitalSignature → WorkOrder (via PaperworkTemplate); NotificationLog generic to WO/events

3) Bookkeeping (recognize and post)
  - LedgerAccount (Chart of Accounts)
  - JournalEntry (double-entry with debit_account and credit_account)
  - Event-driven postings: invoice posting, payment receipt, inventory consumption

#### Integration Points (optimum) {#integration-points}
- Quote → Deal conversion may drive WorkOrder or Project creation when accepted
- WorkOrderInvoice aggregates WorkOrder parts/labor; Invoices visible in CRM and posted to GL
- Payments settle Invoices and update AR; journal postings are automatic and idempotent
- Inventory reservations originate from scheduling; consumed on completion; GL reflects COGS/Inventory movement
- Technician TimeEntry can roll into labor lines or payroll exports; analytics aggregates KPIs

#### Integrated ER Diagram {#er-diagram-integrated}
```mermaid
erDiagram
  ACCOUNT ||--o{ CONTACT : has
  ACCOUNT ||--o{ DEAL : opportunities
  DEAL ||--|| QUOTE : primary
  QUOTE ||--o{ QUOTE_ITEM : lines
  DEAL ||--o{ INVOICE : bills
  INVOICE ||--o{ INVOICE_ITEM : lines
  INVOICE ||--o{ PAYMENT : settles

  PROJECT }o--|| ACCOUNT : belongs_to
  PROJECT }o--|| CONTACT : primary
  PROJECT }o--o{ DEAL : optional_link
  WORK_ORDER }o--|| PROJECT : belongs_to
  WORK_ORDER ||--o{ LINE_ITEM : includes
  SCHEDULED_EVENT }o--|| WORK_ORDER : scheduled_for
  SCHEDULED_EVENT }o--|| TECHNICIAN : assigned_to
  TECHNICIAN ||--o{ TECHNICIAN_AVAILABILITY : has
  TECHNICIAN ||--o{ COVERAGE_AREA : covers
  TECHNICIAN ||--o{ TECHNICIAN_CERTIFICATION : holds
  CERTIFICATION ||--o{ TECHNICIAN_CERTIFICATION : grants
  WORK_ORDER ||--o{ WORK_ORDER_CERT_REQ : requires
  CERTIFICATION ||--o{ WORK_ORDER_CERT_REQ : is_required
  SCHEDULED_EVENT ||--o{ INVENTORY_RESERVATION : reserves
  WAREHOUSE_ITEM ||--o{ INVENTORY_RESERVATION : allocated
  WORK_ORDER ||..o{ DIGITAL_SIGNATURE : approves
  PAPERWORK_TEMPLATE ||..o{ DIGITAL_SIGNATURE : based_on
  WORK_ORDER ||..o{ NOTIFICATION_LOG : notifies

  LEDGER_ACCOUNT ||--o{ JOURNAL_ENTRY : used_by
  JOURNAL_ENTRY ||--|| LEDGER_ACCOUNT : debit_account
  JOURNAL_ENTRY ||--|| LEDGER_ACCOUNT : credit_account
```

### Accounting & Operations Models
```python
LedgerAccount → JournalEntry (debit_account, credit_account)
Expense (submitted_by, approved_by, category)
Budget (category, period_start, period_end)  # Budget v1 summary; see Budget v2 in Accounting Summary
Payment (invoice | work_order_invoice, amount, payment_method)

Warehouse → WarehouseItem (name, sku, quantity, minimum_stock, unit_cost, gtin?)
TimeEntry (project, user, date, hours, billable)
```

### Custom Field System {#custom-fields}
- Models: `CustomField` defines schema; `CustomFieldValue` stores values using ContentTypes.
- Types: text, number, date, boolean with type-specific columns (`value_text`, `value_number`, `value_date`, `value_boolean`).
- Attach to any model via Generic FK. Example:
```python
CustomField.objects.create(
  name="LinkedIn Profile",
  field_type="text",
  content_type=ContentType.objects.get_for_model(Contact)
)
```
- Frontend integration: serializers expose custom field values; dynamic forms render inputs by type. APIs: `/api/custom-fields/`, `/api/custom-field-values/`.

### API Architecture Patterns {#api-patterns}
- REST convention:
```
GET    /api/{resource}/          # List (pagination + filtering)
POST   /api/{resource}/          # Create
GET    /api/{resource}/{id}/     # Retrieve
PUT    /api/{resource}/{id}/     # Update (full)
PATCH  /api/{resource}/{id}/     # Update (partial)
DELETE /api/{resource}/{id}/     # Delete
```
- ViewSets for all entities; role-based filtering in `get_queryset()` and activity logging in `perform_create`/`perform_update`. See Permission Rules and Activity Logging sections below for canonical snippets.

### Project Conventions {#project-conventions}
- Standards referenced: spec sections {#architecture}, {#api-patterns}, {#field-service-api}, {#tech-user-api}, {#accounting-workflow-summary}
- Instructions followed: Use repository models and endpoints as the primary source of truth; validate patterns against external vendor models (Dynamics 365 Field Service/Sales, Xero Accounting) to ensure parity and soundness.

## 4. Interfaces & Data Contracts {#interfaces}

### Backend API Specification

# Converge CRM - API Specification

Django REST Framework API specification for all backend endpoints.

### API and Schema Documentation (concise index) {#api-index}
- CRM: `/api/accounts/`, `/api/contacts/`, `/api/deals/`, `/api/quotes/`, `/api/quote-items/`, `/api/invoices/`, `/api/invoice-items/`, `/api/payments/`
- FSM: `/api/work-orders/`, `/api/line-items/`, `/api/scheduled-events/`, `/api/technicians/`, `/api/certifications/`, `/api/technician-availability/`, `/api/coverage-areas/`, `/api/inventory-reservations/`, notifications, signatures
- Accounting: `/api/ledger-accounts/`, `/api/journal-entries/`, reports endpoints

Utilities
- `/api/utils/gtin/check-digit/` — Compute/validate GTIN-8/12/13/14 check-digit.
- `/api/utils/gtin/check-digit/` — Compute/validate GTIN-8/12/13/14 check-digit.
  - GET: `?gtin_base=<digits>` (7/11/12/13/14). Returns normalized 14-digit GTIN, computed check digit, and validity.
  - POST: `{ "gtin_base": "03600029145" }` (digits-only). Response: `{ "normalized": "0036000291452", "length": 13, "check_digit": 2, "is_valid": true, "message": "ok" }`.
  - Errors: 400 on non-digits or unsupported length; 400 when `length==14` but check digit invalid.
 - `/api/dev/validate-json/` — Dev-only JSON Schema validator (DEBUG only). Validate a payload against a catalog schema key; returns `{valid, errors[], schema_path}`. See docs/API.md → “Schema usage (JSON Schema)”.
### JSON Schema Catalog {#json-schema-catalog}
Baseline enforcement uses JSON Schema draft-07; 2019-09 and 2020-12 variants are informational only.

- Accounting
  - JournalEntry
    - draft-07: `../../.copilot-tracking/research/20251011-journalentry.schema.json`
    - 2019-09: `../../.copilot-tracking/research/20251011-journalentry.schema-2019-09.json`
    - 2020-12: `../../.copilot-tracking/research/20251011-journalentry.schema-2020-12.json`
    - Notes: Aligns with `main.models.JournalEntry`; single-amount double-entry with debit/credit account IDs.
  - Payment
    - draft-07: `../../.copilot-tracking/research/20251011-payment.schema.json`
    - 2019-09: `../../.copilot-tracking/research/20251011-payment.schema-2019-09.json`
    - 2020-12: `../../.copilot-tracking/research/20251011-payment.schema-2020-12.json`
    - Notes: GenericForeignKey target via content_type/object_id (writeOnly); amount >= 0; date formatted.
  - Expense
    - draft-07: `../../.copilot-tracking/research/20251011-expense.schema.json`
    - Notes: Non-breaking annotations; matches spec example; URI ref for receipt.
  - MonthlyDistribution
    - draft-07: `../../.copilot-tracking/research/20251011-monthlydistribution.schema.json`
    - 2019-09: `../../.copilot-tracking/research/20251011-monthlydistribution.schema-2019-09.json`
    - 2020-12: `../../.copilot-tracking/research/20251011-monthlydistribution.schema-2020-12.json`
    - Notes: 12 entries required, each representing a monthly allocation; sum==100% enforced server-side; used by Budget v2.
  - BudgetV2
    - draft-07: `../../.copilot-tracking/research/20251011-budget-v2.schema.json`
    - 2019-09: `../../.copilot-tracking/research/20251011-budget-v2.schema-2019-09.json`
    - 2020-12: `../../.copilot-tracking/research/20251011-budget-v2.schema-2020-12.json`
    - Notes: Requires Cost Center, optional Project; references MonthlyDistribution; totals=100% enforced server-side.

- Field Service Management (FSM)
  - ScheduledEvent
    - draft-07: `../../.copilot-tracking/research/20251011-scheduled-event.schema.json`
    - 2019-09: `../../.copilot-tracking/research/20251011-scheduled-event.schema-2019-09.json`
    - 2020-12: `../../.copilot-tracking/research/20251011-scheduled-event.schema-2020-12.json`
    - Notes: RRULE is a free-form string validated server-side; status enumerations per model.
  - NotificationLog
    - draft-07: `../../.copilot-tracking/research/20251011-notificationlog.schema.json`
    - 2019-09: `../../.copilot-tracking/research/20251011-notificationlog.schema-2019-09.json`
    - 2020-12: `../../.copilot-tracking/research/20251011-notificationlog.schema-2020-12.json`
    - Notes: Channel/status enums; external_id and timestamps readOnly where applicable.

- Staff & Technician
  - Technician
    - draft-07: `../../.copilot-tracking/research/20251011-technician.schema.json`
    - 2019-09: `../../.copilot-tracking/research/20251011-technician.schema-2019-09.json`
    - 2020-12: `../../.copilot-tracking/research/20251011-technician.schema-2020-12.json`
    - Notes: Core profile; nested relations (coverage, certs, availability) via separate endpoints.

- Inventory & Work Orders
  - WarehouseItem
    - draft-07: `../../.copilot-tracking/research/20251011-warehouseitem.schema.json`
    - 2019-09: `../../.copilot-tracking/research/20251011-warehouseitem.schema-2019-09.json`
    - 2020-12: `../../.copilot-tracking/research/20251011-warehouseitem.schema-2020-12.json`
    - Notes: Optional digits-only `gtin` (8/12/13/14) with server-side check-digit validation.
  - WorkOrder
    - draft-07: `../../.copilot-tracking/research/20251011-workorder.schema.json`
    - 2019-09: `../../.copilot-tracking/research/20251011-workorder.schema-2019-09.json`
    - 2020-12: `../../.copilot-tracking/research/20251011-workorder.schema-2020-12.json`
    - Notes: Line items are readOnly; scheduling and invoicing modeled via related resources.
  - WorkOrderInvoice
    - draft-07: `../../.copilot-tracking/research/20251011-workorderinvoice.schema.json`
    - 2019-09: `../../.copilot-tracking/research/20251011-workorderinvoice.schema-2019-09.json`
    - 2020-12: `../../.copilot-tracking/research/20251011-workorderinvoice.schema-2020-12.json`
    - Notes: Payment terms enums; overdue fields are computed readOnly values.

Configuration examples
```json
{
  "posting_rules": {
    "invoice_post": ["DR:AccountsReceivable", "CR:Revenue"],
    "payment_receive": ["DR:Cash", "CR:AccountsReceivable"],
    "inventory_consume": ["DR:COGS", "CR:Inventory"]
  },
  "scheduling": { "rrule_support": true, "optimize_routes": true },
  "qualification": { "enforce_certifications": true }
}
```

Technical requirements
- Enforce double-entry invariants on JournalEntry writes
- Idempotent posting from operational events (invoice post, payment, consumption)
- RBAC across CRM, FSM, and Accounting; audit via ActivityLog and NotificationLog

Recommended approach
- CRM backbone: Account, Contact, Deal, Quote(+Items), Invoice(+Items), Payment
- FSM execution: Project, WorkOrder(+LineItems), ScheduledEvent→Technician, Availability/Coverage, Certifications (+requirements), InventoryReservation, DigitalSignature, NotificationLog
- Bookkeeping core: LedgerAccount (COA), JournalEntry (double-entry)
- Integrations: Event-driven postings; invoice generation from WorkOrders; inventory consumption on completion; payments applied to invoices; analytics snapshots

Schema enforcement and variants
- JSON Schema baseline: draft-07 is authoritative and enforced for API contract validation where applicable.
- Informational variants: 2019-09 and 2020-12 schema files MAY be provided for reference; they are non-enforcing annotations due to validator compatibility.
- CSV artifacts follow RFC 4180 where exported.

Implementation guidance
- Objectives: Unified quote→order→delivery→invoice→payment→posting; accurate inventory and GL in real time
- Key Tasks: Wire posting rules; ensure WorkOrder↔Invoice mapping; enforce assignment constraints; implement reservation→consumption; add acceptance tests for postings
- Dependencies: `main/models.py` for entities; `main/api_urls.py` for endpoints; ActivityLog for audit; RBAC per ViewSets
- Success Criteria: End-to-end flows produce correct GL postings, satisfy scheduling constraints, accurate inventory levels, and traceable communications/approvals

## Authentication API

### Token Authentication
```
POST   /api/auth/login/
Request: {"username": "user@example.com", "password": "password123"}
Response: {"token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b", "user": {...}}

POST   /api/auth/logout/
Headers: Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
Response: {"message": "Successfully logged out"}

GET    /api/auth/user/
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

Notes
- RBAC: Sales Managers can access all contacts; other users may only access contacts where owner == current user.

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

### Invoices API (CRM) — Posting endpoints
```
POST   /api/invoices/{id}/post/
Headers: Authorization: Token <token>
Response 201: {"journal_entry_id": 42, "amount": "100.00"}
Response 409: {"detail": "Invoice already posted"}

Notes:
- Posting action creates a JournalEntry per AC-GL-001 (see {#ac-gl}).
- Minimal default COA mapping used if explicit config is not present: DR 1100 AccountsReceivable, CR 4000 Revenue.
- Idempotent: subsequent POST returns 409 without creating duplicate entries.
 - Durable posted state: Invoice persists `posted_journal` (FK → JournalEntry) and `posted_at` (DateTime). On first successful post these fields are set; any subsequent post SHALL return 409 when `posted_journal` is not null. A legacy description-based guard MAY also be present during transition.
```

### Payments API — Allocation
```
POST   /api/payments/{id}/allocate/
Headers: Authorization: Token <token>
Request: { "invoice": 123, "amount": "50.00" }  # or { "work_order_invoice": 55, ... }
Response 201: { "journal_entry_id": 77, "applied_to": "invoice", "target_id": 123, "open_balance": "50.00", "status": "partial" }
Response 400: { "detail": "Amount exceeds open balance" }
Response 409: { "detail": "Payment already allocated" }

Notes:
- Posting action creates a JournalEntry per AC-GL-002: DR 1000 Cash, CR 1100 AccountsReceivable for payment.amount.
- Applies amount to Invoice or WorkOrderInvoice; rejects overpayment; returns remaining open_balance and status (partial|paid).
- Idempotent: allocation is guarded; retry does not double-apply.
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

### Technician & User Management API {#tech-user-api}
Core endpoints for technician lifecycle, certifications, coverage, availability, hierarchical users, and qualification checks.

```
GET    /api/technicians/
POST   /api/technicians/
GET    /api/certifications/
POST   /api/certifications/
GET    /api/technician-certifications/
POST   /api/technician-certifications/
GET    /api/coverage-areas/
POST   /api/coverage-areas/
GET    /api/technician-availability/
POST   /api/technician-availability/
GET    /api/work-order-cert-requirements/
POST   /api/work-order-cert-requirements/

# Assignment & payroll helpers
GET    /api/technicians/available/                      # Filter by date/time/skills via query
POST   /api/work-orders/{id}/find-technicians/         # Match by skills, coverage, availability
POST   /api/work-orders/{id}/assign-technician/        # Assign and log activity
GET    /api/technicians/{id}/payroll/                  # Aggregated time-entry payroll view
```

Notes
- RBAC: Only managers can see/manage all technicians; reps limited to their team.
- Qualification: `WorkOrderCertificationRequirement` enforces required certs on assignment.
- Optimization: Coverage and availability optimizers exposed via endpoints with safe defaults.

### Field Service Management API {#field-service-api}
Scheduling, notifications, paperwork, customer requests, signatures, inventory reservations, and scheduling analytics.

```
# Resource endpoints
GET/POST /api/scheduled-events/
GET/POST /api/notification-logs/
GET/POST /api/paperwork-templates/
GET/POST /api/appointment-requests/
GET/POST /api/digital-signatures/
GET/POST /api/inventory-reservations/
GET/POST /api/scheduling-analytics/

# Specialized scheduling endpoints
POST   /api/scheduling/route-optimization/             # Route and sequence optimization
GET    /api/scheduling/availability-check/             # Real-time tech availability

Availability-check (GET or POST)
```
Params: technician_id (int, required), start_time (ISO 8601), end_time (ISO 8601)
Response: { "is_available": true|false, "conflicts": [ { "id": 12, "start": "2025-10-12T10:00:00Z", "end": "2025-10-12T11:00:00Z" } ], "details": "Within weekly availability window" }
```

# Communications
POST   /api/notifications/send-reminder/               # Appointment reminder
POST   /api/notifications/send-on-way/                 # "On My Way" notification
```

Design notes
- Recurrence: `ScheduledEvent.recurrence_rule` (RRULE) with `parent_event` for instances.
  - Validation posture: Keep client schema enums minimal; validate RRULE strings and state transitions server-side to avoid brittle constraints.
- Notifications: `NotificationLog` captures channel, status, and provider IDs for auditability.
- Paperwork: HTML templates with conditional logic; optional `requires_signature` gating flows.
- Signatures: `DigitalSignature` stores base64 image, IP, UA, and a `document_hash` + `is_valid` for integrity checks.
- Inventory: `InventoryReservation` links `ScheduledEvent` to `WarehouseItem` with statuses reserved→consumed/released.
- Analytics: `SchedulingAnalytics` daily snapshots for utilization and completion KPIs.
 - Consumption: Completing a WorkOrder consumes reserved inventory and triggers GL posting (see {#ac-gl}).

### Work Orders — Completion (Inventory Consumption)
```
POST   /api/work-orders/{id}/complete/
Headers: Authorization: Token <token>
Response 201: { "journal_entry_id": 88, "consumed_cost": "35.00" }
Response 409: { "detail": "Work order already completed" }
Response 409: { "detail": "Insufficient stock for one or more items" }

Notes:
- Consumes reserved inventory items; creates JournalEntry per AC-GL-003: DR 5000 COGS, CR 1200 Inventory for total consumed cost.
- No GL entry if total consumed cost is 0 (e.g., only service lines).
- Idempotent: completion is guarded; re-completion does not double-consume nor re-post.
```

### Accounting & Workflow Expansion Summary {#accounting-workflow-summary}
Key API surfaces and patterns introduced by the expansion roadmap:

- Financial Reports
  - GET `/api/reports/balance-sheet/`
  - GET `/api/reports/pnl/`
  - GET `/api/reports/cash-flow/`
  - Export: PDF and CSV supported at the report layer (server-side generation).
- Expenses & Budgets
  - CRUD `/api/expenses/` with receipt upload and categorization
  - CRUD `/api/budgets/` with variance tracking
  - Tax reporting: GET `/api/tax-reports/` (or `/api/tax-report/`), role-restricted
- Deal→WorkOrder Automation
  - POST `/api/workorders/auto` (or signal-based creation on deal “won”)
  - Event-driven triggers (signals) ensure auditable, idempotent creation
- Project Billing & Inventory
  - POST `/api/billing/time` (log billable hours for invoicing)
  - POST `/api/inventory/adjust` (inventory decrements on fulfillment)
- Communications
  - POST `/api/communications/email` (invoice emails, reminders)

- Posting & Double-Entry
  - POST `/api/invoices/{id}/post/` (invoice posting → DR AR, CR Revenue [+ Tax])
  - Payments create postings → DR Cash/Bank, CR AR (partial payments supported)
  - WorkOrder completion consumption → DR COGS, CR Inventory
  - Invariants: double-entry enforced; idempotent postings; explicit 400/409 errors on validation/conflict
  - See Acceptance: {#ac-gl}

Budget v2 and MonthlyDistribution (summary)
- Purpose: Introduce dimensional budgeting with Cost Center and Project dimensions; separate monthly allocation via `MonthlyDistribution` document.
- Defaults/Migration:
  - Mapping source: DB mapping table with admin UI to map legacy Budget to v2 (dimensioned).
  - Default Cost Center: "General Operations" when not provided.
  - Default Distribution: 12 months × 8.33% each when distribution missing.
- Contracts: Draft-07 schemas `Budget_v2` and `MonthlyDistribution` are authoritative; variants (2019-09/2020-12) are informational.
- Serializer & API: v2 accepts dimensional fields and optional `monthly_distribution_id`; server enforces totals = 100% and period alignment.

#### Posting configuration {#posting-config}
Configuration sources and idempotency for accounting postings:

- Chart of Accounts (COA) mappings
  - System-level defaults: AccountsReceivable, Revenue, TaxPayable, Cash/Bank, Inventory, COGS
  - Entity-level overrides: per Product/Service (for InvoiceItem revenue); per WarehouseItem (Inventory account); per Tax rate (TaxPayable); optional Project/WorkOrder revenue/cost centers
  - Precedence: Entity override → System default; validation requires all effective accounts to be resolvable at post time

- Idempotency keys and guards
  - Invoice posting: key = `invoice:{id}:post` (or persisted `posted_journal_id`); re-post is a no-op (409 if forced)
  - Payment receipt: key = `payment:{external_ref|uuid}`; duplicate submissions do not double-apply
  - Inventory consumption: key = `workorder:{id}:consumption` with per-line markers; completion triggers a single posting; re-completion is a no-op
  - Error semantics: 400 for missing mappings/validation failures; 409 for conflicts/already-posted/already-consumed

- Audit and observability
  - ActivityLog entries for each posting with user, entity, and amounts
  - Optional NotificationLog for stock alerts or posting failures

Design notes
- RBAC: finance data is access-controlled with managerial roles required for approvals.
- Audit: all automation actions and report generations are activity-logged.
- Validation: invoices generated from work orders must include correct line items and totals.

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

## Error Handling {#error-handling}

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

# Converge CRM - Frontend Specification

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

### UI/UX House Style Addendum {#uiux-house-style}
- Tables/lists use zebra striping via `.striped-table` class.
- Compact layout: prefer minimal padding and margins to maximize information density.
- Navigation: fixed high-level structure — Dashboard, Resources, Contacts, Deals, Tasks, Orders, Warehouse, Staff.
- Permission affordances: hide or disable actions user cannot perform; always render explanatory helper text on 403.


## 5. Acceptance Criteria {#acceptance-criteria}

- **AC-SYS-001**: All backend and frontend components are implemented according to the specifications in this document.
- **AC-SYS-002**: All user stories are successfully implemented and validated.
- **AC-SYS-003**: All automated tests pass, with a minimum of 70% code coverage for new functionality.
- **AC-SYS-004**: The application is successfully deployed to the target environment.

Field Service and Work Order lifecycle (specific)
- AC-WO-001: Technician assignment SHALL enforce availability, coverage area, and certification requirements; assignment fails with clear errors when constraints are unmet.
- AC-WO-002: Creating a ScheduledEvent for a WorkOrder SHALL create or validate InventoryReservations for required WarehouseItems; on completion, consumption is recorded or reservation is released on cancellation.
- AC-WO-003: Generating an invoice from a WorkOrder SHALL include all LineItems and recorded labor; Payments link to the WorkOrderInvoice and update balances.
- AC-WO-004: Completing a WorkOrder that requires signature SHALL be gated until a valid DigitalSignature is recorded and auditable in NotificationLog where applicable.

## 6. Test Automation Strategy {#test-automation}

- **Test Levels**: Unit, Integration, and End-to-End (E2E) tests are required.
- **Frameworks**: Django's TestCase for the backend, and Jest with React Testing Library for the frontend. Cypress for E2E tests.
- **CI/CD Integration**: All tests MUST be integrated into the GitHub Actions CI/CD pipeline and run on every pull request.
- **Coverage Requirements**: A minimum of 70% test coverage is required for all new code.

### Frontend Test Coverage Gap (visibility)
- Current state: infra is complete, but component test coverage is limited. This is an active gap with business risk.
- Plan: follow the staged implementation described in `spec/frontend-test-coverage-gap-analysis.md` and `spec/frontend-test-implementation-plan.md` (if present). Prioritize revenue-critical surfaces (CRM core, Accounting, Field Service) and raise coverage incrementally per module.
- Gate: do not block merges solely on legacy coverage; enforce 70% coverage on changed lines/files and add suites per sprint until baseline targets are met.

### Cross-Browser & Accessibility Testing {#cross-browser-testing}
- Scope: Chrome (stable), Firefox (latest ESR), Edge (stable), Safari (latest on macOS), and mobile emulations (minimum viable via device profiles). Prioritize CRM core flows.
- Tools: Cypress/Playwright for automation; axe-core for accessibility checks; Lighthouse for performance profiling.
- CI: separate GitHub Actions jobs for cross-browser runs with matrix strategy; store artifacts and summary reports.
- Visual regression: optional per critical views using baseline images and diffs.
- Manual procedures: follow spec/cross-browser/manual testing procedures for edge browsers and devices.

## 7. Rationale & Context {#rationale}

This master specification ensures that all development work is aligned with the architectural vision and business requirements of the Converge CRM platform. By providing a single source of truth, it facilitates consistency, reduces ambiguity, and enables more efficient development and testing.

## 8. Dependencies & External Integrations {#dependencies}

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

## 9. Examples & Edge Cases {#examples}

(Examples are provided within the backend and frontend specification sections.)

## 10. Validation Criteria {#validation}

- **VAL-001**: All Django models match the field specifications and constraints.
- **VAL-002**: All API endpoints implement the required RBAC and activity logging.
- **VAL-003**: All React components adhere to the specified architectural patterns.
- **VAL-004**: The final application successfully passes all acceptance criteria.

## 11. Process Quality: ESLint Baseline Diffs and Gates {#process-eslint-baseline}

Purpose: prevent regression of legacy lint debt while enabling incremental improvements.

Key patterns
- Baseline file: `frontend/lint-baseline.json` (and optional batches, e.g., `lint-baseline-batch3.json`).
- Snapshot artifact: `docs/reports/lint-snapshot.json` with per-rule counts and totals.
- Report: `docs/reports/lint-baseline-diff.md` with sections: Current Totals; Baseline Comparisons; Per-Rule Changes (Top Regressions/Improvements); Quality Gate Result; Invocation Parameters.
- Thresholds: `MaxTotalDelta`, `MaxRuleDelta` (default 0 in gate tasks) – fail build on positive deltas.
- Windows-first: PowerShell 5.1 script entrypoint `tools/lint_baseline_diff.ps1`; CI uses Node/ESLint via npx.

Interfaces
- VS Code tasks
  - lint: ci-parity → `npx eslint --max-warnings=0 --ext .js,.jsx,.ts,.tsx src` (cwd: `frontend`).
  - lint: baseline-diff → run PowerShell script to generate snapshot/report (non-gating by default).
  - lint: gate-baseline → same script with `-MaxTotalDelta 0 -MaxRuleDelta 0` (gating).
- Script parameters: `-SnapshotOut`, `-MaxTotalDelta`, `-MaxRuleDelta`, `-TopN`.

Operational guardrails
- Prefer deterministic CI console output; put detail in Markdown artifacts.
- ASCII-only console strings (use "delta", avoid Unicode symbols) for PS 5.1.
- No network access; do not collect source or secrets; store only counts.
- Fallback parsing: if ESLint JSON unavailable, derive totals from text and omit per-rule deltas with a warning.

Acceptance checks
- No-change vs baseline: gate passes and report marks NO CHANGE.
- Any new violation with thresholds at 0: non-zero exit and report shows REGRESSED with top rule deltas.

## 12. Related Specifications / Further Reading {#related}
Primary references
- Developer Guide: ../../docs/DEVELOPMENT.md
- API Reference: ../../docs/API.md
- Testing Automation: ../../docs/TESTING_AUTOMATION.md
- User Stories (source of truth): ../../static/kb/user-stories.md

Spec-driven development assets
- Master AI Spec: ../../main.md
- Compile Prompt: ../../.github/prompts/compile.prompt.md
- Lint Prompt: ../../.github/prompts/lint.prompt.md

Module specifications
- Accounting Expansion: ../../spec/spec-design-accounting-expansion.md
- Phase 4 Technician/User Management: ../../spec/spec-design-phase4-technician-user-management.md
- Field Service Management: ../../spec/spec-design-field-service-management.md

Cross-browser suite (reference)
- Strategy, matrix, automation, and procedures: ../../spec/cross-browser/

---

## 13. Acceptance Mapping {#acceptance-mapping}

Traceability matrix linking design areas to current automated tests. Update when specs or tests change to prevent drift.

- Deal → Project automation (Signals):
  - Tests: `main/tests.py` (Workflow automation), `main/tests_commands.py` (recurrence rules)
- Technician & User Management (Phase 4A):
  - Tests: `main/tests.py::Phase4ATechnicianManagementTests`
- Accounting Expansion (Phase 1):
  - Tests: `main/tests.py::Phase1AccountingTests`
- Workflow Automation (Phase 2):
  - Tests: `main/tests.py::Phase2WorkflowTests`
- Authentication & Permissions:
  - Tests: `main/tests/test_permissions_minimal.py`, `main/tests/test_permissions_deeper.py`, `main/tests/test_permissions_payments_journal.py`

- Field Service Management:
  - Tests: `main/tests.py` (ScheduledEvent, Notifications, Paperwork, Signatures, InventoryReservation, SchedulingAnalytics)
  - Tests: `main/tests/test_search_and_routes.py` (optimize routes endpoints)
  - Tests: `main/test_phase2.py` (technician assignment notifications and recurrence)

- Accounting Posting (see {#ac-gl}):
  - AC-GL-001 (Invoice posting → JournalEntry): Tests implemented `main/tests/test_posting_invoice.py::TestInvoicePosting`
  - AC-GL-002 (Payment receipt → JournalEntry, AR settlement): Tests implemented `main/tests/test_posting_payment.py::TestPaymentPostingGL`
  - AC-GL-003 (Inventory consumption on WorkOrder completion → JournalEntry): Tests implemented `main/tests/test_posting_inventory.py::TestWorkOrderConsumptionPosting`

### Accounting Posting Acceptance Criteria {#ac-gl}

- AC-GL-001 Invoice Posting → Journal Entry
  - Preconditions: A posted Invoice exists with one or more InvoiceItems and valid LedgerAccount mappings for Accounts Receivable and Revenue (and Tax if applicable).
  - Action: POST /api/invoices/{id}/post/ or equivalent posting action.
  - Expected:
    - Creates a JournalEntry with two or more lines obeying double-entry invariants:
      - DR AccountsReceivable = invoice.total_gross
      - CR Revenue = invoice.total_net
      - If tax applicable: CR TaxPayable = invoice.total_tax
    - Idempotency: Re-posting the same invoice does not create duplicate JournalEntries.
    - Invoice status transitions to Posted; AR balance reflects the invoice total.
    - Audit: ActivityLog records the posting event with user and invoice reference.
    - Error modes: Missing COA mapping → 400 with explicit field; Already posted → 409.

- AC-GL-002 Payment Receipt → Journal Entry and AR Settlement
  - Preconditions: A Posted Invoice with open balance; a valid Cash/Bank LedgerAccount mapping.
  - Action: POST /api/payments/ with invoice reference and amount (supports partial payments).
  - Expected:
    - Creates a JournalEntry:
      - DR Cash/Bank = payment.amount
      - CR AccountsReceivable = payment.amount
    - Applies payment to the referenced Invoice, reducing its balance; status transitions to Paid when balance == 0.
    - Partial payments: Invoice status transitions to Partially Paid; remaining balance accurate.
    - Idempotency: Retrying the same payment reference doesn’t double-apply.
    - Validation: Reject overpayment (amount > open balance) with 400.
    - Audit: ActivityLog records payment creation and application.

- AC-GL-003 Inventory Consumption on Work Order Completion → Journal Entry
  - Preconditions: WorkOrder with consumed LineItems that reference WarehouseItem with unit_cost > 0; valid Inventory and COGS LedgerAccount mappings; sufficient stock.
  - Action: PATCH /api/work-orders/{id}/complete/ or completion event that triggers consumption.
  - Expected:
    - For each consumed part line: decrements WarehouseItem.quantity by line.quantity.
    - Creates a JournalEntry totaling cost:
      - DR CostOfGoodsSold = sum(line.quantity × warehouse_item.unit_cost for part lines)
      - CR Inventory = same amount
    - Prevents negative inventory; returns 409 if insufficient stock unless backorder override is specified.
    - Idempotency: Completing the same WorkOrder twice does not double-consume inventory nor double-post GL.
    - Audit: ActivityLog records consumption and posting; NotificationLog may capture stock alerts.

Note: Keep acceptance mapping concise; reference folders/files rather than duplicating content.

- [User Stories](../../static/kb/user-stories.md)
- [Development Guide](../../docs/DEVELOPMENT.md)

---

## 14. Processed Sources (provenance) {#processed-sources}
Concise list of source documents and code artifacts consolidated into this canonical spec, with primary anchors used.

- .github/copilot-instructions.md
  - Architecture Overview; Project-Specific Patterns; API Endpoint Patterns; Frontend Component Organization; Database Model Relationships; Testing Automation Infrastructure; Phase 4 Technician & User Mgmt; Phase 5 Field Service Mgmt
- spec/spec-design-accounting-expansion.md → summarized in Accounting & Workflow Expansion Summary
- spec/spec-process-lint-baseline-gating[processed].md → Process Quality: ESLint Baseline Diffs and Gates
- spec/cross-browser/* → Cross-Browser & Accessibility Testing
- docs/TESTING_AUTOMATION.md → Test Automation Strategy section
- main/api_urls.py → Canonical endpoints for auth, technician, and field service APIs
- main/models.py → Model field references for Technician, ScheduledEvent, NotificationLog, PaperworkTemplate, AppointmentRequest, DigitalSignature, InventoryReservation, SchedulingAnalytics
