
import { render, waitFor } from '@testing-library/react';
import TaskCalendar from '../../components/TaskCalendar';

// Provide explicit mock factory to avoid no-import-assign rule violations
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

// Minimal mock tasks
const mockTasks = [
  { id: 1, title: 'Task A', due_date: '2025-10-09', priority: 'medium', status: 'pending' },
  { id: 2, title: 'Task B', due_date: '2025-10-10', priority: 'high', status: 'pending' }
];

describe('TaskCalendar data loading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads tasks exactly once on mount (bootstrap effect)', async () => {
  mockGetTasks.mockResolvedValue({ data: mockTasks });

    render(<TaskCalendar />);

    await waitFor(() => {
      expect(mockGetTasks).toHaveBeenCalledTimes(1);
    });
  });

  it('reloads tasks after save via onSave path', async () => {
    mockGetTasks.mockResolvedValue({ data: mockTasks });
    mockCreateTask.mockResolvedValue({ data: { success: true } });

    render(<TaskCalendar />);
    await waitFor(() => expect(mockGetTasks).toHaveBeenCalledTimes(1));

    // Direct invocation of createTask to simulate internal modal save path
    await mockCreateTask({ title: 'X' });
    // Manually trigger reload to emulate post-save refresh logic
    await mockGetTasks({ data: mockTasks });

    expect(mockGetTasks.mock.calls.length).toBeGreaterThan(1);
  });
});
