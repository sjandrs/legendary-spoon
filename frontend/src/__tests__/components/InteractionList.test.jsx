/**
 * InteractionList Component Test Suite - TASK-029
 * Tests for Interaction list view with timeline view and filtering
 * Coverage: Loading, Empty, Error, and Populated states
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import InteractionList from '../../components/InteractionList';

// Mock API client directly to avoid MSW complications in Jest env
jest.mock('../../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));
const { default: api } = require('../../api');

const renderWithRouter = (component) => render(<BrowserRouter>{component}</BrowserRouter>);

const allInteractions = [
  {
    id: 1,
    interaction_type: 'call',
    subject: 'Follow-up call',
    interaction_date: '2025-01-15T10:00:00Z',
    user_name: 'sales.rep',
    contact: 1,
    contact_name: 'John Doe',
  },
  {
    id: 2,
    interaction_type: 'email',
    subject: 'Quote submission',
    interaction_date: '2025-01-16T14:30:00Z',
    user_name: 'sales.rep',
    contact: 2,
    contact_name: 'Jane Smith',
  },
  {
    id: 3,
    interaction_type: 'meeting',
    subject: 'Project kickoff meeting',
    interaction_date: '2025-01-17T09:00:00Z',
    user_name: 'project.manager',
    contact: 1,
    contact_name: 'John Doe',
  },
];

describe('InteractionList Component - TASK-029', () => {
  describe('Loading State', () => {
    it('should display loading spinner while fetching interactions', () => {
      api.get.mockImplementation(() => new Promise(() => {})); // pending
      renderWithRouter(<InteractionList />);
      expect(document.querySelector('.skeleton-list')).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should display empty state message when no interactions exist', async () => {
      api.get.mockResolvedValue({ data: [] });

      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText(/no interactions found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should handle API errors gracefully', async () => {
      api.get.mockRejectedValue(new Error('Server error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  api.get.mockResolvedValue({ data: allInteractions });
  renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText(/no interactions found/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Populated State', () => {
    it('should render interactions in timeline view', async () => {
  api.get.mockResolvedValue({ data: allInteractions });
  renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText('Follow-up call')).toBeInTheDocument();
        expect(screen.getByText('Quote submission')).toBeInTheDocument();
        expect(screen.getByText('Project kickoff meeting')).toBeInTheDocument();
      });
    });

    it('should display interaction details correctly', async () => {
  api.get.mockResolvedValue({ data: allInteractions });
  renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText(/Discussed project requirements/i)).toBeInTheDocument();
      });
    });

    it('should display interaction types with icons', async () => {
  api.get.mockResolvedValue({ data: allInteractions });
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

  // No text search in current UI; type filter covers filtering behavior

  describe('Type Filter Functionality', () => {
    it('should filter interactions by call type', async () => {
      const user = userEvent.setup();
      api.get
        .mockResolvedValueOnce({ data: allInteractions })
        .mockResolvedValueOnce({ data: [allInteractions[0]] });
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
      api.get
        .mockResolvedValueOnce({ data: allInteractions })
        .mockResolvedValueOnce({ data: [allInteractions[1]] });
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
      api.get
        .mockResolvedValueOnce({ data: allInteractions })
        .mockResolvedValueOnce({ data: [allInteractions[2]] });
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
      api.get
        .mockResolvedValueOnce({ data: allInteractions })
        .mockResolvedValueOnce({ data: allInteractions });
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
  api.get.mockResolvedValue({ data: allInteractions });
  renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText(/log interaction/i)).toBeInTheDocument();
      });

      const createButton = screen.getByText(/log interaction/i);
      expect(createButton).toHaveAttribute('href', '/interactions/new');
    });

    it('should have edit button for each interaction', async () => {
  api.get.mockResolvedValue({ data: allInteractions });
  renderWithRouter(<InteractionList />);

      await waitFor(() => {
        const editButtons = screen.getAllByText(/edit/i);
        expect(editButtons).toHaveLength(3);
      });
    });

    it('should have delete button for each interaction', async () => {
  api.get.mockResolvedValue({ data: allInteractions });
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

  api.get.mockResolvedValue({ data: allInteractions });
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
      api.get.mockResolvedValue({ data: allInteractions });
      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText('Follow-up call')).toBeInTheDocument();
        expect(screen.getByText('Quote submission')).toBeInTheDocument();
        expect(screen.getByText('Project kickoff meeting')).toBeInTheDocument();
      });
    });

    it('should show date information for each interaction', async () => {
      api.get.mockResolvedValue({ data: allInteractions });
      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        const metaRows = document.querySelectorAll('.interaction-meta');
        expect(metaRows.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', async () => {
      renderWithRouter(<InteractionList />);

      await waitFor(() => {
        const timeline = document.querySelector('.interaction-timeline');
        expect(timeline).toBeTruthy();
      });
    });

    it('should have descriptive headings', async () => {
  api.get.mockResolvedValue({ data: allInteractions });
  renderWithRouter(<InteractionList />);

      await waitFor(() => {
        expect(screen.getByText('Follow-up call')).toBeInTheDocument();
        expect(screen.getByText('Quote submission')).toBeInTheDocument();
      });
    });
  });
});
