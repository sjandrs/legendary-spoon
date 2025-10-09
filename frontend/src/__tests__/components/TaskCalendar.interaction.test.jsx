
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskCalendar from '../../components/TaskCalendar';

const mockGetTasks = jest.fn();
const mockCreateTask = jest.fn();
const mockUpdateTask = jest.fn();

jest.mock('../../api', () => ({
  __esModule: true,
  default: {},
  getTasks: (...args) => mockGetTasks(...args),
  createTask: (...args) => mockCreateTask(...args),
  updateTask: (...args) => mockUpdateTask(...args)
}));

const initialTasks = [
  { id: 1, title: 'Seed Task', due_date: '2025-10-09', priority: 'medium', status: 'pending' }
];

describe('TaskCalendar interaction flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTasks.mockResolvedValue({ data: initialTasks });
    mockCreateTask.mockResolvedValue({ data: { id: 2, title: 'New Task', due_date: '2025-10-10', priority: 'medium', status: 'pending' } });
  });

  it('opens modal via New Task button and triggers create + reload', async () => {
    render(<TaskCalendar />);

    // Initial load
    await waitFor(() => expect(mockGetTasks).toHaveBeenCalledTimes(1));

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /new task/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Fill form minimal (title and due date already defaulted)
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'New Task' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => expect(mockCreateTask).toHaveBeenCalledTimes(1));

    // After create, a reload should occur (second getTasks)
    await waitFor(() => expect(mockGetTasks).toHaveBeenCalledTimes(2));
  });
});
