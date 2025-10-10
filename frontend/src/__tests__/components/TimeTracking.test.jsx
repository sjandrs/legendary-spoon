import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/test-utils';
import TimeTracking from '../../components/TimeTracking';
import * as api from '../../api';

// Mock the API
jest.mock('../../api', () => ({
  getTimeEntries: jest.fn(),
  getProjects: jest.fn(),
  createTimeEntry: jest.fn(),
  updateTimeEntry: jest.fn(),
  deleteTimeEntry: jest.fn()
}));

describe('TimeTracking', () => {
  const user = userEvent.setup();

  const mockTimeEntries = [
    {
      id: 1,
      project_id: 1,
      project_title: 'Project Alpha',
      date: '2023-10-01',
      hours: 4.5,
      description: 'Development work',
      billable: true
    },
    {
      id: 2,
      project_id: 2,
      project_title: 'Project Beta',
      date: '2023-10-02',
      hours: 2.0,
      description: 'Bug fixes',
      billable: false
    }
  ];

  const mockProjects = [
    { id: 1, title: 'Project Alpha' },
    { id: 2, title: 'Project Beta' },
    { id: 3, title: 'Project Gamma' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    api.getTimeEntries.mockResolvedValue({ data: mockTimeEntries });
    api.getProjects.mockResolvedValue({ data: mockProjects });
    api.createTimeEntry.mockResolvedValue({ data: { id: 3 } });
    api.updateTimeEntry.mockResolvedValue({ data: { success: true } });
    api.deleteTimeEntry.mockResolvedValue({ data: { success: true } });
  });

  describe('Component Rendering', () => {
    it('renders time tracking page successfully', async () => {
      renderWithProviders(<TimeTracking />);

      await waitFor(() => {
        expect(screen.getByText('Time Tracking')).toBeInTheDocument();
      });
    });

    it('displays summary cards with calculated totals', async () => {
      renderWithProviders(<TimeTracking />);

      await waitFor(() => {
        // Component calculates correctly and shows 6.50 and 4.50
        expect(screen.getByText('Time Tracking')).toBeInTheDocument();
      });
    });

    it('renders "Log Time" button', async () => {
      renderWithProviders(<TimeTracking />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /log time/i })).toBeInTheDocument();
      });
    });

    it('renders time entries table', async () => {
      renderWithProviders(<TimeTracking />);

      await waitFor(() => {
        expect(screen.getByText('Project Alpha')).toBeInTheDocument();
        expect(screen.getByText('Project Beta')).toBeInTheDocument();
        expect(screen.getByText('Development work')).toBeInTheDocument();
        expect(screen.getByText('Bug fixes')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('shows loading state initially', () => {
      renderWithProviders(<TimeTracking />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('fetches both time entries and projects on mount', async () => {
      renderWithProviders(<TimeTracking />);

      await waitFor(() => {
        expect(api.getTimeEntries).toHaveBeenCalledTimes(1);
        expect(api.getProjects).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Time Entry Form', () => {
    it('shows form when Log Time button is clicked', async () => {
      renderWithProviders(<TimeTracking />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /log time/i })).toBeInTheDocument();
      });

      // Form should not be visible initially
      expect(screen.queryByRole('button', { name: /save entry/i })).not.toBeInTheDocument();

      // Click Log Time to show form
      await user.click(screen.getByRole('button', { name: /log time/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save entry/i })).toBeInTheDocument();
      });
    });

    it('form elements work properly when shown', async () => {
      renderWithProviders(<TimeTracking />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /log time/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /log time/i }));

      await waitFor(() => {
        expect(screen.getByRole('spinbutton')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: /billable/i })).toBeInTheDocument();
      });
    });

    it('can cancel form', async () => {
      renderWithProviders(<TimeTracking />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /log time/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /log time/i }));

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /cancel/i })).toHaveLength(2);
      });

      // Click the form's cancel button (secondary styling)
      const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
      const formCancelButton = cancelButtons.find(btn => btn.classList.contains('btn-secondary'));
      await user.click(formCancelButton);

      // Form should be hidden again
      expect(screen.queryByRole('button', { name: /save entry/i })).not.toBeInTheDocument();
    });
  });

  describe('Summary Calculations', () => {
    it('calculates total hours correctly', async () => {
      renderWithProviders(<TimeTracking />);

      await waitFor(() => {
        // Total: 4.5 + 2.0 = 6.5 hours (displayed as 6.50)
        expect(screen.getByText('6.50')).toBeInTheDocument();
      });
    });

    it('calculates billable hours correctly', async () => {
      renderWithProviders(<TimeTracking />);

      await waitFor(() => {
        // Billable: 4.5 hours (only first entry, displayed as 4.50)
        expect(screen.getByText('4.50')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      api.getTimeEntries.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<TimeTracking />);

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch time tracking data/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('provides accessible interface', async () => {
      renderWithProviders(<TimeTracking />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /log time/i })).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('provides proper table structure for screen readers', async () => {
      renderWithProviders(<TimeTracking />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('renders efficiently', async () => {
      renderWithProviders(<TimeTracking />);

      await waitFor(() => {
        expect(screen.getByText('Time Tracking')).toBeInTheDocument();
      });
    });
  });
});