/**
 * LedgerAccountForm Component Test Suite
 * REQ-201.2: Ledger Account Components - Form Testing
 *
 * Tests chart of accounts creation, form validation, account type selection,
 * API integration, and accessibility compliance for ledger account management.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LedgerAccountForm from '../../components/LedgerAccountForm';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api');
const mockedApi = api;

describe('LedgerAccountForm Component - REQ-201.2', () => {
  const user = userEvent.setup();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful API response
    mockedApi.createLedgerAccount = jest.fn().mockResolvedValue({
      data: { id: 1, name: 'Test Account', code: 'TEST001', account_type: 'asset' }
    });
  });

  describe('Form Rendering and Structure', () => {
    it('renders all required form fields', () => {
      render(<LedgerAccountForm />);

      expect(screen.getByLabelText(/account name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/account code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/account type/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('has proper form structure with correct input types', () => {
      render(<LedgerAccountForm />);

      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();

      const nameInput = screen.getByLabelText(/account name/i);
      const codeInput = screen.getByLabelText(/account code/i);
      const typeSelect = screen.getByLabelText(/account type/i);

      expect(nameInput).toHaveAttribute('type', 'text');
      expect(codeInput).toHaveAttribute('type', 'text');
      expect(typeSelect).toHaveRole('combobox');
    });

    it('shows submit button in enabled state initially', () => {
      render(<LedgerAccountForm />);

      const submitButton = screen.getByRole('button', { name: /create/i });
      expect(submitButton).toBeEnabled();
    });

    it('does not show error message initially', () => {
      render(<LedgerAccountForm />);

      expect(screen.queryByText(/failed to create account/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('prevents submission with empty required fields', async () => {
      render(<LedgerAccountForm onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      expect(mockedApi.createLedgerAccount).not.toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('validates account name field requirement', () => {
      render(<LedgerAccountForm />);

      const nameInput = screen.getByLabelText(/account name/i);
      expect(nameInput).toHaveAttribute('required');
    });

    it('validates account code field requirement', () => {
      render(<LedgerAccountForm />);

      const codeInput = screen.getByLabelText(/account code/i);
      expect(codeInput).toHaveAttribute('required');
    });

    it('has default account type selection', () => {
      render(<LedgerAccountForm />);

      const typeSelect = screen.getByLabelText(/account type/i);
      expect(typeSelect).toHaveValue('asset');
    });
  });

  describe('Account Type Options', () => {
    it('provides all required account type options', () => {
      render(<LedgerAccountForm />);

      const typeSelect = screen.getByLabelText(/account type/i);

      expect(screen.getByRole('option', { name: /asset/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /liability/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /equity/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /revenue/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /expense/i })).toBeInTheDocument();
    });

    it('allows selection of different account types', async () => {
      render(<LedgerAccountForm />);

      const typeSelect = screen.getByLabelText(/account type/i);

      await user.selectOptions(typeSelect, 'liability');
      expect(typeSelect).toHaveValue('liability');

      await user.selectOptions(typeSelect, 'revenue');
      expect(typeSelect).toHaveValue('revenue');
    });
  });

  describe('Form Input Handling', () => {
    it('updates form fields when user types', async () => {
      render(<LedgerAccountForm />);

      const nameInput = screen.getByLabelText(/account name/i);
      const codeInput = screen.getByLabelText(/account code/i);

      await user.type(nameInput, 'Cash Account');
      await user.type(codeInput, 'CASH001');

      expect(nameInput).toHaveValue('Cash Account');
      expect(codeInput).toHaveValue('CASH001');
    });

    it('handles form changes independently', async () => {
      render(<LedgerAccountForm />);

      const nameInput = screen.getByLabelText(/account name/i);
      const typeSelect = screen.getByLabelText(/account type/i);

      await user.type(nameInput, 'Accounts Payable');
      await user.selectOptions(typeSelect, 'liability');

      expect(nameInput).toHaveValue('Accounts Payable');
      expect(typeSelect).toHaveValue('liability');
    });

    it('allows clearing and re-entering field values', async () => {
      render(<LedgerAccountForm />);

      const nameInput = screen.getByLabelText(/account name/i);

      await user.type(nameInput, 'Original Name');
      expect(nameInput).toHaveValue('Original Name');

      await user.clear(nameInput);
      expect(nameInput).toHaveValue('');

      await user.type(nameInput, 'New Name');
      expect(nameInput).toHaveValue('New Name');
    });
  });

  describe('Chart of Accounts Management', () => {
    it('creates asset account correctly', async () => {
      render(<LedgerAccountForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByLabelText(/account name/i), 'Cash');
      await user.type(screen.getByLabelText(/account code/i), '1000');
      await user.selectOptions(screen.getByLabelText(/account type/i), 'asset');

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockedApi.createLedgerAccount).toHaveBeenCalledWith({
          name: 'Cash',
          code: '1000',
          account_type: 'asset'
        });
      });
    });

    it('creates liability account correctly', async () => {
      render(<LedgerAccountForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByLabelText(/account name/i), 'Accounts Payable');
      await user.type(screen.getByLabelText(/account code/i), '2000');
      await user.selectOptions(screen.getByLabelText(/account type/i), 'liability');

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockedApi.createLedgerAccount).toHaveBeenCalledWith({
          name: 'Accounts Payable',
          code: '2000',
          account_type: 'liability'
        });
      });
    });

    it('creates revenue account correctly', async () => {
      render(<LedgerAccountForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByLabelText(/account name/i), 'Service Revenue');
      await user.type(screen.getByLabelText(/account code/i), '4000');
      await user.selectOptions(screen.getByLabelText(/account type/i), 'revenue');

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockedApi.createLedgerAccount).toHaveBeenCalledWith({
          name: 'Service Revenue',
          code: '4000',
          account_type: 'revenue'
        });
      });
    });
  });

  describe('API Integration', () => {
    it('submits ledger account successfully', async () => {
      render(<LedgerAccountForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByLabelText(/account name/i), 'Equipment');
      await user.type(screen.getByLabelText(/account code/i), '1500');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockedApi.createLedgerAccount).toHaveBeenCalledWith({
          name: 'Equipment',
          code: '1500',
          account_type: 'asset'
        });
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('shows loading state during submission', async () => {
      // Create a promise that we can control
      let resolvePromise;
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockedApi.createLedgerAccount.mockReturnValue(pendingPromise);

      render(<LedgerAccountForm />);

      await user.type(screen.getByLabelText(/account name/i), 'Test Account');
      await user.type(screen.getByLabelText(/account code/i), 'TEST');
      await user.click(screen.getByRole('button', { name: /create/i }));

      // Button should be disabled during loading
      expect(screen.getByRole('button', { name: /create/i })).toBeDisabled();

      // Resolve the promise
      resolvePromise({ data: { id: 1 } });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create/i })).toBeEnabled();
      });
    });

    it('clears form after successful submission', async () => {
      render(<LedgerAccountForm />);

      const nameInput = screen.getByLabelText(/account name/i);
      const codeInput = screen.getByLabelText(/account code/i);

      await user.type(nameInput, 'Test Account');
      await user.type(codeInput, 'TEST001');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(nameInput).toHaveValue('');
        expect(codeInput).toHaveValue('');
        expect(screen.getByLabelText(/account type/i)).toHaveValue('asset');
      });
    });

    it('handles API errors gracefully', async () => {
      mockedApi.createLedgerAccount.mockRejectedValue(new Error('API Error'));

      render(<LedgerAccountForm />);

      await user.type(screen.getByLabelText(/account name/i), 'Test Account');
      await user.type(screen.getByLabelText(/account code/i), 'TEST');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to create account/i)).toBeInTheDocument();
      });
    });

    it('handles network errors specifically', async () => {
      mockedApi.createLedgerAccount.mockRejectedValue({
        response: { status: 500, data: { message: 'Server error' } }
      });

      render(<LedgerAccountForm />);

      await user.type(screen.getByLabelText(/account name/i), 'Test Account');
      await user.type(screen.getByLabelText(/account code/i), 'TEST');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to create account/i)).toBeInTheDocument();
      });
    });
  });

  describe('Callback Integration', () => {
    it('calls onSuccess callback after successful submission', async () => {
      render(<LedgerAccountForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByLabelText(/account name/i), 'Test Account');
      await user.type(screen.getByLabelText(/account code/i), 'TEST');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('works without onSuccess callback', async () => {
      render(<LedgerAccountForm />);

      await user.type(screen.getByLabelText(/account name/i), 'Test Account');
      await user.type(screen.getByLabelText(/account code/i), 'TEST');

      // Should not throw error without callback
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockedApi.createLedgerAccount).toHaveBeenCalled();
      });
    });
  });

  describe('Form State Management', () => {
    it('maintains form state during API call', async () => {
      let resolvePromise;
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockedApi.createLedgerAccount.mockReturnValue(pendingPromise);

      render(<LedgerAccountForm />);

      const nameInput = screen.getByLabelText(/account name/i);
      const codeInput = screen.getByLabelText(/account code/i);

      await user.type(nameInput, 'Test Account');
      await user.type(codeInput, 'TEST');
      await user.click(screen.getByRole('button', { name: /create/i }));

      // Values should be maintained during API call
      expect(nameInput).toHaveValue('Test Account');
      expect(codeInput).toHaveValue('TEST');

      resolvePromise({ data: { id: 1 } });

      // Values should be cleared after successful submission
      await waitFor(() => {
        expect(nameInput).toHaveValue('');
        expect(codeInput).toHaveValue('');
      });
    });

    it('preserves form state when error occurs', async () => {
      mockedApi.createLedgerAccount.mockRejectedValue(new Error('API Error'));

      render(<LedgerAccountForm />);

      const nameInput = screen.getByLabelText(/account name/i);
      const codeInput = screen.getByLabelText(/account code/i);

      await user.type(nameInput, 'Test Account');
      await user.type(codeInput, 'TEST');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to create account/i)).toBeInTheDocument();
      });

      // Form values should be preserved after error
      expect(nameInput).toHaveValue('Test Account');
      expect(codeInput).toHaveValue('TEST');
    });
  });

  describe('Accessibility', () => {
    it('has proper form structure for screen readers', () => {
      render(<LedgerAccountForm />);

      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();

      // All inputs should have proper labels
      expect(screen.getByLabelText(/account name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/account code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/account type/i)).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<LedgerAccountForm />);

      const nameInput = screen.getByLabelText(/account name/i);
      const codeInput = screen.getByLabelText(/account code/i);
      const typeSelect = screen.getByLabelText(/account type/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      // Tab through form elements
      nameInput.focus();
      expect(nameInput).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(codeInput).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(typeSelect).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(submitButton).toHaveFocus();
    });

    it('provides meaningful error messages', async () => {
      mockedApi.createLedgerAccount.mockRejectedValue(new Error('Account code already exists'));

      render(<LedgerAccountForm />);

      await user.type(screen.getByLabelText(/account name/i), 'Test Account');
      await user.type(screen.getByLabelText(/account code/i), 'TEST');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        const errorMessage = screen.getByText(/failed to create account/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveStyle({ color: 'red' });
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('handles rapid form submissions gracefully', async () => {
      render(<LedgerAccountForm />);

      await user.type(screen.getByLabelText(/account name/i), 'Test Account');
      await user.type(screen.getByLabelText(/account code/i), 'TEST');

      const submitButton = screen.getByRole('button', { name: /create/i });

      // Multiple rapid clicks should only trigger one API call
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockedApi.createLedgerAccount).toHaveBeenCalledTimes(1);
      });
    });

    it('handles special characters in account names', async () => {
      render(<LedgerAccountForm />);

      await user.type(screen.getByLabelText(/account name/i), 'Petty Cash & Expenses');
      await user.type(screen.getByLabelText(/account code/i), 'PC&E-001');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockedApi.createLedgerAccount).toHaveBeenCalledWith({
          name: 'Petty Cash & Expenses',
          code: 'PC&E-001',
          account_type: 'asset'
        });
      });
    });

    it('handles long account names and codes', async () => {
      render(<LedgerAccountForm />);

      const longName = 'Very Long Account Name That Exceeds Normal Length Expectations';
      const longCode = 'VERYLONGACCOUNTCODE123456789';

      await user.type(screen.getByLabelText(/account name/i), longName);
      await user.type(screen.getByLabelText(/account code/i), longCode);
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockedApi.createLedgerAccount).toHaveBeenCalledWith({
          name: longName,
          code: longCode,
          account_type: 'asset'
        });
      });
    });
  });
});
