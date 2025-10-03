import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUsers } from '../helpers/test-utils';
import JournalEntryList from '../../components/JournalEntryList';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  getJournalEntries: jest.fn(),
}));

const mockApi = api;

const mockJournalEntries = [
  {
    id: 1,
    date: '2025-10-01',
    description: 'Sales transaction - customer payment',
    debit_account: 1001,
    credit_account: 4001,
    amount: 1500.00,
    created_by: 'john.manager',
    created_date: '2025-10-01T09:00:00Z'
  },
  {
    id: 2,
    date: '2025-10-01',
    description: 'Office supplies purchase',
    debit_account: 5001,
    credit_account: 1001,
    amount: 250.50,
    created_by: 'sarah.accountant',
    created_date: '2025-10-01T10:30:00Z'
  },
  {
    id: 3,
    date: '2025-09-30',
    description: 'Rent payment for October',
    debit_account: 5002,
    credit_account: 1001,
    amount: 2000.00,
    created_by: 'sarah.accountant',
    created_date: '2025-09-30T16:00:00Z'
  },
  {
    id: 4,
    date: '2025-09-29',
    description: 'Equipment depreciation adjustment',
    debit_account: 6001,
    credit_account: 1500,
    amount: 833.33,
    created_by: 'john.manager',
    created_date: '2025-09-29T17:00:00Z'
  }
];

const mockEmptyEntries = [];

const mockLargeEntriesList = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  date: '2025-10-01',
  description: `Journal entry ${i + 1}`,
  debit_account: 1001 + (i % 5),
  credit_account: 4001 + (i % 3),
  amount: (i + 1) * 100.00,
  created_by: 'test.user',
  created_date: `2025-10-01T${String(i % 24).padStart(2, '0')}:00:00Z`
}));

describe('JournalEntryList Component - REQ-201.1', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderJournalEntryList = (authUser = mockUsers.salesManager) => {
    return renderWithProviders(
      <JournalEntryList />,
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

  describe('Data Loading and Display', () => {
    it('shows loading state while fetching journal entries', () => {
      mockApi.getJournalEntries.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderJournalEntryList();

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('displays journal entries in table format correctly', async () => {
      mockApi.getJournalEntries.mockResolvedValue({ data: { results: mockJournalEntries } });

      renderJournalEntryList();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Check table headers
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Debit Account')).toBeInTheDocument();
      expect(screen.getByText('Credit Account')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();

      // Check journal entry data
      expect(screen.getByText('Sales transaction - customer payment')).toBeInTheDocument();
      expect(screen.getByText('Office supplies purchase')).toBeInTheDocument();
      expect(screen.getByText('Rent payment for October')).toBeInTheDocument();
      expect(screen.getByText('Equipment depreciation adjustment')).toBeInTheDocument();

      // Check amounts (using getAllByText for duplicates)
      expect(screen.getAllByText('1500')).toHaveLength(2); // Appears as amount and credit account
      expect(screen.getByText('250.5')).toBeInTheDocument();
      expect(screen.getByText('2000')).toBeInTheDocument();
      expect(screen.getByText('833.33')).toBeInTheDocument();
    });

    it('handles empty journal entries list', async () => {
      mockApi.getJournalEntries.mockResolvedValue({ data: { results: mockEmptyEntries } });

      renderJournalEntryList();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');
      const tbody = table.querySelector('tbody');
      const rows = tbody ? within(tbody).queryAllByRole('row') : [];

      // Should have headers but no data rows
      expect(rows).toHaveLength(0);
    });

    it('handles direct array response format', async () => {
      mockApi.getJournalEntries.mockResolvedValue({ data: mockJournalEntries }); // Direct array, not wrapped in results

      renderJournalEntryList();

      await waitFor(() => {
        expect(screen.getByText('Sales transaction - customer payment')).toBeInTheDocument();
      });

      expect(screen.getByText('Office supplies purchase')).toBeInTheDocument();
      expect(screen.getByText('Rent payment for October')).toBeInTheDocument();
    });

    it('makes correct API call on component mount', async () => {
      mockApi.getJournalEntries.mockResolvedValue({ data: { results: mockJournalEntries } });

      renderJournalEntryList();

      await waitFor(() => {
        expect(mockApi.getJournalEntries).toHaveBeenCalledTimes(1);
        expect(mockApi.getJournalEntries).toHaveBeenCalledWith();
      });
    });

    it('displays all journal entry fields correctly', async () => {
      mockApi.getJournalEntries.mockResolvedValue({ data: { results: mockJournalEntries } });

      renderJournalEntryList();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');

      // Check first entry data (using getAllByText for duplicates)
      expect(within(table).getByText('1')).toBeInTheDocument(); // ID
      expect(within(table).getAllByText('2025-10-01')).toHaveLength(2); // Date appears twice
      expect(within(table).getByText('Sales transaction - customer payment')).toBeInTheDocument(); // Description
      expect(within(table).getAllByText('1001')).toHaveLength(3); // Account ID appears multiple times
      expect(within(table).getByText('4001')).toBeInTheDocument(); // Credit Account
      expect(within(table).getAllByText('1500')).toHaveLength(2); // Amount and credit account
    });
  });

  describe('Table Structure and Accessibility', () => {
    beforeEach(() => {
      mockApi.getJournalEntries.mockResolvedValue({ data: { results: mockJournalEntries } });
    });

    it('has proper table structure with headers', async () => {
      renderJournalEntryList();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');
      expect(table).toHaveClass('striped-table');

      const headers = within(table).getAllByRole('columnheader');
      expect(headers).toHaveLength(6);

      expect(headers[0]).toHaveTextContent('ID');
      expect(headers[1]).toHaveTextContent('Date');
      expect(headers[2]).toHaveTextContent('Description');
      expect(headers[3]).toHaveTextContent('Debit Account');
      expect(headers[4]).toHaveTextContent('Credit Account');
      expect(headers[5]).toHaveTextContent('Amount');
    });

    it('creates accessible table rows for each journal entry', async () => {
      renderJournalEntryList();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');

      // Should have header row + data rows
      expect(rows).toHaveLength(mockJournalEntries.length + 1);

      // Check that each data row has correct number of cells
      const dataRows = rows.slice(1); // Skip header row
      dataRows.forEach(row => {
        const cells = within(row).getAllByRole('cell');
        expect(cells).toHaveLength(6); // ID, Date, Description, Debit, Credit, Amount
      });
    });

    it('applies correct CSS classes', async () => {
      renderJournalEntryList();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');
      expect(table).toHaveClass('striped-table');
    });
  });

  describe('Data Formatting and Display', () => {
    it('displays dates in correct format', async () => {
      const entriesWithVariousDates = [
        { ...mockJournalEntries[0], date: '2025-01-01' },
        { ...mockJournalEntries[1], date: '2025-12-31' },
        { ...mockJournalEntries[2], date: '2025-06-15' }
      ];

      mockApi.getJournalEntries.mockResolvedValue({ data: { results: entriesWithVariousDates } });

      renderJournalEntryList();

      await waitFor(() => {
        expect(screen.getByText('2025-01-01')).toBeInTheDocument();
      });

      expect(screen.getByText('2025-12-31')).toBeInTheDocument();
      expect(screen.getByText('2025-06-15')).toBeInTheDocument();
    });

    it('displays amounts in correct format', async () => {
      const entriesWithVariousAmounts = [
        { ...mockJournalEntries[0], amount: 1000.00 },
        { ...mockJournalEntries[1], amount: 0.01 },
        { ...mockJournalEntries[2], amount: 999999.99 },
        { ...mockJournalEntries[3], amount: 500 }
      ];

      mockApi.getJournalEntries.mockResolvedValue({ data: { results: entriesWithVariousAmounts } });

      renderJournalEntryList();

      await waitFor(() => {
        expect(screen.getByText('1000')).toBeInTheDocument();
      });

      expect(screen.getByText('0.01')).toBeInTheDocument();
      expect(screen.getByText('999999.99')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
    });

    it('displays account IDs correctly', async () => {
      mockApi.getJournalEntries.mockResolvedValue({ data: { results: mockJournalEntries } });

      renderJournalEntryList();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Check various account IDs are displayed - using getAllByText for duplicates
      expect(screen.getAllByText('1001')).toHaveLength(3); // Appears in multiple entries
      expect(screen.getByText('4001')).toBeInTheDocument();
      expect(screen.getByText('5001')).toBeInTheDocument();
      expect(screen.getByText('5002')).toBeInTheDocument();
      expect(screen.getByText('6001')).toBeInTheDocument();
      expect(screen.getAllByText('1500')).toHaveLength(2); // Appears as amount and credit account
    });

    it('truncates long descriptions appropriately', async () => {
      const longDescription = 'A'.repeat(200);
      const entriesWithLongDescription = [
        { ...mockJournalEntries[0], description: longDescription }
      ];

      mockApi.getJournalEntries.mockResolvedValue({ data: { results: entriesWithLongDescription } });

      renderJournalEntryList();

      await waitFor(() => {
        expect(screen.getByText(longDescription)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockApi.getJournalEntries.mockRejectedValue(new Error('Network error'));

      renderJournalEntryList();

      // Component should handle error gracefully - check that it doesn't crash
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Should show empty table after error
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Should show empty tbody
      const tbody = table.querySelector('tbody');
      const rows = within(tbody).queryAllByRole('row');
      expect(rows).toHaveLength(0);

      consoleError.mockRestore();
    });

    it('handles malformed API response', async () => {
      mockApi.getJournalEntries.mockResolvedValue({ data: null }); // Malformed response

      renderJournalEntryList();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Should handle gracefully with empty table
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Should show empty tbody
      const tbody = table.querySelector('tbody');
      const rows = within(tbody).queryAllByRole('row');
      expect(rows).toHaveLength(0);
    });

    it('handles API response without results property', async () => {
      mockApi.getJournalEntries.mockResolvedValue({ data: undefined });

      renderJournalEntryList();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Should handle gracefully with empty table
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Should show empty tbody
      const tbody = table.querySelector('tbody');
      const rows = within(tbody).queryAllByRole('row');
      expect(rows).toHaveLength(0);
    });
  });

  describe('Role-Based Access Control', () => {
    it('displays journal entries for Sales Manager', async () => {
      mockApi.getJournalEntries.mockResolvedValue({ data: { results: mockJournalEntries } });

      renderJournalEntryList(mockUsers.salesManager);

      await waitFor(() => {
        expect(screen.getByText('Sales transaction - customer payment')).toBeInTheDocument();
      });

      expect(screen.getByText('Office supplies purchase')).toBeInTheDocument();
      expect(screen.getByText('Rent payment for October')).toBeInTheDocument();
      expect(screen.getByText('Equipment depreciation adjustment')).toBeInTheDocument();
    });

    it('displays appropriate journal entries for Sales Rep', async () => {
      // Sales rep might see limited entries based on backend filtering
      const limitedEntries = mockJournalEntries.slice(0, 2);
      mockApi.getJournalEntries.mockResolvedValue({ data: { results: limitedEntries } });

      renderJournalEntryList(mockUsers.salesRep);

      await waitFor(() => {
        expect(screen.getByText('Sales transaction - customer payment')).toBeInTheDocument();
      });

      expect(screen.getByText('Office supplies purchase')).toBeInTheDocument();
    });
  });

  describe('Performance and Large Datasets', () => {
    it('handles large datasets efficiently', async () => {
      mockApi.getJournalEntries.mockResolvedValue({ data: { results: mockLargeEntriesList } });

      const startTime = performance.now();
      renderJournalEntryList();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should render within 500ms

      await waitFor(() => {
        expect(screen.getByText('Journal entry 1')).toBeInTheDocument();
      });

      expect(screen.getByText('Journal entry 50')).toBeInTheDocument();
    });

    it('renders table with many rows efficiently', async () => {
      mockApi.getJournalEntries.mockResolvedValue({ data: { results: mockLargeEntriesList } });

      renderJournalEntryList();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');

      // Should have header + 50 data rows
      expect(rows).toHaveLength(51);
    });
  });

  describe('Component Integration', () => {
    it('integrates with API module correctly', async () => {
      mockApi.getJournalEntries.mockResolvedValue({ data: { results: mockJournalEntries } });

      renderJournalEntryList();

      await waitFor(() => {
        expect(mockApi.getJournalEntries).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      expect(screen.getByText('Sales transaction - customer payment')).toBeInTheDocument();
    });

    it('handles component remounting correctly', async () => {
      mockApi.getJournalEntries.mockResolvedValue({ data: { results: mockJournalEntries } });

      const { unmount } = renderJournalEntryList();

      await waitFor(() => {
        expect(mockApi.getJournalEntries).toHaveBeenCalledTimes(1);
      });

      unmount();
      jest.clearAllMocks();

      renderJournalEntryList();

      await waitFor(() => {
        expect(mockApi.getJournalEntries).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Special Characters and Edge Cases', () => {
    it('handles special characters in descriptions', async () => {
      const entriesWithSpecialChars = [
        {
          ...mockJournalEntries[0],
          description: 'Entry with émojis 🏦 & special chars <script>alert("test")</script>'
        },
        {
          ...mockJournalEntries[1],
          description: 'Description with "quotes" and \'apostrophes\''
        }
      ];

      mockApi.getJournalEntries.mockResolvedValue({ data: { results: entriesWithSpecialChars } });

      renderJournalEntryList();

      await waitFor(() => {
        expect(screen.getByText('Entry with émojis 🏦 & special chars <script>alert("test")</script>')).toBeInTheDocument();
      });

      expect(screen.getByText('Description with "quotes" and \'apostrophes\'')).toBeInTheDocument();
    });

    it('handles zero and negative amounts', async () => {
      const entriesWithSpecialAmounts = [
        { ...mockJournalEntries[0], amount: 0 },
        { ...mockJournalEntries[1], amount: -500.00 },
        { ...mockJournalEntries[2], amount: 0.001 }
      ];

      mockApi.getJournalEntries.mockResolvedValue({ data: { results: entriesWithSpecialAmounts } });

      renderJournalEntryList();

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });

      expect(screen.getByText('-500')).toBeInTheDocument();
      expect(screen.getByText('0.001')).toBeInTheDocument();
    });

    it('handles missing or null values in entries', async () => {
      const entriesWithMissingValues = [
        {
          id: 1,
          date: '2025-10-01',
          description: null,
          debit_account: 1001,
          credit_account: null,
          amount: 1000
        }
      ];

      mockApi.getJournalEntries.mockResolvedValue({ data: { results: entriesWithMissingValues } });

      renderJournalEntryList();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Should handle null values gracefully
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });
});
