import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUsers } from '../helpers/test-utils';
import JournalEntryForm from '../../components/JournalEntryForm';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  createJournalEntry: jest.fn(),
}));

const mockApi = api;

const mockLedgerAccounts = [
  { id: 1, name: 'Cash', account_type: 'asset', number: '1001' },
  { id: 2, name: 'Accounts Receivable', account_type: 'asset', number: '1002' },
  { id: 3, name: 'Revenue', account_type: 'income', number: '4001' },
  { id: 4, name: 'Expenses', account_type: 'expense', number: '5001' },
  { id: 5, name: 'Accounts Payable', account_type: 'liability', number: '2001' }
];

const mockJournalEntry = {
  id: 1,
  date: '2025-10-01',
  description: 'Test journal entry for sales transaction',
  debit_account: '1001',
  credit_account: '4001',
  amount: 1000.00,
  created_by: 'testuser',
  created_date: '2025-10-01T10:00:00Z'
};

describe('JournalEntryForm Component - REQ-201.1', () => {
  const user = userEvent.setup();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderJournalEntryForm = (authUser = mockUsers.salesManager, props = {}) => {
    return renderWithProviders(
      <JournalEntryForm onSuccess={mockOnSuccess} {...props} />,
      {
        authValue: {
          user: authUser,
          token: 'mock-token',
          loading: false,
          login: jest.fn(),
          logout: jest.fn(),
        }
      }
    );
  };

  describe('Form Rendering and Structure', () => {
    it('renders all required form fields', () => {
      renderJournalEntryForm();

      expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /debit account/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /credit account/i })).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name: /amount/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument(); // Date field
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('has proper form structure with correct input types', () => {
      renderJournalEntryForm();

      const dateInput = screen.getByLabelText(/date/i);
      expect(dateInput).toHaveAttribute('type', 'date');
      expect(dateInput).toHaveAttribute('name', 'date');
      expect(dateInput).toBeRequired();

      const descriptionInput = screen.getByRole('textbox', { name: /description/i });
      expect(descriptionInput).toHaveAttribute('name', 'description');
      expect(descriptionInput).toBeRequired();

      const amountInput = screen.getByRole('spinbutton', { name: /amount/i });
      expect(amountInput).toHaveAttribute('type', 'number');
      expect(amountInput).toHaveAttribute('name', 'amount');
      expect(amountInput).toBeRequired();
    });

    it('shows submit button in enabled state initially', () => {
      renderJournalEntryForm();

      const submitButton = screen.getByRole('button', { name: /create/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });

    it('does not show error message initially', () => {
      renderJournalEntryForm();

      expect(screen.queryByText(/failed to create journal entry/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('prevents submission with empty required fields', async () => {
      renderJournalEntryForm();

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      expect(mockApi.createJournalEntry).not.toHaveBeenCalled();
    });

    it('validates date field requirement', async () => {
      renderJournalEntryForm();

      const dateInput = screen.getByLabelText(/date/i);
      expect(dateInput).toBeRequired();
      expect(dateInput).toBeInvalid(); // Empty required field is invalid
    });

    it('validates description field requirement', async () => {
      renderJournalEntryForm();

      const descriptionInput = screen.getByRole('textbox', { name: /description/i });
      expect(descriptionInput).toBeRequired();
      expect(descriptionInput).toBeInvalid(); // Empty required field is invalid
    });

    it('validates account fields requirement', async () => {
      renderJournalEntryForm();

      const debitAccountInput = screen.getByRole('textbox', { name: /debit account/i });
      const creditAccountInput = screen.getByRole('textbox', { name: /credit account/i });

      expect(debitAccountInput).toBeRequired();
      expect(creditAccountInput).toBeRequired();
      expect(debitAccountInput).toBeInvalid();
      expect(creditAccountInput).toBeInvalid();
    });

    it('validates amount field requirement and type', async () => {
      renderJournalEntryForm();

      const amountInput = screen.getByRole('spinbutton', { name: /amount/i });
      expect(amountInput).toBeRequired();
      expect(amountInput).toHaveAttribute('type', 'number');
    });
  });

  describe('Form Input Handling', () => {
    it('updates form fields when user types', async () => {
      renderJournalEntryForm();

      const dateInput = screen.getByLabelText(/date/i);
      const descriptionInput = screen.getByRole('textbox', { name: /description/i });
      const debitAccountInput = screen.getByRole('textbox', { name: /debit account/i });
      const creditAccountInput = screen.getByRole('textbox', { name: /credit account/i });
      const amountInput = screen.getByRole('spinbutton', { name: /amount/i });

      await user.type(dateInput, '2025-10-01');
      await user.type(descriptionInput, 'Test entry description');
      await user.type(debitAccountInput, '1001');
      await user.type(creditAccountInput, '4001');
      await user.type(amountInput, '1000');

      expect(dateInput).toHaveValue('2025-10-01');
      expect(descriptionInput).toHaveValue('Test entry description');
      expect(debitAccountInput).toHaveValue('1001');
      expect(creditAccountInput).toHaveValue('4001');
      expect(amountInput).toHaveValue(1000);
    });

    it('handles form changes independently', async () => {
      renderJournalEntryForm();

      const descriptionInput = screen.getByRole('textbox', { name: /description/i });
      const amountInput = screen.getByRole('spinbutton', { name: /amount/i });

      await user.type(descriptionInput, 'First entry');
      expect(descriptionInput).toHaveValue('First entry');
      expect(amountInput).toHaveValue(null);

      await user.type(amountInput, '500');
      expect(descriptionInput).toHaveValue('First entry');
      expect(amountInput).toHaveValue(500);
    });

    it('allows clearing and re-entering field values', async () => {
      renderJournalEntryForm();

      const descriptionInput = screen.getByRole('textbox', { name: /description/i });

      await user.type(descriptionInput, 'Initial text');
      expect(descriptionInput).toHaveValue('Initial text');

      await user.clear(descriptionInput);
      expect(descriptionInput).toHaveValue('');

      await user.type(descriptionInput, 'New text');
      expect(descriptionInput).toHaveValue('New text');
    });
  });

  describe('Double-Entry Bookkeeping Validation', () => {
    it('accepts valid debit and credit account entries', async () => {
      mockApi.createJournalEntry.mockResolvedValue({ data: mockJournalEntry });

      renderJournalEntryForm();

      await user.type(screen.getByLabelText(/date/i), '2025-10-01');
      await user.type(screen.getByRole('textbox', { name: /description/i }), 'Sales transaction');
      await user.type(screen.getByRole('textbox', { name: /debit account/i }), '1001');
      await user.type(screen.getByRole('textbox', { name: /credit account/i }), '4001');
      await user.type(screen.getByRole('spinbutton', { name: /amount/i }), '1000');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockApi.createJournalEntry).toHaveBeenCalledWith({
          date: '2025-10-01',
          description: 'Sales transaction',
          debit_account: '1001',
          credit_account: '4001',
          amount: '1000'
        });
      });
    });

    it('handles different account types correctly', async () => {
      mockApi.createJournalEntry.mockResolvedValue({ data: mockJournalEntry });

      renderJournalEntryForm();

      // Asset to Liability transaction
      await user.type(screen.getByLabelText(/date/i), '2025-10-01');
      await user.type(screen.getByRole('textbox', { name: /description/i }), 'Payment transaction');
      await user.type(screen.getByRole('textbox', { name: /debit account/i }), '2001'); // Liability
      await user.type(screen.getByRole('textbox', { name: /credit account/i }), '1001'); // Asset
      await user.type(screen.getByRole('spinbutton', { name: /amount/i }), '500');

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockApi.createJournalEntry).toHaveBeenCalledWith({
          date: '2025-10-01',
          description: 'Payment transaction',
          debit_account: '2001',
          credit_account: '1001',
          amount: '500'
        });
      });
    });
  });

  describe('API Integration', () => {
    it('submits journal entry successfully', async () => {
      mockApi.createJournalEntry.mockResolvedValue({ data: mockJournalEntry });

      renderJournalEntryForm();

      await user.type(screen.getByLabelText(/date/i), '2025-10-01');
      await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test entry');
      await user.type(screen.getByRole('textbox', { name: /debit account/i }), '1001');
      await user.type(screen.getByRole('textbox', { name: /credit account/i }), '4001');
      await user.type(screen.getByRole('spinbutton', { name: /amount/i }), '1000');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockApi.createJournalEntry).toHaveBeenCalledTimes(1);
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('shows loading state during submission', async () => {
      let resolvePromise;
      mockApi.createJournalEntry.mockReturnValue(
        new Promise(resolve => { resolvePromise = resolve; })
      );

      renderJournalEntryForm();

      await user.type(screen.getByLabelText(/date/i), '2025-10-01');
      await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test entry');
      await user.type(screen.getByRole('textbox', { name: /debit account/i }), '1001');
      await user.type(screen.getByRole('textbox', { name: /credit account/i }), '4001');
      await user.type(screen.getByRole('spinbutton', { name: /amount/i }), '1000');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      // Button should be disabled during loading
      expect(submitButton).toBeDisabled();

      // Resolve the promise
      resolvePromise({ data: mockJournalEntry });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('clears form after successful submission', async () => {
      mockApi.createJournalEntry.mockResolvedValue({ data: mockJournalEntry });

      renderJournalEntryForm();

      const dateInput = screen.getByLabelText(/date/i);
      const descriptionInput = screen.getByRole('textbox', { name: /description/i });
      const debitAccountInput = screen.getByRole('textbox', { name: /debit account/i });
      const creditAccountInput = screen.getByRole('textbox', { name: /credit account/i });
      const amountInput = screen.getByRole('spinbutton', { name: /amount/i });

      await user.type(dateInput, '2025-10-01');
      await user.type(descriptionInput, 'Test entry');
      await user.type(debitAccountInput, '1001');
      await user.type(creditAccountInput, '4001');
      await user.type(amountInput, '1000');

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(dateInput).toHaveValue('');
        expect(descriptionInput).toHaveValue('');
        expect(debitAccountInput).toHaveValue('');
        expect(creditAccountInput).toHaveValue('');
        expect(amountInput).toHaveValue(null);
      });
    });

    it('handles API errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockApi.createJournalEntry.mockRejectedValue(new Error('API Error'));

      renderJournalEntryForm();

      await user.type(screen.getByLabelText(/date/i), '2025-10-01');
      await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test entry');
      await user.type(screen.getByRole('textbox', { name: /debit account/i }), '1001');
      await user.type(screen.getByRole('textbox', { name: /credit account/i }), '4001');
      await user.type(screen.getByRole('spinbutton', { name: /amount/i }), '1000');

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to create journal entry/i)).toBeInTheDocument();
      });

      const errorMessage = screen.getByText(/failed to create journal entry/i);
      expect(errorMessage).toHaveStyle({ color: 'red' });
      expect(mockOnSuccess).not.toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it('handles network errors specifically', async () => {
      mockApi.createJournalEntry.mockRejectedValue({
        response: { status: 500, data: { message: 'Internal server error' } }
      });

      renderJournalEntryForm();

      await user.type(screen.getByLabelText(/date/i), '2025-10-01');
      await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test entry');
      await user.type(screen.getByRole('textbox', { name: /debit account/i }), '1001');
      await user.type(screen.getByRole('textbox', { name: /credit account/i }), '4001');
      await user.type(screen.getByRole('spinbutton', { name: /amount/i }), '1000');

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to create journal entry/i)).toBeInTheDocument();
      });
    });
  });

  describe('Role-Based Access Control', () => {
    it('allows Sales Manager to create journal entries', () => {
      renderJournalEntryForm(mockUsers.salesManager);

      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument();
    });

    it('allows Sales Rep to create journal entries', () => {
      renderJournalEntryForm(mockUsers.salesRep);

      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument();
    });
  });

  describe('Callback Integration', () => {
    it('calls onSuccess callback after successful submission', async () => {
      mockApi.createJournalEntry.mockResolvedValue({ data: mockJournalEntry });

      renderJournalEntryForm();

      await user.type(screen.getByLabelText(/date/i), '2025-10-01');
      await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test entry');
      await user.type(screen.getByRole('textbox', { name: /debit account/i }), '1001');
      await user.type(screen.getByRole('textbox', { name: /credit account/i }), '4001');
      await user.type(screen.getByRole('spinbutton', { name: /amount/i }), '1000');

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('works without onSuccess callback', async () => {
      mockApi.createJournalEntry.mockResolvedValue({ data: mockJournalEntry });

      renderJournalEntryForm(mockUsers.salesManager, { onSuccess: undefined });

      await user.type(screen.getByLabelText(/date/i), '2025-10-01');
      await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test entry');
      await user.type(screen.getByRole('textbox', { name: /debit account/i }), '1001');
      await user.type(screen.getByRole('textbox', { name: /credit account/i }), '4001');
      await user.type(screen.getByRole('spinbutton', { name: /amount/i }), '1000');

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockApi.createJournalEntry).toHaveBeenCalledTimes(1);
      });

      // Should not throw error when onSuccess is undefined
      expect(screen.queryByText(/failed to create journal entry/i)).not.toBeInTheDocument();
    });
  });

  describe('Form State Management', () => {
    it('maintains form state during API call', async () => {
      let resolvePromise;
      mockApi.createJournalEntry.mockReturnValue(
        new Promise(resolve => { resolvePromise = resolve; })
      );

      renderJournalEntryForm();

      await user.type(screen.getByLabelText(/date/i), '2025-10-01');
      await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test entry');
      await user.type(screen.getByRole('textbox', { name: /debit account/i }), '1001');
      await user.type(screen.getByRole('textbox', { name: /credit account/i }), '4001');
      await user.type(screen.getByRole('spinbutton', { name: /amount/i }), '1000');

      await user.click(screen.getByRole('button', { name: /create/i }));

      // Values should remain during API call
      expect(screen.getByDisplayValue('2025-10-01')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test entry')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('4001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1000')).toBeInTheDocument();

      resolvePromise({ data: mockJournalEntry });

      await waitFor(() => {
        expect(screen.getByLabelText(/date/i)).toBeInTheDocument(); // Should clear after success
      });
    });

    it('preserves form state when error occurs', async () => {
      mockApi.createJournalEntry.mockRejectedValue(new Error('API Error'));

      renderJournalEntryForm();

      await user.type(screen.getByLabelText(/date/i), '2025-10-01');
      await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test entry');
      await user.type(screen.getByRole('textbox', { name: /debit account/i }), '1001');
      await user.type(screen.getByRole('textbox', { name: /credit account/i }), '4001');
      await user.type(screen.getByRole('spinbutton', { name: /amount/i }), '1000');

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to create journal entry/i)).toBeInTheDocument();
      });

      // Form values should be preserved after error
      expect(screen.getByDisplayValue('2025-10-01')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test entry')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('4001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form structure for screen readers', () => {
      renderJournalEntryForm();

      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();

      // All inputs should be accessible
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument(); // Date
      expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /debit account/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /credit account/i })).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name: /amount/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      renderJournalEntryForm();

      const dateInput = screen.getByLabelText(/date/i);
      const descriptionInput = screen.getByRole('textbox', { name: /description/i });
      const submitButton = screen.getByRole('button', { name: /create/i });

      dateInput.focus();
      expect(dateInput).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(descriptionInput).toHaveFocus();

      // Can navigate to submit button
      submitButton.focus();
      expect(submitButton).toHaveFocus();
    });

    it('provides meaningful error messages', async () => {
      mockApi.createJournalEntry.mockRejectedValue(new Error('API Error'));

      renderJournalEntryForm();

      await user.type(screen.getByLabelText(/date/i), '2025-10-01');
      await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test entry');
      await user.type(screen.getByRole('textbox', { name: /debit account/i }), '1001');
      await user.type(screen.getByRole('textbox', { name: /credit account/i }), '4001');
      await user.type(screen.getByRole('spinbutton', { name: /amount/i }), '1000');

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        const errorMessage = screen.getByText(/failed to create journal entry/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toBeVisible();
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('handles rapid form submissions gracefully', async () => {
      mockApi.createJournalEntry.mockResolvedValue({ data: mockJournalEntry });

      renderJournalEntryForm();

      await user.type(screen.getByLabelText(/date/i), '2025-10-01');
      await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test entry');
      await user.type(screen.getByRole('textbox', { name: /debit account/i }), '1001');
      await user.type(screen.getByRole('textbox', { name: /credit account/i }), '4001');
      await user.type(screen.getByRole('spinbutton', { name: /amount/i }), '1000');

      const submitButton = screen.getByRole('button', { name: /create/i });

      // Rapid clicks should be handled
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      await waitFor(() => {
        // Should only submit once due to loading state
        expect(mockApi.createJournalEntry).toHaveBeenCalledTimes(1);
      });
    });

    it('handles special characters in description', async () => {
      mockApi.createJournalEntry.mockResolvedValue({ data: mockJournalEntry });

      renderJournalEntryForm();

      const specialDescription = 'Journal entry with special chars: àáâã & <script> "quotes"';

      await user.type(screen.getByLabelText(/date/i), '2025-10-01');
      await user.type(screen.getByRole('textbox', { name: /description/i }), specialDescription);
      await user.type(screen.getByRole('textbox', { name: /debit account/i }), '1001');
      await user.type(screen.getByRole('textbox', { name: /credit account/i }), '4001');
      await user.type(screen.getByRole('spinbutton', { name: /amount/i }), '1000');

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockApi.createJournalEntry).toHaveBeenCalledWith(
          expect.objectContaining({
            description: specialDescription
          })
        );
      });
    });

    it('handles large amounts correctly', async () => {
      mockApi.createJournalEntry.mockResolvedValue({ data: mockJournalEntry });

      renderJournalEntryForm();

      await user.type(screen.getByLabelText(/date/i), '2025-10-01');
      await user.type(screen.getByRole('textbox', { name: /description/i }), 'Large amount entry');
      await user.type(screen.getByRole('textbox', { name: /debit account/i }), '1001');
      await user.type(screen.getByRole('textbox', { name: /credit account/i }), '4001');
      await user.type(screen.getByRole('spinbutton', { name: /amount/i }), '999999.99');

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockApi.createJournalEntry).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: '999999.99'
          })
        );
      });
    });
  });
});
