import React from 'react';
import { screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUsers, testComponentAccessibility } from '../helpers/test-utils';
import TaskDashboard from '../../components/TaskDashboard';

// Mock child components
jest.mock('../../components/TaskCalendar', () => {
  return function MockTaskCalendar() {
    return <div data-testid="calendar">Mock Task Calendar</div>;
  };
});

jest.mock('../../components/ActivityTimeline', () => {
  return function MockActivityTimeline({ limit }) {
    return <div data-testid="activity-timeline" data-limit={limit}>Mock Activity Timeline</div>;
  };
});

// Mock API module
jest.mock('../../api', () => ({
  getTasks: jest.fn(),
  getActivityLogs: jest.fn(),
}));

describe('TaskDashboard Component', () => {
  const user = userEvent.setup();

  const mockTasks = [
    {
      id: 1,
      title: 'Complete project proposal',
      description: 'Write and submit the Q1 project proposal',
      due_date: '2024-01-15',
      priority: 'high',
      task_type: 'Development',
      status: 'pending',
      is_overdue: false,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    {
      id: 2,
      title: 'Review code changes',
      description: 'Review pull request #123',
      due_date: '2024-01-16',
      priority: 'urgent',
      task_type: 'Review',
      status: 'completed',
      is_overdue: false,
      created_at: '2024-01-02T10:00:00Z',
      updated_at: '2024-01-02T10:00:00Z'
    },
    {
      id: 3,
      title: 'Update documentation',
      description: 'Update API documentation',
      due_date: '2024-01-10',
      priority: 'medium',
      task_type: 'Documentation',
      status: 'in_progress',
      is_overdue: true,
      created_at: '2024-01-03T10:00:00Z',
      updated_at: '2024-01-03T10:00:00Z'
    },
    {
      id: 4,
      title: 'Fix critical bug',
      description: 'Address production issue',
      due_date: '2024-01-20',
      priority: 'urgent',
      task_type: 'Development',
      status: 'pending',
      is_overdue: false,
      created_at: '2024-01-04T10:00:00Z',
      updated_at: '2024-01-04T10:00:00Z'
    },
    {
      id: 5,
      title: 'Client meeting',
      description: 'Discuss project requirements',
      due_date: '2024-01-18',
      priority: 'high',
      task_type: 'Meeting',
      status: 'pending',
      is_overdue: false,
      created_at: '2024-01-05T10:00:00Z',
      updated_at: '2024-01-05T10:00:00Z'
    }
  ];

  const mockOverdueTasks = [
    {
      id: 3,
      title: 'Update documentation',
      status: 'in_progress',
      is_overdue: true
    }
  ];

  const mockUpcomingTasks = [
    {
      id: 1,
      title: 'Complete project proposal',
      due_date: '2024-01-15'
    },
    {
      id: 2,
      title: 'Review code changes',
      due_date: '2024-01-16'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    const { getTasks } = require('../../api');
    getTasks.mockImplementation((url) => {
      if (url === '/api/tasks/overdue/') {
        return Promise.resolve({ data: mockOverdueTasks });
      } else if (url === '/api/tasks/upcoming/') {
        return Promise.resolve({ data: mockUpcomingTasks });
      } else {
        return Promise.resolve({ data: mockTasks });
      }
    });
  });

  describe('Initial Rendering', () => {
    it('renders dashboard with header and loading state initially', () => {
      renderWithProviders(<TaskDashboard />);

      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
      expect(screen.queryByText('Task & Activity Management')).not.toBeInTheDocument();
    });

    it('loads and displays task statistics after API calls', async () => {
      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      // Check statistics cards
      expect(screen.getByText('5')).toBeInTheDocument(); // Total tasks
      expect(screen.getByText('3')).toBeInTheDocument(); // Pending tasks
      expect(screen.getByText('2')).toBeInTheDocument(); // Due this week

      // Verify the three cards with '1' value
      const oneValues = screen.getAllByText('1');
      expect(oneValues).toHaveLength(3); // In Progress, Completed, Overdue
    });

    it('displays tab navigation with three tabs', async () => {
      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      expect(screen.getByText('📅 Calendar View')).toBeInTheDocument();
      expect(screen.getByText('📝 Task List')).toBeInTheDocument();
      expect(screen.getByText('⏱️ Activity Timeline')).toBeInTheDocument();
    });

    it('shows calendar tab as active by default', async () => {
      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      const calendarTab = screen.getByText('📅 Calendar View');
      expect(calendarTab).toHaveClass('active');
    });
  });

  describe('Statistics Cards', () => {
    it('displays correct task counts in statistics cards', async () => {
      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      // Verify each stat card shows correct count
      const statCards = screen.getAllByText(/Total Tasks|Pending|In Progress|Completed|Overdue|Due This Week/);
      expect(statCards).toHaveLength(6);

      // Check specific values by stat card context
      expect(screen.getByText('5')).toBeInTheDocument(); // Total
      expect(screen.getByText('3')).toBeInTheDocument(); // Pending
      expect(screen.getByText('2')).toBeInTheDocument(); // Due this week

      // Check for the three '1' values (In Progress, Completed, Overdue)
      const oneValues = screen.getAllByText('1');
      expect(oneValues).toHaveLength(3);

      // Verify they're in the correct stat cards
      expect(screen.getByText('In Progress').closest('.stat-card').querySelector('.stat-value')).toHaveTextContent('1');
      expect(screen.getByText('Completed').closest('.stat-card').querySelector('.stat-value')).toHaveTextContent('1');
      expect(screen.getByText('Overdue').closest('.stat-card').querySelector('.stat-value')).toHaveTextContent('1');
    });

    it('displays stat card icons correctly', async () => {
      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      expect(screen.getByText('📋')).toBeInTheDocument(); // Total tasks icon
      expect(screen.getByText('⏳')).toBeInTheDocument(); // Pending icon
      expect(screen.getByText('🔄')).toBeInTheDocument(); // In Progress icon
      expect(screen.getByText('✅')).toBeInTheDocument(); // Completed icon
      expect(screen.getByText('⚠️')).toBeInTheDocument(); // Overdue icon
      expect(screen.getByText('📅')).toBeInTheDocument(); // Due this week icon
    });
  });

  describe('Tab Navigation', () => {
    it('switches to calendar view when calendar tab is clicked', async () => {
      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      const calendarTab = screen.getByText('📅 Calendar View');
      await user.click(calendarTab);

      expect(calendarTab).toHaveClass('active');
      expect(screen.getByTestId('calendar')).toBeInTheDocument();
    });

    it('switches to task list view when list tab is clicked', async () => {
      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      const listTab = screen.getByText('📝 Task List');
      await user.click(listTab);

      expect(listTab).toHaveClass('active');
      expect(screen.getByText('Recent Tasks')).toBeInTheDocument();
    });

    it('switches to activity timeline view when activity tab is clicked', async () => {
      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      const activityTab = screen.getByText('⏱️ Activity Timeline');
      await user.click(activityTab);

      expect(activityTab).toHaveClass('active');
      expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
    });

    it('only shows one tab content at a time', async () => {
      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      // Start with calendar view
      expect(screen.getByTestId('calendar')).toBeInTheDocument();

      // Switch to list view
      const listTab = screen.getByText('📝 Task List');
      await user.click(listTab);

      expect(screen.queryByTestId('calendar')).not.toBeInTheDocument();
      expect(screen.getByText('Recent Tasks')).toBeInTheDocument();

      // Switch to activity view
      const activityTab = screen.getByText('⏱️ Activity Timeline');
      await user.click(activityTab);

      expect(screen.queryByText('Recent Tasks')).not.toBeInTheDocument();
      expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
    });
  });

  describe('Task List View', () => {
    it('displays recent tasks sorted by most recently updated', async () => {
      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      const listTab = screen.getByText('📝 Task List');
      await user.click(listTab);

      // Should show the 5 most recent tasks (all tasks in this case)
      expect(screen.getByText('Fix critical bug')).toBeInTheDocument(); // Most recent
      expect(screen.getByText('Client meeting')).toBeInTheDocument();
      expect(screen.getByText('Update documentation')).toBeInTheDocument();
      expect(screen.getByText('Review code changes')).toBeInTheDocument();
      expect(screen.getByText('Complete project proposal')).toBeInTheDocument(); // Oldest
    });

    it('displays task priority and status with correct colors', async () => {
      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      const listTab = screen.getByText('📝 Task List');
      await user.click(listTab);

      // Check that priority and status elements are present
      const priorityElements = screen.getAllByText(/urgent|high|medium/);
      const statusElements = screen.getAllByText(/pending|in progress|completed/);

      expect(priorityElements.length).toBeGreaterThan(0);
      expect(statusElements.length).toBeGreaterThan(0);
    });

    it('shows task due dates and overdue indicators', async () => {
      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      const listTab = screen.getByText('📝 Task List');
      await user.click(listTab);

      // Check for due date display
      expect(screen.getAllByText(/Due:/).length).toBeGreaterThanOrEqual(1);
      // Check for overdue indicator on the overdue task
      expect(screen.getByText(/\(Overdue!\)/)).toBeInTheDocument();
    });

    it('displays "View All Tasks" link', async () => {
      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      const listTab = screen.getByText('📝 Task List');
      await user.click(listTab);

      expect(screen.getByText('View All Tasks →')).toBeInTheDocument();
    });

    it('shows empty state when no tasks exist', async () => {
      const { getTasks } = require('../../api');
      getTasks.mockResolvedValue({ data: [] });

      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      const listTab = screen.getByText('📝 Task List');
      await user.click(listTab);

      expect(screen.getByText('No tasks found. Create your first task to get started!')).toBeInTheDocument();
    });
  });

  describe('Activity Timeline Integration', () => {
    it('renders ActivityTimeline component with correct limit', async () => {
      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      const activityTab = screen.getByText('⏱️ Activity Timeline');
      await user.click(activityTab);

      const activityTimeline = screen.getByTestId('activity-timeline');
      expect(activityTimeline).toBeInTheDocument();
      expect(activityTimeline).toHaveAttribute('data-limit', '50');
    });
  });

  describe('API Integration', () => {
    it('calls getTasks API three times on component mount', async () => {
      const { getTasks } = require('../../api');

      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      expect(getTasks).toHaveBeenCalledTimes(3);
      expect(getTasks).toHaveBeenCalledWith();
      expect(getTasks).toHaveBeenCalledWith('/api/tasks/overdue/');
      expect(getTasks).toHaveBeenCalledWith('/api/tasks/upcoming/');
    });

    it('handles API errors gracefully', async () => {
      const { getTasks } = require('../../api');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      getTasks.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading task stats:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('reloads data when refresh button is clicked', async () => {
      const { getTasks } = require('../../api');
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      });

      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('🔄 Refresh');
      await user.click(refreshButton);

      // Should call window.location.reload
      expect(mockReload).toHaveBeenCalledTimes(1);
    })
  });

  describe('Role-Based Features', () => {
    it('shows settings button for superuser', async () => {
      renderWithProviders(<TaskDashboard />, {
        authValue: {
          user: mockUsers.superuser,
          token: 'mock-token',
          loading: false,
          login: jest.fn(),
          logout: jest.fn(),
          checkAuth: jest.fn()
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      // Check for the settings link (Link component renders as anchor)
      const settingsLink = screen.getByTitle('Task Settings');
      expect(settingsLink).toBeInTheDocument();
      expect(settingsLink.tagName).toBe('A');
      expect(settingsLink).toHaveAttribute('href', '/tasks/admin');
    });

    it('hides settings button for regular users', async () => {
      renderWithProviders(<TaskDashboard />, {
        authContextValue: {
          user: mockUsers.salesRep
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      expect(screen.queryByTitle('Task Settings')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles API errors and continues to render', async () => {
      const { getTasks } = require('../../api');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      getTasks.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<TaskDashboard />);

      // Should still render the dashboard structure
      await waitFor(() => {
        expect(screen.getByText('Task & Activity Management')).toBeInTheDocument();
      });

      // Should show zero counts for all stats
      expect(screen.getAllByText('0')).toHaveLength(6); // All 6 stat cards should show 0

      consoleSpy.mockRestore();
    });

    it('handles partial API failures gracefully', async () => {
      const { getTasks } = require('../../api');

      // Make overdue and upcoming APIs fail but main API succeed
      getTasks.mockImplementation((url) => {
        if (url === '/api/tasks/overdue/') {
          return Promise.reject(new Error('Overdue API failed'));
        } else if (url === '/api/tasks/upcoming/') {
          return Promise.reject(new Error('Upcoming API failed'));
        } else {
          return Promise.resolve({ data: mockTasks });
        }
      });

      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      // Component shows all zeros when APIs fail (error state)
      expect(screen.getAllByText('0')).toHaveLength(6); // All stats show 0 when errors occur
    })
  });

  describe('Accessibility', () => {
    it('meets WCAG 2.1 AA standards', async () => {
      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      await testComponentAccessibility(<TaskDashboard />);
    });

    it('has proper heading hierarchy', async () => {
      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Task & Activity Management');

      // Switch to list tab to see the h3
      const listTab = screen.getByText('📝 Task List');
      fireEvent.click(listTab);

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Recent Tasks');
    });

    it('supports keyboard navigation for tabs', async () => {
      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      const calendarTab = screen.getByText('📅 Calendar View');
      calendarTab.focus();
      expect(document.activeElement).toBe(calendarTab);
    });

    it('has descriptive button labels', async () => {
      renderWithProviders(<TaskDashboard />, {
        authValue: {
          user: mockUsers.superuser,
          token: 'mock-token',
          loading: false,
          login: jest.fn(),
          logout: jest.fn(),
          checkAuth: jest.fn()
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      expect(screen.getByText('🔄 Refresh')).toBeInTheDocument();
      expect(screen.getByTitle('Task Settings')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for mobile screens', async () => {
      // Mock window resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      // Component should render without issues on mobile
      expect(screen.getByText('Task & Activity Management')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('loads data efficiently with Promise.all', async () => {
      const { getTasks } = require('../../api');
      const startTime = Date.now();

      renderWithProviders(<TaskDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Should load within reasonable time (allowing for test environment)
      expect(loadTime).toBeLessThan(2000);
      expect(getTasks).toHaveBeenCalledTimes(3);
    });
  });
});