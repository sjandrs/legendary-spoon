
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskCalendar from '../../components/TaskCalendar';

const mockGetTasks = jest.fn();
const mockCreateTask = jest.fn();
const mockUpdateTask = jest.fn();
const mockApiGet = jest.fn();

jest.mock('../../api', () => ({
  __esModule: true,
  // default export is the apiClient used inside TaskCalendar/TaskModal
  default: {
    get: (...args) => mockApiGet(...args)
  },
  getTasks: (...args) => mockGetTasks(...args),
  createTask: (...args) => mockCreateTask(...args),
  updateTask: (...args) => mockUpdateTask(...args)
}));

// Mock react-big-calendar to a lightweight test double similar to TaskCalendar.test.jsx
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

// Mock moment to stabilize date formatting in tests
jest.mock('moment', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    format: jest.fn(() => '2024-01-15')
  }))
}));

const initialTasks = [
  { id: 1, title: 'Seed Task', due_date: '2025-10-09', priority: 'medium', status: 'pending' }
];

describe('TaskCalendar interaction flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTasks.mockResolvedValue({ data: initialTasks });
    mockCreateTask.mockResolvedValue({ data: { id: 2, title: 'New Task', due_date: '2025-10-10', priority: 'medium', status: 'pending' } });
    // TaskModal fetches task types via apiClient.get('/api/task-types/')
    mockApiGet.mockImplementation((url) => {
      if (url.includes('/api/task-types/')) {
        return Promise.resolve({
          data: {
            results: [
              { id: 99, name: 'General', is_active: true },
              { id: 100, name: 'Bug', is_active: true }
            ]
          }
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('opens modal by clicking an existing event and triggers update + reload', async () => {
    render(<TaskCalendar />);

    // Initial load
    await waitFor(() => expect(mockGetTasks).toHaveBeenCalledTimes(1));

  // Open modal by clicking on the existing event rendered in the calendar
  const existingEvent = await screen.findByText('Seed Task');
  fireEvent.click(existingEvent);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Fill form minimal (title and due date already defaulted)
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'New Task' } });

    // Wait for task types to load and select one (required field)
    const typeSelect = await screen.findByLabelText(/type/i);
    fireEvent.change(typeSelect, { target: { value: '99' } });

  // Submit form (update path)
  fireEvent.click(screen.getByRole('button', { name: /update task/i }));

  await waitFor(() => expect(mockUpdateTask).toHaveBeenCalledTimes(1));

    // After create, a reload should occur (second getTasks)
    await waitFor(() => expect(mockGetTasks).toHaveBeenCalledTimes(2));
  });
});
