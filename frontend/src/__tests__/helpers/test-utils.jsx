import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock auth context values
const mockAuthContext = {
  user: {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    groups: [{ name: 'Sales Manager' }],
  },
  token: 'mock-token',
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
};

// Custom render function with providers
export const renderWithProviders = (ui, options = {}) => {
  const {
    authValue = mockAuthContext,
    route = '/',
    ...renderOptions
  } = options;

  const Wrapper = ({ children }) => {
    // Set initial route if specified
    if (route !== '/') {
      window.history.pushState({}, 'Test page', route);
    }

    return (
      <BrowserRouter>
        <AuthProvider value={authValue}>
          {children}
        </AuthProvider>
      </BrowserRouter>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock authenticated user variations
export const mockUsers = {
  salesManager: {
    id: 1,
    username: 'manager',
    email: 'manager@example.com',
    groups: [{ name: 'Sales Manager' }],
  },
  salesRep: {
    id: 2,
    username: 'rep',
    email: 'rep@example.com',
    groups: [{ name: 'Sales Rep' }],
  },
  admin: {
    id: 3,
    username: 'admin',
    email: 'admin@example.com',
    groups: [{ name: 'Admin' }],
  },
};

// Common test data factories
export const createMockContact = (overrides = {}) => ({
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-0123',
  company: 'Test Company',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

export const createMockDeal = (overrides = {}) => ({
  id: 1,
  title: 'Test Deal',
  amount: 5000.00,
  stage: 'qualified',
  probability: 75,
  expected_close_date: '2025-12-31',
  contact: createMockContact(),
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

export const createMockAccount = (overrides = {}) => ({
  id: 1,
  name: 'Test Account',
  company_type: 'business',
  industry: 'Technology',
  annual_revenue: 1000000,
  owner: mockUsers.salesManager,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

export const createMockProject = (overrides = {}) => ({
  id: 1,
  title: 'Test Project',
  description: 'Test project description',
  status: 'active',
  priority: 'medium',
  due_date: '2025-12-31',
  assignee: mockUsers.salesRep,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

// API response mocks
export const mockApiResponse = (data, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
});

export const mockApiError = (message = 'API Error', status = 500) => ({
  response: {
    data: { message },
    status,
    statusText: 'Internal Server Error',
  },
  message,
});

// Form testing utilities
export const fillForm = async (user, fields) => {
  for (const [fieldName, value] of Object.entries(fields)) {
    const field = screen.getByLabelText(new RegExp(fieldName, 'i'));
    await user.clear(field);
    await user.type(field, value);
  }
};

export const submitForm = async (user, formName = 'form') => {
  const submitButton = screen.getByRole('button', { name: /submit|save|create|update/i });
  await user.click(submitButton);
};

// Wait utilities
export const waitForLoading = async () => {
  const loadingElement = screen.queryByText(/loading/i);
  if (loadingElement) {
    await waitForElementToBeRemoved(loadingElement);
  }
};

// Re-export testing library utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Additional imports for the fillForm and submitForm functions
import { screen, waitForElementToBeRemoved } from '@testing-library/react';

// Enhanced testing utilities for comprehensive coverage

// Role-based testing utilities
export const hasUserRole = (user, roleName) => {
  return user?.groups?.some(group => group.name === roleName) || false;
};

export const createUserWithRole = (roleName, overrides = {}) => {
  const baseUser = {
    id: Math.floor(Math.random() * 1000),
    username: `test_${roleName.toLowerCase().replace(' ', '_')}`,
    email: `${roleName.toLowerCase().replace(' ', '_')}@example.com`,
    first_name: 'Test',
    last_name: 'User',
    groups: [{ name: roleName }],
    ...overrides,
  };
  return baseUser;
};

// API testing utilities
export const createMockApiCall = (endpoint, response, delay = 0) => {
  return jest.fn().mockImplementation(() =>
    new Promise((resolve) =>
      setTimeout(() => resolve({ data: response }), delay)
    )
  );
};

export const createMockApiError = (status = 500, message = 'Server Error') => {
  return jest.fn().mockRejectedValue({
    response: {
      status,
      data: { message },
    },
  });
};

// Date testing utilities
export const mockDate = (isoString) => {
  const mockDate = new Date(isoString);
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
  return mockDate;
};

export const restoreDate = () => {
  global.Date.mockRestore?.();
};

// Local storage testing utilities
export const mockLocalStorage = () => {
  const store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Component accessibility testing
export const testComponentAccessibility = async (component, options = {}) => {
  const { container } = renderWithProviders(component, options);

  // Basic accessibility checks
  const buttons = container.querySelectorAll('button');
  buttons.forEach(button => {
    expect(button).toHaveAttribute('type');
  });

  const inputs = container.querySelectorAll('input');
  inputs.forEach(input => {
    if (input.type !== 'hidden') {
      const label = container.querySelector(`label[for="${input.id}"]`) ||
                   input.closest('label') ||
                   input.getAttribute('aria-label');
      expect(label).toBeTruthy();
    }
  });

  return container;
};

// Performance testing utilities
export const measureRenderTime = (renderFunction) => {
  const start = performance.now();
  const result = renderFunction();
  const end = performance.now();
  return {
    ...result,
    renderTime: end - start,
  };
};

// Error boundary testing component
export const TestErrorBoundary = ({ children, onError = jest.fn() }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (error) => {
      setHasError(true);
      onError(error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [onError]);

  if (hasError) {
    return <div data-testid="error-boundary">Something went wrong</div>;
  }

  return children;
};

// Extended mock data for comprehensive testing
export const createMockTimeEntry = (overrides = {}) => ({
  id: 1,
  project: 1,
  user: 1,
  date: '2024-01-01',
  hours: 8.5,
  description: 'Project setup and planning',
  billable: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockWorkOrder = (overrides = {}) => ({
  id: 1,
  title: 'Installation Service',
  project: 1,
  status: 'scheduled',
  scheduled_date: '2024-01-15T10:00:00Z',
  technician: 3,
  description: 'Complete system installation',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockTechnician = (overrides = {}) => ({
  id: 1,
  user: 3,
  employee_id: 'TECH001',
  phone: '555-0199',
  emergency_contact: 'Emergency Contact',
  emergency_phone: '555-0911',
  address: '123 Main St',
  city: 'Anytown',
  state: 'ST',
  zip_code: '12345',
  hire_date: '2024-01-01',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockInvoice = (overrides = {}) => ({
  id: 1,
  work_order: 1,
  total_amount: 1500.00,
  status: 'sent',
  due_date: '2024-02-01',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Utility for testing form validation
export const testFormValidation = async (user, formElement, validationRules) => {
  for (const [fieldName, rules] of Object.entries(validationRules)) {
    const field = screen.getByLabelText(new RegExp(fieldName, 'i'));

    // Test required field validation
    if (rules.required) {
      await user.clear(field);
      await user.tab(); // Trigger blur event
      expect(screen.getByText(new RegExp(`${fieldName}.*required`, 'i'))).toBeInTheDocument();
    }

    // Test minimum length validation
    if (rules.minLength) {
      await user.clear(field);
      await user.type(field, 'a'.repeat(rules.minLength - 1));
      await user.tab();
      expect(screen.getByText(new RegExp(`${fieldName}.*${rules.minLength}`, 'i'))).toBeInTheDocument();
    }

    // Test email validation
    if (rules.email) {
      await user.clear(field);
      await user.type(field, 'invalid-email');
      await user.tab();
      expect(screen.getByText(new RegExp(`${fieldName}.*email`, 'i'))).toBeInTheDocument();
    }
  }
};

// Utility for testing loading states
export const testLoadingStates = async (renderComponent, apiCall) => {
  // Mock API call with delay
  const mockApi = jest.fn().mockImplementation(() =>
    new Promise(resolve => setTimeout(() => resolve({ data: [] }), 100))
  );

  // Replace the API call
  apiCall.mockImplementation(mockApi);

  // Render component
  renderComponent();

  // Should show loading state
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // Wait for loading to finish
  await waitForLoading();

  // Loading should be gone
  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
};
