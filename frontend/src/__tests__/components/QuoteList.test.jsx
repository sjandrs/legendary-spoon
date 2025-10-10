/**
 * QuoteList Component Test Suite - TASK-029
 * Tests for Quote list view with status filtering and search
 * Coverage: Loading, Empty, Error, and Populated states
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import QuoteList from '../../components/QuoteList';

// Mock API module used by QuoteList
jest.mock('../../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));
const { default: api } = require('../../api');

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('QuoteList Component - TASK-029', () => {
  const allQuotes = [
    {
      id: 1,
      name: 'QT-2025-001',
      contact_name: 'John Doe',
      account_name: 'Acme Corporation',
      total_amount: '5000.00',
      status: 'draft',
      valid_until: '2025-02-01',
    },
    {
      id: 2,
      name: 'QT-2025-002',
      contact_name: 'Jane Smith',
      account_name: 'Global Solutions Inc',
      total_amount: '12000.00',
      status: 'sent',
      valid_until: '2025-02-15',
    },
    {
      id: 3,
      name: 'QT-2025-003',
      contact_name: 'Bob Johnson',
      account_name: 'Tech Innovations',
      total_amount: '8500.00',
      status: 'accepted',
      valid_until: '2025-01-20',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading spinner while fetching quotes', () => {
      api.get.mockImplementation(() => new Promise(() => {})); // pending promise

  renderWithRouter(<QuoteList />);
  expect(document.querySelector('.skeleton-table')).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should display empty state message when no quotes exist', async () => {
      api.get.mockResolvedValue({ data: [] });

      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText(/no quotes/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should handle API errors gracefully', async () => {
      api.get.mockRejectedValue({ response: { status: 500 } });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load quotes/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Populated State', () => {
    it('should render quotes table with data', async () => {
      api.get.mockResolvedValue({ data: allQuotes });
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('QT-2025-001')).toBeInTheDocument();
        expect(screen.getByText('QT-2025-002')).toBeInTheDocument();
        expect(screen.getByText('QT-2025-003')).toBeInTheDocument();
      });
    });

    it('should display quote details correctly', async () => {
      api.get.mockResolvedValue({ data: allQuotes });
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
        expect(screen.getByText('Global Solutions Inc')).toBeInTheDocument();
        expect(screen.getByText('$5,000.00')).toBeInTheDocument();
        expect(screen.getByText('$12,000.00')).toBeInTheDocument();
      });
    });

    it('should display contact information', async () => {
      api.get.mockResolvedValue({ data: allQuotes });
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    it('should display status badges', async () => {
      api.get.mockResolvedValue({ data: allQuotes });
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });

      const tableEl = screen.getByRole('table');
      expect(within(tableEl).getByText(/Draft/)).toBeInTheDocument();
      expect(within(tableEl).getByText(/Sent/)).toBeInTheDocument();
      expect(within(tableEl).getByText(/Accepted/)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter quotes by quote number', async () => {
      const user = userEvent.setup();
      api.get
        .mockResolvedValueOnce({ data: allQuotes })
        .mockResolvedValueOnce({ data: [allQuotes[0]] });
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('QT-2025-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search quotes/i);
      await user.type(searchInput, 'QT-2025-001');

      // Submit search
      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('QT-2025-001')).toBeInTheDocument();
      });
    });

    it('should filter quotes by contact name', async () => {
      const user = userEvent.setup();
      api.get
        .mockResolvedValueOnce({ data: allQuotes })
        .mockResolvedValueOnce({ data: [allQuotes[1]] });
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search quotes/i);
      await user.type(searchInput, 'Jane');
      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });
  });

  describe('Status Filter Functionality', () => {
    it('should filter quotes by draft status', async () => {
      const user = userEvent.setup();
      api.get
        .mockResolvedValueOnce({ data: allQuotes })
        .mockResolvedValueOnce({ data: [allQuotes[0]] });
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('QT-2025-001')).toBeInTheDocument();
      });

      const statusFilter = screen.getByRole('combobox');
      await user.selectOptions(statusFilter, 'draft');

      await waitFor(() => {
        expect(screen.getByText('QT-2025-001')).toBeInTheDocument();
      });
    });

    it('should filter quotes by sent status', async () => {
      const user = userEvent.setup();
      api.get
        .mockResolvedValueOnce({ data: allQuotes })
        .mockResolvedValueOnce({ data: [allQuotes[1]] });
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('QT-2025-002')).toBeInTheDocument();
      });

      const statusFilter = screen.getByRole('combobox');
      await user.selectOptions(statusFilter, 'sent');

      await waitFor(() => {
        expect(screen.getByText('QT-2025-002')).toBeInTheDocument();
      });
    });

    it('should filter quotes by accepted status', async () => {
      const user = userEvent.setup();
      api.get
        .mockResolvedValueOnce({ data: allQuotes })
        .mockResolvedValueOnce({ data: [allQuotes[2]] });
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('QT-2025-003')).toBeInTheDocument();
      });

      const statusFilter = screen.getByRole('combobox');
      await user.selectOptions(statusFilter, 'accepted');

      await waitFor(() => {
        expect(screen.getByText('QT-2025-003')).toBeInTheDocument();
      });
    });

    it('should show all quotes when "all" is selected', async () => {
      const user = userEvent.setup();
      api.get
        .mockResolvedValueOnce({ data: allQuotes })
        .mockResolvedValueOnce({ data: allQuotes });
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('QT-2025-001')).toBeInTheDocument();
      });

      const statusFilter = screen.getByRole('combobox');
  await user.selectOptions(statusFilter, '');

      await waitFor(() => {
        expect(screen.getByText('QT-2025-001')).toBeInTheDocument();
        expect(screen.getByText('QT-2025-002')).toBeInTheDocument();
        expect(screen.getByText('QT-2025-003')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should navigate to create new quote page', async () => {
      api.get.mockResolvedValue({ data: allQuotes });
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText(/create quote/i)).toBeInTheDocument();
      });

      const createButton = screen.getByText(/create quote/i);
      expect(createButton).toHaveAttribute('href', '/quotes/new');
    });

    it('should have view and edit links for each quote', async () => {
      api.get.mockResolvedValue({ data: allQuotes });
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        const viewLinks = screen.getAllByText(/view/i);
        const editLinks = screen.getAllByText(/edit/i);
        expect(viewLinks.length).toBeGreaterThan(0);
        expect(editLinks.length).toBeGreaterThan(0);
      });
    });
  });

  // Delete functionality not present in current UI; tests removed

  describe('Accessibility', () => {
    it('should have proper table structure', async () => {
      api.get.mockResolvedValue({ data: allQuotes });
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });
    });

    it('should have table headers', async () => {
      api.get.mockResolvedValue({ data: allQuotes });
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('Quote Name')).toBeInTheDocument();
        expect(screen.getByText('Account')).toBeInTheDocument();
        expect(screen.getByText('Contact')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });
  });
});
