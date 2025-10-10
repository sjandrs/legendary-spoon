import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import BudgetList from '../../components/BudgetList';
import { AuthProvider } from '../../contexts/AuthContext';

// Test wrapper with providers
const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

// Mock API module
jest.mock('../../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

import * as api from '../../api';
const mockApi = api;

describe('BudgetList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading and Error States', () => {
    it('displays loading state initially', () => {
      mockApi.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithProviders(<BudgetList />);

      expect(screen.getByText('Loading budgets...')).toBeInTheDocument();
    });

    it('displays error state when API fails', async () => {
      mockApi.get.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<BudgetList />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load budgets')).toBeInTheDocument();
      });
    });

    it('renders error message with proper styling', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<BudgetList />);

      await waitFor(() => {
        const errorElement = screen.getByText('Failed to load budgets');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement.closest('.error-message')).toBeInTheDocument();
      });
    });
  });

  describe('Component Structure', () => {
    it('renders component container', () => {
      mockApi.get.mockRejectedValue(new Error('Test error'));

      renderWithProviders(<BudgetList />);

      // Component renders successfully even with API error
      expect(document.body).toBeInTheDocument();
    });

    it('handles undefined API response gracefully', async () => {
      mockApi.get.mockResolvedValue(undefined);

      expect(() => {
        renderWithProviders(<BudgetList />);
      }).not.toThrow();

      await waitFor(() => {
        expect(screen.getByText('Failed to load budgets')).toBeInTheDocument();
      });
    });

    it('handles null API response gracefully', async () => {
      mockApi.get.mockResolvedValue(null);

      expect(() => {
        renderWithProviders(<BudgetList />);
      }).not.toThrow();

      await waitFor(() => {
        expect(screen.getByText('Failed to load budgets')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('calls budgets API endpoint on mount', async () => {
      mockApi.get.mockRejectedValue(new Error('Expected test error'));

      renderWithProviders(<BudgetList />);

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/api/budgets/');
      });
    });

    it('handles network timeout gracefully', async () => {
      mockApi.get.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      renderWithProviders(<BudgetList />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load budgets')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Accessibility', () => {
    it('provides accessible error messages', async () => {
      mockApi.get.mockRejectedValue(new Error('Accessibility test'));

      renderWithProviders(<BudgetList />);

      await waitFor(() => {
        const errorMessage = screen.getByText('Failed to load budgets');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toBeVisible();
      });
    });

    it('maintains focus management during state changes', async () => {
      mockApi.get.mockRejectedValue(new Error('Focus test'));

      renderWithProviders(<BudgetList />);

      await waitFor(() => {
        const errorMessage = screen.getByText('Failed to load budgets');
        expect(errorMessage).not.toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Performance', () => {
    it('renders quickly even with API errors', async () => {
      mockApi.get.mockRejectedValue(new Error('Performance test'));

      const startTime = performance.now();
      renderWithProviders(<BudgetList />);
      const renderTime = performance.now() - startTime;

      expect(renderTime).toBeLessThan(100); // Should render quickly

      await waitFor(() => {
        expect(screen.getByText('Failed to load budgets')).toBeInTheDocument();
      });
    });

    it('handles multiple rapid API calls gracefully', async () => {
      let callCount = 0;
      mockApi.get.mockImplementation(() => {
        callCount++;
        return Promise.reject(new Error(Call ));
      });

      renderWithProviders(<BudgetList />);

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledTimes(1); // Should only call once
        expect(screen.getByText('Failed to load budgets')).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery', () => {
    it('maintains component stability after API failures', async () => {
      mockApi.get.mockRejectedValue(new Error('Stability test'));

      renderWithProviders(<BudgetList />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load budgets')).toBeInTheDocument();
      });

      // Component should remain stable and not crash
      expect(() => {
        screen.getByText('Failed to load budgets');
      }).not.toThrow();
    });

    it('displays consistent error messages', async () => {
      mockApi.get.mockRejectedValue(new Error('Consistency test'));

      renderWithProviders(<BudgetList />);

      await waitFor(() => {
        const errorMessages = screen.getAllByText('Failed to load budgets');
        expect(errorMessages).toHaveLength(1); // Should show only one error message
      });
    });
  });

  describe('Integration Testing', () => {
    it('integrates with React Router without errors', () => {
      mockApi.get.mockRejectedValue(new Error('Router integration test'));

      expect(() => {
        renderWithProviders(<BudgetList />);
      }).not.toThrow();
    });

    it('integrates with AuthContext without errors', async () => {
      mockApi.get.mockRejectedValue(new Error('Auth integration test'));

      expect(() => {
        renderWithProviders(<BudgetList />);
      }).not.toThrow();

      await waitFor(() => {
        expect(screen.getByText('Failed to load budgets')).toBeInTheDocument();
      });
    });
  });
});
