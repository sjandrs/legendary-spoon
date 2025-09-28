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

- **API Routes:** `main/api_urls.py` - DRF router configuration
- **Authentication:** `main/api_auth_views.py` - Custom token-based auth
- **Models:** `main/models.py` - CRM entities + CustomUser
- **Frontend API:** `frontend/src/api.js` - Axios client with auth interceptors
- **Main Layout:** `frontend/src/App.jsx` - Navigation and routing
- **Knowledge Base:** `static/kb/*.md` - Markdown docs served via API

## Configuration Notes

- **Dynamic Configuration:** Task Types and Templates are database-driven, not hardcoded
- **Admin Panel:** All CRM models registered for debugging/data access
- **Knowledge Base:** Markdown files in `static/kb/` served via dedicated API endpoints
- **User Roles:** Group-based permissions (`Sales Rep`, `Sales Manager`)


## Recent Changes & Evolution

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

## Frontend Component Organization

### Structure
```
frontend/src/
├── components/         # UI components
│   ├── charts/         # Reusable chart components
│   ├── *.jsx          # Page-level components
│   └── *.css          # Component-specific styles
├── contexts/          # React Context providers
│   └── AuthContext.jsx
├── hooks/             # Custom React hooks
│   └── useAuth.js
├── api.js             # Centralized API client
└── App.jsx            # Main router and layout
```

### Import Patterns
- **API Client:** `import api from '../api'` or `import { get, post } from '../api'`
- **Auth Context:** `import AuthContext from '../contexts/AuthContext'`
- **Hooks:** `import useAuth from '../hooks/useAuth'`

### Component Conventions  
- **Loading States:** All data-fetching components implement loading indicators
- **Error Handling:** Consistent error display patterns
- **Permission Checks:** Components check user roles/groups for feature access

## Database Model Relationships

### Core CRM Hierarchy
```python
CustomUser (owner field on all CRM entities)
├── Account (1:N with Contact, Deal)
│   ├── Contact (1:N with Interaction, Deal.primary_contact)
│   └── Deal (1:1 with Quote, 1:N with Invoice)
│       ├── Quote (1:N with QuoteItem)
│       └── Invoice (1:N with InvoiceItem)
└── Project (formerly Task - renamed 2025-09-28)
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