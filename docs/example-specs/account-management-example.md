# Example Specification: Account Management Feature

This is a complete example of how to specify a feature using the spec-driven development approach.

## Feature Overview

**Feature Name**: Account Management
**Epic**: CRM Core Functionality
**User Story**: "As a sales representative, I want to manage company accounts so that I can track business relationships and opportunities."

## Backend Specification

### Account Model
```python
class Account(models.Model):
    name = models.CharField(max_length=255)
    industry = models.CharField(max_length=100, blank=True)
    annual_revenue = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    website = models.URLField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    owner = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def contacts_count(self):
        return self.contacts.count()

    @property
    def deals_count(self):
        return self.deals.count()

    @property
    def total_deal_value(self):
        return self.deals.aggregate(
            total=models.Sum('value')
        )['total'] or 0
```

### API ViewSet
```python
class AccountViewSet(ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['industry', 'owner']
    search_fields = ['name', 'industry', 'website']
    ordering_fields = ['name', 'created_at', 'annual_revenue']
    ordering = ['name']

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name='Sales Manager').exists():
            return Account.objects.all()
        return Account.objects.filter(owner=user)

    def perform_create(self, serializer):
        instance = serializer.save(owner=self.request.user)
        ActivityLog.objects.create(
            user=self.request.user,
            action='create',
            content_object=instance,
            description=f'Created account: {instance.name}'
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        ActivityLog.objects.create(
            user=self.request.user,
            action='update',
            content_object=instance,
            description=f'Updated account: {instance.name}'
        )
```

### Serializer
```python
class AccountSerializer(ModelSerializer):
    contacts_count = serializers.ReadOnlyField()
    deals_count = serializers.ReadOnlyField()
    total_deal_value = serializers.ReadOnlyField()
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)

    class Meta:
        model = Account
        fields = [
            'id', 'name', 'industry', 'annual_revenue', 'website',
            'phone', 'address', 'owner', 'owner_name',
            'contacts_count', 'deals_count', 'total_deal_value',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['owner', 'created_at', 'updated_at']
```

## Frontend Specification

### AccountList Component
```jsx
// File: frontend/src/components/AccountList.jsx
const AccountList = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [industryFilter, setIndustryFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.getAccounts({
        search: searchQuery,
        page: currentPage,
        industry: industryFilter,
        page_size: 20
      });
      setAccounts(response.data.results);
      setTotalCount(response.data.count);
    } catch (error) {
      setError('Failed to fetch accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(fetchAccounts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, currentPage, industryFilter]);

  const handleDelete = async (accountId, accountName) => {
    if (!window.confirm(`Are you sure you want to delete "${accountName}"?`)) {
      return;
    }

    try {
      await api.deleteAccount(accountId);
      setAccounts(accounts.filter(account => account.id !== accountId));
      toast.success('Account deleted successfully');
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Account Management</h1>
        <Link to="/accounts/new" className="btn btn-primary">
          Add New Account
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input flex-1"
            data-testid="search-input"
          />
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="form-input w-48"
          >
            <option value="">All Industries</option>
            <option value="Technology">Technology</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Finance">Finance</option>
            <option value="Manufacturing">Manufacturing</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading && <LoadingSkeleton />}
      {error && <ErrorMessage message={error} onRetry={fetchAccounts} />}

      {!loading && accounts.length === 0 && (
        <EmptyState
          title="No accounts found"
          description="Create your first account to start tracking business relationships."
          action={
            <Link to="/accounts/new" className="btn btn-primary">
              Create First Account
            </Link>
          }
        />
      )}

      {!loading && accounts.length > 0 && (
        <>
          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {accounts.map(account => (
              <div key={account.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">
                    <Link
                      to={`/accounts/${account.id}`}
                      className="hover:text-primary"
                    >
                      {account.name}
                    </Link>
                  </h3>
                  <div className="flex gap-2">
                    <Link
                      to={`/accounts/${account.id}/edit`}
                      className="text-gray-400 hover:text-primary"
                    >
                      <EditIcon className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(account.id, account.name)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <DeleteIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {account.industry && (
                    <div>Industry: {account.industry}</div>
                  )}
                  {account.annual_revenue && (
                    <div>
                      Revenue: ${parseInt(account.annual_revenue).toLocaleString()}
                    </div>
                  )}
                  <div>Contacts: {account.contacts_count}</div>
                  <div>Deals: {account.deals_count}</div>
                  {account.total_deal_value > 0 && (
                    <div>
                      Deal Value: ${parseInt(account.total_deal_value).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                  Owner: {account.owner_name}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalCount / 20)}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};

export default AccountList;
```

### AccountForm Component
```jsx
// File: frontend/src/components/AccountForm.jsx
const AccountForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    annual_revenue: '',
    website: '',
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      const fetchAccount = async () => {
        try {
          const response = await api.getAccount(id);
          setFormData(response.data);
        } catch (error) {
          toast.error('Failed to load account');
          navigate('/accounts');
        } finally {
          setInitialLoading(false);
        }
      };

      fetchAccount();
    }
  }, [id, isEditing]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid website URL';
    }

    if (formData.annual_revenue && isNaN(parseFloat(formData.annual_revenue))) {
      newErrors.annual_revenue = 'Please enter a valid revenue amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        annual_revenue: formData.annual_revenue ? parseFloat(formData.annual_revenue) : null
      };

      if (isEditing) {
        await api.updateAccount(id, submitData);
        toast.success('Account updated successfully');
        navigate(`/accounts/${id}`);
      } else {
        const response = await api.createAccount(submitData);
        toast.success('Account created successfully');
        navigate(`/accounts/${response.data.id}`);
      }
    } catch (error) {
      toast.error('Failed to save account');
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  if (initialLoading) return <LoadingSkeleton />;

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? 'Edit Account' : 'Create New Account'}
      </h1>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            label="Account Name"
            name="name"
            value={formData.name}
            onChange={(value) => handleInputChange('name', value)}
            error={errors.name}
            required
          />

          <FormField
            label="Industry"
            name="industry"
            value={formData.industry}
            onChange={(value) => handleInputChange('industry', value)}
            error={errors.industry}
            type="select"
            options={[
              { value: '', label: 'Select Industry' },
              { value: 'Technology', label: 'Technology' },
              { value: 'Healthcare', label: 'Healthcare' },
              { value: 'Finance', label: 'Finance' },
              { value: 'Manufacturing', label: 'Manufacturing' },
              { value: 'Other', label: 'Other' }
            ]}
          />

          <FormField
            label="Annual Revenue"
            name="annual_revenue"
            value={formData.annual_revenue}
            onChange={(value) => handleInputChange('annual_revenue', value)}
            error={errors.annual_revenue}
            type="number"
            placeholder="Enter amount in USD"
          />

          <FormField
            label="Website"
            name="website"
            value={formData.website}
            onChange={(value) => handleInputChange('website', value)}
            error={errors.website}
            type="url"
            placeholder="https://example.com"
          />

          <FormField
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={(value) => handleInputChange('phone', value)}
            error={errors.phone}
            type="tel"
            placeholder="+1 (555) 123-4567"
          />

          <FormField
            label="Address"
            name="address"
            value={formData.address}
            onChange={(value) => handleInputChange('address', value)}
            error={errors.address}
            type="textarea"
            rows={3}
          />

          <div className="flex gap-4 pt-6 border-t">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Account' : 'Create Account')}
            </button>

            <button
              type="button"
              onClick={() => navigate('/accounts')}
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

export default AccountForm;
```

## Testing Specification

### Backend Tests
```python
# File: main/tests.py (Account tests section)
class AccountAPITestCase(APITestCase):
    def setUp(self):
        self.sales_rep = CustomUser.objects.create_user(
            username='salesrep',
            email='rep@example.com',
            password='testpass123'
        )
        self.sales_manager = CustomUser.objects.create_user(
            username='manager',
            email='manager@example.com',
            password='testpass123'
        )

        rep_group = Group.objects.create(name='Sales Rep')
        manager_group = Group.objects.create(name='Sales Manager')
        self.sales_rep.groups.add(rep_group)
        self.sales_manager.groups.add(manager_group)

        self.account_data = {
            'name': 'Test Account',
            'industry': 'Technology',
            'annual_revenue': '1000000.00',
            'website': 'https://testaccount.com'
        }

    def test_create_account_success(self):
        """Test successful account creation"""
        self.client.force_authenticate(user=self.sales_rep)
        response = self.client.post('/api/accounts/', self.account_data)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['name'], 'Test Account')
        self.assertEqual(response.data['owner'], self.sales_rep.id)

        # Verify activity log created
        self.assertTrue(
            ActivityLog.objects.filter(
                user=self.sales_rep,
                action='create'
            ).exists()
        )

    def test_account_list_filtering_by_role(self):
        """Test that sales reps only see their accounts"""
        # Create accounts for different users
        Account.objects.create(name='Rep Account', owner=self.sales_rep)
        Account.objects.create(name='Manager Account', owner=self.sales_manager)

        # Sales rep should only see their account
        self.client.force_authenticate(user=self.sales_rep)
        response = self.client.get('/api/accounts/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Rep Account')

    def test_manager_sees_all_accounts(self):
        """Test that sales managers see all accounts"""
        Account.objects.create(name='Rep Account', owner=self.sales_rep)
        Account.objects.create(name='Manager Account', owner=self.sales_manager)

        self.client.force_authenticate(user=self.sales_manager)
        response = self.client.get('/api/accounts/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 2)
```

### Frontend Tests
```jsx
// File: frontend/src/__tests__/components/AccountList.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AccountList from '../AccountList';
import * as api from '../../api';

jest.mock('../../api');
const mockedApi = api as jest.Mocked<typeof api>;

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AccountList Component', () => {
  beforeEach(() => {
    mockedApi.getAccounts.mockResolvedValue({
      data: {
        count: 1,
        results: [
          {
            id: 1,
            name: 'Test Account',
            industry: 'Technology',
            annual_revenue: '1000000.00',
            contacts_count: 5,
            deals_count: 2,
            total_deal_value: '50000.00',
            owner_name: 'John Doe'
          }
        ]
      }
    });
  });

  test('renders account list successfully', async () => {
    renderWithRouter(<AccountList />);

    expect(screen.getByText('Account Management')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Account')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('Contacts: 5')).toBeInTheDocument();
    });
  });

  test('handles search functionality', async () => {
    renderWithRouter(<AccountList />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Test' } });

    await waitFor(() => {
      expect(mockedApi.getAccounts).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Test' })
      );
    });
  });

  test('handles delete account', async () => {
    mockedApi.deleteAccount.mockResolvedValue({});
    window.confirm = jest.fn(() => true);

    renderWithRouter(<AccountList />);

    await waitFor(() => {
      const deleteButton = screen.getByLabelText('Delete Test Account');
      fireEvent.click(deleteButton);
    });

    expect(mockedApi.deleteAccount).toHaveBeenCalledWith(1);
  });
});
```

## Acceptance Criteria

### Functional Requirements
- ✅ Sales representatives can create, view, edit, and delete their own accounts
- ✅ Sales managers can view and manage all accounts in the system
- ✅ Account list supports search by name, industry, and website
- ✅ Account list supports filtering by industry
- ✅ Account list shows related entity counts (contacts, deals, deal value)
- ✅ Account form validates required fields and data formats
- ✅ Account deletion requires confirmation and checks for related records
- ✅ All CRUD operations are logged to activity feed

### Technical Requirements
- ✅ API follows RESTful conventions with proper HTTP status codes
- ✅ Frontend components follow established patterns (List → Detail → Form)
- ✅ Role-based permissions enforced at database query level
- ✅ Form validation on both client and server side
- ✅ Responsive design works on mobile and desktop
- ✅ Accessibility standards met (WCAG 2.1 AA)
- ✅ Loading states and error handling implemented
- ✅ Test coverage ≥70% for both backend and frontend

### Performance Requirements
- ✅ Account list loads in <2 seconds with 1000+ records
- ✅ Search results appear within 300ms of typing
- ✅ Form submission completes within 3 seconds
- ✅ Pagination loads 20 records per page for optimal performance

---

**This example demonstrates the complete spec-driven development approach from backend models to frontend components, including comprehensive testing and acceptance criteria.**
