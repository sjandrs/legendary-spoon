/**
 * LedgerAccountList Component Test Suite
 * REQ-201.2: Ledger Account Components - List Display Testing
 *
 * Tests chart of accounts display, account hierarchy, categorization,
 * data loading, and accessibility for ledger account management.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import LedgerAccountList from '../../components/LedgerAccountList';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  getLedgerAccounts: jest.fn(),
}));

const mockApi = api;

// Mock console.error to prevent test noise
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('LedgerAccountList Component - REQ-201.2', () => {
  const mockLedgerAccounts = [
    {
      id: 1,
      name: 'Cash',
      code: '1000',
      account_type: 'asset'
    },
    {
      id: 2,
      name: 'Accounts Receivable',
      code: '1200',
      account_type: 'asset'
    },
    {
      id: 3,
      name: 'Accounts Payable',
      code: '2000',
      account_type: 'liability'
    },
    {
      id: 4,
      name: 'Service Revenue',
      code: '4000',
      account_type: 'revenue'
    },
    {
      id: 5,
      name: 'Office Expenses',
      code: '5000',
      account_type: 'expense'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.getLedgerAccounts.mockResolvedValue({
      data: { results: mockLedgerAccounts }
    });
  });

  describe('Data Loading and Display', () => {
    it('shows loading state while fetching ledger accounts', async () => {
      // Create a promise that never resolves to keep loading state
      mockApi.getLedgerAccounts.mockReturnValue(new Promise(() => {}));

      render(<LedgerAccountList />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('displays ledger accounts in table format correctly', async () => {
      render(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByText('Cash')).toBeInTheDocument();
        expect(screen.getByText('1000')).toBeInTheDocument();
        expect(screen.getAllByText('asset')).toHaveLength(2); // Two asset accounts

        expect(screen.getByText('Accounts Payable')).toBeInTheDocument();
        expect(screen.getByText('2000')).toBeInTheDocument();
        expect(screen.getByText('liability')).toBeInTheDocument();
      });
    });

    it('handles empty ledger accounts list', async () => {
      mockApi.getLedgerAccounts.mockResolvedValue({ data: { results: [] } });

      render(<LedgerAccountList />);

      await waitFor(() => {
        // Table headers should still be visible
        expect(screen.getByText('ID')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Code')).toBeInTheDocument();
        expect(screen.getByText('Type')).toBeInTheDocument();

        // But no account rows
        expect(screen.queryByText('Cash')).not.toBeInTheDocument();
      });
    });

    it('handles direct array response format', async () => {
      mockApi.getLedgerAccounts.mockResolvedValue({ data: mockLedgerAccounts });

      render(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByText('Cash')).toBeInTheDocument();
        expect(screen.getByText('Service Revenue')).toBeInTheDocument();
      });
    });

    it('makes correct API call on component mount', async () => {
      render(<LedgerAccountList />);

      expect(mockApi.getLedgerAccounts).toHaveBeenCalledTimes(1);

      await waitFor(() => {
        expect(screen.getByText('Cash')).toBeInTheDocument();
      });
    });

    it('displays all ledger account fields correctly', async () => {
      render(<LedgerAccountList />);

      await waitFor(() => {
        // Check that all fields from mock data are displayed
        mockLedgerAccounts.forEach(account => {
          expect(screen.getByText(account.id.toString())).toBeInTheDocument();
          expect(screen.getByText(account.name)).toBeInTheDocument();
          expect(screen.getByText(account.code)).toBeInTheDocument();
        });

        // Check account types with proper counting
        expect(screen.getAllByText('asset')).toHaveLength(2);
        expect(screen.getByText('liability')).toBeInTheDocument();
        expect(screen.getByText('revenue')).toBeInTheDocument();
        expect(screen.getByText('expense')).toBeInTheDocument();
      });
    });
  });

  describe('Table Structure and Accessibility', () => {
    it('has proper table structure with headers', async () => {
      render(<LedgerAccountList />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
        expect(table).toHaveClass('striped-table');

        // Check for proper table headers
        expect(screen.getByRole('columnheader', { name: /id/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /code/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /type/i })).toBeInTheDocument();
      });
    });

    it('creates accessible table rows for each ledger account', async () => {
      render(<LedgerAccountList />);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // Header row + data rows
        expect(rows).toHaveLength(mockLedgerAccounts.length + 1);
      });
    });

    it('applies correct CSS classes', async () => {
      render(<LedgerAccountList />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toHaveClass('striped-table');
      });
    });
  });

  describe('Account Type Display and Categorization', () => {
    it('displays asset accounts correctly', async () => {
      render(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByText('Cash')).toBeInTheDocument();
        expect(screen.getByText('Accounts Receivable')).toBeInTheDocument();

        // Check that asset type is displayed
        const assetCells = screen.getAllByText('asset');
        expect(assetCells).toHaveLength(2); // Two asset accounts in mock data
      });
    });

    it('displays liability accounts correctly', async () => {
      render(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByText('Accounts Payable')).toBeInTheDocument();
        expect(screen.getByText('liability')).toBeInTheDocument();
      });
    });

    it('displays revenue accounts correctly', async () => {
      render(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByText('Service Revenue')).toBeInTheDocument();
        expect(screen.getByText('revenue')).toBeInTheDocument();
      });
    });

    it('displays expense accounts correctly', async () => {
      render(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByText('Office Expenses')).toBeInTheDocument();
        expect(screen.getByText('expense')).toBeInTheDocument();
      });
    });

    it('displays account codes in proper format', async () => {
      render(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByText('1000')).toBeInTheDocument(); // Cash
        expect(screen.getByText('1200')).toBeInTheDocument(); // A/R
        expect(screen.getByText('2000')).toBeInTheDocument(); // A/P
        expect(screen.getByText('4000')).toBeInTheDocument(); // Revenue
        expect(screen.getByText('5000')).toBeInTheDocument(); // Expenses
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockApi.getLedgerAccounts.mockRejectedValue(new Error('Network error'));

      render(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        // Component should not crash and should show empty table
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch ledger accounts:',
        expect.any(Error)
      );
    });

    it('handles malformed API response', async () => {
      mockApi.getLedgerAccounts.mockResolvedValue({ data: null });

      render(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('handles API response without results property', async () => {
      mockApi.getLedgerAccounts.mockResolvedValue({ data: { accounts: mockLedgerAccounts } });

      render(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });
  });

  describe('Chart of Accounts Integration', () => {
    it('displays accounts in ID order', async () => {
      render(<LedgerAccountList />);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        const dataRows = rows.slice(1); // Remove header row

        // Check that accounts appear in the expected order
        expect(dataRows[0]).toHaveTextContent('1Cash1000asset');
        expect(dataRows[1]).toHaveTextContent('2Accounts Receivable1200asset');
        expect(dataRows[2]).toHaveTextContent('3Accounts Payable2000liability');
        expect(dataRows[3]).toHaveTextContent('4Service Revenue4000revenue');
        expect(dataRows[4]).toHaveTextContent('5Office Expenses5000expense');
      });
    });

    it('handles mixed account types correctly', async () => {
      const mixedAccounts = [
        { id: 1, name: 'Cash', code: '1000', account_type: 'asset' },
        { id: 2, name: 'Revenue', code: '4000', account_type: 'revenue' },
        { id: 3, name: 'Liability', code: '2000', account_type: 'liability' },
        { id: 4, name: 'Equity', code: '3000', account_type: 'equity' },
        { id: 5, name: 'Expense', code: '5000', account_type: 'expense' }
      ];

      mockApi.getLedgerAccounts.mockResolvedValue({ data: { results: mixedAccounts } });

      render(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByText('asset')).toBeInTheDocument();
        expect(screen.getByText('revenue')).toBeInTheDocument();
        expect(screen.getByText('liability')).toBeInTheDocument();
        expect(screen.getByText('equity')).toBeInTheDocument();
        expect(screen.getByText('expense')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Large Datasets', () => {
    it('handles large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Account ${i + 1}`,
        code: `${1000 + i}`,
        account_type: ['asset', 'liability', 'equity', 'revenue', 'expense'][i % 5]
      }));

      mockApi.getLedgerAccounts.mockResolvedValue({ data: { results: largeDataset } });

      const startTime = performance.now();
      render(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByText('Account 1')).toBeInTheDocument();
        expect(screen.getByText('Account 100')).toBeInTheDocument();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should render within 1 second
    });

    it('renders table with many rows efficiently', async () => {
      const manyAccounts = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `Test Account ${i + 1}`,
        code: `TEST${String(i + 1).padStart(3, '0')}`,
        account_type: 'asset'
      }));

      mockApi.getLedgerAccounts.mockResolvedValue({ data: { results: manyAccounts } });

      render(<LedgerAccountList />);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows).toHaveLength(51); // Header + 50 data rows
      });
    });
  });

  describe('Component Integration', () => {
    it('integrates with API module correctly', async () => {
      render(<LedgerAccountList />);

      expect(mockApi.getLedgerAccounts).toHaveBeenCalledWith();

      await waitFor(() => {
        expect(screen.getByText('Cash')).toBeInTheDocument();
      });
    });

    it('handles component remounting correctly', async () => {
      const { unmount } = render(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByText('Cash')).toBeInTheDocument();
      });

      unmount();

      // Re-mount the component
      render(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByText('Cash')).toBeInTheDocument();
      });

      expect(mockApi.getLedgerAccounts).toHaveBeenCalledTimes(2);
    });
  });

  describe('Special Characters and Edge Cases', () => {
    it('handles special characters in account names', async () => {
      const specialAccounts = [
        { id: 1, name: 'Petty Cash & Expenses', code: 'PC&E-001', account_type: 'asset' },
        { id: 2, name: 'A/R - Trade', code: 'AR-T', account_type: 'asset' },
        { id: 3, name: 'Employee Benefits (401k)', code: 'EB401K', account_type: 'expense' }
      ];

      mockApi.getLedgerAccounts.mockResolvedValue({ data: { results: specialAccounts } });

      render(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByText('Petty Cash & Expenses')).toBeInTheDocument();
        expect(screen.getByText('A/R - Trade')).toBeInTheDocument();
        expect(screen.getByText('Employee Benefits (401k)')).toBeInTheDocument();
      });
    });

    it('handles very long account names', async () => {
      const longNameAccounts = [
        {
          id: 1,
          name: 'Very Long Account Name That Exceeds Normal Length Expectations For Testing',
          code: 'VLNG001',
          account_type: 'asset'
        }
      ];

      mockApi.getLedgerAccounts.mockResolvedValue({ data: { results: longNameAccounts } });

      render(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByText('Very Long Account Name That Exceeds Normal Length Expectations For Testing')).toBeInTheDocument();
      });
    });

    it('handles missing or null values in accounts', async () => {
      const incompleteAccounts = [
        { id: 1, name: 'Complete Account', code: '1000', account_type: 'asset' },
        { id: 2, name: '', code: '2000', account_type: 'liability' },
        { id: 3, name: 'No Code Account', code: '', account_type: 'revenue' },
        { id: 4, name: 'No Type Account', code: '4000', account_type: '' }
      ];

      mockApi.getLedgerAccounts.mockResolvedValue({ data: { results: incompleteAccounts } });

      render(<LedgerAccountList />);

      await waitFor(() => {
        expect(screen.getByText('Complete Account')).toBeInTheDocument();
        // Component should not crash with missing values
        const rows = screen.getAllByRole('row');
        expect(rows).toHaveLength(5); // Header + 4 data rows
      });
    });
  });
});
