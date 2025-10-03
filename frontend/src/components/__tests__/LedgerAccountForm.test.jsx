import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, testComponentAccessibility } from '../../__tests__/helpers/test-utils';
import LedgerAccountForm from '../LedgerAccountForm';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  createLedgerAccount: jest.fn(),
}));
const mockedApi = api;

describe('LedgerAccountForm Component', () => {
  const user = userEvent.setup();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('renders form with all required fields', () => {
      renderWithProviders(<LedgerAccountForm />);

      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/account name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/account code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/account type/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('renders account type options correctly', () => {
      renderWithProviders(<LedgerAccountForm />);

      const select = screen.getByLabelText(/account type/i);
      expect(select).toHaveValue('asset');

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(5);
      expect(options[0]).toHaveValue('asset');
      expect(options[1]).toHaveValue('liability');
      expect(options[2]).toHaveValue('equity');
      expect(options[3]).toHaveValue('revenue');
      expect(options[4]).toHaveValue('expense');
    });

    it('initializes with default asset account type', () => {
      renderWithProviders(<LedgerAccountForm />);

      expect(screen.getByLabelText(/account type/i)).toHaveValue('asset');
    });
  });

  describe('Form Validation', () => {
    it('validates required name field', async () => {
      renderWithProviders(<LedgerAccountForm />);

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      expect(mockedApi.createLedgerAccount).not.toHaveBeenCalled();
    });

    it('validates required code field', async () => {
      renderWithProviders(<LedgerAccountForm />);

      await user.type(screen.getByLabelText(/account name/i), 'Test Account');
      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      expect(mockedApi.createLedgerAccount).not.toHaveBeenCalled();
    });

    it('allows form submission with valid data', async () => {
      mockedApi.createLedgerAccount.mockResolvedValue({ id: 1 });

      renderWithProviders(<LedgerAccountForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByLabelText(/account name/i), 'Cash Account');
      await user.type(screen.getByLabelText(/account code/i), '1000');
      await user.selectOptions(screen.getByLabelText(/account type/i), 'asset');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockedApi.createLedgerAccount).toHaveBeenCalledWith({
          name: 'Cash Account',
          code: '1000',
          account_type: 'asset'
        });
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form data successfully', async () => {
      const mockAccount = { id: 1, name: 'Test Account', code: '1000', account_type: 'asset' };
      mockedApi.createLedgerAccount.mockResolvedValue(mockAccount);

      renderWithProviders(<LedgerAccountForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByLabelText(/account name/i), 'Test Account');
      await user.type(screen.getByLabelText(/account code/i), '1000');
      await user.selectOptions(screen.getByLabelText(/account type/i), 'asset');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockedApi.createLedgerAccount).toHaveBeenCalledWith({
          name: 'Test Account',
          code: '1000',
          account_type: 'asset'
        });
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('resets form after successful submission', async () => {
      mockedApi.createLedgerAccount.mockResolvedValue({ id: 1 });

      renderWithProviders(<LedgerAccountForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByLabelText(/account name/i), 'Test Account');
      await user.type(screen.getByLabelText(/account code/i), '1000');
      await user.selectOptions(screen.getByLabelText(/account type/i), 'liability');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      expect(screen.getByLabelText(/account name/i)).toHaveValue('');
      expect(screen.getByLabelText(/account code/i)).toHaveValue('');
      expect(screen.getByLabelText(/account type/i)).toHaveValue('asset');
    });

    it('handles API errors gracefully', async () => {
      mockedApi.createLedgerAccount.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<LedgerAccountForm />);

      await user.type(screen.getByLabelText(/account name/i), 'Test Account');
      await user.type(screen.getByLabelText(/account code/i), '1000');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create account')).toBeInTheDocument();
      });
    });

    it('shows loading state during submission', async () => {
      mockedApi.createLedgerAccount.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ id: 1 }), 100))
      );

      renderWithProviders(<LedgerAccountForm />);

      await user.type(screen.getByLabelText(/account name/i), 'Test Account');
      await user.type(screen.getByLabelText(/account code/i), '1000');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Form Interaction', () => {
    it('updates form state on input change', async () => {
      renderWithProviders(<LedgerAccountForm />);

      const nameInput = screen.getByLabelText(/account name/i);
      const codeInput = screen.getByLabelText(/account code/i);
      const typeSelect = screen.getByLabelText(/account type/i);

      await user.type(nameInput, 'Updated Name');
      await user.type(codeInput, '2000');
      await user.selectOptions(typeSelect, 'liability');

      expect(nameInput).toHaveValue('Updated Name');
      expect(codeInput).toHaveValue('2000');
      expect(typeSelect).toHaveValue('liability');
    });

    it('prevents form submission when loading', async () => {
      mockedApi.createLedgerAccount.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ id: 1 }), 100))
      );

      renderWithProviders(<LedgerAccountForm />);

      await user.type(screen.getByLabelText(/account name/i), 'Test Account');
      await user.type(screen.getByLabelText(/account code/i), '1000');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      // Try to click again while loading
      await user.click(submitButton);

      // Should only be called once
      await waitFor(() => {
        expect(mockedApi.createLedgerAccount).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG 2.1 AA standards', async () => {
      await testComponentAccessibility(<LedgerAccountForm />);
    });

    it('has proper form labels', () => {
      renderWithProviders(<LedgerAccountForm />);

      expect(screen.getByLabelText(/account name/i)).toBeRequired();
      expect(screen.getByLabelText(/account code/i)).toBeRequired();
      expect(screen.getByLabelText(/account type/i)).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<LedgerAccountForm />);

      const nameInput = screen.getByLabelText(/account name/i);
      const codeInput = screen.getByLabelText(/account code/i);
      const typeSelect = screen.getByLabelText(/account type/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      nameInput.focus();
      expect(nameInput).toHaveFocus();

      await user.tab();
      expect(codeInput).toHaveFocus();

      await user.tab();
      expect(typeSelect).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('has proper ARIA attributes', () => {
      renderWithProviders(<LedgerAccountForm />);

      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/account name/i)).toHaveAttribute('aria-label', 'Account Name');
      expect(screen.getByLabelText(/account code/i)).toHaveAttribute('aria-label', 'Account Code');
      expect(screen.getByLabelText(/account type/i)).toHaveAttribute('aria-label', 'Account Type');
    });
  });

  describe('Error Handling', () => {
    it('clears previous errors on new submission', async () => {
      mockedApi.createLedgerAccount
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({ id: 1 });

      renderWithProviders(<LedgerAccountForm />);

      // First submission fails
      await user.type(screen.getByLabelText(/account name/i), 'Test Account');
      await user.type(screen.getByLabelText(/account code/i), '1000');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create account')).toBeInTheDocument();
      });

      // Second submission succeeds
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.queryByText('Failed to create account')).not.toBeInTheDocument();
      });
    });

    it('handles network errors', async () => {
      mockedApi.createLedgerAccount.mockRejectedValue({
        message: 'Network Error',
        isAxiosError: true
      });

      renderWithProviders(<LedgerAccountForm />);

      await user.type(screen.getByLabelText(/account name/i), 'Test Account');
      await user.type(screen.getByLabelText(/account code/i), '1000');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create account')).toBeInTheDocument();
      });
    });
  });

  describe('Account Type Validation', () => {
    it('accepts all valid account types', async () => {
      mockedApi.createLedgerAccount.mockResolvedValue({ id: 1 });

      renderWithProviders(<LedgerAccountForm onSuccess={mockOnSuccess} />);

      const accountTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];

      for (const type of accountTypes) {
        await user.clear(screen.getByLabelText(/account name/i));
        await user.clear(screen.getByLabelText(/account code/i));

        await user.type(screen.getByLabelText(/account name/i), `${type} Account`);
        await user.type(screen.getByLabelText(/account code/i), '1000');
        await user.selectOptions(screen.getByLabelText(/account type/i), type);

        await user.click(screen.getByRole('button', { name: /create/i }));

        await waitFor(() => {
          expect(mockedApi.createLedgerAccount).toHaveBeenCalledWith(
            expect.objectContaining({ account_type: type })
          );
        });

        expect(mockOnSuccess).toHaveBeenCalled();
        mockOnSuccess.mockClear();
        mockedApi.createLedgerAccount.mockClear();
      }
    });
  });
});
