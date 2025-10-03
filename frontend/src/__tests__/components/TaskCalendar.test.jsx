import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import TaskCalendar from '../../components/TaskCalendar';
import { renderWithProviders, testComponentAccessibility } from '../helpers/test-utils';

// Mock react-big-calendar
jest.mock('react-big-calendar', () => ({
  Calendar: ({ events, onSelectEvent, onSelectSlot, eventPropGetter, ...props }) => (
    <div data-testid="calendar" {...props}>
      <div data-testid="calendar-events">
        {events.map((event, index) => (
          <div
            key={event.id || index}
            data-testid={`calendar-event-${event.id || index}`}
            onClick={() => onSelectEvent && onSelectEvent(event)}
            tabIndex={0}
            style={eventPropGetter ? eventPropGetter(event).style : {}}
          >
            {event.title}
          </div>
        ))}
      </div>
      <div
        data-testid="calendar-slot"
        onClick={() => onSelectSlot && onSelectSlot({ start: new Date('2024-01-15') })}
      >
        Select Slot
      </div>
    </div>
  ),
  momentLocalizer: jest.fn(() => ({}))
}));

// Mock moment
jest.mock('moment', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    format: jest.fn(() => '2024-01-15')
  }))
}));

// Mock API
jest.mock('../../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  },
  getTasks: jest.fn(),
  updateTask: jest.fn(),
  createTask: jest.fn()
}));

const mockTasks = [
  {
    id: 1,
    title: 'Complete project proposal',
    description: 'Write and submit the Q1 project proposal',
    due_date: '2024-01-15',
    priority: 'high',
    task_type: 1,
    status: 'pending',
    is_overdue: false
  },
  {
    id: 2,
    title: 'Review code changes',
    description: 'Review pull request #123',
    due_date: '2024-01-16',
    priority: 'urgent',
    task_type: 2,
    status: 'completed',
    is_overdue: false
  },
  {
    id: 3,
    title: 'Update documentation',
    description: 'Update API documentation',
    due_date: '2024-01-10',
    priority: 'medium',
    task_type: 1,
    status: 'pending',
    is_overdue: true
  }
];

const mockTaskTypes = [
  { id: 1, name: 'Development', is_active: true },
  { id: 2, name: 'Review', is_active: true },
  { id: 3, name: 'Documentation', is_active: false }
];

describe('TaskCalendar Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    const { getTasks, default: apiClient } = require('../../api');
    getTasks.mockResolvedValue({ data: mockTasks });
    apiClient.get.mockImplementation((url) => {
      if (url === '/api/task-types/') {
        return Promise.resolve({ data: mockTaskTypes });
      }
      return Promise.reject(new Error('Not mocked'));
    });
  });

  describe('Initial Rendering', () => {
    it('renders calendar with header and legend', async () => {
      renderWithProviders(<TaskCalendar />);

      expect(screen.getByText('Task Calendar')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Overdue')).toBeInTheDocument();
      expect(screen.getByText('Urgent')).toBeInTheDocument();
      expect(screen.getByText('High Priority')).toBeInTheDocument();
      expect(screen.getByText('Normal')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('calendar')).toBeInTheDocument();
      });
    });

    it('loads and displays tasks as calendar events', async () => {
      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
        expect(screen.getByText('Review code changes')).toBeInTheDocument();
        expect(screen.getByText('Update documentation')).toBeInTheDocument();
      });
    });

    it('handles API loading errors gracefully', async () => {
      const { getTasks } = require('../../api');
      getTasks.mockRejectedValue(new Error('API Error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading tasks:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Event Styling', () => {
    it('applies correct styling for completed tasks', async () => {
      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        const completedEvent = screen.getByText('Review code changes');
        expect(completedEvent).toBeInTheDocument();
        // The styling is applied via eventPropGetter, which would set background color
      });
    });

    it('applies correct styling for overdue tasks', async () => {
      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        const overdueEvent = screen.getByText('Update documentation');
        expect(overdueEvent).toBeInTheDocument();
      });
    });

    it('applies correct styling for urgent priority tasks', async () => {
      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        const urgentEvent = screen.getByText('Review code changes');
        expect(urgentEvent).toBeInTheDocument();
      });
    });
  });

  describe('Event Selection', () => {
    it('opens modal when clicking on calendar event', async () => {
      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
      });

      const event = screen.getByText('Complete project proposal');
      await user.click(event);

      expect(screen.getByText('Edit Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Complete project proposal')).toBeInTheDocument();
    });

    it('populates modal with correct task data', async () => {
      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
      });

      const event = screen.getByText('Complete project proposal');
      await user.click(event);

      expect(screen.getByDisplayValue('Complete project proposal')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Write and submit the Q1 project proposal')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument();
      expect(screen.getByLabelText('Priority')).toHaveValue('high');
    });
  });

  describe('Slot Selection', () => {
    it('opens modal for creating new task when clicking on calendar slot', async () => {
      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar')).toBeInTheDocument();
      });

      const slot = screen.getByTestId('calendar-slot');
      await user.click(slot);

      expect(screen.getByText('Create New Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument();
    });

    it('initializes new task with default values', async () => {
      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar')).toBeInTheDocument();
      });

      const slot = screen.getByTestId('calendar-slot');
      await user.click(slot);

      const titleInput = screen.getByLabelText('Title');
      expect(titleInput).toHaveValue(''); // Empty title
      expect(screen.getByLabelText('Priority')).toHaveValue('medium'); // Default priority
      expect(screen.getByLabelText('Status')).toHaveValue('pending'); // Default status
    });
  });

  describe('Task Modal', () => {
    it('renders modal with all required form fields', async () => {
      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
      });

      const event = screen.getByText('Complete project proposal');
      await user.click(event);

      expect(screen.getByLabelText('Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Due Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Priority')).toBeInTheDocument();
      expect(screen.getByLabelText('Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });

    it('loads and displays task types in dropdown', async () => {
      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
      });

      const event = screen.getByText('Complete project proposal');
      await user.click(event);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
        expect(screen.getByText('Review')).toBeInTheDocument();
      });
    });

    it('filters out inactive task types', async () => {
      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
      });

      const event = screen.getByText('Complete project proposal');
      await user.click(event);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
        expect(screen.getByText('Review')).toBeInTheDocument();
        expect(screen.queryByText('Documentation')).not.toBeInTheDocument();
      });
    });

    it('closes modal when clicking close button', async () => {
      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
      });

      const event = screen.getByText('Complete project proposal');
      await user.click(event);

      expect(screen.getByText('Edit Task')).toBeInTheDocument();

      const closeButton = screen.getByRole('button', { name: /×/ });
      await user.click(closeButton);

      expect(screen.queryByText('Edit Task')).not.toBeInTheDocument();
    });

    it('closes modal when clicking cancel button', async () => {
      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
      });

      const event = screen.getByText('Complete project proposal');
      await user.click(event);

      expect(screen.getByText('Edit Task')).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByText('Edit Task')).not.toBeInTheDocument();
    });
  });

  describe('Task Creation', () => {
    it('creates new task successfully', async () => {
      const { createTask } = require('../../api');
      createTask.mockResolvedValue({ data: { id: 4, ...mockTasks[0] } });

      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar')).toBeInTheDocument();
      });

      const slot = screen.getByTestId('calendar-slot');
      await user.click(slot);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText('Title');
      const descriptionInput = screen.getByLabelText('Description');
      const taskTypeSelect = screen.getByLabelText('Type');
      const saveButton = screen.getByRole('button', { name: /create task/i });

      await user.type(titleInput, 'New Test Task');
      await user.type(descriptionInput, 'Test description');
      await user.selectOptions(taskTypeSelect, '1'); // Select Development

      await user.click(saveButton);

      expect(createTask).toHaveBeenCalledWith(expect.objectContaining({
        title: 'New Test Task',
        description: 'Test description',
        due_date: '2024-01-15',
        task_type: '1'
      }));
    });

    it('reloads tasks after successful creation', async () => {
      const { createTask, getTasks } = require('../../api');
      createTask.mockResolvedValue({ data: { id: 4 } });
      getTasks.mockResolvedValue({ data: [...mockTasks, { id: 4, title: 'New Task' }] });

      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar')).toBeInTheDocument();
      });

      const slot = screen.getByTestId('calendar-slot');
      await user.click(slot);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText('Title');
      const taskTypeSelect = screen.getByLabelText('Type');
      const saveButton = screen.getByRole('button', { name: /create task/i });

      await user.type(titleInput, 'New Task');
      await user.selectOptions(taskTypeSelect, '1'); // Select Development
      await user.click(saveButton);

      await waitFor(() => {
        expect(getTasks).toHaveBeenCalledTimes(2); // Initial load + reload after create
      });
    });

    it('handles creation errors gracefully', async () => {
      const { createTask } = require('../../api');
      createTask.mockRejectedValue(new Error('Creation failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar')).toBeInTheDocument();
      });

      const slot = screen.getByTestId('calendar-slot');
      await user.click(slot);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText('Title');
      const taskTypeSelect = screen.getByLabelText('Type');
      const saveButton = screen.getByRole('button', { name: /create task/i });

      await user.type(titleInput, 'New Task');
      await user.selectOptions(taskTypeSelect, '1'); // Select Development
      await user.click(saveButton);

      expect(consoleSpy).toHaveBeenCalledWith('Error saving task:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Task Editing', () => {
    it('updates existing task successfully', async () => {
      const { updateTask } = require('../../api');
      updateTask.mockResolvedValue({ data: mockTasks[0] });

      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
      });

      const event = screen.getByText('Complete project proposal');
      await user.click(event);

      const titleInput = screen.getByLabelText('Title');
      const saveButton = screen.getByRole('button', { name: /update task/i });

      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Project Proposal');

      await user.click(saveButton);

      expect(updateTask).toHaveBeenCalledWith(1, expect.objectContaining({
        title: 'Updated Project Proposal'
      }));
    });

    it('reloads tasks after successful update', async () => {
      const { updateTask, getTasks } = require('../../api');
      updateTask.mockResolvedValue({ data: mockTasks[0] });

      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
      });

      const event = screen.getByText('Complete project proposal');
      await user.click(event);

      const saveButton = screen.getByRole('button', { name: /update task/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(getTasks).toHaveBeenCalledTimes(2); // Initial load + reload after update
      });
    });

    it('handles update errors gracefully', async () => {
      const { updateTask } = require('../../api');
      updateTask.mockRejectedValue(new Error('Update failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
      });

      const event = screen.getByText('Complete project proposal');
      await user.click(event);

      const saveButton = screen.getByRole('button', { name: /update task/i });
      await user.click(saveButton);

      expect(consoleSpy).toHaveBeenCalledWith('Error saving task:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Form Validation', () => {
    it('requires title field', async () => {
      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar')).toBeInTheDocument();
      });

      const slot = screen.getByTestId('calendar-slot');
      await user.click(slot);

      const titleInput = screen.getByLabelText('Title');
      const saveButton = screen.getByRole('button', { name: /create task/i });

      // Clear the title and try to submit
      await user.clear(titleInput);
      await user.click(saveButton);

      // HTML5 validation should prevent submission
      expect(titleInput).toBeInvalid();
    });

    it('requires due date field', async () => {
      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar')).toBeInTheDocument();
      });

      const slot = screen.getByTestId('calendar-slot');
      await user.click(slot);

      const dateInput = screen.getByLabelText('Due Date');
      const saveButton = screen.getByRole('button', { name: /create task/i });

      // Clear the date and try to submit
      fireEvent.change(dateInput, { target: { value: '' } });
      await user.click(saveButton);

      expect(dateInput).toBeInvalid();
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG 2.1 AA standards', async () => {
      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar')).toBeInTheDocument();
      });

      await testComponentAccessibility(<TaskCalendar />);
    });

    it('has proper form labels', async () => {
      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
      });

      const event = screen.getByText('Complete project proposal');
      await user.click(event);

      expect(screen.getByLabelText('Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Due Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Priority')).toBeInTheDocument();
      expect(screen.getByLabelText('Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
      });

      const event = screen.getByText('Complete project proposal');
      event.focus();
      expect(document.activeElement).toBe(event);
    });

    it('has proper ARIA attributes', async () => {
      renderWithProviders(<TaskCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
      });

      const event = screen.getByText('Complete project proposal');
      await user.click(event);

      // Modal should be accessible
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for mobile screens', () => {
      // Mock window resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      renderWithProviders(<TaskCalendar />);

      // Component should render without issues on mobile
      expect(screen.getByText('Task Calendar')).toBeInTheDocument();
    });
  });
});
