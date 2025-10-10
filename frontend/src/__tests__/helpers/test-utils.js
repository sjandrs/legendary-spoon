import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';

// Mock the AuthContext module before importing
jest.mock('../../contexts/AuthContext', () => {
  const React = require('react');
  const AuthContext = React.createContext();

  const AuthProvider = ({ children, testValue }) => {
    return React.createElement(AuthContext.Provider, { value: testValue }, children);
  };

  return {
    __esModule: true,
    default: AuthContext,
    AuthProvider,
  };
});

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock users for different roles
export const mockUsers = {
  salesManager: {
    id: 1,
    username: 'manager@example.com',
    email: 'manager@example.com',
    firstName: 'John',
    lastName: 'Manager',
    groups: [{ name: 'Sales Manager' }],
    is_staff: true,
    is_superuser: false
  },
  salesRep: {
    id: 2,
    username: 'rep@example.com',
    email: 'rep@example.com',
    firstName: 'Jane',
    lastName: 'Rep',
    groups: [{ name: 'Sales Rep' }],
    is_staff: false,
    is_superuser: false
  },
  superuser: {
    id: 3,
    username: 'admin@example.com',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    groups: [{ name: 'Sales Manager' }],
    is_staff: true,
    is_superuser: true
  }
};

// Mock contact data factory
export const createMockContact = (overrides = {}) => ({
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '555-1234',
  company: 'Example Corp',
  title: 'Manager',
  notes: 'Test contact',
  owner: mockUsers.salesRep.id,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  customFieldValues: [],
  ...overrides
});

// Mock deal data factory
export const createMockDeal = (overrides = {}) => ({
  id: 1,
  name: 'Test Deal',
  value: 10000,
  stage: 'negotiation',
  expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  probability: 75,
  contact: createMockContact(),
  account: createMockAccount(),
  owner: mockUsers.salesRep.id,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

// Mock account data factory
export const createMockAccount = (overrides = {}) => ({
  id: 1,
  name: 'Example Corp',
  type: 'customer',
  industry: 'Technology',
  website: 'https://example.com',
  phone: '555-9999',
  owner: mockUsers.salesRep.id,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

// Mock project data factory
export const createMockProject = (overrides = {}) => ({
  id: 1,
  name: 'Test Project',
  description: 'Test project description',
  status: 'active',
  priority: 'medium',
  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  assignedTo: mockUsers.salesRep.id,
  createdBy: mockUsers.salesManager.id,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

// Mock custom field data factory
export const createMockCustomField = (overrides = {}) => ({
  id: 1,
  name: 'Test Field',
  fieldType: 'text',
  required: false,
  options: [],
  contentType: 'contact',
  ...overrides
});

// Default auth context value for testing
const defaultAuthValue = {
  user: mockUsers.salesRep,
  token: 'test-token',
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  checkAuth: jest.fn()
};

// Import the mocked AuthContext
const { AuthProvider: MockedAuthProvider } = require('../../contexts/AuthContext');

// Test provider wrapper component
const TestProviders = ({ children, authValue = defaultAuthValue, initialEntries = ['/'] }) => {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <MockedAuthProvider testValue={authValue}>
        {children}
      </MockedAuthProvider>
    </MemoryRouter>
  );
};

// Enhanced render function with providers
export const renderWithProviders = (
  ui,
  {
    authValue = defaultAuthValue,
    initialEntries = ['/'],
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => (
    <TestProviders authValue={authValue} initialEntries={initialEntries}>
      {children}
    </TestProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Accessibility testing helper
export const testComponentAccessibility = async (component) => {
  const { container } = renderWithProviders(component);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

// Form validation helper
export const expectFormValidation = (screen, fieldName, errorMessage) => {
  const field = screen.getByLabelText(new RegExp(fieldName, 'i'));
  const error = screen.getByText(new RegExp(errorMessage, 'i'));

  expect(field).toHaveAttribute('aria-invalid', 'true');
  expect(error).toBeInTheDocument();
  expect(field).toHaveAttribute('aria-describedby', expect.stringContaining(error.id || 'error'));
};

// Wait for loading states helper
export const waitForLoadingToFinish = async (screen) => {
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
};

// Mock API response helper
export const createApiResponse = (data, status = 200) => ({
  data,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: {},
  config: {}
});

// Role-based testing helper
export const renderWithRole = (component, role = 'salesRep') => {
  const authValue = {
    ...defaultAuthValue,
    user: mockUsers[role]
  };

  return renderWithProviders(component, { authValue });
};

// Error boundary test helper
export const TestErrorBoundary = ({ children, onError = jest.fn() }) => {
  try {
    return children;
  } catch (_err) {
    onError(_err);
    return <div role="alert">Something went wrong</div>;
  }
};

// Mock intersection observer
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.IntersectionObserver = mockIntersectionObserver;
};

// Performance testing helper
export const measureComponentPerformance = (renderFn) => {
  const startTime = performance.now();
  const result = renderFn();
  const endTime = performance.now();
  const renderTime = endTime - startTime;

  return {
    ...result,
    renderTime,
    expectRenderTime: (maxTime) => expect(renderTime).toBeLessThan(maxTime)
  };
};

// Default export for convenience
export default {
  renderWithProviders,
  mockUsers,
  createMockContact,
  createMockDeal,
  createMockAccount,
  createMockProject,
  createMockCustomField,
  testComponentAccessibility,
  expectFormValidation,
  waitForLoadingToFinish,
  renderWithRole,
  createApiResponse,
  measureComponentPerformance
};
