# Converge CRM - Master Specification

**PRIMARY DIRECTIVE**: This document serves as AI source code for the Converge CRM platform. Every code generation task MUST reference and implement these exact specifications.

## System Architecture & Requirements

### Architecture Definition
- **Backend Technology Stack**: Django 5.2.6 + Django REST Framework (Pure API server architecture)
- **Frontend Technology Stack**: React 19.1.1 + Vite 7.1.7 (Single Page Application consuming RESTful APIs)
- **Database Configuration**: SQLite (development environment) → PostgreSQL (production environment)
- **Authentication System**: Custom token-based authentication (not Django's default session-based)

### Mandatory Implementation Rules
**RULE 1**: User Story Alignment - All features MUST align with user stories documented in `static/kb/user-stories.md` (130+ comprehensive scenarios)
**RULE 2**: Role-Based Security - Implement strict role-based access control (Sales Rep, Sales Manager, Admin roles with hierarchical permissions)
**RULE 3**: RESTful Consistency - All API endpoints MUST follow consistent CRUD patterns with proper HTTP status codes
**RULE 4**: Activity Auditing - Every CRM operation MUST generate ActivityLog entries for compliance tracking
**RULE 5**: Responsive Accessibility - Frontend components MUST meet WCAG 2.1 AA standards with mobile-first responsive design

## Django Backend Specification

### Authentication System Implementation

#### CustomUser Model Requirements
**IMPLEMENTATION DIRECTIVE**: Extend Django's AbstractUser with the following specifications:
```python
class CustomUser(AbstractUser):
    # MANDATORY INHERITANCE: username, email, first_name, last_name, password
    # REQUIRED USER GROUPS: Sales Rep, Sales Manager, Admin
    # PERMISSION HIERARCHY: Sales Rep < Sales Manager < Admin
```

#### Token Authentication Workflow (MANDATORY SEQUENCE)
**STEP 1**: Client POSTs credentials to `/api/login/` endpoint
**STEP 2**: Backend validates using Django's `authenticate()` function
**STEP 3**: Generate token using `Token.objects.get_or_create(user=user)[0].key`
**STEP 4**: Frontend stores token in localStorage with key 'authToken'
**STEP 5**: All API requests MUST include header: `Authorization: Token <token_key>`
**STEP 6**: Logout via `/api/logout/` MUST delete token from database

### Core CRM Models

#### Account Model (Company-Level CRM Entity)
**MODEL PURPOSE**: Primary business relationship container for customer companies

**FIELD SPECIFICATIONS**:
```python
class Account(models.Model):
    name = CharField(max_length=255, null=False, blank=False)  # REQUIRED
    industry = CharField(max_length=100, blank=True)
    annual_revenue = DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    website = URLField(blank=True)
    phone = CharField(max_length=20, blank=True)
    address = TextField(blank=True)
    owner = ForeignKey(CustomUser, on_delete=models.CASCADE)  # REQUIRED
    created_at = DateTimeField(auto_now_add=True)  # AUTO-GENERATED
    updated_at = DateTimeField(auto_now=True)  # AUTO-UPDATED
```

**MANDATORY BUSINESS RULES**:
- **PERMISSION RULE**: Sales Rep users MUST see only self-owned accounts via `get_queryset()` filtering
- **PERMISSION RULE**: Sales Manager users MUST see all accounts without filtering
- **VALIDATION RULE**: Fields `name` and `owner` are REQUIRED and cannot be null/blank
- **DELETION RULE**: MUST implement cascade delete protection by checking related contacts/deals before deletion
- **ACTIVITY RULE**: All create/update/delete operations MUST generate ActivityLog entries

#### Contact Model (Individual Person Entity)
**MODEL PURPOSE**: Individual person records within Account context for relationship management

**FIELD SPECIFICATIONS**:
```python
class Contact(models.Model):
    account = ForeignKey(Account, on_delete=models.CASCADE, related_name='contacts')  # REQUIRED
    first_name = CharField(max_length=100)  # REQUIRED
    last_name = CharField(max_length=100)  # REQUIRED
    email = EmailField(unique=True)  # REQUIRED + UNIQUE CONSTRAINT
    phone = CharField(max_length=20, blank=True)
    title = CharField(max_length=100, blank=True)
    owner = ForeignKey(CustomUser, on_delete=models.CASCADE)  # REQUIRED
    created_at = DateTimeField(auto_now_add=True)  # AUTO-GENERATED
    updated_at = DateTimeField(auto_now=True)  # AUTO-UPDATED
```

**MANDATORY BUSINESS RULES**:
- **RELATIONSHIP RULE**: Contact MUST belong to an existing Account (foreign key constraint)
- **UNIQUENESS RULE**: Email field MUST be unique across entire system
- **INHERITANCE RULE**: Contact owner MUST default to Account owner during creation
- **DISPLAY RULE**: Contact representation MUST format as "first_name last_name (title)"
- **PERMISSION RULE**: Apply same role-based filtering as Account (Sales Rep sees only owned)

#### Deal Model (Sales Opportunity Pipeline)
**MODEL PURPOSE**: Sales opportunity tracking with structured pipeline management

**FIELD SPECIFICATIONS**:
```python
class Deal(models.Model):
    # MANDATORY STAGE CHOICES (DO NOT MODIFY)
    STAGE_CHOICES = [
        ('lead', 'Lead'),
        ('qualified', 'Qualified'),
        ('proposal', 'Proposal'),
        ('negotiation', 'Negotiation'),
        ('won', 'Won'),
        ('lost', 'Lost')
    ]

    name = CharField(max_length=255)  # REQUIRED
    account = ForeignKey(Account, on_delete=models.CASCADE, related_name='deals')  # REQUIRED
    primary_contact = ForeignKey(Contact, on_delete=models.SET_NULL, null=True, blank=True)
    value = DecimalField(max_digits=10, decimal_places=2)  # REQUIRED
    stage = CharField(max_length=20, choices=STAGE_CHOICES, default='lead')
    probability = IntegerField(default=0)  # RANGE: 0-100 percentage
    close_date = DateField()  # REQUIRED
    owner = ForeignKey(CustomUser, on_delete=models.CASCADE)  # REQUIRED
    created_at = DateTimeField(auto_now_add=True)  # AUTO-GENERATED
    updated_at = DateTimeField(auto_now=True)  # AUTO-UPDATED
```

**MANDATORY BUSINESS RULES**:
- **PIPELINE RULE**: Stage progression MUST follow sequence: lead → qualified → proposal → negotiation → won/lost
- **PROBABILITY RULE**: Auto-calculate probability: lead=10%, qualified=25%, proposal=50%, negotiation=75%, won=100%, lost=0%
- **AUTOMATION RULE**: When stage changes to 'won', MUST auto-create Project via Django signals
- **RELATIONSHIP RULE**: primary_contact MUST belong to the same Account as the Deal
- **PERMISSION RULE**: Apply role-based filtering consistent with Account model

#### Quote Model
Formal price quotations with line items:
```python
class Quote(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('converted', 'Converted to Deal')
    ]

    name = CharField(max_length=255)
    account = ForeignKey(Account, on_delete=models.CASCADE)
    contact = ForeignKey(Contact, on_delete=models.CASCADE)
    status = CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    valid_until = DateField()
    subtotal = DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_rate = DecimalField(max_digits=5, decimal_places=2, default=0)
    discount = DecimalField(max_digits=10, decimal_places=2, default=0)
    total = DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = TextField(blank=True)
    owner = ForeignKey(CustomUser, on_delete=models.CASCADE)
    created_at = DateTimeField(auto_now_add=True)

    # Business Rules:
    # - Contact must belong to the same Account
    # - Total = (subtotal - discount) + (subtotal * tax_rate)
    # - Can convert to Deal when status = 'accepted'
    # - One-click conversion creates Deal with quote total as value
```

#### QuoteItem Model
Individual line items within Quote:
```python
class QuoteItem(models.Model):
    quote = ForeignKey(Quote, on_delete=models.CASCADE, related_name='items')
    product_name = CharField(max_length=255)
    description = TextField(blank=True)
    quantity = IntegerField(default=1)
    unit_price = DecimalField(max_digits=10, decimal_places=2)
    discount_percent = DecimalField(max_digits=5, decimal_places=2, default=0)
    line_total = DecimalField(max_digits=10, decimal_places=2)

    # Business Rules:
    # - line_total = quantity * unit_price * (1 - discount_percent/100)
    # - Auto-calculate on save
    # - Update Quote.subtotal when items change
```

#### Interaction Model
Communication history tracking:
```python
class Interaction(models.Model):
    TYPE_CHOICES = [
        ('call', 'Phone Call'),
        ('email', 'Email'),
        ('meeting', 'Meeting'),
        ('note', 'Note')
    ]

    account = ForeignKey(Account, on_delete=models.CASCADE, related_name='interactions')
    contact = ForeignKey(Contact, on_delete=models.SET_NULL, null=True, blank=True)
    deal = ForeignKey(Deal, on_delete=models.SET_NULL, null=True, blank=True)
    interaction_type = CharField(max_length=20, choices=TYPE_CHOICES)
    subject = CharField(max_length=255)
    notes = TextField()
    date = DateTimeField()
    owner = ForeignKey(CustomUser, on_delete=models.CASCADE)
    created_at = DateTimeField(auto_now_add=True)

    # Business Rules:
    # - Must be associated with Account
    # - Contact and Deal are optional but provide context
    # - Chronological ordering by date (newest first)
    # - Searchable by subject and notes
```

### Project Management Models

#### Project Model (formerly Task)
Work execution containers created from won Deals:
```python
class Project(models.Model):
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ]

    name = CharField(max_length=255)
    description = TextField()
    deal = ForeignKey(Deal, on_delete=models.SET_NULL, null=True, blank=True)
    status = CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    start_date = DateField()
    end_date = DateField(null=True, blank=True)
    estimated_hours = DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    owner = ForeignKey(CustomUser, on_delete=models.CASCADE)
    created_at = DateTimeField(auto_now_add=True)

    # Business Rules:
    # - Auto-created when Deal.stage changes to 'won'
    # - Project.name = Deal.name by default
    # - Can have multiple TimeEntry records for tracking
    # - Can generate WorkOrder for execution
```

#### TimeEntry Model
Time tracking for projects and billing:
```python
class TimeEntry(models.Model):
    project = ForeignKey(Project, on_delete=models.CASCADE, related_name='time_entries')
    user = ForeignKey(CustomUser, on_delete=models.CASCADE)
    date = DateField()
    hours = DecimalField(max_digits=4, decimal_places=2)
    description = CharField(max_length=255)
    billable = BooleanField(default=True)
    hourly_rate = DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    created_at = DateTimeField(auto_now_add=True)

    # Business Rules:
    # - Hours must be > 0 and <= 24
    # - Date cannot be in future
    # - Billable entries contribute to project profitability
    # - Hourly rate defaults to user's standard rate
```

### Financial Management Models

#### WorkOrder Model
Execution documents for service delivery:
```python
class WorkOrder(models.Model):
    project = ForeignKey(Project, on_delete=models.CASCADE, related_name='work_orders')
    work_order_number = CharField(max_length=50, unique=True)
    description = TextField()
    status = CharField(max_length=20, choices=[
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ], default='draft')
    scheduled_date = DateTimeField(null=True, blank=True)
    technician = ForeignKey('Technician', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = DateTimeField(auto_now_add=True)

    # Business Rules:
    # - Auto-generate work_order_number (format: WO-YYYY-NNNN)
    # - Can auto-generate WorkOrderInvoice on completion
    # - Technician assignment based on skills and availability
```

#### Invoice Model
Standard invoicing for service billing:
```python
class Invoice(models.Model):
    invoice_number = CharField(max_length=50, unique=True)
    deal = ForeignKey(Deal, on_delete=models.CASCADE, related_name='invoices')
    amount = DecimalField(max_digits=10, decimal_places=2)
    due_date = DateField()
    paid = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)

    # Business Rules:
    # - Auto-generate invoice_number (format: INV-YYYY-NNNN)
    # - Amount calculated from related InvoiceItem records
    # - Overdue when due_date < today and paid = False
```

### RESTful API Endpoint Specifications

**API IMPLEMENTATION DIRECTIVE**: ALL endpoints MUST follow Django REST Framework ModelViewSet patterns with consistent response formats

#### Authentication Endpoints (MANDATORY IMPLEMENTATION)
```
POST   /api/login/          # FUNCTION: User authentication with credentials
                            # REQUEST: {"username": "string", "password": "string"}
                            # RESPONSE: {"token": "string", "user": UserSerializer}

POST   /api/logout/         # FUNCTION: Token invalidation and session cleanup
                            # REQUEST: Authorization header required
                            # RESPONSE: {"detail": "Successfully logged out"}

GET    /api/user/           # FUNCTION: Current authenticated user details
                            # REQUEST: Authorization header required
                            # RESPONSE: UserSerializer data
```

#### CRM Core Endpoints (ROLE-BASED FILTERING MANDATORY)
```
# Account Management Endpoints
GET    /api/accounts/                    # FUNCTION: List accounts with role-based filtering
                                        # PERMISSION: Sales Rep = owned only, Sales Manager = all
                                        # FEATURES: Search, pagination, industry filtering

POST   /api/accounts/                    # FUNCTION: Create new account
                                        # VALIDATION: Name required, owner auto-assigned
                                        # ACTIVITY: Auto-generate ActivityLog entry

GET    /api/accounts/{id}/               # FUNCTION: Retrieve specific account details
                                        # PERMISSION: Owner or Sales Manager only
                                        # RESPONSE: Include contacts_count, deals_count

PUT    /api/accounts/{id}/               # FUNCTION: Update account information
                                        # PERMISSION: Owner or Sales Manager only
                                        # ACTIVITY: Auto-generate ActivityLog entry

DELETE /api/accounts/{id}/               # FUNCTION: Delete account with protection
                                        # VALIDATION: Check for related contacts/deals
                                        # PERMISSION: Owner or Sales Manager only

# Contact Management Endpoints
GET    /api/contacts/                    # FUNCTION: List contacts with role-based filtering
                                        # PERMISSION: Based on Account ownership
                                        # FEATURES: Search by name/email, account filtering

POST   /api/contacts/                    # FUNCTION: Create new contact
                                        # VALIDATION: Email uniqueness, Account association
                                        # DEFAULT: Inherit owner from Account

GET    /api/contacts/{id}/               # FUNCTION: Retrieve contact details
                                        # PERMISSION: Account owner or Sales Manager
                                        # RESPONSE: Include related interactions

PUT    /api/contacts/{id}/               # FUNCTION: Update contact information
                                        # VALIDATION: Email uniqueness across system
                                        # PERMISSION: Account owner or Sales Manager

DELETE /api/contacts/{id}/               # FUNCTION: Delete contact
                                        # VALIDATION: Check for Deal associations
                                        # PERMISSION: Account owner or Sales Manager

# Deal Pipeline Endpoints
GET    /api/deals/                       # FUNCTION: List deals with pipeline filtering
                                        # PERMISSION: Role-based deal visibility
                                        # FEATURES: Stage filtering, value sorting, date range

POST   /api/deals/                       # FUNCTION: Create new deal
                                        # VALIDATION: Account association, probability calculation
                                        # DEFAULT: Stage='lead', probability based on stage

GET    /api/deals/{id}/                  # FUNCTION: Retrieve deal details
                                        # PERMISSION: Owner or Sales Manager
                                        # RESPONSE: Include related quote, project status

PUT    /api/deals/{id}/                  # FUNCTION: Update deal (CRITICAL: may trigger Project)
                                        # AUTOMATION: Create Project when stage='won'
                                        # VALIDATION: Stage progression rules

DELETE /api/deals/{id}/                  # FUNCTION: Delete deal
                                        # VALIDATION: Check for related records
                                        # PERMISSION: Owner or Sales Manager only
```

#### Role-Based Permission Implementation (MANDATORY PATTERN)
**IMPLEMENTATION DIRECTIVE**: ALL CRM ViewSets MUST implement this exact permission pattern

```python
class AccountViewSet(ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated]  # REQUIRED
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    def get_queryset(self):
        """MANDATORY: Implement role-based data filtering"""
        user = self.request.user
        if user.groups.filter(name='Sales Manager').exists():
            return Account.objects.all()  # Managers see everything
        else:
            return Account.objects.filter(owner=user)  # Reps see only owned

    def perform_create(self, serializer):
        """MANDATORY: Auto-assign owner and log activity"""
        instance = serializer.save(owner=self.request.user)
        ActivityLog.objects.create(
            user=self.request.user,
            action='create',
            content_object=instance,
            description=f'Created account: {instance.name}'
        )

    def perform_update(self, serializer):
        """MANDATORY: Log all update activities"""
        instance = serializer.save()
        ActivityLog.objects.create(
            user=self.request.user,
            action='update',
            content_object=instance,
            description=f'Updated account: {instance.name}'
        )
```

## React Frontend Specification

### React Component Architecture (MANDATORY PATTERNS)

#### Navigation Structure Implementation (EXACT ROUTING REQUIRED)
**DIRECTIVE**: All navigation MUST implement this exact structure with React Router v6

```
CRM ▼ (PRIMARY NAVIGATION)
├── Accounts        # ROUTES: /accounts, /accounts/:id, /accounts/new, /accounts/:id/edit
                   # COMPONENTS: AccountList, AccountDetail, AccountForm
├── Contacts        # ROUTES: /contacts, /contacts/:id, /contacts/new, /contacts/:id/edit
                   # COMPONENTS: ContactList, ContactDetail, ContactForm
├── Deals           # ROUTES: /deals, /deals/:id, /deals/new, /deals/:id/edit
                   # COMPONENTS: DealList, DealDetail, DealForm
├── Quotes          # ROUTES: /quotes, /quotes/:id, /quotes/new, /quotes/:id/edit
                   # COMPONENTS: QuoteList, QuoteDetail, QuoteForm
├── Interactions    # ROUTES: /interactions, /interactions/new
                   # COMPONENTS: InteractionList, InteractionForm
└── Activity Timeline # ROUTE: /activity-timeline
                     # COMPONENT: ActivityTimeline

Advanced ▼ (ANALYTICS NAVIGATION)
├── Deal Predictions     # ROUTE: /analytics/deal-predictions
├── Customer Lifetime Value # ROUTE: /analytics/customer-lifetime-value
└── Revenue Forecast     # ROUTE: /analytics/revenue-forecast

Projects & Tasks ▼ (PROJECT NAVIGATION)
├── Task Dashboard       # ROUTE: /tasks (COMPONENT: TaskDashboard)
├── Task Calendar       # ROUTE: /tasks/calendar (COMPONENT: TaskCalendar)
├── Time Tracking       # ROUTE: /time-tracking (COMPONENT: TimeTracking)
├── Project Templates   # ROUTE: /project-templates (COMPONENT: ProjectTemplates)
└── Manage Types        # ROUTE: /task-administration (COMPONENT: TaskTypeSettings)
```

#### Component Implementation Patterns (MANDATORY STANDARDS)

**List Components** (AccountList, ContactList, DealList, QuoteList):
**REQUIREMENT 1**: Search functionality with 300ms debounced input using `useEffect` and `setTimeout`
**REQUIREMENT 2**: Pagination displaying exactly 20 items per page with navigation controls
**REQUIREMENT 3**: Status/category filtering implemented as dropdown selects with API query parameters
**REQUIREMENT 4**: Bulk actions for power users with checkbox selection and confirmation modals
**REQUIREMENT 5**: Empty states with descriptive message and call-to-action button
**REQUIREMENT 6**: Loading skeletons during data fetch (NOT generic loading spinners)

**Detail Components** (AccountDetail, ContactDetail, DealDetail):
**REQUIREMENT 1**: Comprehensive entity information display using responsive grid layout
**REQUIREMENT 2**: Related entities with clickable navigation links (e.g., Account → Contacts, Deals)
**REQUIREMENT 3**: Edit/Delete actions with confirmation modals and permission checking
**REQUIREMENT 4**: Activity timeline integration showing chronological interaction history
**REQUIREMENT 5**: Responsive info grid that stacks on mobile devices

**Form Components** (AccountForm, ContactForm, DealForm, QuoteForm):
**REQUIREMENT 1**: Create/Edit mode detection via URL params using `useParams` hook
**REQUIREMENT 2**: Field validation with real-time feedback and error message display
**REQUIREMENT 3**: Required field indicators (*) with visual styling
**REQUIREMENT 4**: Save/Cancel actions with loading states and disabled buttons during submission
**REQUIREMENT 5**: Auto-save drafts for long forms using `localStorage` and periodic saves

#### API Integration Pattern (MANDATORY IMPLEMENTATION)
**DIRECTIVE**: ALL components MUST follow this exact API integration pattern

```jsx
// REQUIRED: Import centralized API client
import api from '../api';

const AccountList = () => {
  // MANDATORY STATE MANAGEMENT
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);      // REQUIRED: Loading state
  const [error, setError] = useState(null);          // REQUIRED: Error state
  const [searchQuery, setSearchQuery] = useState(''); // REQUIRED: Search state
  const [currentPage, setCurrentPage] = useState(1);  // REQUIRED: Pagination state

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);                              // REQUIRED: Set loading state
        const response = await api.getAccounts({       // REQUIRED: Use centralized API
          search: searchQuery,
          page: currentPage,
          page_size: 20
        });
        setAccounts(response.data.results);            // REQUIRED: Set results
      } catch (error) {
        setError('Failed to fetch accounts');          // REQUIRED: User-friendly error
        console.error('API Error:', error);            // REQUIRED: Developer logging

        // OPTIONAL: Toast notification for user feedback
        if (error.response?.status === 401) {
          // REQUIRED: Handle authentication errors
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);                            // REQUIRED: Clear loading state
      }
    };

    fetchAccounts();
  }, [searchQuery, currentPage]);                     // REQUIRED: Dependency array

  // REQUIRED: Implement loading/error/empty state rendering
  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  if (accounts.length === 0) return <EmptyState />;

  // Component rendering with data
};
```

### Business Logic Implementation

#### Quote-to-Deal Conversion Workflow
```jsx
const QuoteDetail = () => {
  const convertToDeal = async (quoteId) => {
    try {
      setConverting(true);
      const response = await api.convertQuoteToDeal(quoteId);
      navigate(`/deals/${response.data.deal_id}`);
      toast.success('Quote converted to deal successfully');
    } catch (error) {
      toast.error('Failed to convert quote');
    } finally {
      setConverting(false);
    }
  };
};
```

#### Activity Timeline Integration
```jsx
const ActivityTimeline = ({ accountId }) => {
  const [interactions, setInteractions] = useState([]);

  useEffect(() => {
    const fetchInteractions = async () => {
      const response = await api.getInteractions({ account: accountId });
      setInteractions(response.data.results.sort((a, b) =>
        new Date(b.date) - new Date(a.date)
      ));
    };

    fetchInteractions();
  }, [accountId]);

  return (
    <div className="timeline">
      {interactions.map(interaction => (
        <TimelineItem key={interaction.id} interaction={interaction} />
      ))}
    </div>
  );
};
```

## Implementation Workflow (MANDATORY PROCESS)

### Development Process (EXACT SEQUENCE REQUIRED)
**STEP 1**: Specification Changes - Edit this file (`spec/main.md`) with new requirements using structured format
**STEP 2**: Code Generation - Use GitHub Copilot `/compile` prompt referencing this specification as source
**STEP 3**: Testing Validation - Run existing test suites with minimum 70% coverage requirement
**STEP 4**: Deployment Execution - Use VS Code tasks for automated build and deployment pipeline

### Quality Standards (NON-NEGOTIABLE REQUIREMENTS)
**STANDARD 1**: All generated code MUST align with user stories documented in `static/kb/user-stories.md`
**STANDARD 2**: Role-based permissions MUST be enforced at Django API ViewSet level (never frontend-only)
**STANDARD 3**: Activity logging MUST be implemented for all CRM create/update/delete operations
**STANDARD 4**: Responsive design MUST meet WCAG 2.1 AA accessibility standards
**STANDARD 5**: Test coverage MUST achieve minimum 70% for all new functionality

### Business Rules Enforcement (CRITICAL IMPLEMENTATION REQUIREMENTS)
**RULE 1**: Sales Rep users MUST see only their owned records (enforced in `get_queryset()`)
**RULE 2**: Sales Manager users MUST see all records without filtering restrictions
**RULE 3**: Admin users MUST have unrestricted system access to all entities
**RULE 4**: ALL CRUD operations MUST generate ActivityLog entries with user attribution
**RULE 5**: Deal stage changes to 'won' MUST trigger automated Project creation via Django signals
**RULE 6**: Quote acceptance MUST enable one-click Deal conversion with value inheritance

### Code Generation Validation Checklist
- [ ] Django models follow exact field specifications with proper constraints
- [ ] API ViewSets implement role-based permission patterns
- [ ] React components follow mandatory component patterns
- [ ] Frontend implements proper error handling and loading states
- [ ] Activity logging is implemented for all CRM operations
- [ ] Test coverage meets 70% minimum requirement

---

**CRITICAL DIRECTIVE**: This specification serves as the AUTHORITATIVE source of truth for the Converge CRM platform. ALL code generation tasks MUST reference and implement these exact specifications without deviation.
