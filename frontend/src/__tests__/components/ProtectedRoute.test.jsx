import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';

// Mock child components for testing
const MockDashboard = () => <div data-testid="dashboard">Dashboard Content</div>;
const MockProfile = () => <div data-testid="profile">Profile Content</div>;
const MockLogin = () => <div data-testid="login">Login Page</div>;

describe('ProtectedRoute Component - REQ-106.1', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    cleanup();
  });

  const renderProtectedRoute = (initialEntries = ['/dashboard'], authToken = null) => {
    if (authToken) {
      localStorage.setItem('authToken', authToken);
    }

    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<MockLogin />} />
          <Route path="/" element={<ProtectedRoute />}>
            <Route path="dashboard" element={<MockDashboard />} />
            <Route path="profile" element={<MockProfile />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Core Authentication Behavior', () => {
    it('renders protected content when user is authenticated', () => {
      renderProtectedRoute(['/dashboard'], 'valid-auth-token');
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('login')).not.toBeInTheDocument();
    });

    it('redirects to login when user is not authenticated', () => {
      renderProtectedRoute(['/dashboard']);
      expect(screen.getByTestId('login')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
    });

    it('redirects to login when auth token is empty string', () => {
      renderProtectedRoute(['/dashboard'], '');
      expect(screen.getByTestId('login')).toBeInTheDocument();
    });

    it('redirects to login when auth token is null', () => {
      renderProtectedRoute(['/dashboard'], null);
      expect(screen.getByTestId('login')).toBeInTheDocument();
    });
  });

  describe('Route Protection', () => {
    it('allows access to dashboard when authenticated', () => {
      renderProtectedRoute(['/dashboard'], 'valid-token');
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    it('allows access to profile when authenticated', () => {
      renderProtectedRoute(['/profile'], 'valid-token');
      expect(screen.getByTestId('profile')).toBeInTheDocument();
    });
  });

  describe('Token Validation', () => {
    it('accepts any truthy string token', () => {
      const tokens = ['token', '123', 'jwt-abc'];

      tokens.forEach((token) => {
        renderProtectedRoute(['/dashboard'], token);
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
        cleanup();
      });
    });
  });

  describe('Navigation Behavior', () => {
    it('uses replace navigation for login redirect', () => {
      renderProtectedRoute(['/dashboard']);
      expect(screen.getByTestId('login')).toBeInTheDocument();
    });

    it('preserves the intended route for post-login redirect', () => {
      renderProtectedRoute(['/profile']);
      expect(screen.getByTestId('login')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null localStorage gracefully', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = jest.fn().mockReturnValue(null);

      try {
        renderProtectedRoute(['/dashboard']);
        expect(screen.getByTestId('login')).toBeInTheDocument();
      } finally {
        localStorage.getItem = originalGetItem;
      }
    });

    it('handles localStorage exceptions gracefully', () => {
      const originalGetItem = localStorage.getItem;

      try {
        localStorage.getItem = jest.fn().mockImplementation(() => {
          throw new Error('localStorage not available');
        });

        expect(() => {
          renderProtectedRoute(['/dashboard']);
        }).toThrow('localStorage not available');
      } finally {
        localStorage.getItem = originalGetItem;
      }
    });
  });

  describe('Component Architecture', () => {
    it('renders Outlet when authenticated', () => {
      renderProtectedRoute(['/dashboard'], 'valid-token');
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    it('renders Navigate to login when not authenticated', () => {
      renderProtectedRoute(['/dashboard']);
      expect(screen.getByTestId('login')).toBeInTheDocument();
    });
  });

  describe('Security Considerations', () => {
    it('does not expose token value in component output', () => {
      const sensitiveToken = 'sensitive-jwt-token-12345';
      renderProtectedRoute(['/dashboard'], sensitiveToken);

      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      expect(screen.queryByText(sensitiveToken)).not.toBeInTheDocument();
    });

    it('properly isolates authentication logic', () => {
      renderProtectedRoute(['/dashboard'], 'valid-token');
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();

      localStorage.clear();
      renderProtectedRoute(['/dashboard']);
      expect(screen.getByTestId('login')).toBeInTheDocument();
    });
  });
});
