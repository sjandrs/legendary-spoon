# Converge CRM Development Guide

**Converge** is a Django/React CRM and Business Management platform targeting small-to-medium businesses. This guide covers essential patterns and workflows for productive development.

## Architecture Overview

**Backend:** Django REST Framework with custom token authentication (`main/api_auth_views.py`)
**Frontend:** React + Vite with Axios API client (`frontend/src/api.js`)
**Database:** SQLite (development), with custom `CustomUser` model extending `AbstractUser`
**Project Structure:** Clean separation - Django backend serves RESTful APIs, React frontend consumes them

## Critical Developer Workflows

### Starting Development Environment
**Recommended:** Use VS Code Tasks (`Ctrl+Shift+P` → `Tasks: Run Task` → `start-dev`)
- Runs both backend (`py manage.py runserver`) and frontend (`npm run dev`) in parallel
- Configuration in `.vscode/tasks.json`
- Alternative: PowerShell script `start_dev.ps1`

### Database Setup & Seeding
```bash
py manage.py migrate                 # Apply schema changes
py manage.py seed_data              # CRITICAL: Populate test data
py manage.py set_password <user>    # Admin password reset tool
```

The `seed_data` command is essential - creates users, deal stages, task types, and sample CRM data required for UI components to function.

## Project-Specific Patterns

### API Architecture
- **ViewSets:** All CRM entities use `ModelViewSet` pattern in `main/api_views.py`
- **Permissions:** Role-based access (Sales Reps see only their data, Sales Managers see all)
- **Activity Logging:** Automatic logging in `perform_create`/`perform_update` methods
- **Custom Fields:** Dynamic field system via `CustomField`/`CustomFieldValue` models

### Frontend Conventions
- **API Client:** Centralized in `frontend/src/api.js` with token interceptors
- **Auth Flow:** Token stored in localStorage, automatic 401 redirect to login
- **URL Structure:** RESTful - `/api/{resource}/` for CRUD operations

### Model Relationships
```python
# Key CRM entities with ownership patterns
Account → Contact (FK) → Deal (FK) → Interaction (FK)
CustomUser → Account.owner (Sales territory assignment)
```

### UI/UX Standards
- **Zebra Striping:** Use `.striped-table` class on all tables/lists
- **Compact Design:** Minimal padding/margins for horizontal space optimization
- **Navigation:** Fixed structure - Dashboard, Resources, Contacts, Deals, Tasks, Orders, Warehouse, Staff

## Essential File Locations

### Backend Files
- **API Routes:** `main/api_urls.py` - DRF router configuration
- **Authentication:** `main/api_auth_views.py` - Custom token-based auth
- **Models:** `main/models.py` - CRM entities + CustomUser + Accounting + Workflow models
- **Views:** `main/api_views.py` - All API endpoints including Phase 1 & 2 features
- **Signals:** `main/signals.py` - Workflow automation (Deal → Project/WorkOrder)
- **Reports:** `main/reports.py` - Financial reporting classes
- **Serializers:** `main/serializers.py` - Data serialization for all models

### Frontend Files
- **API Client:** `frontend/src/api.js` - Axios client with all Phase 1 & 2 endpoints
- **Main Layout:** `frontend/src/App.jsx` - Navigation and routing
- **Dashboard:** `frontend/src/components/DashboardPage.jsx` - Analytics dashboard
- **Time Tracking:** `frontend/src/components/TimeTracking.jsx` - Time entry management
- **Warehouse:** `frontend/src/components/Warehouse.jsx` - Inventory management
- **Email Communication:** `frontend/src/components/EmailCommunication.jsx` - Automated communications

### Static Assets
- **Knowledge Base:** `static/kb/*.md` - Markdown docs served via API
- **Reports:** `main/reports.py` - FinancialReports class for balance sheet, P&L, cash flow

### Configuration
- **Settings:** `web/settings.py` - Django configuration
- **URLs:** `web/urls.py` - Main URL configuration
- **VS Code Tasks:** `.vscode/tasks.json` - Development environment tasks

## Configuration Notes

- **Dynamic Configuration:** Task Types and Templates are database-driven, not hardcoded
- **Admin Panel:** All CRM models registered for debugging/data access
- **Knowledge Base:** Markdown files in `static/kb/` served via dedicated API endpoints
- **User Roles:** Group-based permissions (`Sales Rep`, `Sales Manager`)


## Recent Changes & Evolution

### Phase 1: Accounting Expansion (2025-09-28)
- **REQ-101: Financial Reporting System**
  - Added `FinancialReports` class with balance sheet, P&L, and cash flow reports
  - New API endpoints: `/api/reports/balance-sheet/`, `/api/reports/pnl/`, `/api/reports/cash-flow/`
  - Date range filtering and comprehensive financial analytics

- **REQ-102: Expense Management**
  - New `Expense` and `Budget` models with approval workflow
  - Expense categories, approval status, and budget tracking
  - API endpoints: `/api/expenses/`, `/api/budgets/`
  - Role-based approval system (Sales Managers approve expenses)

- **REQ-103: Work Order & Invoicing System**
  - Complete work order lifecycle management
  - `WorkOrder`, `WorkOrderInvoice`, `LineItem` models
  - Automatic invoice generation from work orders
  - Payment tracking and overdue invoice management

- **REQ-104: Ledger Accounting**
  - Double-entry bookkeeping with `LedgerAccount` and `JournalEntry` models
  - Chart of accounts and journal entry management
  - API endpoints: `/api/ledger-accounts/`, `/api/journal-entries/`

- **REQ-105: Payment Processing**
  - `Payment` model for tracking all payment transactions
  - Integration with invoices and work orders
  - Payment method tracking and reconciliation

### Phase 2: Workflow Automation (2025-09-29)
- **REQ-201: Automatic WorkOrder Creation**
  - Django signals automatically create Projects/WorkOrders on Deal wins
  - `deal_status_changed_handler` in `main/signals.py`
  - Seamless deal-to-project conversion workflow

- **REQ-202: Time Tracking & Billing**
  - `TimeEntry` model with billable hours tracking
  - Project-based time logging with hourly rates
  - API endpoints: `/api/time-entries/`
  - Frontend: Time Tracking component with analytics

- **REQ-203: Inventory Integration**
  - `Warehouse` and `WarehouseItem` models with stock management
  - Automatic inventory adjustments from WorkOrder completion
  - Low stock alerts and inventory value calculations
  - API endpoints: `/api/warehouses/`, `/api/warehouse-items/`

- **REQ-204: Email Automation**
  - Automated invoice emails and overdue payment reminders
  - Email methods on `WorkOrderInvoice` model
  - Bulk communication tools for customer management
  - API endpoints: `/api/invoices/{id}/send-email/`, `/api/invoices/send-overdue-reminders/`

- **REQ-205: Cross-Module Analytics**
  - Comprehensive dashboard analytics across all modules
  - Customer lifetime value, project profitability, time tracking metrics
  - Inventory alerts and business intelligence
  - API endpoint: `/api/analytics/dashboard/`

- **Model Renaming (2025-09-28):** Core "Task" model renamed to "Project" for better business alignment
- **Authentication Stabilized (2025-09-27):** Custom token system implemented after removing `dj-rest-auth` conflicts
- **Dynamic Configuration:** Task Types and Templates are now database-driven with full CRUD APIs
- **Navigation Restructure:** Main nav aligned to core business functions (Dashboard, Resources, Contacts, Deals, Tasks, Orders, Warehouse, Staff)

## Development Environment Setup

1. **Backend:** Activate virtual environment with `.\venv\Scripts\Activate.ps1`, then `py manage.py runserver`
2. **Frontend:** `cd frontend && npm run dev`
3. **Combined:** Use VS Code Task `start-dev` for parallel startup

## Custom Field System Implementation

### Backend Architecture
- **Models:** `CustomField` + `CustomFieldValue` using Django's ContentTypes framework
- **Generic Relations:** Fields can attach to any model (Contact, Account, etc.)
- **Type System:** Support for text, number, date, boolean field types
- **Storage:** Separate columns (`value_text`, `value_number`, `value_date`, `value_boolean`)

```python
# Example: Adding custom fields to a Contact
CustomField.objects.create(
    name="LinkedIn Profile", 
    field_type="text", 
    content_type=ContentType.objects.get_for_model(Contact)
)
```

### Frontend Integration
- **Serializers:** `ContactWithCustomFieldsSerializer` includes custom field values
- **API Endpoints:** `/api/custom-fields/` and `/api/custom-field-values/`
- **Dynamic Forms:** Custom field inputs rendered based on field type

## API Endpoint Patterns

### REST Convention
```
GET    /api/{resource}/          # List with pagination, filtering
POST   /api/{resource}/          # Create new record
GET    /api/{resource}/{id}/     # Retrieve specific record
PUT    /api/{resource}/{id}/     # Update entire record
PATCH  /api/{resource}/{id}/     # Partial update
DELETE /api/{resource}/{id}/     # Delete record
```

### Role-Based Data Access
```python
def get_queryset(self):
    user = self.request.user
    if user.groups.filter(name='Sales Manager').exists():
        return Account.objects.all()  # Managers see all
    else:
        return Account.objects.filter(owner=user)  # Reps see only theirs
```

### Activity Logging Pattern
```python
def perform_create(self, serializer):
    serializer.save(owner=self.request.user)
    ActivityLog.objects.create(
        user=self.request.user,
        action='create',
        content_object=serializer.instance,
        description=f'Created {serializer.instance}'
    )
```

## Phase 1 & Phase 2 API Endpoints

### Financial Reporting (Phase 1)
```
GET    /api/reports/balance-sheet/     # Balance sheet report
GET    /api/reports/pnl/               # Profit & Loss report  
GET    /api/reports/cash-flow/         # Cash flow report
GET    /api/tax-report/                # Tax reporting data
```

### Expense & Budget Management (Phase 1)
```
GET    /api/expenses/                   # List expenses
POST   /api/expenses/                   # Create expense
GET    /api/budgets/                    # List budgets
POST   /api/budgets/                    # Create budget
```

### Work Order & Invoicing (Phase 1)
```
GET    /api/work-orders/                # List work orders
POST   /api/work-orders/                # Create work order
POST   /api/workorders/{id}/generate-invoice/  # Generate invoice
GET    /api/invoices/overdue/           # Get overdue invoices
```

### Ledger Accounting (Phase 1)
```
GET    /api/ledger-accounts/            # List ledger accounts
POST   /api/ledger-accounts/            # Create ledger account
GET    /api/journal-entries/            # List journal entries
POST   /api/journal-entries/            # Create journal entry
```

### Payment Processing (Phase 1)
```
GET    /api/payments/                   # List payments
POST   /api/payments/                   # Create payment
```

### Time Tracking (Phase 2)
```
GET    /api/time-entries/               # List time entries
POST   /api/time-entries/               # Create time entry
PUT    /api/time-entries/{id}/          # Update time entry
DELETE /api/time-entries/{id}/          # Delete time entry
```

### Warehouse Management (Phase 2)
```
GET    /api/warehouses/                 # List warehouses
POST   /api/warehouses/                 # Create warehouse
GET    /api/warehouse-items/            # List warehouse items
POST   /api/warehouse-items/            # Create warehouse item
```

### Email Communication (Phase 2)
```
POST   /api/invoices/{id}/send-email/   # Send invoice email
POST   /api/invoices/send-overdue-reminders/  # Send overdue reminders
```

### Analytics Dashboard (Phase 2)
```
GET    /api/analytics/dashboard/        # Cross-module analytics
```

### Workflow Automation (Phase 2)
- **Automatic WorkOrder Creation:** Django signals trigger on Deal status change to 'won'
- **Inventory Adjustments:** Automatic stock updates on WorkOrder completion
- **Email Notifications:** Automated customer communications for invoices and reminders

## Frontend Component Organization

### Structure
```
frontend/src/
├── components/         # UI components
│   ├── charts/         # Reusable chart components
│   ├── Accounting.jsx          # Accounting overview page
│   ├── BudgetForm.jsx          # Budget management forms
│   ├── BudgetList.jsx          # Budget listing and management
│   ├── ContactDetail.jsx       # Contact detail view
│   ├── ContactForm.jsx         # Contact creation/editing
│   ├── ContactList.jsx         # Contact listing
│   ├── Contacts.jsx            # Main contacts page
│   ├── CustomFieldsSettings.jsx # Custom field configuration
│   ├── DashboardPage.jsx       # Enhanced analytics dashboard
│   ├── DealDetail.jsx          # Deal detail view
│   ├── Deals.jsx               # Deal listing and management
│   ├── EmailCommunication.jsx  # Automated email communications
│   ├── ExpenseForm.jsx         # Expense management forms
│   ├── ExpenseList.jsx         # Expense listing
│   ├── HomePage.jsx            # Landing page
│   ├── Invoicing.jsx           # Invoice management
│   ├── JournalEntryForm.jsx    # Journal entry forms
│   ├── JournalEntryList.jsx    # Journal entry listing
│   ├── KnowledgeBase.jsx       # Knowledge base viewer
│   ├── LedgerAccountForm.jsx   # Ledger account forms
│   ├── LedgerAccountList.jsx   # Ledger account listing
│   ├── LineItemForm.jsx        # Line item forms
│   ├── LineItemList.jsx        # Line item listing
│   ├── Login.jsx               # Authentication
│   ├── LoginPage.jsx           # Login page wrapper
│   ├── MarkdownViewer.jsx      # Markdown content viewer
│   ├── Orders.jsx              # Order management
│   ├── PaymentForm.jsx         # Payment forms
│   ├── PaymentList.jsx         # Payment listing
│   ├── PostDetail.jsx          # Blog post detail
│   ├── PostList.jsx            # Blog post listing
│   ├── ProtectedRoute.jsx      # Route protection
│   ├── Reports.jsx             # Financial reports
│   ├── Resources.jsx           # Company resources
│   ├── SearchPage.jsx          # Global search
│   ├── SearchResults.jsx       # Search results display
│   ├── Staff.jsx               # Staff management
│   ├── TagManager.jsx          # Tag management
│   ├── TaskAdministration.jsx  # Task template management
│   ├── TaskCalendar.jsx        # Task calendar view
│   ├── TaskDashboard.jsx       # Task dashboard
│   ├── TaskForm.jsx            # Task creation/editing
│   ├── TaskTypeSettings.jsx    # Task type configuration
│   ├── TaxReport.jsx           # Tax reporting interface
│   ├── TimeTracking.jsx        # Time entry management (Phase 2)
│   ├── UserRoleManagement.jsx  # User role management
│   ├── Warehouse.jsx           # Inventory management (Phase 2)
│   ├── WorkOrderForm.jsx       # Work order forms
│   ├── WorkOrderList.jsx        # Work order listing
│   └── WorkOrders.jsx          # Work order management
│   └── *.css                   # Component-specific styles
├── contexts/          # React Context providers
│   └── AuthContext.jsx
├── hooks/             # Custom React hooks
│   └── useAuth.js
├── api.js             # Centralized API client
└── App.jsx            # Main router and layout
```

### Navigation Structure
- **Dashboard:** Enhanced analytics with cross-module metrics
- **Resources:** Company resources and knowledge base
- **Contacts:** Contact management with custom fields
- **Deals:** Deal pipeline and management
- **Tasks:** Project management with time tracking
- **Orders:** Order and work order management
- **Warehouse:** Inventory management (Phase 2)
- **Staff:** User and role management
- **Accounting:** Financial management (Phase 1)

### Component Conventions  
- **Loading States:** All data-fetching components implement loading indicators
- **Error Handling:** Consistent error display patterns with user-friendly messages
- **Permission Checks:** Components check user roles/groups for feature access
- **Form Validation:** Client-side validation with server error integration
- **Responsive Design:** Mobile-friendly layouts with responsive grids

## Frontend Component Organization

### Structure
```
frontend/src/
├── components/         # UI components
│   ├── charts/         # Reusable chart components
│   ├── Accounting.jsx          # Accounting overview page
│   ├── BudgetForm.jsx          # Budget management forms
│   ├── BudgetList.jsx          # Budget listing and management
│   ├── ContactDetail.jsx       # Contact detail view
│   ├── ContactForm.jsx         # Contact creation/editing
│   ├── ContactList.jsx         # Contact listing
│   ├── Contacts.jsx            # Main contacts page
│   ├── CustomFieldsSettings.jsx # Custom field configuration
│   ├── DashboardPage.jsx       # Enhanced analytics dashboard
│   ├── DealDetail.jsx          # Deal detail view
│   ├── Deals.jsx               # Deal listing and management
│   ├── EmailCommunication.jsx  # Automated email communications
│   ├── ExpenseForm.jsx         # Expense management forms
│   ├── ExpenseList.jsx         # Expense listing
│   ├── HomePage.jsx            # Landing page
│   ├── Invoicing.jsx           # Invoice management
│   ├── JournalEntryForm.jsx    # Journal entry forms
│   ├── JournalEntryList.jsx    # Journal entry listing
│   ├── KnowledgeBase.jsx       # Knowledge base viewer
│   ├── LedgerAccountForm.jsx   # Ledger account forms
│   ├── LedgerAccountList.jsx   # Ledger account listing
│   ├── LineItemForm.jsx        # Line item forms
│   ├── LineItemList.jsx        # Line item listing
│   ├── Login.jsx               # Authentication
│   ├── LoginPage.jsx           # Login page wrapper
│   ├── MarkdownViewer.jsx      # Markdown content viewer
│   ├── Orders.jsx              # Order management
│   ├── PaymentForm.jsx         # Payment forms
│   ├── PaymentList.jsx         # Payment listing
│   ├── PostDetail.jsx          # Blog post detail
│   ├── PostList.jsx            # Blog post listing
│   ├── ProtectedRoute.jsx      # Route protection
│   ├── Reports.jsx             # Financial reports
│   ├── Resources.jsx           # Company resources
│   ├── SearchPage.jsx          # Global search
│   ├── SearchResults.jsx       # Search results display
│   ├── Staff.jsx               # Staff management
│   ├── TagManager.jsx          # Tag management
│   ├── TaskAdministration.jsx  # Task template management
│   ├── TaskCalendar.jsx        # Task calendar view
│   ├── TaskDashboard.jsx       # Task dashboard
│   ├── TaskForm.jsx            # Task creation/editing
│   ├── TaskTypeSettings.jsx    # Task type configuration
│   ├── TaxReport.jsx           # Tax reporting interface
│   ├── TimeTracking.jsx        # Time entry management (Phase 2)
│   ├── UserRoleManagement.jsx  # User role management
│   ├── Warehouse.jsx           # Inventory management (Phase 2)
│   ├── WorkOrderForm.jsx       # Work order forms
│   ├── WorkOrderList.jsx       # Work order listing
│   └── WorkOrders.jsx          # Work order management
│   └── *.css                   # Component-specific styles
├── contexts/          # React Context providers
│   └── AuthContext.jsx
├── hooks/             # Custom React hooks
│   └── useAuth.js
├── api.js             # Centralized API client
└── App.jsx            # Main router and layout
```

### Navigation Structure
- **Dashboard:** Enhanced analytics with cross-module metrics
- **Resources:** Company resources and knowledge base
- **Contacts:** Contact management with custom fields
- **Deals:** Deal pipeline and management
- **Tasks:** Project management with time tracking
- **Orders:** Order and work order management
- **Warehouse:** Inventory management (Phase 2)
- **Staff:** User and role management
- **Accounting:** Financial management (Phase 1)

### Component Conventions  
- **Loading States:** All data-fetching components implement loading indicators
- **Error Handling:** Consistent error display patterns with user-friendly messages
- **Permission Checks:** Components check user roles/groups for feature access
- **Form Validation:** Client-side validation with server error integration
- **Responsive Design:** Mobile-friendly layouts with responsive grids

## Database Model Relationships

### Core CRM Hierarchy
```python
CustomUser (owner field on all CRM entities)
├── Account (1:N with Contact, Deal)
│   ├── Contact (1:N with Interaction, Deal.primary_contact)
│   └── Deal (1:1 with Quote, 1:N with Invoice)
│       ├── Quote (1:N with QuoteItem)
│       └── Invoice (1:N with InvoiceItem)
│           └── Payment (M:N with Invoice)
└── Project (formerly Task - renamed 2025-09-28)
    ├── WorkOrder (1:N with Project)
    │   ├── WorkOrderInvoice (1:1 with WorkOrder)
    │   └── LineItem (1:N with WorkOrder)
    └── TimeEntry (1:N with Project)
```

### Accounting & Financial Models
```python
# Phase 1: Accounting Expansion
LedgerAccount (Chart of Accounts)
├── JournalEntry (Double-entry bookkeeping)
│   ├── debit_account (FK to LedgerAccount)
│   └── credit_account (FK to LedgerAccount)

Expense (Expense Management)
├── submitted_by (FK to CustomUser)
├── approved_by (FK to CustomUser)
└── category (CharField)

Budget (Budget Tracking)
├── category (CharField)
├── period_start (DateField)
└── period_end (DateField)

Payment (Payment Processing)
├── invoice (FK to Invoice/nullable)
├── work_order_invoice (FK to WorkOrderInvoice/nullable)
├── amount (DecimalField)
└── payment_method (CharField)
```

### Inventory & Operations Models
```python
# Phase 2: Workflow Automation
Warehouse (Inventory Management)
└── WarehouseItem (Stock Items)
    ├── name (CharField)
    ├── sku (CharField)
    ├── quantity (IntegerField)
    ├── minimum_stock (IntegerField)
    └── unit_cost (DecimalField)

TimeEntry (Time Tracking)
├── project (FK to Project)
├── user (FK to CustomUser)
├── date (DateField)
├── hours (DecimalField)
└── billable (BooleanField)
```

### Custom Fields Architecture
```python
CustomField (defines field schema)
├── content_type (links to any model via ContentTypes)
└── CustomFieldValue (stores actual values)
    ├── Generic FK to any model instance
    └── Type-specific value columns (value_text, value_number, etc.)
```

### Activity Logging
```python
ActivityLog (tracks all CRM actions)
├── Generic FK to any model instance
├── user (who performed the action)
└── action type (create, update, delete)
```

## Development Debugging Workflows

### Backend Debugging
- **Django Admin:** All CRM models registered - access at `/admin/`
- **API Testing:** Use `/api/` for browsable DRF interface
- **Database Inspection:** SQLite browser or Django shell (`py manage.py shell`)
- **Logging:** Activity logs stored in database via custom `DatabaseLogHandler`

### Frontend Debugging  
- **Network Tab:** Monitor API calls in browser DevTools
- **React DevTools:** Inspect component state and context
- **Console Errors:** Check for 401/403 auth issues, API response errors
- **Token Issues:** Check localStorage for `authToken`, verify in Network tab headers

### Common Issues & Solutions
- **"Invalid Credentials":** User may not exist - use `py manage.py createsuperuser`
- **403 Forbidden:** Check user groups (`Sales Rep` vs `Sales Manager`)
- **Custom Fields Not Showing:** Verify `ContentType` matches target model
- **Data Not Loading:** Check `seed_data` command was run after migrations

## Additional Instructions

file:./feature-map.instructions.md
file:./a11y.instructions.md
file:./ai-prompt-engineering-safety-best-practices.instructions.md
file:./containerization-docker-best-practices.instructions.md
file:./conventional-commit.prompt.md
file:./copilot-thought-logging.instructions.md
file:./devops-core-principles.instructions.md
file:./gilfoyle-code-review.instructions.md
file:./github-actions-ci-cd-best-practices.instructions.md
file:./kubernetes-deployment-best-practices.instructions.md
file:./localization.instructions.md
file:./markdown.instructions.md
file:./memory-bank.instructions.md
file:./object-calisthenics.instructions.md
file:./performance-optimization.instructions.md
file:./playwright-python.instructions.md
file:./playwright-typescript.instructions.md
file:./powershell-pester-5.instructions.md
file:./powershell.instructions.md
file:./python.instructions.md
file:./reactjs.instructions.md
file:./security-and-owasp.instructions.md
file:./self-explanatory-code-commenting.instructions.md
file:./spec-driven-workflow-v1.instructions.md
file:./taming-copilot.instructions.md
file:./task-implementation.instructions.md
file:./tasksync.instructions.md
file:./terraform-azure.instructions.md
file:./terraform.instructions.md
file:../spec/spec-design-accounting-expansion.md