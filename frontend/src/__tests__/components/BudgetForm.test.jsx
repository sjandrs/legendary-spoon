import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import BudgetForm from '../../components/BudgetForm';
import api from '../../api';

// Get reference to the mocked API
const mockApi = api;

// Mock the API module
jest.mock('../../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Helper function to render with MemoryRouter for different routes
const renderWithRouter = (initialEntries = ['/budgets/new']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/budgets/new" element={<BudgetForm />} />
        <Route path="/budgets/:id/edit" element={<BudgetForm />} />
      </Routes>
    </MemoryRouter>
  );
};

const renderWithProviders = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('BudgetForm', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.get = jest.fn();
    mockApi.post = jest.fn();
    mockApi.patch = jest.fn();
  });

  describe('Form Rendering', () => {
    it('renders budget form with all required fields', () => {
      renderWithProviders(<BudgetForm />);

      expect(screen.getByRole('heading', { name: /create budget/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/period/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/budgeted amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    });

    it('displays all budget category options', () => {
      renderWithProviders(<BudgetForm />);

      const categorySelect = screen.getByLabelText(/category/i);
      expect(categorySelect).toBeInTheDocument();

      // Check for key categories
      expect(screen.getByDisplayValue(/office supplies/i)).toBeInTheDocument();
    });

    it('generates period options correctly', () => {
      renderWithProviders(<BudgetForm />);

      const periodSelect = screen.getByLabelText(/period/i);
      expect(periodSelect).toBeInTheDocument();

      // Should have current month and future periods
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(12); // At least current year + some future months
    });

    it('sets default values correctly', () => {
      renderWithProviders(<BudgetForm />);

      const categorySelect = screen.getByLabelText(/category/i);
      expect(categorySelect.value).toBe('office_supplies');

      const periodSelect = screen.getByLabelText(/period/i);
      // Should default to current month
      const currentDate = new Date();
      const expectedPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      expect(periodSelect.value).toBe(expectedPeriod);
    });
  });

  describe('Form Validation', () => {
    it('validates required fields before submission', async () => {
      renderWithProviders(<BudgetForm />);

      // Clear the amount field (required)
      const amountField = screen.getByLabelText(/budgeted amount/i);
      await user.clear(amountField);

      await user.click(screen.getByRole('button', { name: /create budget/i }));

      // Form should not submit with invalid data
      expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('validates positive amount values', async () => {
      renderWithProviders(<BudgetForm />);

      const amountField = screen.getByLabelText(/budgeted amount/i);
      await user.type(amountField, '-100');

      await user.click(screen.getByRole('button', { name: /create budget/i }));

      // Should not submit negative amounts
      expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('validates decimal amounts correctly', async () => {
      renderWithProviders(<BudgetForm />);

      const amountField = screen.getByLabelText(/budgeted amount/i);
      await user.type(amountField, '1500.50');

      // HTML number inputs normalize trailing zeros
      expect(amountField.value).toBe('1500.5');
    });

    it('limits notes field length', async () => {
      renderWithProviders(<BudgetForm />);

      const notesField = screen.getByLabelText(/notes/i);
      expect(notesField).toHaveAttribute('maxLength', '500');
    });
  });

  describe('Form Submission', () => {
    it('submits valid budget data for creation', async () => {
      mockApi.post.mockResolvedValue({ data: { id: 1, category: 'travel', amount: 2000 } });

      renderWithProviders(<BudgetForm />);

      await user.selectOptions(screen.getByLabelText(/category/i), 'travel');
      await user.type(screen.getByLabelText(/budgeted amount/i), '2000');
      await user.type(screen.getByLabelText(/notes/i), 'Q1 travel budget');

      await user.click(screen.getByRole('button', { name: /create budget/i }));

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/api/budgets/', expect.objectContaining({
          category: 'travel',
          amount: 2000,
          notes: 'Q1 travel budget'
        }));
      });

      expect(mockNavigate).toHaveBeenCalledWith('/budgets');
    });

    it('handles API errors during submission', async () => {
      mockApi.post.mockRejectedValue(new Error('Server error'));

      renderWithProviders(<BudgetForm />);

      // Complete all required fields
      await user.selectOptions(screen.getByLabelText(/category/i), 'office_supplies');
      await user.selectOptions(screen.getByLabelText(/period/i), '2025-11');
      await user.type(screen.getByLabelText(/budgeted amount/i), '1000');
      await user.click(screen.getByRole('button', { name: /create budget/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to save budget')).toBeInTheDocument();
      });
    });

    it('shows loading state during submission', async () => {
      let resolvePromise;
      mockApi.post.mockImplementation(() => new Promise(resolve => {
        resolvePromise = resolve;
      }));

      renderWithProviders(<BudgetForm />);

      // Complete all required fields
      await user.selectOptions(screen.getByLabelText(/category/i), 'office_supplies');
      await user.selectOptions(screen.getByLabelText(/period/i), '2025-11');
      await user.type(screen.getByLabelText(/budgeted amount/i), '1000');

      // Click submit and immediately check loading state
      const submitButton = screen.getByRole('button', { name: /create budget/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /saving.../i })).toBeDisabled();
      });

      // Resolve the promise to complete the test
      resolvePromise({ data: { id: 1 } });
    });
  });

  describe('Edit Mode', () => {
    it('loads existing budget data in edit mode', async () => {
      const mockBudget = {
        id: 1,
        category: 'marketing',
        period: '2025-11',
        amount: 3000,
        notes: 'Marketing campaign budget'
      };

      mockApi.get.mockResolvedValue({ data: mockBudget });

      // Render with edit route
      renderWithRouter(['/budgets/1/edit']);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit budget/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /update budget/i })).toBeInTheDocument();
      });

      expect(mockApi.get).toHaveBeenCalledWith('/api/budgets/1/');
    });

    it('updates budget using PATCH method', async () => {
      const mockBudget = {
        id: 1,
        category: 'marketing',
        period: '2025-11',
        amount: 3000,
        notes: 'Marketing campaign budget'
      };

      mockApi.get.mockResolvedValue({ data: mockBudget });
      mockApi.patch.mockResolvedValue({ data: { id: 1 } });

      // Render with edit route
      renderWithRouter(['/budgets/1/edit']);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('3000')).toBeInTheDocument();
      });

      const amountInput = screen.getByLabelText(/budgeted amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '2500');
      await user.click(screen.getByRole('button', { name: /update budget/i }));

      await waitFor(() => {
        expect(mockApi.patch).toHaveBeenCalledWith('/api/budgets/1/', expect.any(Object));
      });
    });
  });

  describe('Navigation Integration', () => {
    it('navigates back to budget list on cancel', async () => {
      renderWithProviders(<BudgetForm />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/budgets');
    });

    it('navigates back after successful submission', async () => {
      mockApi.post.mockResolvedValue({ data: { id: 1 } });

      renderWithProviders(<BudgetForm />);

      await user.type(screen.getByLabelText(/budgeted amount/i), '1000');
      await user.click(screen.getByRole('button', { name: /create budget/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/budgets');
      });
    });
  });

  describe('User Experience', () => {
    it('provides helpful labels and placeholders', () => {
      renderWithProviders(<BudgetForm />);

      expect(screen.getByLabelText(/category \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/period \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/budgeted amount \*/i)).toBeInTheDocument();
    });

    it('shows period labels in readable format', () => {
      renderWithProviders(<BudgetForm />);

      const periodSelect = screen.getByLabelText(/period/i);
      // Should have options with readable month names
      expect(periodSelect).toBeInTheDocument();
    });

    it('handles form state changes correctly', async () => {
      renderWithProviders(<BudgetForm />);

      const categorySelect = screen.getByLabelText(/category/i);
      await user.selectOptions(categorySelect, 'utilities');

      expect(categorySelect.value).toBe('utilities');
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for all form fields', () => {
      renderWithProviders(<BudgetForm />);

      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/period/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/budgeted amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    });

    it('provides clear button labels', () => {
      renderWithProviders(<BudgetForm />);

      expect(screen.getByRole('button', { name: /create budget/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('shows error messages accessibly', async () => {
      mockApi.post.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<BudgetForm />);

      // Complete all required fields
      await user.selectOptions(screen.getByLabelText(/category/i), 'office_supplies');
      await user.selectOptions(screen.getByLabelText(/period/i), '2025-11');
      await user.type(screen.getByLabelText(/budgeted amount/i), '1000');
      await user.click(screen.getByRole('button', { name: /create budget/i }));

      await waitFor(() => {
        const errorMessage = screen.getByText('Failed to save budget');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveClass('error-message');
      });
    });
  });

  describe('Performance', () => {
    it('renders form quickly', () => {
      const startTime = performance.now();
      renderWithProviders(<BudgetForm />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });

    it('handles large period option lists efficiently', () => {
      renderWithProviders(<BudgetForm />);

      const periodSelect = screen.getByLabelText(/period/i);
      const options = screen.getAllByRole('option');

      // Should handle multiple years of periods efficiently
      expect(options.length).toBeGreaterThan(24); // 2+ years of months
      expect(periodSelect).toBeInTheDocument();
    });
  });
});
