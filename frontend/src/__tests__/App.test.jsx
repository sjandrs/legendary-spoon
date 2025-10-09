import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUsers } from './helpers/test-utils';
import App from '../App';

// Mock components to avoid complex rendering in routing tests
jest.mock('../components/DashboardPage', () => {
  return function MockDashboard() {
    return <div data-testid="mock-dashboard">Dashboard Page</div>;
  };
});

jest.mock('../components/Contacts', () => {
  return function MockContacts() {
    return <div data-testid="mock-contacts">Contacts Page</div>;
  };
});

jest.mock('../components/LoginPage', () => {
  return function MockLoginPage() {
    return <div data-testid="login-page">Login Page</div>;
  };
});

// Mock ProtectedRoute to always allow access for testing authentication flow
jest.mock('../components/ProtectedRoute', () => {
  const { Outlet } = require('react-router-dom');

  return function MockProtectedRoute() {
    return <Outlet />;
  };
});

describe('App Component', () => {
  beforeEach(() => {
    // Clear localStorage mock before each test
    window.localStorage.clear();
    jest.clearAllMocks();

    // Reset localStorage mock behavior
    window.localStorage.getItem.mockReset();
    window.localStorage.setItem.mockReset();
  });

  it('renders login page when user is not authenticated', () => {
    // Ensure localStorage.getItem returns null for authToken
    window.localStorage.getItem.mockReturnValue(null);

    renderWithProviders(<App />, {
      authValue: {
        user: null,
        token: null,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
      },
      initialEntries: ['/'], // Start at home page
    });

    // Should show home page for unauthenticated users
    expect(screen.getByText('Welcome to Converge')).toBeInTheDocument();
    expect(screen.getByText('Go to Business Management Software')).toBeInTheDocument();
  });

  it('shows loading state while authentication is loading', () => {
    renderWithProviders(<App />, {
      authValue: {
        user: null,
        token: null,
        loading: true,
        login: jest.fn(),
        logout: jest.fn(),
      },
    });

    // Should show loading indicator
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders navigation when user is authenticated', () => {
    // Mock localStorage to return token for authentication
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'authToken') return 'mock-token';
      return null;
    });

    renderWithProviders(<App />, {
      authValue: {
        user: mockUsers.salesManager,
        token: 'mock-token',
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
      },
      initialEntries: ['/dashboard'],
    });

    // Should show main navigation and dashboard
    expect(screen.getByTestId('mock-dashboard')).toBeInTheDocument();
    // Top-level nav buttons (many links now grouped under dropdowns)
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    // CRM items are inside a hover dropdown, so just assert the CRM trigger button exists
    expect(screen.getByTestId('nav-crm')).toBeInTheDocument();
  });

  it('navigates between pages when navigation links are clicked', async () => {
    const user = userEvent.setup();

    // Mock localStorage to return token
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'authToken') return 'mock-token';
      return null;
    });

    renderWithProviders(<App />, {
      authValue: {
        user: mockUsers.salesManager,
        token: 'mock-token',
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
      },
      initialEntries: ['/dashboard'],
    });

    // Should start on dashboard
    expect(screen.getByTestId('mock-dashboard')).toBeInTheDocument();

  // Open CRM dropdown then click on Contacts link now nested inside
    const crmButton = screen.getByTestId('nav-crm');
    // Prefer keyboard interaction to open dropdown (Enter handled by handleKeyDown)
    crmButton.focus();
    await user.keyboard('{Enter}');
  const contactsLink = await screen.findByText('Contacts');
  await user.click(contactsLink);

    // Should navigate to contacts page
    await waitFor(() => {
      expect(screen.getByTestId('mock-contacts')).toBeInTheDocument();
    });
  });

  it('displays logout button in navigation', () => {
    // Mock localStorage to return token
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'authToken') return 'mock-token';
      return null;
    });

    renderWithProviders(<App />, {
      authValue: {
        user: mockUsers.salesManager,
        token: 'mock-token',
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
      },
      initialEntries: ['/dashboard'],
    });

    // Should show logout button
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('handles logout functionality', async () => {
    const user = userEvent.setup();

    // Mock localStorage to return token
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'authToken') return 'mock-token';
      return null;
    });

    renderWithProviders(<App />, {
      authValue: {
        user: mockUsers.salesManager,
        token: 'mock-token',
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
      },
      initialEntries: ['/dashboard'],
    });

    // Find and click logout button
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);

    // Should remove the authToken from localStorage
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('authToken');
  });

  it('shows Staff & Resources navigation for managers', async () => {
    // Mock localStorage to return token
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'authToken') return 'mock-token';
      return null;
    });

    renderWithProviders(<App />, {
      authValue: {
        user: mockUsers.salesManager,
        token: 'mock-token',
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
      },
      initialEntries: ['/dashboard'],
    });

    // Updated label is 'Staff & Resources'
    expect(screen.getByText('Staff & Resources')).toBeInTheDocument();
    expect(screen.getByText('Accounting')).toBeInTheDocument();
  });

  it('shows basic navigation for all users (CRM links behind dropdown)', async () => {
    // Mock localStorage to return token
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'authToken') return 'mock-token';
      return null;
    });

    renderWithProviders(<App />, {
      authValue: {
        user: mockUsers.salesRep,
        token: 'mock-token',
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
      },
      initialEntries: ['/dashboard'],
    });

    // All users should see basic navigation
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    // CRM dropdown trigger present
    expect(screen.getByTestId('nav-crm')).toBeInTheDocument();
  });

  it('renders protected content when authenticated', () => {
    // Mock localStorage to return token
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'authToken') return 'mock-token';
      return null;
    });

    renderWithProviders(<App />, {
      authValue: {
        user: mockUsers.salesManager,
        token: 'mock-token',
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
      },
      initialEntries: ['/dashboard'], // Access protected route with auth
    });

    // Should render protected content
    expect(screen.getByTestId('mock-dashboard')).toBeInTheDocument();
    // There are two nav elements (utility + main); ensure at least one present
    const navs = screen.getAllByRole('navigation');
    expect(navs.length).toBeGreaterThanOrEqual(1);
  });
});
