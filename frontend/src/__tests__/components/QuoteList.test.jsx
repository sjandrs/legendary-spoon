/**
 * QuoteList Component Test Suite - TASK-029
 * Tests for Quote list view with status filtering and search
 * Coverage: Loading, Empty, Error, and Populated states
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import QuoteList from '../../components/QuoteList';

// Mock server for API calls
const server = setupServer(
  rest.get('/api/quotes/', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: 1,
          quote_number: 'QT-2025-001',
          contact: { id: 1, first_name: 'John', last_name: 'Doe' },
          account: { id: 1, name: 'Acme Corporation' },
          total_amount: '5000.00',
          status: 'draft',
          valid_until: '2025-02-01',
          created_at: '2025-01-01T00:00:00Z'
        },
        {
          id: 2,
          quote_number: 'QT-2025-002',
          contact: { id: 2, first_name: 'Jane', last_name: 'Smith' },
          account: { id: 2, name: 'Global Solutions Inc' },
          total_amount: '12000.00',
          status: 'sent',
          valid_until: '2025-02-15',
          created_at: '2025-01-05T00:00:00Z'
        },
        {
          id: 3,
          quote_number: 'QT-2025-003',
          contact: { id: 3, first_name: 'Bob', last_name: 'Johnson' },
          account: { id: 3, name: 'Tech Innovations' },
          total_amount: '8500.00',
          status: 'accepted',
          valid_until: '2025-01-20',
          created_at: '2025-01-10T00:00:00Z'
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

describe('QuoteList Component - TASK-029', () => {
  describe('Loading State', () => {
    it('should display loading spinner while fetching quotes', () => {
      server.use(
        rest.get('/api/quotes/', (req, res, ctx) => {
          return res(ctx.delay(100), ctx.json([]));
        })
      );

      renderWithRouter(<QuoteList />);
      expect(screen.getByText(/loading quotes/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state message when no quotes exist', async () => {
      server.use(
        rest.get('/api/quotes/', (req, res, ctx) => {
          return res(ctx.json([]));
        })
      );

      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText(/no quotes found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should handle API errors gracefully', async () => {
      server.use(
        rest.get('/api/quotes/', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }));
        })
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText(/no quotes found/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Populated State', () => {
    it('should render quotes table with data', async () => {
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('QT-2025-001')).toBeInTheDocument();
        expect(screen.getByText('QT-2025-002')).toBeInTheDocument();
        expect(screen.getByText('QT-2025-003')).toBeInTheDocument();
      });
    });

    it('should display quote details correctly', async () => {
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
        expect(screen.getByText('Global Solutions Inc')).toBeInTheDocument();
        expect(screen.getByText('$5,000.00')).toBeInTheDocument();
        expect(screen.getByText('$12,000.00')).toBeInTheDocument();
      });
    });

    it('should display contact information', async () => {
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    it('should display status badges', async () => {
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText(/draft/i)).toBeInTheDocument();
        expect(screen.getByText(/sent/i)).toBeInTheDocument();
        expect(screen.getByText(/accepted/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter quotes by quote number', async () => {
      const user = userEvent.setup();
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('QT-2025-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search quotes/i);
      await user.type(searchInput, 'QT-2025-001');

      await waitFor(() => {
        expect(screen.getByText('QT-2025-001')).toBeInTheDocument();
        expect(screen.queryByText('QT-2025-002')).not.toBeInTheDocument();
      });
    });

    it('should filter quotes by contact name', async () => {
      const user = userEvent.setup();
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search quotes/i);
      await user.type(searchInput, 'Jane');

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });
  });

  describe('Status Filter Functionality', () => {
    it('should filter quotes by draft status', async () => {
      const user = userEvent.setup();
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('QT-2025-001')).toBeInTheDocument();
      });

      const statusFilter = screen.getByRole('combobox');
      await user.selectOptions(statusFilter, 'draft');

      await waitFor(() => {
        expect(screen.getByText('QT-2025-001')).toBeInTheDocument();
        expect(screen.queryByText('QT-2025-002')).not.toBeInTheDocument();
        expect(screen.queryByText('QT-2025-003')).not.toBeInTheDocument();
      });
    });

    it('should filter quotes by sent status', async () => {
      const user = userEvent.setup();
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('QT-2025-002')).toBeInTheDocument();
      });

      const statusFilter = screen.getByRole('combobox');
      await user.selectOptions(statusFilter, 'sent');

      await waitFor(() => {
        expect(screen.getByText('QT-2025-002')).toBeInTheDocument();
        expect(screen.queryByText('QT-2025-001')).not.toBeInTheDocument();
      });
    });

    it('should filter quotes by accepted status', async () => {
      const user = userEvent.setup();
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('QT-2025-003')).toBeInTheDocument();
      });

      const statusFilter = screen.getByRole('combobox');
      await user.selectOptions(statusFilter, 'accepted');

      await waitFor(() => {
        expect(screen.getByText('QT-2025-003')).toBeInTheDocument();
        expect(screen.queryByText('QT-2025-001')).not.toBeInTheDocument();
      });
    });

    it('should show all quotes when "all" is selected', async () => {
      const user = userEvent.setup();
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('QT-2025-001')).toBeInTheDocument();
      });

      const statusFilter = screen.getByRole('combobox');
      await user.selectOptions(statusFilter, 'all');

      await waitFor(() => {
        expect(screen.getByText('QT-2025-001')).toBeInTheDocument();
        expect(screen.getByText('QT-2025-002')).toBeInTheDocument();
        expect(screen.getByText('QT-2025-003')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should navigate to create new quote page', async () => {
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText(/create quote/i)).toBeInTheDocument();
      });

      const createButton = screen.getByText(/create quote/i);
      expect(createButton).toHaveAttribute('href', '/quotes/new');
    });

    it('should have view button for each quote', async () => {
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText(/view/i);
        expect(viewButtons).toHaveLength(3);
      });
    });

    it('should have edit button for each quote', async () => {
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        const editButtons = screen.getAllByText(/edit/i);
        expect(editButtons).toHaveLength(3);
      });
    });

    it('should have generate PDF button for each quote', async () => {
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        const pdfButtons = screen.getAllByText(/pdf/i);
        expect(pdfButtons).toHaveLength(3);
      });
    });
  });

  describe('Delete Functionality', () => {
    it('should show confirmation dialog on delete', async () => {
      const user = userEvent.setup();
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('QT-2025-001')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText(/delete/i);
      await user.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('should delete quote on confirmation', async () => {
      const user = userEvent.setup();
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      server.use(
        rest.delete('/api/quotes/:id/', (req, res, ctx) => {
          return res(ctx.status(204));
        })
      );

      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('QT-2025-001')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText(/delete/i);
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('QT-2025-001')).not.toBeInTheDocument();
        expect(screen.getByText('QT-2025-002')).toBeInTheDocument();
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure', async () => {
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });
    });

    it('should have table headers', async () => {
      renderWithRouter(<QuoteList />);

      await waitFor(() => {
        expect(screen.getByText('Quote #')).toBeInTheDocument();
        expect(screen.getByText('Contact')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });
  });
});
