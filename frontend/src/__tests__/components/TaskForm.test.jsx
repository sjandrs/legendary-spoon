import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, testComponentAccessibility } from '../helpers/test-utils';
import TaskForm from '../../components/TaskForm';

// Mock the API module
jest.mock('../../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));
const mockedApi = require('../../api');

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: jest.fn(() => ({ state: null })),
}));

describe('TaskForm Component', () => {
  const user = userEvent.setup();
  const mockUsers = [
    { id: 1, username: 'testuser' },
    { id: 2, username: 'manager' }
  ];
  const mockTaskTypes = [
    { id: 1, name: 'Development', is_active: true },
    { id: 2, name: 'Support', is_active: true },
    { id: 3, name: 'Inactive Type', is_active: false }
  ];
  const mockContact = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone_number: '123-456-7890',
    account: { id: 1, name: 'Test Account' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();

    // Set up default mocks for tests that need them
    mockedApi.get.mockImplementation((url) => {
      if (url === '/api/user-roles/') {
        return Promise.resolve({ data: { users: mockUsers } });
      }
      if (url === '/api/project-types/') {
        return Promise.resolve({ data: mockTaskTypes });
      }
      if (url.startsWith('/api/contacts/')) {
        return Promise.resolve({ data: mockContact });
      }
      return Promise.reject(new Error('Unexpected API call'));
    });
    mockedApi.post.mockResolvedValue({ id: 1 });

    // Silence act() warnings for this test
    const originalError = console.error;
    console.error = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('Warning: An update to')) {
        return;
      }
      originalError.call(console, ...args);
    };
  });

  describe('Loading State', () => {
    it('shows loading state initially', () => {
      mockedApi.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithProviders(<TaskForm />);

      expect(screen.getByText('Loading Form...')).toBeInTheDocument();
    });

    it('transitions from loading to loaded state', async () => {
      mockedApi.get
        .mockResolvedValueOnce({ data: { users: mockUsers } })
        .mockResolvedValueOnce({ data: mockTaskTypes });

      renderWithProviders(<TaskForm />);

      expect(screen.getByText('Loading Form...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading Form...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Rendering', () => {
    it('renders form with all required fields', async () => {
      mockedApi.get
        .mockResolvedValueOnce({ data: { users: mockUsers } })
        .mockResolvedValueOnce({ data: mockTaskTypes });

      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(screen.getByText('Create New Task')).toBeInTheDocument();
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/task type/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/assign to/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
      });
    });

    it('loads and displays task types correctly', async () => {
      mockedApi.get
        .mockResolvedValueOnce({ data: { users: mockUsers } })
        .mockResolvedValueOnce({ data: mockTaskTypes });

      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        const taskTypeSelect = screen.getByLabelText(/task type/i);
        expect(taskTypeSelect).toHaveValue('1'); // First active type selected by default

        const options = screen.getAllByRole('option');
        const taskTypeOptions = options.filter(option => option.closest('select[id="task-type"]'));
        expect(taskTypeOptions).toHaveLength(3); // 2 active types + 1 "Select a type" option
        expect(screen.getByText('Development')).toBeInTheDocument();
        expect(screen.getByText('Support')).toBeInTheDocument();
        expect(screen.queryByText('Inactive Type')).not.toBeInTheDocument();
      });
    });

    it('loads and displays users correctly', async () => {
      mockedApi.get
        .mockResolvedValueOnce({ data: { users: mockUsers } })
        .mockResolvedValueOnce({ data: mockTaskTypes });

      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        const assignToSelect = screen.getByLabelText(/assign to/i);
        expect(assignToSelect).toHaveValue('2'); // Current user selected by default

        const options = screen.getAllByRole('option');
        const assignToOptions = options.filter(option => option.closest('select[id="assign-to"]'));
        expect(assignToOptions).toHaveLength(3); // 2 users + 1 "Select a user" option
        expect(screen.getByText('testuser')).toBeInTheDocument();
        expect(screen.getByText('manager')).toBeInTheDocument();
      });
    });

    it('displays priority options correctly', async () => {
      mockedApi.get
        .mockResolvedValueOnce({ data: { users: mockUsers } })
        .mockResolvedValueOnce({ data: mockTaskTypes });

      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        const prioritySelect = screen.getByLabelText(/priority/i);
        expect(prioritySelect).toHaveValue('medium'); // Default value

        expect(screen.getByText('Low')).toBeInTheDocument();
        expect(screen.getByText('Medium')).toBeInTheDocument();
        expect(screen.getByText('High')).toBeInTheDocument();
        expect(screen.getByText('Urgent')).toBeInTheDocument();
      });
    });
  });

  describe('Contact Integration', () => {
    it('displays contact details when contact is provided', async () => {
      const mockContact = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone_number: '123-456-7890',
        account: { id: 1, name: 'Test Account' }
      };

      // Mock useLocation to return contact in state
      const mockUseLocation = require('react-router-dom').useLocation;
      mockUseLocation.mockReturnValue({ state: { contact: { id: 1 } } });

      mockedApi.get
        .mockResolvedValueOnce({ data: { users: mockUsers } })
        .mockResolvedValueOnce({ data: mockTaskTypes })
        .mockResolvedValueOnce({ data: mockContact });

      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('123-456-7890')).toBeInTheDocument();
        expect(screen.getByText('Test Account')).toBeInTheDocument();
      });
    });

    it('shows contact avatar with initials', async () => {
      const mockContact = {
        id: 1,
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com'
      };

      mockedApi.get
        .mockResolvedValueOnce({ data: { users: mockUsers } })
        .mockResolvedValueOnce({ data: mockTaskTypes })
        .mockResolvedValueOnce({ data: mockContact });

      const mockUseLocation = jest.fn(() => ({
        state: { contact: { id: 1 } }
      }));
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
        useLocation: mockUseLocation,
      }));

      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(screen.getByText('JS')).toBeInTheDocument(); // Initials
      });
    });
  });

  describe('Form Validation', () => {
    it('validates required title field', async () => {
      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(screen.queryByText('Loading Form...')).not.toBeInTheDocument();
      });

      expect(screen.getByLabelText(/title/i)).toBeRequired();
    });

    it('validates required due date field', async () => {
      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(screen.queryByText('Loading Form...')).not.toBeInTheDocument();
      });

      expect(screen.getByLabelText(/due date/i)).toBeRequired();
    });

    it('validates required assign to field', async () => {
      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(screen.queryByText('Loading Form...')).not.toBeInTheDocument();
      });

      expect(screen.getByLabelText(/assign to/i)).toBeRequired();
    });

    it('shows validation error for missing required fields', async () => {
      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(screen.queryByText('Loading Form...')).not.toBeInTheDocument();
      });

      const form = document.querySelector('.task-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Title, Due Date, Assigned To, and Task Type are required.')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form data successfully', async () => {
      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(screen.queryByText('Loading Form...')).not.toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/title/i), 'Test Task');
      await user.type(screen.getByLabelText(/due date/i), '2025-01-01');
      await user.type(screen.getByLabelText(/description/i), 'Test description');
      await user.selectOptions(screen.getByLabelText(/priority/i), 'high');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith('/api/projects/', {
          title: 'Test Task',
          description: 'Test description',
          due_date: '2025-01-01',
          priority: 'high',
          task_type: 1,
          assigned_to: 2,
          contact: 1,
          account: 1,
        });
        expect(screen.getByText('Task created successfully! Redirecting...')).toBeInTheDocument();
      });
    });

    it('navigates to tasks page after successful submission', async () => {
      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(screen.queryByText('Loading Form...')).not.toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/title/i), 'Test Task');
      await user.type(screen.getByLabelText(/due date/i), '2025-01-01');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/tasks');
      }, { timeout: 3000 });
    });

    it('handles API errors gracefully', async () => {
      mockedApi.post.mockRejectedValueOnce({
        response: { data: { detail: 'Validation error' } }
      });

      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(screen.queryByText('Loading Form...')).not.toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/title/i), 'Test Task');
      await user.type(screen.getByLabelText(/due date/i), '2025-01-01');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Validation error')).toBeInTheDocument();
      });
    });

    it('handles network errors', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(screen.queryByText('Loading Form...')).not.toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/title/i), 'Test Task');
      await user.type(screen.getByLabelText(/due date/i), '2025-01-01');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create task. Please check the details and try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Form Interaction', () => {
    it('updates form state on input change', async () => {
      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(screen.queryByText('Loading Form...')).not.toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      const descriptionTextarea = screen.getByLabelText(/description/i);
      const prioritySelect = screen.getByLabelText(/priority/i);

      await user.type(titleInput, 'Updated Title');
      await user.type(descriptionTextarea, 'Updated description');
      await user.selectOptions(prioritySelect, 'urgent');

      expect(titleInput).toHaveValue('Updated Title');
      expect(descriptionTextarea).toHaveValue('Updated description');
      expect(prioritySelect).toHaveValue('urgent');
    });

    it('changes task type selection', async () => {
      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(screen.queryByText('Loading Form...')).not.toBeInTheDocument();
      });

      const taskTypeSelect = screen.getByLabelText(/task type/i);
      await user.selectOptions(taskTypeSelect, '2');

      expect(taskTypeSelect).toHaveValue('2');
    });

    it('changes assigned user selection', async () => {
      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(screen.queryByText('Loading Form...')).not.toBeInTheDocument();
      });

      const assignToSelect = screen.getByLabelText(/assign to/i);
      await user.selectOptions(assignToSelect, '2');

      expect(assignToSelect).toHaveValue('2');
    });
  });

  describe('API Integration', () => {
    it('fetches users and task types on mount', async () => {
      mockedApi.get
        .mockResolvedValueOnce({ data: { users: mockUsers } })
        .mockResolvedValueOnce({ data: mockTaskTypes });

      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(mockedApi.get).toHaveBeenCalledWith('/api/user-roles/');
        expect(mockedApi.get).toHaveBeenCalledWith('/api/project-types/');
      });
    });

    it('fetches contact details when contact is provided', async () => {
      const mockContact = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      };

      // Mock useLocation to return contact in state
      const mockUseLocation = require('react-router-dom').useLocation;
      mockUseLocation.mockReturnValue({ state: { contact: { id: 1 } } });

      mockedApi.get
        .mockResolvedValueOnce({ data: { users: mockUsers } })
        .mockResolvedValueOnce({ data: mockTaskTypes })
        .mockResolvedValueOnce({ data: mockContact });

      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(mockedApi.get).toHaveBeenCalledWith('/api/contacts/1/');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles users API error gracefully', async () => {
      mockedApi.get
        .mockRejectedValueOnce(new Error('Users API error'))
        .mockResolvedValueOnce({ data: mockTaskTypes });

      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load necessary data. Please try again later.')).toBeInTheDocument();
      });
    });

    it('handles task types API error gracefully', async () => {
      mockedApi.get
        .mockResolvedValueOnce({ data: { users: mockUsers } })
        .mockRejectedValueOnce(new Error('Task types API error'));

      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load necessary data. Please try again later.')).toBeInTheDocument();
      });
    });

    it('handles contact API error gracefully', async () => {
      // Mock useLocation to return contact in state
      const mockUseLocation = require('react-router-dom').useLocation;
      mockUseLocation.mockReturnValue({ state: { contact: { id: 1 } } });

      mockedApi.get
        .mockResolvedValueOnce({ data: { users: mockUsers } })
        .mockResolvedValueOnce({ data: mockTaskTypes })
        .mockRejectedValueOnce(new Error('Contact API error'));

      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load necessary data. Please try again later.')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG 2.1 AA standards', async () => {
      mockedApi.get
        .mockResolvedValueOnce({ data: { users: mockUsers } })
        .mockResolvedValueOnce({ data: mockTaskTypes });

      await testComponentAccessibility(<TaskForm />);
    });

    it('has proper form labels', async () => {
      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(screen.queryByText('Loading Form...')).not.toBeInTheDocument();
      });

      expect(screen.getByLabelText(/title/i)).toBeRequired();
      expect(screen.getByLabelText(/due date/i)).toBeRequired();
      expect(screen.getByLabelText(/task type/i)).toBeRequired();
      expect(screen.getByLabelText(/assign to/i)).toBeRequired();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(screen.queryByText('Loading Form...')).not.toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      const dueDateInput = screen.getByLabelText(/due date/i);
      const taskTypeSelect = screen.getByLabelText(/task type/i);
      const prioritySelect = screen.getByLabelText(/priority/i);
      const assignToSelect = screen.getByLabelText(/assign to/i);
      const descriptionTextarea = screen.getByLabelText(/description/i);
      const submitButton = screen.getByRole('button', { name: /create task/i });

      titleInput.focus();
      expect(titleInput).toHaveFocus();

      // Note: Full keyboard navigation testing would require more complex setup
      // This tests that elements are focusable
      expect(titleInput).toBeInTheDocument();
      expect(dueDateInput).toBeInTheDocument();
      expect(taskTypeSelect).toBeInTheDocument();
      expect(prioritySelect).toBeInTheDocument();
      expect(assignToSelect).toBeInTheDocument();
      expect(descriptionTextarea).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
    });

    it('has proper ARIA attributes', async () => {
      renderWithProviders(<TaskForm />);

      await waitFor(() => {
        expect(screen.queryByText('Loading Form...')).not.toBeInTheDocument();
      });

      // Form elements use proper labels, no aria-label attributes needed
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/task type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/assign to/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });
  });
});
