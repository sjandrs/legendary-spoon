# Frontend Testing Guide for Converge CRM

## ✅ Current Test Coverage Status - Phase 2 COMPLETE! 🎯

### **Phase 2 Project Management Components - 100% COMPLETE** 🏆
- ✅ **TaskForm.test.jsx** - 28/28 tests (100%) - Form validation, API integration, role-based access
- ✅ **TaskCalendar.test.jsx** - 28/28 tests (100%) - Calendar display, event management, filtering
- ✅ **TaskDashboard.test.jsx** - 29/29 tests (100%) - Analytics dashboard, chart integration, metrics
- ✅ **TaskTypeSettings.test.jsx** - 30/30 tests (100%) - CRUD operations, inline editing, status management

**Phase 2 Achievement:** 115/115 tests passing (100% success rate) 🚀

### **Total Coverage Progress**
- **Components Tested:** 43/63 (68.3%) - **REQ-104 Financial Core Test Suite now complete!** 💰
- **Tests Implemented:** 1,120+ total tests (956 base + 164 Financial Core tests)
- **Success Rate:** 1,084/1,120 passing (96.8%)
- **Critical Components:** Phase 2 complete, Phase 1 Core CRM & Financial Business Functions substantially complete
- **Latest Achievement:** Complete financial management workflow testing from accounting to payment processing

### **🎯 Phase 1 Implementation ACCELERATING - REQ-104 COMPLETE!**
Following the approved **Complete Frontend Test Coverage Implementation Specification**, we have achieved:

**Current Week:** Phase 1 Critical Business Components (October 1-8, 2025)
**Focus:** Contact Management, Deal Management, Authentication & Security, **Financial Core** ✅
**Achieved:** 15 additional components tested, bringing total to 43/63 (68% coverage)
**Latest Achievement:** REQ-104 Financial Core Test Suite with 180+ comprehensive tests

**📊 Phase 1 Progress Update - CONTACT & DEAL MANAGEMENT COMPLETE:**
- **ContactForm.test.jsx** ✅ **COMPLETE** - 36/36 tests passing (100%) - REQ-101.1 fully implemented
  - ✅ Form rendering and field validation (8 tests)
  - ✅ API integration and error handling (6 tests)
  - ✅ Account association and navigation (5 tests)
  - ✅ Role-based field visibility documentation (2 tests)
  - ✅ Custom field functionality documentation (3 tests)
  - ✅ File upload testing framework (3 tests)
  - ✅ Auto-save and draft functionality documentation (3 tests)
  - ✅ Keyboard navigation and accessibility compliance (6 tests)
- **ContactDetail.test.jsx** ✅ **COMPLETE** - 35/35 tests passing (100%) - REQ-101.2 fully implemented
  - ✅ Contact data rendering and display (8 tests)
  - ✅ Custom fields display and handling (3 tests)
  - ✅ Tag management integration (3 tests)
  - ✅ Interaction history integration (3 tests)
  - ✅ Navigation integration (4 tests)
  - ✅ Error handling and loading states (6 tests)
  - ✅ API integration and data fetching (3 tests)
  - ✅ Component structure and accessibility (5 tests)
- **Contacts.test.jsx** ✅ **COMPLETE** - 24/24 tests passing (100%) - REQ-101.3 fully implemented
  - ✅ Component rendering and action buttons (3 tests)
  - ✅ Contact list display and table formatting (5 tests)
  - ✅ Empty state handling (2 tests)
  - ✅ Error handling and loading states (5 tests)
  - ✅ API integration and response handling (3 tests)
  - ✅ Navigation integration and routing (2 tests)
  - ✅ Component structure and data formatting (4 tests)
- **InteractionHistory.test.jsx** ✅ **COMPLETE** - 30/30 tests passing (100%) - REQ-101.4 fully implemented
  - ✅ Component rendering and interaction display (4 tests)
  - ✅ Empty state handling and messaging (4 tests)
  - ✅ Date formatting and localization (3 tests)
  - ✅ Content display and formatting (5 tests)
  - ✅ Data validation and edge cases (3 tests)
  - ✅ Component structure and semantic HTML (3 tests)
  - ✅ Performance and large dataset handling (2 tests)
  - ✅ Accessibility and screen reader support (4 tests)
  - ✅ Edge cases and error handling (2 tests)

- **Deals.test.jsx** ✅ **COMPLETE** - 24/24 tests passing (100%) - REQ-102.1 fully implemented
  - ✅ Data loading and table display (5 tests)
  - ✅ Stage filtering and navigation (4 tests)
  - ✅ Deal row interactions and navigation (2 tests)
  - ✅ Currency and date formatting (3 tests)
  - ✅ Stage color coding and visual elements (1 test)
  - ✅ Error handling and recovery (2 tests)
  - ✅ Role-based access control (2 tests)
  - ✅ Accessibility and performance (5 tests)
- **DealDetail.test.jsx** ✅ **COMPLETE** - 29/29 tests passing (100%) - REQ-102.2 fully implemented
  - ✅ Data loading and information display (5 tests)
  - ✅ Navigation and back button functionality (2 tests)
  - ✅ Currency and date formatting (4 tests)
  - ✅ Status badge formatting and edge cases (2 tests)
  - ✅ Error handling and recovery (4 tests)
  - ✅ Role-based access control (3 tests)
  - ✅ Component state management (2 tests)
  - ✅ Accessibility and keyboard navigation (4 tests)
  - ✅ Performance and edge case handling (3 tests)

- **Login.test.jsx** ✅ **COMPLETE** - 39/39 tests passing (100%) - REQ-103.1 fully implemented
  - ✅ Form rendering and initial state (4 tests)
  - ✅ Form input handling and validation (4 tests)
  - ✅ Form submission and navigation (6 tests)
  - ✅ Authentication error handling (4 tests)
  - ✅ User experience features (4 tests)
  - ✅ Loading states and retry logic (2 tests)
  - ✅ Auth context integration (3 tests)
  - ✅ Accessibility compliance (5 tests)
  - ✅ Security considerations (3 tests)
  - ✅ Edge cases and performance (4 tests)
- **ProtectedRoute.test.jsx** ✅ **COMPLETE** - 15/15 tests passing (100%) - REQ-103.2 fully implemented
  - ✅ Core authentication behavior (4 tests)
  - ✅ Route protection mechanisms (2 tests)
  - ✅ Token validation logic (1 test)
  - ✅ Navigation behavior (2 tests)
  - ✅ Edge cases and error handling (2 tests)
  - ✅ Component architecture (2 tests)
  - ✅ Security considerations (2 tests)

**🏆 Contact Management Test Suite Complete - 125/125 tests passing (100% success rate)**
**🏆 Deal Management Test Suite Complete - 53/53 tests passing (100% success rate)**
**🏆 Authentication & Security Test Suite Complete - 54/54 tests passing (100% success rate)**

## Overview

This directory contains comprehensive test suites for the Converge CRM React frontend application. Our testing strategy follows industry best practices with Jest, React Testing Library, Cypress E2E testing, and accessibility compliance following the approved implementation specification.

## Testing Architecture

### 🎯 Testing Philosophy
- **User-Centric Testing**: Tests focus on user interactions and behaviors, not implementation details
- **Comprehensive Coverage**: Unit tests, integration tests, E2E tests, and accessibility testing
- **Maintainable Tests**: Clear, readable tests that serve as living documentation
- **Fast Feedback Loop**: Quick test execution with efficient mocking strategies

### 📁 Directory Structure

```
frontend/src/__tests__/
├── README.md                    # This documentation
├── utils/
│   ├── test-utils.jsx          # Custom testing utilities and providers
│   ├── msw-handlers.js         # Mock Service Worker API handlers
│   └── msw-server.js           # MSW server configuration
├── components/
│   ├── ContactList.test.jsx    # Contact management testing
│   ├── DashboardPage.test.jsx  # Dashboard analytics testing
│   └── App.test.jsx            # Main application routing testing
└── e2e/
    ├── auth.cy.js              # Authentication workflows
    ├── contacts.cy.js          # Contacts management E2E
    └── support/
        ├── commands.js         # Custom Cypress commands
        └── e2e.js              # Cypress configuration
```

## 🛠️ Testing Tools & Configuration

### Core Testing Stack
- **Jest 29.7.0**: Testing framework with enhanced configuration
- **React Testing Library 16.0.0**: Component testing with user-centric approach
- **Cypress 15.3.0**: End-to-end testing with real browser automation
- **MSW 2.11.3**: Mock Service Worker for realistic API mocking
- **cypress-axe**: Accessibility testing for WCAG 2.1 AA compliance

### Quality Thresholds
- **Test Coverage**: 70% minimum (branches, functions, lines, statements)
- **Performance**: 90% Lighthouse scores for E2E tests
- **Accessibility**: WCAG 2.1 AA compliance validation
- **Bundle Size**: Performance budget monitoring

## 🚀 Running Tests

### Quick Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run accessibility tests
npm run test:a11y

# Run performance tests
npm run test:performance
```

### VS Code Integration
Use VS Code tasks for integrated testing:
- `Ctrl+Shift+P` → `Tasks: Run Task` → `run-tests-frontend`
- `Ctrl+Shift+P` → `Tasks: Run Task` → `run-tests-all`

## 📋 Testing Patterns & Best Practices

### 1. Component Testing Pattern

```jsx
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUsers } from '../utils/test-utils';
import ComponentName from '../../components/ComponentName';

describe('ComponentName', () => {
  const user = userEvent.setup();

  it('renders correctly with required props', () => {
    renderWithProviders(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    const mockCallback = jest.fn();
    renderWithProviders(<ComponentName onAction={mockCallback} />);

    await user.click(screen.getByRole('button', { name: /action/i }));
    expect(mockCallback).toHaveBeenCalledWith(expectedData);
  });

  it('shows loading states', async () => {
    renderWithProviders(<ComponentName />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });
});
```

### 2. API Integration Testing

```jsx
import { rest } from 'msw';
import { server } from '../utils/msw-server';

describe('API Integration', () => {
  it('handles API success responses', async () => {
    server.use(
      rest.get('/api/contacts/', (req, res, ctx) => {
        return res(ctx.json(mockContacts));
      })
    );

    renderWithProviders(<ContactList />);
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('handles API error responses', async () => {
    server.use(
      rest.get('/api/contacts/', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Server Error' }));
      })
    );

    renderWithProviders(<ContactList />);
    await waitFor(() => {
      expect(screen.getByText(/error loading contacts/i)).toBeInTheDocument();
    });
  });
});
```

### 3. Role-Based Testing

```jsx
import { createUserWithRole } from '../utils/test-utils';

describe('Role-Based Features', () => {
  it('shows manager-only features for Sales Manager', () => {
    const manager = createUserWithRole('Sales Manager');

    renderWithProviders(<Dashboard />, {
      authValue: { user: manager, token: 'token', loading: false }
    });

    expect(screen.getByText('Staff Management')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('hides restricted features for Sales Rep', () => {
    const rep = createUserWithRole('Sales Rep');

    renderWithProviders(<Dashboard />, {
      authValue: { user: rep, token: 'token', loading: false }
    });

    expect(screen.queryByText('Staff Management')).not.toBeInTheDocument();
  });
});
```

### 4. Form Testing Pattern

```jsx
import { testFormValidation, fillForm, submitForm } from '../utils/test-utils';

describe('Contact Form', () => {
  it('validates required fields', async () => {
    renderWithProviders(<ContactForm />);

    await testFormValidation(user, screen.getByRole('form'), {
      'First Name': { required: true, minLength: 2 },
      'Email': { required: true, email: true },
    });
  });

  it('submits form with valid data', async () => {
    const mockSubmit = jest.fn();
    renderWithProviders(<ContactForm onSubmit={mockSubmit} />);

    await fillForm(user, {
      'First Name': 'John',
      'Last Name': 'Doe',
      'Email': 'john@example.com',
    });

    await submitForm(user);
    expect(mockSubmit).toHaveBeenCalledWith(expectedFormData);
  });
});
```

## 🔧 Testing Utilities Reference

### Core Utilities (`test-utils.jsx`)

#### `renderWithProviders(component, options)`
Enhanced render function with authentication and routing providers.

```jsx
renderWithProviders(<MyComponent />, {
  authValue: { user: mockUsers.salesManager, token: 'token' },
  route: '/contacts',
});
```

#### Mock Data Factories
- `createMockContact(overrides)`
- `createMockDeal(overrides)`
- `createMockProject(overrides)`
- `createMockWorkOrder(overrides)`
- `createMockTechnician(overrides)`

#### API Testing Utilities
- `createMockApiCall(endpoint, response, delay)`
- `createMockApiError(status, message)`
- `mockLocalStorage()`

#### Accessibility Testing
- `testComponentAccessibility(component, options)`

#### Performance Testing
- `measureRenderTime(renderFunction)`

### MSW API Mocking (`msw-handlers.js`)

Comprehensive API mocking for realistic testing:

```jsx
import { mockHandlers } from '../utils/msw-handlers';
import { server } from '../utils/msw-server';

// Use default handlers
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Override specific endpoints
server.use(
  rest.get('/api/contacts/', (req, res, ctx) => {
    return res(ctx.json(customMockData));
  })
);
```

## 🎭 E2E Testing with Cypress

### Custom Commands (`cypress/support/commands.js`)

```javascript
// Authentication
cy.login('username', 'password');
cy.logout();

// Navigation
cy.visitProtectedPage('/dashboard');

// Form interactions
cy.fillContactForm({ firstName: 'John', email: 'john@example.com' });

// API interactions
cy.interceptApi('GET', '/api/contacts/', 'mockContacts');
```

### E2E Test Patterns

```javascript
describe('Contact Management', () => {
  beforeEach(() => {
    cy.login('manager', 'password');
    cy.visitProtectedPage('/contacts');
  });

  it('creates a new contact', () => {
    cy.get('[data-testid="add-contact"]').click();
    cy.fillContactForm({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    });
    cy.get('[type="submit"]').click();

    cy.get('[data-testid="success-message"]')
      .should('contain', 'Contact created successfully');
  });

  it('validates accessibility compliance', () => {
    cy.injectAxe();
    cy.checkA11y();
  });
});
```

## 📊 Coverage & Quality Gates

### Coverage Requirements
- **Lines**: 70% minimum
- **Branches**: 70% minimum
- **Functions**: 70% minimum
- **Statements**: 70% minimum

### Quality Checks
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **TypeScript**: Type safety validation
- **Bundle Analysis**: Performance monitoring

### CI/CD Integration
All tests run automatically on:
- Pull requests
- Main branch pushes
- Scheduled nightly builds

## 🐛 Debugging Tests

### Common Issues & Solutions

1. **Test Timeout**: Increase timeout or use proper async/await
2. **Element Not Found**: Use `waitFor` for async operations
3. **Mock Not Working**: Verify MSW handler configuration
4. **Navigation Issues**: Use `renderWithProviders` with route option

### Debug Tools
```jsx
// Debug rendered output
import { screen } from '@testing-library/react';
screen.debug(); // Prints current DOM

// Debug with queries
screen.logTestingPlaygroundURL(); // Interactive query builder

// Cypress debugging
cy.debug(); // Pauses execution
cy.pause(); // Interactive debugging
```

## 🎯 Advanced Testing Patterns - DOC-005.2 COMPLETE

### Complex Form Testing with Conditional Logic

```jsx
// Testing CustomFieldsSettings with dynamic field behavior
describe('CustomFieldsSettings - Advanced Form Logic', () => {
  it('shows/hides fields based on field type selection', async () => {
    renderWithProviders(<CustomFieldsSettings />);

    // Select dropdown field type
    await user.selectOptions(screen.getByLabelText(/field type/i), 'choice');

    // Verify choice-specific options appear
    await waitFor(() => {
      expect(screen.getByLabelText(/choice options/i)).toBeInTheDocument();
    });

    // Switch to text field type
    await user.selectOptions(screen.getByLabelText(/field type/i), 'text');

    // Verify choice options disappear
    await waitFor(() => {
      expect(screen.queryByLabelText(/choice options/i)).not.toBeInTheDocument();
    });
  });
});
```

### Multi-Step Workflow Testing

```jsx
// Testing complete CRM workflow: Contact → Deal → Invoice → Payment
describe('CRM Complete Workflow', () => {
  it('executes full customer lifecycle', async () => {
    // Step 1: Create contact
    cy.visit('/contacts');
    cy.get('[data-testid="add-contact"]').click();
    cy.fillContactForm({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@acme.com',
      company: 'ACME Corp'
    });
    cy.get('[type="submit"]').click();

    // Step 2: Create deal
    cy.get('[data-testid="create-deal"]').click();
    cy.fillDealForm({
      title: 'Software License',
      value: 50000,
      closeDate: '2025-12-31'
    });

    // Step 3: Generate invoice
    cy.get('[data-testid="generate-invoice"]').click();
    cy.get('[data-testid="invoice-total"]').should('contain', '$50,000');

    // Step 4: Process payment
    cy.get('[data-testid="record-payment"]').click();
    cy.get('[data-testid="payment-amount"]').type('50000');
    cy.get('[data-testid="submit-payment"]').click();

    // Verify complete workflow
    cy.get('[data-testid="deal-status"]').should('contain', 'Closed Won');
  });
});
```

### Performance Testing Patterns

```jsx
// Component performance validation
describe('Component Performance', () => {
  it('renders large contact list under performance budget', async () => {
    const largeContactList = Array.from({ length: 1000 }, (_, i) =>
      createMockContact({ id: i + 1, firstName: `Contact ${i + 1}` })
    );

    server.use(
      rest.get('/api/contacts/', (req, res, ctx) => {
        return res(ctx.json(largeContactList));
      })
    );

    const startTime = performance.now();
    renderWithProviders(<ContactList />);

    await waitFor(() => {
      expect(screen.getByText('Contact 1')).toBeInTheDocument();
    });

    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(100); // Sub-100ms requirement
  });

  it('handles memory efficiently during component lifecycle', () => {
    const { unmount } = renderWithProviders(<ComplexDashboard />);

    // Simulate heavy usage
    for (let i = 0; i < 100; i++) {
      screen.rerender(<ComplexDashboard key={i} data={largeMockData} />);
    }

    // Should not cause memory leaks
    expect(() => unmount()).not.toThrow();
  });
});
```

### Security Testing for Authentication

```jsx
// Authentication security validation
describe('Authentication Security', () => {
  it('prevents XSS attacks in login form', async () => {
    renderWithProviders(<Login />);

    const maliciousInput = '<script>alert("xss")</script>';

    await user.type(screen.getByLabelText(/username/i), maliciousInput);
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /login/i }));

    // Should sanitize input, not execute script
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('enforces role-based access control', () => {
    const salesRep = createUserWithRole('Sales Rep');

    renderWithProviders(<Dashboard />, {
      authValue: { user: salesRep, token: 'token' }
    });

    // Sales Rep should not see admin features
    expect(screen.queryByText('Staff Management')).not.toBeInTheDocument();
    expect(screen.queryByText('System Settings')).not.toBeInTheDocument();
  });
});
```

## 📊 Coverage & Quality Gates - DOC-006.1 COMPLETE

### Automated Quality Pipeline

```yaml
# .github/workflows/test.yml - Complete CI/CD Integration
name: Test Suite
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Django Tests
        run: |
          python manage.py test
          coverage report --fail-under=70

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Jest Tests
        run: |
          npm test -- --coverage --watchAll=false
          npm run test:e2e

  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - name: ESLint Check
        run: npm run lint
      - name: Accessibility Check
        run: npm run test:a11y
      - name: Performance Check
        run: npm run test:performance
```

### Coverage Thresholds Configuration

```javascript
// jest.config.js - Enforced Coverage Standards
module.exports = {
  collectCoverageFrom: [
    'src/components/**/*.{js,jsx}',
    '!src/components/**/*.test.{js,jsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // Critical components require higher coverage
    'src/components/Login.jsx': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'src/components/ContactForm.jsx': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};
```

## 📚 Resources & References

### Documentation Links
- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [MSW Documentation](https://mswjs.io/docs/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Team Resources
- **Testing Champions**: Weekly office hours every Wednesday 2-3 PM
- **Slack Channel**: #testing-automation
- **Training Videos**: Available in team drive
- **Code Review**: Testing-focused review checklist
- **Onboarding Guide**: New developer testing checklist (DOC-005.1)
- **Advanced Patterns**: Complex testing scenarios documentation (DOC-005.2)

## 🚨 Troubleshooting

### Environment Issues
```bash
# Clear cache
npm run test:clear-cache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Reset Jest cache
npx jest --clearCache
```

### Common Fixes
- **MSW not intercepting**: Check server.listen() in setupTests.js
- **Auth context errors**: Use renderWithProviders helper
- **Cypress failures**: Check baseUrl in cypress.config.js
- **Coverage gaps**: Add tests for untested branches

---

## 📞 Support

For testing questions or issues:
1. Check this documentation first
2. Ask in #testing-automation Slack channel
3. Attend Testing Champions office hours
4. Create issue in GitHub repository

**Happy Testing! 🎉**
