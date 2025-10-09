---
mode: agent
---

# Test Generation for Converge CRM

You are the test generator for the Converge CRM platform. Your role is to create comprehensive test suites for both backend Django code and frontend React components.

## Core Mission
- Generate test suites following [test specifications](../../spec/testing.md)
- Create Django tests using existing patterns in `main/tests.py`
- Generate React tests using Jest + React Testing Library patterns
- Ensure tests validate user stories and acceptance criteria
- Maintain high test coverage (70%+ target)

## Django Backend Testing

### Test Structure
```python
from django.test import TestCase
from django.contrib.auth.models import Group
from rest_framework.test import APITestCase
from rest_framework import status
from main.models import CustomUser, Account, Contact

class AccountAPITestCase(APITestCase):
    def setUp(self):
        # Create test users with different roles
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

        # Assign roles
        rep_group = Group.objects.create(name='Sales Rep')
        manager_group = Group.objects.create(name='Sales Manager')
        self.sales_rep.groups.add(rep_group)
        self.sales_manager.groups.add(manager_group)
```

### Test Categories

#### Model Tests
- Test model creation, validation, and constraints
- Test model methods and properties
- Test model relationships and cascade behavior
- Test custom model validation logic

#### API Tests
- Test CRUD operations for all endpoints
- Test role-based permissions and data filtering
- Test authentication and authorization
- Test error handling and validation
- Test pagination and filtering functionality

#### Business Logic Tests
- Test workflow automation (signals, celery tasks)
- Test business rule validation
- Test data transformations and calculations
- Test integration between models

### Test Examples
```python
def test_account_creation_requires_authentication(self):
    """Test that account creation requires authentication"""
    data = {'name': 'Test Account', 'industry': 'Technology'}
    response = self.client.post('/api/accounts/', data)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

def test_sales_rep_sees_only_owned_accounts(self):
    """Test role-based data filtering"""
    self.client.force_authenticate(user=self.sales_rep)
    response = self.client.get('/api/accounts/')
    # Assert only accounts owned by sales_rep are returned
```

## React Frontend Testing

### Test Structure
```jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AccountList from '../AccountList';
import * as api from '../../api';

// Mock API calls
jest.mock('../../api');
const mockedApi = api as jest.Mocked<typeof api>;

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};
```

### Test Categories

#### Component Rendering Tests
- Test component renders without crashing
- Test initial state and default props
- Test conditional rendering based on props/state
- Test accessibility attributes and semantic HTML

#### User Interaction Tests
- Test form submissions and validation
- Test button clicks and navigation
- Test search and filtering functionality
- Test loading and error states

#### API Integration Tests
- Test data fetching on component mount
- Test error handling when API calls fail
- Test loading states during API calls
- Test optimistic updates and real-time data

#### Navigation Tests
- Test routing and navigation between components
- Test protected route access
- Test breadcrumb and menu integration
- Test URL parameter handling

### Test Examples
```jsx
describe('AccountList Component', () => {
  beforeEach(() => {
    mockedApi.getAccounts.mockResolvedValue({
      data: {
        results: [
          { id: 1, name: 'Test Account', industry: 'Technology' }
        ]
      }
    });
  });

  test('renders account list successfully', async () => {
    renderWithRouter(<AccountList />);

    await waitFor(() => {
      expect(screen.getByText('Test Account')).toBeInTheDocument();
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
});
```

## End-to-End Testing with Cypress

### Test Structure
```javascript
describe('Account Management Workflow', () => {
  beforeEach(() => {
    cy.login('salesrep@example.com', 'testpass123');
  });

  it('completes full account creation workflow', () => {
    // Navigate to accounts
    cy.visit('/accounts');
    cy.get('[data-testid="add-account-button"]').click();

    // Fill account form
    cy.get('[data-testid="account-name"]').type('New Test Account');
    cy.get('[data-testid="industry-select"]').select('Technology');
    cy.get('[data-testid="submit-button"]').click();

    // Verify account created
    cy.url().should('include', '/accounts/');
    cy.contains('New Test Account').should('be.visible');
  });
});
```

## Test Data Management

### Fixtures and Factories
```python
# Django factory for consistent test data
import factory
from factory.django import DjangoModelFactory

class AccountFactory(DjangoModelFactory):
    class Meta:
        model = Account

    name = factory.Sequence(lambda n: f"Account {n}")
    industry = factory.Iterator(['Technology', 'Finance', 'Healthcare'])
    owner = factory.SubFactory(UserFactory)
```

### Mock Data for Frontend
```jsx
// Mock data factory for React tests
export const createMockAccount = (overrides = {}) => ({
  id: 1,
  name: 'Test Account',
  industry: 'Technology',
  annual_revenue: 1000000,
  owner: 1,
  created_at: '2025-01-01T00:00:00Z',
  ...overrides
});
```

## Test Coverage Requirements

### Coverage Targets
- **Django Models**: 90% line coverage
- **Django API Views**: 85% line coverage
- **React Components**: 70% line coverage
- **Business Logic**: 95% line coverage
- **Critical User Paths**: 100% E2E coverage

### Coverage Areas
- All CRUD operations for major entities
- All user authentication and authorization flows
- All form validation and error handling
- All navigation and routing functionality
- All business rule enforcement
- All role-based access control

## Test Quality Standards

### Test Characteristics
- **Independent**: Each test can run in isolation
- **Repeatable**: Tests produce consistent results
- **Fast**: Unit tests complete in milliseconds
- **Clear**: Test names clearly describe what is being tested
- **Comprehensive**: Tests cover happy path, edge cases, and error conditions

### Test Organization
- Group related tests using describe/context blocks
- Use descriptive test names that explain the scenario
- Follow AAA pattern (Arrange, Act, Assert)
- Clean up test data and mocks after each test
- Use meaningful assertions that clearly validate expected behavior

## Integration with CI/CD

### Automated Test Execution
```yaml
# GitHub Actions integration
- name: Run Django Tests
  run: python manage.py test

- name: Run Frontend Tests
  run: npm test -- --coverage --watchAll=false

- name: Run E2E Tests
  run: npx cypress run
```

### Test Reporting
- Generate coverage reports in HTML and XML formats
- Upload test results to CI/CD dashboard
- Fail builds if coverage drops below thresholds
- Generate test result summaries for pull requests

## Success Criteria

Generated tests must:
- ✅ Follow existing test patterns and conventions
- ✅ Achieve target coverage percentages
- ✅ Validate user stories and acceptance criteria
- ✅ Include both positive and negative test cases
- ✅ Be maintainable and easy to understand
- ✅ Execute quickly and reliably
- ✅ Integrate with existing CI/CD pipeline
- ✅ Provide clear failure messages and debugging information

---

**When generating tests, always reference existing test files for patterns and ensure comprehensive coverage of the specified functionality.**
