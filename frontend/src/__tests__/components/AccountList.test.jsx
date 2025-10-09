/**
 * AccountList Component Test Suite - TASK-029
 * Tests for Account list view with search, filter, and pagination
 * Coverage: Loading, Empty, Error, and Populated states
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import AccountList from '../../components/AccountList';

// Mock server for API calls
const server = setupServer(
  rest.get('/api/accounts/', (req, res, ctx) => {
    return res(
      ctx.json([
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
      ])
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('AccountList Component - TASK-029', () => {
  describe('Loading State', () => {
    it('should display loading spinner while fetching accounts', () => {
      server.use(
        rest.get('/api/accounts/', (req, res, ctx) => {
          return res(ctx.delay(100), ctx.json([]));
        })
      );

      renderWithRouter(<AccountList />);
      expect(screen.getByText(/loading accounts/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state message when no accounts exist', async () => {
      server.use(
        rest.get('/api/accounts/', (req, res, ctx) => {
          return res(ctx.json([]));
        })
      );

      renderWithRouter(<AccountList />);

      await waitFor(() => {
        expect(screen.getByText(/no accounts found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should handle API errors gracefully', async () => {
      server.use(
        rest.get('/api/accounts/', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }));
        })
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      renderWithRouter(<AccountList />);

      await waitFor(() => {
        expect(screen.getByText(/no accounts found/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      server.use(
        rest.get('/api/accounts/', (req, res, ctx) => {
          return res.networkError('Network error');
        })
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      renderWithRouter(<AccountList />);

      await waitFor(() => {
        expect(screen.getByText(/no accounts found/i)).toBeInTheDocument();
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
        expect(screen.getByText('555-0100')).toBeInTheDocument();
        expect(screen.getByText('contact@acme.com')).toBeInTheDocument();
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
    it('should filter accounts by name', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AccountList />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search accounts/i);
      await user.type(searchInput, 'Acme');

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
        expect(screen.queryByText('Global Solutions Inc')).not.toBeInTheDocument();
      });
    });

    it('should show no results when search has no matches', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AccountList />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search accounts/i);
      await user.type(searchInput, 'NonexistentCompany');

      await waitFor(() => {
        expect(screen.queryByText('Acme Corporation')).not.toBeInTheDocument();
        expect(screen.queryByText('Global Solutions Inc')).not.toBeInTheDocument();
      });
    });
  });

  describe('Filter Functionality', () => {
    it('should filter accounts by industry', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AccountList />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      });

      const filterSelect = screen.getByRole('combobox');
      await user.selectOptions(filterSelect, 'Technology');

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
        expect(screen.queryByText('Global Solutions Inc')).not.toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should navigate to create new account page', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AccountList />);

      await waitFor(() => {
        expect(screen.getByText(/create account/i)).toBeInTheDocument();
      });

      const createButton = screen.getByText(/create account/i);
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

    it('should have delete button for each account', async () => {
      renderWithRouter(<AccountList />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByText(/delete/i);
        expect(deleteButtons).toHaveLength(2);
      });
    });
  });

  describe('Delete Functionality', () => {
    it('should show confirmation dialog on delete', async () => {
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

    it('should delete account on confirmation', async () => {
      const user = userEvent.setup();
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      server.use(
        rest.delete('/api/accounts/:id/', (req, res, ctx) => {
          return res(ctx.status(204));
        })
      );

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
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Industry')).toBeInTheDocument();
        expect(screen.getByText('Owner')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });
  });
});
