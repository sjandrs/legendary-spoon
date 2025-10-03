import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUsers, createMockApiCall, testComponentAccessibility } from '../helpers/test-utils';
import TaskTypeSettings from '../../components/TaskTypeSettings';

// Mock API module
jest.mock('../../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('TaskTypeSettings Component', () => {
  const user = userEvent.setup();

  const mockTaskTypes = [
    {
      id: 1,
      name: 'Development',
      is_active: true,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    {
      id: 2,
      name: 'Design',
      is_active: true,
      created_at: '2024-01-02T10:00:00Z',
      updated_at: '2024-01-02T10:00:00Z'
    },
    {
      id: 3,
      name: 'Testing',
      is_active: false,
      created_at: '2024-01-03T10:00:00Z',
      updated_at: '2024-01-03T10:00:00Z'
    },
    {
      id: 4,
      name: 'Documentation',
      is_active: true,
      created_at: '2024-01-04T10:00:00Z',
      updated_at: '2024-01-04T10:00:00Z'
    },
    {
      id: 5,
      name: 'Review',
      is_active: false,
      created_at: '2024-01-05T10:00:00Z',
      updated_at: '2024-01-05T10:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default successful API responses
    const apiClient = require('../../api');
    apiClient.get.mockResolvedValue({ data: mockTaskTypes });
    apiClient.post.mockResolvedValue({ data: { id: 6, name: 'New Type', is_active: true } });
    apiClient.put.mockResolvedValue({ data: {} });
    apiClient.delete.mockResolvedValue({ data: {} });
  });

  describe('Initial Rendering', () => {
    it('renders loading state initially', () => {
      renderWithProviders(<TaskTypeSettings />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders task type settings with header and description', async () => {
      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Manage Task Types')).toBeInTheDocument();
      });

      expect(screen.getByText('Add, edit, or deactivate task types available across the application.')).toBeInTheDocument();
    });

    it('displays add task type form', async () => {
      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter new task type name')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /add type/i })).toBeInTheDocument();
    });

    it('loads and displays existing task types', async () => {
      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      expect(screen.getByText('Design')).toBeInTheDocument();
      expect(screen.getByText('Testing')).toBeInTheDocument();
      expect(screen.getByText('Documentation')).toBeInTheDocument();
      expect(screen.getByText('Review')).toBeInTheDocument();
    });
  });

  describe('Task Type Display', () => {
    it('shows active task types with correct styling', async () => {
      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const developmentItem = screen.getByText('Development').closest('.task-type-item');
      expect(developmentItem).not.toHaveClass('deactivated');
    });

    it('shows inactive task types with deactivated styling', async () => {
      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Testing')).toBeInTheDocument();
      });

      const testingItem = screen.getByText('Testing').closest('.task-type-item');
      expect(testingItem).toHaveClass('deactivated');
    });

    it('displays action buttons for each task type', async () => {
      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      // Should have Active/Inactive, Edit, and Delete buttons for each task type
      const activeButtons = screen.getAllByText(/Active|Inactive/);
      const editButtons = screen.getAllByText('Edit');
      const deleteButtons = screen.getAllByText('Delete');

      expect(activeButtons).toHaveLength(5); // 5 task types
      expect(editButtons).toHaveLength(5);
      expect(deleteButtons).toHaveLength(5);
    });

    it('shows correct active/inactive button state', async () => {
      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      // Development is active
      const developmentRow = screen.getByText('Development').closest('.task-type-item');
      const developmentToggle = developmentRow.querySelector('.btn-toggle');
      expect(developmentToggle).toHaveTextContent('Active');
      expect(developmentToggle).toHaveClass('active');

      // Testing is inactive
      const testingRow = screen.getByText('Testing').closest('.task-type-item');
      const testingToggle = testingRow.querySelector('.btn-toggle');
      expect(testingToggle).toHaveTextContent('Inactive');
      expect(testingToggle).not.toHaveClass('active');
    });
  });

  describe('Task Type Creation', () => {
    it('creates new task type when form is submitted', async () => {
      const apiClient = require('../../api');

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter new task type name')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Enter new task type name');
      const submitButton = screen.getByRole('button', { name: /add type/i });

      await user.type(input, 'Marketing');
      await user.click(submitButton);

      expect(apiClient.post).toHaveBeenCalledWith('/api/task-types/', {
        name: 'Marketing',
        is_active: true
      });

      // Should refetch task types after creation
      expect(apiClient.get).toHaveBeenCalledTimes(2); // Initial load + after creation
    });

    it('clears input field after successful creation', async () => {
      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter new task type name')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Enter new task type name');
      const submitButton = screen.getByRole('button', { name: /add type/i });

      await user.type(input, 'Marketing');
      await user.click(submitButton);

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    it('prevents submission of empty task type name', async () => {
      const apiClient = require('../../api');

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter new task type name')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /add type/i });
      await user.click(submitButton);

      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('prevents submission of whitespace-only task type name', async () => {
      const apiClient = require('../../api');

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter new task type name')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Enter new task type name');
      const submitButton = screen.getByRole('button', { name: /add type/i });

      await user.type(input, '   ');
      await user.click(submitButton);

      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('handles creation errors gracefully', async () => {
      const apiClient = require('../../api');
      apiClient.post.mockRejectedValue({
        response: { data: { name: ['Task type with this name already exists.'] } }
      });

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter new task type name')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Enter new task type name');
      const submitButton = screen.getByRole('button', { name: /add type/i });

      await user.type(input, 'Development');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to create task type.*Task type with this name already exists/)).toBeInTheDocument();
      });
    });
  });

  describe('Task Type Editing', () => {
    it('enters edit mode when edit button is clicked', async () => {
      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const developmentRow = screen.getByText('Development').closest('.task-type-item');
      const editButton = developmentRow.querySelector('button:has-text("Edit"), .btn-secondary');

      // Find edit button by text since CSS selector may not work
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]); // Click first edit button (Development)

      // Should show input field instead of span
      await waitFor(() => {
        const input = developmentRow.querySelector('input[type="text"]');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue('Development');
      });
    });

    it('enters edit mode when task type name is double-clicked', async () => {
      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const developmentSpan = screen.getByText('Development');
      await user.dblClick(developmentSpan);

      // Should show input field
      await waitFor(() => {
        const developmentRow = developmentSpan.closest('.task-type-item');
        const input = developmentRow.querySelector('input[type="text"]');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue('Development');
      });
    });

    it('saves changes when input loses focus', async () => {
      const apiClient = require('../../api');

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const developmentSpan = screen.getByText('Development');
      await user.dblClick(developmentSpan);

      await waitFor(() => {
        const developmentRow = developmentSpan.closest('.task-type-item');
        const input = developmentRow.querySelector('input[type="text"]');
        expect(input).toBeInTheDocument();
      });

      const developmentRow = developmentSpan.closest('.task-type-item');
      const input = developmentRow.querySelector('input[type="text"]');

      await user.clear(input);
      await user.type(input, 'Frontend Development');

      // Trigger blur event
      fireEvent.blur(input);

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalledWith('/api/task-types/1/', {
          id: 1,
          name: 'Frontend Development',
          is_active: true,
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z'
        });
      });
    });

    it('saves changes when Enter key is pressed', async () => {
      const apiClient = require('../../api');

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const developmentSpan = screen.getByText('Development');
      await user.dblClick(developmentSpan);

      await waitFor(() => {
        const developmentRow = developmentSpan.closest('.task-type-item');
        const input = developmentRow.querySelector('input[type="text"]');
        expect(input).toBeInTheDocument();
      });

      const developmentRow = developmentSpan.closest('.task-type-item');
      const input = developmentRow.querySelector('input[type="text"]');

      await user.clear(input);
      await user.type(input, 'Backend Development');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalledWith('/api/task-types/1/', {
          id: 1,
          name: 'Backend Development',
          is_active: true,
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z'
        });
      });
    });

    it('exits edit mode after successful update', async () => {
      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const developmentSpan = screen.getByText('Development');
      await user.dblClick(developmentSpan);

      await waitFor(() => {
        const developmentRow = developmentSpan.closest('.task-type-item');
        const input = developmentRow.querySelector('input[type="text"]');
        expect(input).toBeInTheDocument();
      });

      const developmentRow = developmentSpan.closest('.task-type-item');
      const input = developmentRow.querySelector('input[type="text"]');

      await user.clear(input);
      await user.type(input, 'Software Development');
      fireEvent.blur(input);

      // Should exit edit mode and show updated name
      await waitFor(() => {
        expect(developmentRow.querySelector('input[type="text"]')).not.toBeInTheDocument();
      });
    });

    it('handles update errors gracefully', async () => {
      const apiClient = require('../../api');
      apiClient.put.mockRejectedValue(new Error('Update failed'));

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const developmentSpan = screen.getByText('Development');
      await user.dblClick(developmentSpan);

      await waitFor(() => {
        const developmentRow = developmentSpan.closest('.task-type-item');
        const input = developmentRow.querySelector('input[type="text"]');
        expect(input).toBeInTheDocument();
      });

      const developmentRow = developmentSpan.closest('.task-type-item');
      const input = developmentRow.querySelector('input[type="text"]');

      await user.clear(input);
      await user.type(input, 'Updated Development');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Failed to update task type.')).toBeInTheDocument();
      });
    });
  });

  describe('Task Type Status Toggle', () => {
    it('toggles task type from active to inactive', async () => {
      const apiClient = require('../../api');

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const developmentRow = screen.getByText('Development').closest('.task-type-item');
      const toggleButton = developmentRow.querySelector('.btn-toggle');

      expect(toggleButton).toHaveTextContent('Active');
      await user.click(toggleButton);

      expect(apiClient.put).toHaveBeenCalledWith('/api/task-types/1/', {
        id: 1,
        name: 'Development',
        is_active: false, // Should be toggled to false
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z'
      });
    });

    it('toggles task type from inactive to active', async () => {
      const apiClient = require('../../api');

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Testing')).toBeInTheDocument();
      });

      const testingRow = screen.getByText('Testing').closest('.task-type-item');
      const toggleButton = testingRow.querySelector('.btn-toggle');

      expect(toggleButton).toHaveTextContent('Inactive');
      await user.click(toggleButton);

      expect(apiClient.put).toHaveBeenCalledWith('/api/task-types/3/', {
        id: 3,
        name: 'Testing',
        is_active: true, // Should be toggled to true
        created_at: '2024-01-03T10:00:00Z',
        updated_at: '2024-01-03T10:00:00Z'
      });
    });

    it('refreshes task types after successful toggle', async () => {
      const apiClient = require('../../api');

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const developmentRow = screen.getByText('Development').closest('.task-type-item');
      const toggleButton = developmentRow.querySelector('.btn-toggle');

      await user.click(toggleButton);

      // Should refetch task types after toggle
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledTimes(2); // Initial load + after toggle
      });
    });
  });

  describe('Task Type Deletion', () => {
    it('shows confirmation dialog when delete button is clicked', async () => {
      // Mock window.confirm
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const developmentRow = screen.getByText('Development').closest('.task-type-item');
      const deleteButton = developmentRow.querySelector('.btn-danger');

      await user.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this task type? This cannot be undone.');

      confirmSpy.mockRestore();
    });

    it('deletes task type when confirmation is accepted', async () => {
      const apiClient = require('../../api');
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const developmentRow = screen.getByText('Development').closest('.task-type-item');
      const deleteButton = developmentRow.querySelector('.btn-danger');

      await user.click(deleteButton);

      expect(apiClient.delete).toHaveBeenCalledWith('/api/task-types/1/');

      // Should refetch task types after deletion
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledTimes(2); // Initial load + after deletion
      });

      confirmSpy.mockRestore();
    });

    it('does not delete task type when confirmation is cancelled', async () => {
      const apiClient = require('../../api');
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const developmentRow = screen.getByText('Development').closest('.task-type-item');
      const deleteButton = developmentRow.querySelector('.btn-danger');

      await user.click(deleteButton);

      expect(apiClient.delete).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('handles deletion errors gracefully', async () => {
      const apiClient = require('../../api');
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      apiClient.delete.mockRejectedValue(new Error('Cannot delete task type in use'));

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const developmentRow = screen.getByText('Development').closest('.task-type-item');
      const deleteButton = developmentRow.querySelector('.btn-danger');

      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to delete task type. It might be in use.')).toBeInTheDocument();
      });

      confirmSpy.mockRestore();
    });
  });

  describe('API Integration', () => {
    it('calls API to fetch task types on component mount', async () => {
      const apiClient = require('../../api');

      renderWithProviders(<TaskTypeSettings />);

      expect(apiClient.get).toHaveBeenCalledWith('/api/task-types/');

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });
    });

    it('handles API response with results property', async () => {
      const apiClient = require('../../api');
      apiClient.get.mockResolvedValue({ data: { results: mockTaskTypes } });

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      expect(screen.getByText('Design')).toBeInTheDocument();
    });

    it('handles API response without results property', async () => {
      const apiClient = require('../../api');
      apiClient.get.mockResolvedValue({ data: mockTaskTypes });

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      expect(screen.getByText('Design')).toBeInTheDocument();
    });

    it('handles empty task types list', async () => {
      const apiClient = require('../../api');
      apiClient.get.mockResolvedValue({ data: [] });

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Manage Task Types')).toBeInTheDocument();
      });

      // Should still show the form
      expect(screen.getByPlaceholderText('Enter new task type name')).toBeInTheDocument();

      // Should not show any task type items
      expect(screen.queryByText('Development')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API fails to load task types', async () => {
      const apiClient = require('../../api');
      apiClient.get.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load task types. You may not have the required permissions.')).toBeInTheDocument();
      });

      // Should not show the main interface
      expect(screen.queryByText('Manage Task Types')).not.toBeInTheDocument();
    });

    it('handles 403 permission errors appropriately', async () => {
      const apiClient = require('../../api');
      apiClient.get.mockRejectedValue({ response: { status: 403 } });

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load task types. You may not have the required permissions.')).toBeInTheDocument();
      });
    });

    it('clears error message on successful operations', async () => {
      const apiClient = require('../../api');
      // First fail, then succeed
      apiClient.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ data: mockTaskTypes });

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load task types. You may not have the required permissions.')).toBeInTheDocument();
      });

      // Trigger a retry by creating a new task type (which calls fetchTaskTypes)
      apiClient.get.mockResolvedValue({ data: mockTaskTypes });

      // Force a re-render or retry by calling the component again
      const { rerender } = renderWithProviders(<TaskTypeSettings />);
      rerender(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Manage Task Types')).toBeInTheDocument();
      });

      expect(screen.queryByText('Failed to load task types. You may not have the required permissions.')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG 2.1 AA standards', async () => {
      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Manage Task Types')).toBeInTheDocument();
      });

      await testComponentAccessibility(<TaskTypeSettings />);
    });

    it('has proper form labels and structure', async () => {
      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter new task type name')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Enter new task type name');
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('provides descriptive button labels', async () => {
      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /add type/i })).toBeInTheDocument();
      expect(screen.getAllByText('Edit')).toHaveLength(5);
      expect(screen.getAllByText('Delete')).toHaveLength(5);
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter new task type name')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Enter new task type name');
      const submitButton = screen.getByRole('button', { name: /add type/i });

      input.focus();
      expect(document.activeElement).toBe(input);

      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(submitButton);
    });

    it('has proper heading hierarchy', async () => {
      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Manage Task Types')).toBeInTheDocument();
      });

      const heading = screen.getByRole('heading', { level: 2, name: /manage task types/i });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('User Experience', () => {
    it('focuses edit input when entering edit mode', async () => {
      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const developmentSpan = screen.getByText('Development');
      await user.dblClick(developmentSpan);

      await waitFor(() => {
        const developmentRow = developmentSpan.closest('.task-type-item');
        const input = developmentRow.querySelector('input[type="text"]');
        expect(input).toBeInTheDocument();
        expect(document.activeElement).toBe(input);
      });
    });

    it('shows visual feedback for active vs inactive task types', async () => {
      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      // Active task type should not have deactivated class
      const developmentItem = screen.getByText('Development').closest('.task-type-item');
      expect(developmentItem).not.toHaveClass('deactivated');

      // Inactive task type should have deactivated class
      const testingItem = screen.getByText('Testing').closest('.task-type-item');
      expect(testingItem).toHaveClass('deactivated');
    });

    it('provides immediate feedback for form submission', async () => {
      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter new task type name')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Enter new task type name');
      const submitButton = screen.getByRole('button', { name: /add type/i });

      await user.type(input, 'Marketing');
      await user.click(submitButton);

      // Input should be cleared immediately
      await waitFor(() => {
        expect(input).toHaveValue('');
      });
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

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Manage Task Types')).toBeInTheDocument();
      });

      // Component should render without issues on mobile
      expect(screen.getByText('Add, edit, or deactivate task types available across the application.')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('loads efficiently with single API call', async () => {
      const apiClient = require('../../api');
      const startTime = Date.now();

      renderWithProviders(<TaskTypeSettings />);

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Should load within reasonable time
      expect(loadTime).toBeLessThan(1000);
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('handles large lists of task types efficiently', async () => {
      const largeTaskTypeList = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `Task Type ${i + 1}`,
        is_active: i % 2 === 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const apiClient = require('../../api');
      apiClient.get.mockResolvedValue({ data: largeTaskTypeList });

      const startTime = performance.now();
      renderWithProviders(<TaskTypeSettings />);
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      await waitFor(() => {
        expect(screen.getByText('Task Type 1')).toBeInTheDocument();
      });

      // Should render large lists efficiently
      expect(renderTime).toBeLessThan(200); // 200ms performance budget
      expect(screen.getByText('Task Type 50')).toBeInTheDocument();
    });
  });
});
