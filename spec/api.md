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
