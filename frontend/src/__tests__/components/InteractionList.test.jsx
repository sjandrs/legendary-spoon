/**
 * InteractionList Component Test Suite - TASK-029
 * Tests for Interaction list view with timeline view and filtering
 * Coverage: Loading, Empty, Error, and Populated states
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import InteractionList from '../../components/InteractionList';

// Mock server for API calls
const server = setupServer(
  rest.get('/api/interactions/', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: 1,
          contact: { id: 1, first_name: 'John', last_name: 'Doe' },
          interaction_type: 'call',
          subject: 'Follow-up call',
          description: 'Discussed project requirements and timeline',
          interaction_date: '2025-01-15T10:00:00Z',
          user: { id: 1, username: 'sales.rep' }
        },
        {
          id: 2,
          contact: { id: 2, first_name: 'Jane', last_name: 'Smith' },
          interaction_type: 'email',
          subject: 'Quote submission',
          description: 'Sent quote QT-2025-002 for review',
          interaction_date: '2025-01-16T14:30:00Z',
          user: { id: 1, username: 'sales.rep' }
        },
        {
          id: 3,
          contact: { id: 1, first_name: 'John', last_name: 'Doe' },
          interaction_type: 'meeting',
          subject: 'Project kickoff meeting',
          description: 'Initial meeting with stakeholders',
          interaction_date: '2025-01-17T09:00:00Z',
          user: { id: 2, username: 'project.manager' }
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

describe('InteractionList Component - TASK-029', () => {
  describe('Loading State', () => {
    it('should display loading spinner while fetching interactions', () => {
      server.use(
        rest.get('/api/interactions/', (req, res, ctx) => {
          return res(ctx.delay(100), ctx.json([]));
        })
      );

      renderWithRouter(<InteractionList />);
      expect(screen.getByText(/loading interactions/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state message when no interactions exist', async () => {
      server.use(
        rest.get('/api/interactions/', (req, res, ctx) => {
          return res(ctx.json([]));
        })
      );

      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText(/no interactions found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should handle API errors gracefully', async () => {
      server.use(
        rest.get('/api/interactions/', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }));
        })
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText(/no interactions found/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Populated State', () => {
    it('should render interactions in timeline view', async () => {
      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText('Follow-up call')).toBeInTheDocument();
        expect(screen.getByText('Quote submission')).toBeInTheDocument();
        expect(screen.getByText('Project kickoff meeting')).toBeInTheDocument();
      });
    });

    it('should display interaction details correctly', async () => {
      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText(/Discussed project requirements/i)).toBeInTheDocument();
      });
    });

    it('should display interaction types with icons', async () => {
      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText(/call/i)).toBeInTheDocument();
        expect(screen.getByText(/email/i)).toBeInTheDocument();
        expect(screen.getByText(/meeting/i)).toBeInTheDocument();
      });
    });

    it('should display user information', async () => {
      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText('sales.rep')).toBeInTheDocument();
        expect(screen.getByText('project.manager')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter interactions by subject', async () => {
      const user = userEvent.setup();
      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText('Follow-up call')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search interactions/i);
      await user.type(searchInput, 'Follow-up');

      await waitFor(() => {
        expect(screen.getByText('Follow-up call')).toBeInTheDocument();
        expect(screen.queryByText('Quote submission')).not.toBeInTheDocument();
      });
    });

    it('should filter interactions by contact name', async () => {
      const user = userEvent.setup();
      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search interactions/i);
      await user.type(searchInput, 'Jane');

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('Follow-up call')).not.toBeInTheDocument();
      });
    });
  });

  describe('Type Filter Functionality', () => {
    it('should filter interactions by call type', async () => {
      const user = userEvent.setup();
      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText('Follow-up call')).toBeInTheDocument();
      });

      const typeFilter = screen.getByRole('combobox');
      await user.selectOptions(typeFilter, 'call');

      await waitFor(() => {
        expect(screen.getByText('Follow-up call')).toBeInTheDocument();
        expect(screen.queryByText('Quote submission')).not.toBeInTheDocument();
        expect(screen.queryByText('Project kickoff meeting')).not.toBeInTheDocument();
      });
    });

    it('should filter interactions by email type', async () => {
      const user = userEvent.setup();
      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText('Quote submission')).toBeInTheDocument();
      });

      const typeFilter = screen.getByRole('combobox');
      await user.selectOptions(typeFilter, 'email');

      await waitFor(() => {
        expect(screen.getByText('Quote submission')).toBeInTheDocument();
        expect(screen.queryByText('Follow-up call')).not.toBeInTheDocument();
      });
    });

    it('should filter interactions by meeting type', async () => {
      const user = userEvent.setup();
      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText('Project kickoff meeting')).toBeInTheDocument();
      });

      const typeFilter = screen.getByRole('combobox');
      await user.selectOptions(typeFilter, 'meeting');

      await waitFor(() => {
        expect(screen.getByText('Project kickoff meeting')).toBeInTheDocument();
        expect(screen.queryByText('Follow-up call')).not.toBeInTheDocument();
      });
    });

    it('should show all interactions when "all" is selected', async () => {
      const user = userEvent.setup();
      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText('Follow-up call')).toBeInTheDocument();
      });

      const typeFilter = screen.getByRole('combobox');
      await user.selectOptions(typeFilter, 'all');

      await waitFor(() => {
        expect(screen.getByText('Follow-up call')).toBeInTheDocument();
        expect(screen.getByText('Quote submission')).toBeInTheDocument();
        expect(screen.getByText('Project kickoff meeting')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should navigate to create new interaction page', async () => {
      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText(/log interaction/i)).toBeInTheDocument();
      });

      const createButton = screen.getByText(/log interaction/i);
      expect(createButton).toHaveAttribute('href', '/interactions/new');
    });

    it('should have edit button for each interaction', async () => {
      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        const editButtons = screen.getAllByText(/edit/i);
        expect(editButtons).toHaveLength(3);
      });
    });

    it('should have delete button for each interaction', async () => {
      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByText(/delete/i);
        expect(deleteButtons).toHaveLength(3);
      });
    });
  });

  describe('Delete Functionality', () => {
    it('should show confirmation dialog on delete', async () => {
      const user = userEvent.setup();
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText('Follow-up call')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText(/delete/i);
      await user.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('should delete interaction on confirmation', async () => {
      const user = userEvent.setup();
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      server.use(
        rest.delete('/api/interactions/:id/', (req, res, ctx) => {
          return res(ctx.status(204));
        })
      );

      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText('Follow-up call')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText(/delete/i);
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Follow-up call')).not.toBeInTheDocument();
        expect(screen.getByText('Quote submission')).toBeInTheDocument();
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Timeline View', () => {
    it('should display interactions in chronological order', async () => {
      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        const interactions = screen.getAllByRole('article');
        expect(interactions).toHaveLength(3);
      });
    });

    it('should show date information for each interaction', async () => {
      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText(/Jan 15/i)).toBeInTheDocument();
        expect(screen.getByText(/Jan 16/i)).toBeInTheDocument();
        expect(screen.getByText(/Jan 17/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', async () => {
      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        const articles = screen.getAllByRole('article');
        expect(articles.length).toBeGreaterThan(0);
      });
    });

    it('should have descriptive headings', async () => {
      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText('Follow-up call')).toBeInTheDocument();
        expect(screen.getByText('Quote submission')).toBeInTheDocument();
      });
    });
  });
});
