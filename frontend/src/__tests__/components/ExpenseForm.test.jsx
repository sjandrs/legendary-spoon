import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpenseForm from '../../components/ExpenseForm';
import { renderWithProviders } from '../helpers/test-utils';

// Mock the API module - mock the default export
jest.mock('../../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  }
}));

import api from '../../api';
const mockApi = api;

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

describe('ExpenseForm', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.get.mockClear();
    mockApi.post.mockClear();
    mockApi.patch.mockClear();
    mockApi.delete.mockClear();
    // Set default useParams to return no id (add mode)
    mockUseParams.mockReturnValue({ id: undefined });
  });

  describe('Form Rendering', () => {
    it('renders expense form with all required fields', () => {
      renderWithProviders(<ExpenseForm />);

      expect(screen.getByRole('heading', { name: /add expense/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/vendor/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/receipt/i)).toBeInTheDocument();
    });

    it('displays all expense category options', () => {
      renderWithProviders(<ExpenseForm />);

      const categorySelect = screen.getByLabelText(/category/i);
      expect(categorySelect).toBeInTheDocument();

      // Check for key categories
      expect(screen.getByDisplayValue(/office supplies/i)).toBeInTheDocument();
    });

    it('sets default values correctly', () => {
      renderWithProviders(<ExpenseForm />);

      const dateField = screen.getByLabelText(/date/i);
      const today = new Date().toISOString().split('T')[0];
      expect(dateField.value).toBe(today);

      const categorySelect = screen.getByLabelText(/category/i);
      expect(categorySelect.value).toBe('office_supplies');
    });

    it('includes file upload for receipts', () => {
      renderWithProviders(<ExpenseForm />);

      const receiptField = screen.getByLabelText(/receipt/i);
      expect(receiptField).toBeInTheDocument();
      expect(receiptField.type).toBe('file');
      expect(receiptField).toHaveAttribute('accept', 'image/*,.pdf');
    });
  });

  describe('Form Validation', () => {
    it('validates required fields before submission', async () => {
      renderWithProviders(<ExpenseForm />);

      // Clear required fields
      await user.clear(screen.getByLabelText(/description/i));
      await user.clear(screen.getByLabelText(/amount/i));

      await user.click(screen.getByRole('button', { name: /add expense/i }));

      // Form should not submit with missing required data
      expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('validates positive amount values', async () => {
      renderWithProviders(<ExpenseForm />);

      const amountField = screen.getByLabelText(/amount/i);
      await user.type(amountField, '-50');

      await user.click(screen.getByRole('button', { name: /add expense/i }));

      // Should not submit negative amounts
      expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('validates decimal amounts correctly', async () => {
      renderWithProviders(<ExpenseForm />);

      const amountField = screen.getByLabelText(/amount/i);
      await user.type(amountField, '125.75');

      expect(amountField.value).toBe('125.75');
    });

    it('limits description field length', () => {
      renderWithProviders(<ExpenseForm />);

      const descriptionField = screen.getByLabelText(/description/i);
      expect(descriptionField).toHaveAttribute('maxLength', '255');
    });

    it('limits vendor field length', () => {
      renderWithProviders(<ExpenseForm />);

      const vendorField = screen.getByLabelText(/vendor/i);
      expect(vendorField).toHaveAttribute('maxLength', '100');
    });
  });

  describe('Form Submission', () => {
    it('submits valid expense data for creation', async () => {
      mockApi.post.mockResolvedValue({ data: { id: 1, description: 'Test expense' } });

      renderWithProviders(<ExpenseForm />);

      // Fill required fields
      await user.clear(screen.getByLabelText(/description/i));
      await user.type(screen.getByLabelText(/description/i), 'Flight to conference');
      await user.clear(screen.getByLabelText(/amount/i));
      await user.type(screen.getByLabelText(/amount/i), '450');

      // Submit the form by clicking the button
      await user.click(screen.getByRole('button', { name: /add expense/i }));

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/api/expenses/', expect.any(FormData), {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }, { timeout: 3000 });

      expect(mockNavigate).toHaveBeenCalledWith('/expenses');
    });

    it('handles file upload in form submission', async () => {
      mockApi.post.mockResolvedValue({ data: { id: 1 } });

      renderWithProviders(<ExpenseForm />);

      const file = new File(['receipt'], 'receipt.pdf', { type: 'application/pdf' });
      const receiptField = screen.getByLabelText(/receipt/i);

      await user.clear(screen.getByLabelText(/description/i));
      await user.type(screen.getByLabelText(/description/i), 'Office supplies');
      await user.clear(screen.getByLabelText(/amount/i));
      await user.type(screen.getByLabelText(/amount/i), '75.50');
      await user.upload(receiptField, file);

      await user.click(screen.getByRole('button', { name: /add expense/i }));

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/api/expenses/', expect.any(FormData), {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }, { timeout: 3000 });
    });

    it('handles API errors during submission', async () => {
      mockApi.post.mockRejectedValue(new Error('Server error'));

      renderWithProviders(<ExpenseForm />);

      await user.clear(screen.getByLabelText(/description/i));
      await user.type(screen.getByLabelText(/description/i), 'Test expense');
      await user.clear(screen.getByLabelText(/amount/i));
      await user.type(screen.getByLabelText(/amount/i), '100');
      await user.click(screen.getByRole('button', { name: /add expense/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to save expense/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('shows loading state during submission', async () => {
      let resolvePromise;
      const mockPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockApi.post.mockImplementation(() => mockPromise);

      renderWithProviders(<ExpenseForm />);

      await user.clear(screen.getByLabelText(/description/i));
      await user.type(screen.getByLabelText(/description/i), 'Test expense');
      await user.clear(screen.getByLabelText(/amount/i));
      await user.type(screen.getByLabelText(/amount/i), '100');

      await user.click(screen.getByRole('button', { name: /add expense/i }));

      // Wait for loading state to appear
      await waitFor(() => {
        expect(screen.getByText(/saving.../i)).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /saving.../i })).toBeDisabled();

      // Resolve the promise to complete the test
      resolvePromise({ data: { id: 1 } });

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/saving.../i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      // Mock useParams to return an ID for edit mode
      mockUseParams.mockReturnValue({ id: '1' });
    });

    afterEach(() => {
      // Reset useParams mock to default
      mockUseParams.mockReturnValue({ id: undefined });
    });

    it('loads existing expense data in edit mode', async () => {
      const mockExpense = {
        id: 1,
        date: '2025-10-01',
        category: 'meals',
        description: 'Client lunch',
        vendor: 'Restaurant ABC',
        amount: 85.50
      };

      mockApi.get.mockResolvedValue({ data: mockExpense });

      renderWithProviders(<ExpenseForm />);

      // Wait for API call and data load
      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/api/expenses/1/');
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit expense/i })).toBeInTheDocument();
      });
    });

    it('updates expense using PATCH method', async () => {
      const mockExpense = {
        id: 1,
        date: '2025-10-01',
        category: 'meals',
        description: 'Client lunch',
        vendor: 'Restaurant ABC',
        amount: 85.50
      };

      mockApi.get.mockResolvedValue({ data: mockExpense });
      mockApi.patch.mockResolvedValue({ data: { id: 1 } });

      renderWithProviders(<ExpenseForm />);

      // Wait for initial data load
      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/api/expenses/1/');
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit expense/i })).toBeInTheDocument();
      });

      await user.clear(screen.getByLabelText(/description/i));
      await user.type(screen.getByLabelText(/description/i), 'Updated expense');
      await user.clear(screen.getByLabelText(/amount/i));
      await user.type(screen.getByLabelText(/amount/i), '150');
      await user.click(screen.getByRole('button', { name: /update expense/i }));

      await waitFor(() => {
        expect(mockApi.patch).toHaveBeenCalledWith('/api/expenses/1/', expect.any(FormData), {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }, { timeout: 3000 });
    });

    it('shows file upload note in edit mode', async () => {
      const mockExpense = {
        id: 1,
        date: '2025-10-01',
        category: 'meals',
        description: 'Client lunch',
        vendor: 'Restaurant ABC',
        amount: 85.50
      };

      mockApi.get.mockResolvedValue({ data: mockExpense });

      renderWithProviders(<ExpenseForm />);

      await waitFor(() => {
        expect(screen.getByText(/if you don't select a new file/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Experience', () => {
    it('provides helpful labels and field types', () => {
      renderWithProviders(<ExpenseForm />);

      expect(screen.getByLabelText(/date \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount \*/i)).toBeInTheDocument();

      const amountField = screen.getByLabelText(/amount/i);
      expect(amountField.type).toBe('number');
      expect(amountField).toHaveAttribute('step', '0.01');
    });

    it('shows required field indicators', () => {
      renderWithProviders(<ExpenseForm />);

      expect(screen.getByText(/date \*/i)).toBeInTheDocument();
      expect(screen.getByText(/category \*/i)).toBeInTheDocument();
      expect(screen.getByText(/description \*/i)).toBeInTheDocument();
      expect(screen.getByText(/amount \*/i)).toBeInTheDocument();
    });

    it('handles form state changes correctly', async () => {
      renderWithProviders(<ExpenseForm />);

      const categorySelect = screen.getByLabelText(/category/i);
      await user.selectOptions(categorySelect, 'utilities');

      expect(categorySelect.value).toBe('utilities');
    });
  });

  describe('Navigation Integration', () => {
    it('navigates back to expense list on cancel', async () => {
      renderWithProviders(<ExpenseForm />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/expenses');
    });

    it('navigates back after successful submission', async () => {
      mockApi.post.mockResolvedValue({ data: { id: 1 } });

      renderWithProviders(<ExpenseForm />);

      await user.type(screen.getByLabelText(/description/i), 'Test expense');
      await user.type(screen.getByLabelText(/amount/i), '100');
      await user.click(screen.getByRole('button', { name: /add expense/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/expenses');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for all form fields', () => {
      renderWithProviders(<ExpenseForm />);

      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/vendor/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/receipt/i)).toBeInTheDocument();
    });

    it('provides clear button labels', () => {
      renderWithProviders(<ExpenseForm />);

      expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('shows error messages accessibly', async () => {
      mockApi.post.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<ExpenseForm />);

      await user.clear(screen.getByLabelText(/description/i));
      await user.type(screen.getByLabelText(/description/i), 'Test expense');
      await user.clear(screen.getByLabelText(/amount/i));
      await user.type(screen.getByLabelText(/amount/i), '100');
      await user.click(screen.getByRole('button', { name: /add expense/i }));

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalled();
      });

      await waitFor(() => {
        const errorMessage = screen.getByText(/failed to save expense/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveClass('error-message');
      }, { timeout: 3000 });
    });
  });

  describe('Performance', () => {
    it('renders form quickly', () => {
      const startTime = performance.now();
      renderWithProviders(<ExpenseForm />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });

    it('handles file uploads efficiently', async () => {
      renderWithProviders(<ExpenseForm />);

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const receiptField = screen.getByLabelText(/receipt/i);

      await user.upload(receiptField, file);

      // Just verify the file was uploaded successfully
      expect(receiptField.files[0]).toBe(file);
      expect(receiptField.files).toHaveLength(1);
    });
  });
});
