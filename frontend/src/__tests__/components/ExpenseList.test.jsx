import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ExpenseList from '../../components/ExpenseList';
import { renderWithProviders } from '../helpers/test-utils';
import api from '../../api';

// Mock the API module
jest.mock('../../api');
const mockApi = api;

describe('ExpenseList', () => {
  const user = userEvent.setup();

  const mockExpenses = [
    {
      id: 1,
      date: '2025-10-01',
      category: 'office_supplies',
      description: 'Printer paper and pens',
      vendor: 'Office Depot',
      amount: 45.99,
      status: 'pending',
      approved: false
    },
    {
      id: 2,
      date: '2025-10-02',
      category: 'travel',
      description: 'Flight to client meeting',
      vendor: 'United Airlines',
      amount: 425.00,
      status: 'approved',
      approved: true
    },
    {
      id: 3,
      date: '2025-10-03',
      category: 'meals',
      description: 'Client lunch meeting',
      vendor: 'Fine Dining Restaurant',
      amount: 89.50,
      status: 'rejected',
      approved: false
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.get = jest.fn().mockResolvedValue({ data: mockExpenses });
    mockApi.patch = jest.fn().mockResolvedValue({ data: { success: true } });
  });

  describe('Component Rendering', () => {
    it('renders expense list with heading', async () => {
      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /expenses/i })).toBeInTheDocument();
        expect(screen.getByText('Printer paper and pens')).toBeInTheDocument();
      });
    });

    it('displays add expense button', async () => {
      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /add expense/i })).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      mockApi.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithProviders(<ExpenseList />);

      expect(screen.getByText(/loading expenses.../i)).toBeInTheDocument();
    });
  });

  describe('Expense Data Display', () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue({ data: mockExpenses });
    });

    it('displays expense information in table format', async () => {
      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText('Printer paper and pens')).toBeInTheDocument();
        expect(screen.getByText('Flight to client meeting')).toBeInTheDocument();
        expect(screen.getByText('Client lunch meeting')).toBeInTheDocument();
      });
    });

    it('formats currency amounts correctly', async () => {
      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText('$45.99')).toBeInTheDocument();
        expect(screen.getByText('$425.00')).toBeInTheDocument();
        expect(screen.getByText('$89.50')).toBeInTheDocument();
      });
    });

    it('displays expense dates correctly', async () => {
      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText('2025-10-01')).toBeInTheDocument();
        expect(screen.getByText('2025-10-02')).toBeInTheDocument();
        expect(screen.getByText('2025-10-03')).toBeInTheDocument();
      });
    });

    it('shows vendor information', async () => {
      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText('Office Depot')).toBeInTheDocument();
        expect(screen.getByText('United Airlines')).toBeInTheDocument();
        expect(screen.getByText('Fine Dining Restaurant')).toBeInTheDocument();
      });
    });

    it('displays expense categories', async () => {
      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText('Office Supplies')).toBeInTheDocument();
        expect(screen.getByText('Travel')).toBeInTheDocument();
        expect(screen.getByText('Meals')).toBeInTheDocument();
      });
    });

    it('shows expense status correctly', async () => {
      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText('pending')).toBeInTheDocument();
        expect(screen.getByText('approved')).toBeInTheDocument();
        expect(screen.getByText('rejected')).toBeInTheDocument();
      });
    });
  });

  describe('Approval Workflow', () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue({ data: mockExpenses });
    });

    it('shows approve buttons for pending expenses', async () => {
      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        const approveButtons = screen.getAllByText('Approve');
        expect(approveButtons).toHaveLength(1); // Only pending expenses (rejected doesn't get approve button)
      });
    });

    it('handles expense approval', async () => {
      mockApi.patch.mockResolvedValue({ data: { id: 1, approved: true } });

      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        const approveButtons = screen.getAllByText('Approve');
        expect(approveButtons[0]).toBeInTheDocument();
      });

      await user.click(screen.getAllByText('Approve')[0]);

      expect(mockApi.patch).toHaveBeenCalledWith('/api/expenses/1/', { approved: true });
    });

    it('refreshes list after approval', async () => {
      mockApi.patch.mockResolvedValue({ data: { id: 1, approved: true } });
      mockApi.get.mockResolvedValueOnce({ data: mockExpenses })
                 .mockResolvedValueOnce({ data: [...mockExpenses.slice(1)] }); // Remove approved expense

      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText('Printer paper and pens')).toBeInTheDocument();
      });

      await user.click(screen.getAllByText('Approve')[0]);

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledTimes(2); // Initial load + refresh
      });
    });

    it('handles approval errors gracefully', async () => {
      mockApi.patch.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getAllByText('Approve')[0]).toBeInTheDocument();
      });

      // Mock console.error to avoid test output noise
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await user.click(screen.getAllByText('Approve')[0]);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error approving expense:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Table Structure', () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue({ data: mockExpenses });
    });

    it('has proper table headers', async () => {
      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Category')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Vendor')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });

    it('uses striped table styling', async () => {
      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toHaveClass('striped-table');
      });
    });

    it('displays data in correct table structure', async () => {
      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows).toHaveLength(4); // Header + 3 data rows
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load expenses/i)).toBeInTheDocument();
      });
    });

    it('handles empty expense list', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        // Should still show table headers
        expect(screen.getByText('Date')).toBeInTheDocument();
        // But no expense rows
        const rows = screen.getAllByRole('row');
        expect(rows).toHaveLength(1); // Only header row
      });
    });

    it('handles malformed API response', async () => {
      mockApi.get.mockResolvedValue({ data: null });

      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        // Should handle gracefully without crashing
        expect(screen.getByRole('heading', { name: /expenses/i })).toBeInTheDocument();
      });
    });

    it('shows error message with proper styling', async () => {
      mockApi.get.mockRejectedValue(new Error('Server error'));

      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        const errorMessage = screen.getByText(/failed to load expenses/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveClass('error-message');
      });
    });
  });

  describe('API Integration', () => {
    it('calls expenses API endpoint on mount', async () => {
      mockApi.get.mockResolvedValue({ data: mockExpenses });

      renderWithProviders(<ExpenseList />);

      expect(mockApi.get).toHaveBeenCalledWith('/api/expenses/');
    });

    it('handles API response correctly', async () => {
      mockApi.get.mockResolvedValue({ data: mockExpenses });

      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText('Printer paper and pens')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Integration', () => {
    it('links to expense creation form', async () => {
      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        const addButton = screen.getByRole('link', { name: /add expense/i });
        expect(addButton).toHaveAttribute('href', '/expenses/new');
      });
    });

    it('renders within routing context', async () => {
      mockApi.get.mockResolvedValue({ data: mockExpenses });

      render(
        <BrowserRouter>
          <ExpenseList />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /expenses/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue({ data: mockExpenses });
    });

    it('has proper table structure for screen readers', async () => {
      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /date/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /amount/i })).toBeInTheDocument();
      });
    });

    it('provides meaningful headings', async () => {
      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: /expenses/i });
        expect(heading).toBeInTheDocument();
        expect(heading.tagName).toBe('H2');
      });
    });

    it('has accessible action buttons', async () => {
      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        const addButton = screen.getByRole('link', { name: /add expense/i });
        expect(addButton).toBeInTheDocument();
      });

      await waitFor(() => {
        const approveButtons = screen.getAllByRole('button', { name: /approve/i });
        expect(approveButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance', () => {
    it('renders efficiently with large expense lists', async () => {
      const largeExpenseList = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        date: '2025-10-01',
        category: 'office_supplies',
        description: `Expense ${i + 1}`,
        vendor: `Vendor ${i + 1}`,
        amount: 50 + i,
        status: 'pending',
        approved: false
      }));

      mockApi.get.mockResolvedValue({ data: largeExpenseList });

      const startTime = performance.now();
      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText('Expense 1')).toBeInTheDocument();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should render within 1 second
    });

    it('handles multiple approval actions efficiently', async () => {
      mockApi.patch.mockResolvedValue({ data: { approved: true } });
      mockApi.get.mockResolvedValue({ data: mockExpenses });

      renderWithProviders(<ExpenseList />);

      await waitFor(() => {
        const approveButtons = screen.getAllByText('Approve');
        expect(approveButtons.length).toBeGreaterThan(0);
      });

      // Click multiple approve buttons rapidly
      const approveButtons = screen.getAllByText('Approve');
      await Promise.all(approveButtons.map(button => user.click(button)));

      // Should handle concurrent requests without issues
      expect(mockApi.patch).toHaveBeenCalledTimes(approveButtons.length);
    });
  });
});