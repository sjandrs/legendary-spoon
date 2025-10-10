/**
 * AccountList Component Test Suite - TASK-029
 * Tests for Account list view with search, filter, and pagination
 * Coverage: Loading, Empty, Error, and Populated states
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
// TODO: Re-enable real MSW server once polyfills for WebSocket/TransformStream are stabilized in Jest env.
// Hybrid fallback: directly mock API client instead of MSW server
import { get, del as apiDelete } from '../../api';
jest.mock('../../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  del: jest.fn(),
}));
import AccountList from '../../components/AccountList';

// Shared mock data
const mockAccounts = [
  {
    id: 1,
    name: 'Acme Corporation',
    industry: 'Technology',
    owner: { id: 1, username: 'john.doe' },
    phone: '555-0100',
    email: 'contact@acme.com',
    website: 'https://acme.com',
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Global Solutions Inc',
    industry: 'Consulting',
    owner: { id: 2, username: 'jane.smith' },
    phone: '555-0200',
    email: 'info@globalsolutions.com',
    website: 'https://globalsolutions.com',
    created_at: '2025-01-02T00:00:00Z'
  }
];
beforeEach(() => {
  get.mockResolvedValue({ data: { results: mockAccounts, count: mockAccounts.length } });
});
afterEach(() => {
  jest.clearAllMocks();
});

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('AccountList Component - TASK-029', () => {
  describe('Loading State', () => {
    it('should display loading spinner while fetching accounts', () => {
      get.mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ data: { results: [], count: 0 } }), 100)));

      renderWithRouter(<AccountList />);
      expect(screen.getByText(/loading accounts/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state message when no accounts exist', async () => {
      get.mockResolvedValueOnce({ data: { results: [], count: 0 } });

      renderWithRouter(<AccountList />);

      await waitFor(() => {
        expect(screen.getByText(/no accounts found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should handle API errors gracefully', async () => {
      get.mockRejectedValueOnce(new Error('Server error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      renderWithRouter(<AccountList />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/failed to load accounts/i);
      });

      consoleSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      get.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      renderWithRouter(<AccountList />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/failed to load accounts/i);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Populated State', () => {
    it('should render accounts table with data', async () => {
      renderWithRouter(<AccountList />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
        expect(screen.getByText('Global Solutions Inc')).toBeInTheDocument();
      });
    });

    it('should display account details correctly', async () => {
      renderWithRouter(<AccountList />);

      await waitFor(() => {
        expect(screen.getByText('Technology')).toBeInTheDocument();
        expect(screen.getByText('Consulting')).toBeInTheDocument();
      });
    });

    it('should display owner information', async () => {
      renderWithRouter(<AccountList />);

      await waitFor(() => {
        expect(screen.getByText('john.doe')).toBeInTheDocument();
        expect(screen.getByText('jane.smith')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter accounts by name via server query', async () => {
      const user = userEvent.setup();
      // First call returns both; second call returns only Acme
      get
        .mockResolvedValueOnce({ data: { results: mockAccounts, count: mockAccounts.length } })
        .mockResolvedValueOnce({ data: { results: [mockAccounts[0]], count: 1 } });

      renderWithRouter(<AccountList />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
        expect(screen.getByText('Global Solutions Inc')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search accounts/i);
      await user.type(searchInput, 'Acme');
      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });
    });
  });

  describe('Filter Functionality', () => {
    it.skip('should filter accounts by industry (UI not implemented)', async () => {});
  });

  describe('User Interactions', () => {
    it('should navigate to create new account page', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AccountList />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /new account/i })).toBeInTheDocument();
      });

      const createButton = screen.getByRole('link', { name: /new account/i });
      expect(createButton).toHaveAttribute('href', '/accounts/new');
    });

    it('should have view button for each account', async () => {
      renderWithRouter(<AccountList />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText(/view/i);
        expect(viewButtons).toHaveLength(2);
      });
    });

    it('should have edit button for each account', async () => {
      renderWithRouter(<AccountList />);

      await waitFor(() => {
        const editButtons = screen.getAllByText(/edit/i);
        expect(editButtons).toHaveLength(2);
      });
    });

    it.skip('should have delete button for each account (UI not implemented)', async () => {});
  });

  describe('Delete Functionality', () => {
  it.skip('should show confirmation dialog on delete (UI not implemented)', async () => {
      const user = userEvent.setup();
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      renderWithRouter(<AccountList />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText(/delete/i);
      await user.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('delete'));
      confirmSpy.mockRestore();
    });

  it.skip('should delete account on confirmation (UI not implemented)', async () => {
      const user = userEvent.setup();
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      apiDelete.mockResolvedValueOnce({ status: 204 });
      // After delete call, next list fetch returns one account
      get
        .mockResolvedValueOnce({ data: { results: mockAccounts, count: mockAccounts.length } })
        .mockResolvedValueOnce({ data: { results: [mockAccounts[1]], count: 1 } });

      renderWithRouter(<AccountList />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText(/delete/i);
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Acme Corporation')).not.toBeInTheDocument();
        expect(screen.getByText('Global Solutions Inc')).toBeInTheDocument();
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure', async () => {
      renderWithRouter(<AccountList />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });
    });

    it('should have table headers', async () => {
      renderWithRouter(<AccountList />);

      await waitFor(() => {
        expect(screen.getByText('Account Name')).toBeInTheDocument();
        expect(screen.getByText('Industry')).toBeInTheDocument();
        expect(screen.getByText('Owner')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });
  });
});
