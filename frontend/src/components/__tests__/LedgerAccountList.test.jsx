import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, testComponentAccessibility } from '../../__tests__/helpers/test-utils';
import LedgerAccountList from '../LedgerAccountList';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  getLedgerAccounts: jest.fn(),
}));
const mockedApi = api;

describe('LedgerAccountList Component', () => {
  const mockAccounts = [
    {
      id: 1,
      name: 'Cash Account',
      code: '1000',
      account_type: 'asset'
    },
    {
      id: 2,
      name: 'Accounts Payable',
      code: '2000',
      account_type: 'liability'
    },
    {
      id: 3,
      name: 'Retained Earnings',
      code: '3000',
      account_type: 'equity'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading state initially', () => {
      mockedApi.getLedgerAccounts.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithProviders(<LedgerAccountList />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('transitions from loading to loaded state', async () => {
      mockedApi.getLedgerAccounts.mockResolvedValue({
        data: mockAccounts
      });

      renderWithProviders(<LedgerAccountList />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Display', () => {
    it('renders table with correct headers', async () => {
      mockedApi.getLedgerAccounts.mockResolvedValue({
        data: mockAccounts
      });

      renderWithProviders(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByText('ID')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Code')).toBeInTheDocument();
        expect(screen.getByText('Type')).toBeInTheDocument();
      });
    });

    it('displays account data correctly', async () => {
      mockedApi.getLedgerAccounts.mockResolvedValue({
        data: mockAccounts
      });

      renderWithProviders(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('Cash Account')).toBeInTheDocument();
        expect(screen.getByText('1000')).toBeInTheDocument();
        expect(screen.getByText('asset')).toBeInTheDocument();

        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('Accounts Payable')).toBeInTheDocument();
        expect(screen.getByText('2000')).toBeInTheDocument();
        expect(screen.getByText('liability')).toBeInTheDocument();

        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Retained Earnings')).toBeInTheDocument();
        expect(screen.getByText('3000')).toBeInTheDocument();
        expect(screen.getByText('equity')).toBeInTheDocument();
      });
    });

    it('applies striped table class', async () => {
      mockedApi.getLedgerAccounts.mockResolvedValue({
        data: mockAccounts
      });

      renderWithProviders(<LedgerAccountList />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toHaveClass('striped-table');
      });
    });
  });

  describe('API Integration', () => {
    it('calls getLedgerAccounts on mount', async () => {
      mockedApi.getLedgerAccounts.mockResolvedValue({
        data: mockAccounts
      });

      renderWithProviders(<LedgerAccountList />);

      await waitFor(() => {
        expect(mockedApi.getLedgerAccounts).toHaveBeenCalledTimes(1);
        expect(mockedApi.getLedgerAccounts).toHaveBeenCalledWith();
      });
    });

    it('handles paginated response format', async () => {
      const paginatedResponse = {
        data: {
          results: mockAccounts,
          count: 3,
          next: null,
          previous: null
        }
      };

      mockedApi.getLedgerAccounts.mockResolvedValue(paginatedResponse);

      renderWithProviders(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByText('Cash Account')).toBeInTheDocument();
        expect(screen.getByText('Accounts Payable')).toBeInTheDocument();
        expect(screen.getByText('Retained Earnings')).toBeInTheDocument();
      });
    });

    it('handles direct array response format', async () => {
      mockedApi.getLedgerAccounts.mockResolvedValue({
        data: mockAccounts
      });

      renderWithProviders(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByText('Cash Account')).toBeInTheDocument();
        expect(screen.getByText('Accounts Payable')).toBeInTheDocument();
        expect(screen.getByText('Retained Earnings')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockedApi.getLedgerAccounts.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<LedgerAccountList />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch ledger accounts:', expect.any(Error));
      });

      // Should still render table structure even with error
      expect(screen.getByRole('table')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('handles malformed response data', async () => {
      mockedApi.getLedgerAccounts.mockResolvedValue({
        data: null // Malformed response
      });

      renderWithProviders(<LedgerAccountList />);

      await waitFor(() => {
        // Should render empty table
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.queryByText('Cash Account')).not.toBeInTheDocument();
      });
    });

    it('handles non-object response data', async () => {
      mockedApi.getLedgerAccounts.mockResolvedValue({
        data: 'invalid response'
      });

      renderWithProviders(<LedgerAccountList />);

      await waitFor(() => {
        // Should render empty table
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.queryByText('Cash Account')).not.toBeInTheDocument();
      });
    });

    it('handles empty results array', async () => {
      mockedApi.getLedgerAccounts.mockResolvedValue({
        data: {
          results: []
        }
      });

      renderWithProviders(<LedgerAccountList />);

      await waitFor(() => {
        // Should render table with no rows
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.queryByText('Cash Account')).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('renders table structure with no accounts', async () => {
      mockedApi.getLedgerAccounts.mockResolvedValue({
        data: []
      });

      renderWithProviders(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByText('ID')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Code')).toBeInTheDocument();
        expect(screen.getByText('Type')).toBeInTheDocument();
      });
    });

    it('handles empty paginated response', async () => {
      mockedApi.getLedgerAccounts.mockResolvedValue({
        data: {
          results: [],
          count: 0
        }
      });

      renderWithProviders(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.queryByRole('row')).toBeTruthy(); // Header row should exist
      });
    });
  });

  describe('Data Transformation', () => {
    it('handles accounts with missing fields gracefully', async () => {
      const incompleteAccounts = [
        { id: 1, name: 'Test Account' }, // Missing code and account_type
        { id: 2, code: '1000' }, // Missing name and account_type
        { id: 3, account_type: 'asset' } // Missing name and code
      ];

      mockedApi.getLedgerAccounts.mockResolvedValue({
        data: incompleteAccounts
      });

      renderWithProviders(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('Test Account')).toBeInTheDocument();
        // Should handle undefined values gracefully
      });
    });

    it('displays account types correctly', async () => {
      const diverseAccounts = [
        { id: 1, name: 'Asset Account', code: '1000', account_type: 'asset' },
        { id: 2, name: 'Liability Account', code: '2000', account_type: 'liability' },
        { id: 3, name: 'Equity Account', code: '3000', account_type: 'equity' },
        { id: 4, name: 'Revenue Account', code: '4000', account_type: 'revenue' },
        { id: 5, name: 'Expense Account', code: '5000', account_type: 'expense' }
      ];

      mockedApi.getLedgerAccounts.mockResolvedValue({
        data: diverseAccounts
      });

      renderWithProviders(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByText('asset')).toBeInTheDocument();
        expect(screen.getByText('liability')).toBeInTheDocument();
        expect(screen.getByText('equity')).toBeInTheDocument();
        expect(screen.getByText('revenue')).toBeInTheDocument();
        expect(screen.getByText('expense')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('renders large account lists efficiently', async () => {
      const largeAccountList = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Account ${i + 1}`,
        code: `${1000 + i}`,
        account_type: 'asset'
      }));

      mockedApi.getLedgerAccounts.mockResolvedValue({
        data: largeAccountList
      });

      const startTime = performance.now();
      renderWithProviders(<LedgerAccountList />);
      const endTime = performance.now();

      // Initial render should be fast
      expect(endTime - startTime).toBeLessThan(100);

      await waitFor(() => {
        expect(screen.getByText('Account 1')).toBeInTheDocument();
        expect(screen.getByText('Account 100')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG 2.1 AA standards', async () => {
      mockedApi.getLedgerAccounts.mockResolvedValue({
        data: mockAccounts
      });

      await testComponentAccessibility(<LedgerAccountList />);
    });

    it('has proper table structure', async () => {
      mockedApi.getLedgerAccounts.mockResolvedValue({
        data: mockAccounts
      });

      renderWithProviders(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Code' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Type' })).toBeInTheDocument();
      });
    });

    it('has proper table data cells', async () => {
      mockedApi.getLedgerAccounts.mockResolvedValue({
        data: mockAccounts
      });

      renderWithProviders(<LedgerAccountList />);

      await waitFor(() => {
        // Should have proper table cell structure
        const cells = screen.getAllByRole('cell');
        expect(cells.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('only calls API once on mount', async () => {
      mockedApi.getLedgerAccounts.mockResolvedValue({
        data: mockAccounts
      });

      const { rerender } = renderWithProviders(<LedgerAccountList />);

      await waitFor(() => {
        expect(mockedApi.getLedgerAccounts).toHaveBeenCalledTimes(1);
      });

      // Rerender should not trigger additional API calls
      rerender(<LedgerAccountList />);

      expect(mockedApi.getLedgerAccounts).toHaveBeenCalledTimes(1);
    });

    it('handles component unmounting during API call', async () => {
      mockedApi.getLedgerAccounts.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: mockAccounts }), 100))
      );

      const { unmount } = renderWithProviders(<LedgerAccountList />);

      // Unmount before API resolves
      unmount();

      // Should not cause any errors
      await new Promise(resolve => setTimeout(resolve, 200));
    });
  });

  describe('Data Consistency', () => {
    it('displays accounts in correct order', async () => {
      const orderedAccounts = [
        { id: 1, name: 'Account A', code: '1000', account_type: 'asset' },
        { id: 2, name: 'Account B', code: '2000', account_type: 'liability' },
        { id: 3, name: 'Account C', code: '3000', account_type: 'equity' }
      ];

      mockedApi.getLedgerAccounts.mockResolvedValue({
        data: orderedAccounts
      });

      renderWithProviders(<LedgerAccountList />);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // First row is header, then data rows
        expect(rows[1]).toHaveTextContent('1');
        expect(rows[1]).toHaveTextContent('Account A');
        expect(rows[2]).toHaveTextContent('2');
        expect(rows[2]).toHaveTextContent('Account B');
        expect(rows[3]).toHaveTextContent('3');
        expect(rows[3]).toHaveTextContent('Account C');
      });
    });

    it('handles duplicate account codes', async () => {
      const accountsWithDuplicates = [
        { id: 1, name: 'Account 1', code: '1000', account_type: 'asset' },
        { id: 2, name: 'Account 2', code: '1000', account_type: 'liability' },
        { id: 3, name: 'Account 3', code: '2000', account_type: 'equity' }
      ];

      mockedApi.getLedgerAccounts.mockResolvedValue({
        data: accountsWithDuplicates
      });

      renderWithProviders(<LedgerAccountList />);

      await waitFor(() => {
        // Should display all accounts even with duplicate codes
        expect(screen.getAllByText('1000')).toHaveLength(2);
        expect(screen.getByText('2000')).toBeInTheDocument();
      });
    });
  });
});
