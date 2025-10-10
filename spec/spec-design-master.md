---
title: Converge CRM Master Design Specification
version: 1.0
date_created: 2025-10-09
last_updated: 2025-10-09
owner: Converge Product Team
tags: [design, architecture, master, backend, frontend]
---

# Introduction

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

# Converge CRM - API Specification

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
