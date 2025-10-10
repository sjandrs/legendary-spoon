import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mock API functions
jest.mock('../../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}));

import apiClient from '../../api';
import TaskAdministration from '../../components/TaskAdministration';

// Test utilities
const renderWithProviders = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('TaskAdministration Component - REQ-202.3', () => {
  const user = userEvent.setup();

  const mockTaskTypes = [
    {
      id: 1,
      name: 'Installation',
      is_active: true
    },
    {
      id: 2,
      name: 'Maintenance',
      is_active: true
    }
  ];

  const mockTaskTemplates = [
    {
      id: 1,
      name: 'Standard Installation',
      description: 'Template for standard equipment installation'
    },
    {
      id: 2,
      name: 'Monthly Maintenance',
      description: 'Monthly maintenance checklist'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock API responses
    apiClient.get.mockImplementation((url) => {
      if (url === '/api/project-templates/') {
        return Promise.resolve({ data: mockTaskTemplates });
      }
      if (url === '/api/project-types/') {
        return Promise.resolve({ data: mockTaskTypes });
      }
      return Promise.resolve({ data: [] });
    });
  });

  describe('Component Rendering', () => {
    it('renders task template management interface', async () => {
      renderWithProviders(<TaskAdministration />);

      await waitFor(() => {
        expect(screen.getByText('Task Template Management')).toBeInTheDocument();
      });

      expect(screen.getByText('+ Create New Template')).toBeInTheDocument();
    });

    it('loads templates on mount', async () => {
      renderWithProviders(<TaskAdministration />);

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/api/project-templates/');
      });
    });

    it('displays loading state while fetching templates', async () => {
      apiClient.get.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ data: mockTaskTemplates }), 100))
      );

      renderWithProviders(<TaskAdministration />);

      expect(screen.getByText('Loading templates...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading templates...')).not.toBeInTheDocument();
      });
    });

    it('displays templates when loaded', async () => {
      renderWithProviders(<TaskAdministration />);

      await waitFor(() => {
        expect(screen.getByText('Standard Installation')).toBeInTheDocument();
        expect(screen.getByText('Monthly Maintenance')).toBeInTheDocument();
      });
    });

    it('shows empty state when no templates exist', async () => {
      apiClient.get.mockResolvedValue({ data: [] });

      renderWithProviders(<TaskAdministration />);

      await waitFor(() => {
        expect(screen.getByText('No task templates found. Create one to get started.')).toBeInTheDocument();
      });
    });
  });

  describe('Template Management', () => {
    it('handles template creation', async () => {
      apiClient.post.mockResolvedValue({ data: { id: 3, name: 'New Template' } });

      renderWithProviders(<TaskAdministration />);

      await waitFor(() => {
        expect(screen.getByText('+ Create New Template')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ Create New Template'));

      await waitFor(() => {
        expect(screen.getByText('Create Task Template')).toBeInTheDocument();
      });
    });

    it('handles template editing', async () => {
      renderWithProviders(<TaskAdministration />);

      await waitFor(() => {
        expect(screen.getByText('Standard Installation')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Task Template')).toBeInTheDocument();
      });
    });

    it('handles template deletion with confirmation', async () => {
      // Mock window.confirm
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => true);

      apiClient.delete.mockResolvedValue({});

      renderWithProviders(<TaskAdministration />);

      await waitFor(() => {
        expect(screen.getByText('Standard Installation')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this template?');

      await waitFor(() => {
        expect(apiClient.delete).toHaveBeenCalledWith('/api/project-templates/1/');
      });

      // Restore window.confirm
      window.confirm = originalConfirm;
    });

    it('cancels deletion when user declines confirmation', async () => {
      // Mock window.confirm to return false
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => false);

      renderWithProviders(<TaskAdministration />);

      await waitFor(() => {
        expect(screen.getByText('Standard Installation')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this template?');
      expect(apiClient.delete).not.toHaveBeenCalled();

      // Restore window.confirm
      window.confirm = originalConfirm;
    });
  });

  describe('Error Handling', () => {
    it('displays error message when template loading fails', async () => {
      apiClient.get.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<TaskAdministration />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load templates. You may not have the required permissions.')).toBeInTheDocument();
      });
    });

    it('shows error when template save fails', async () => {
      apiClient.post.mockRejectedValue({ response: { data: { detail: 'Save failed' } } });

      renderWithProviders(<TaskAdministration />);

      await waitFor(() => {
        expect(screen.getByText('+ Create New Template')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ Create New Template'));

      await waitFor(() => {
        expect(screen.getByText('Create Task Template')).toBeInTheDocument();
      });

      // Fill form inputs - get all textboxes and use specific ones
      const textInputs = screen.getAllByRole('textbox');
      const nameInput = textInputs.find(input => input.name === 'name');
      const titleInput = textInputs.find(input => input.name === 'default_title');

      expect(nameInput).toBeInTheDocument();
      expect(titleInput).toBeInTheDocument();

      await user.type(nameInput, 'Test Template');
      await user.type(titleInput, 'Test Project');

      await user.click(screen.getByText('Save Template'));

      await waitFor(() => {
        expect(screen.getByText(/failed to save template/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Functionality', () => {
    it('validates required fields in template form', async () => {
      renderWithProviders(<TaskAdministration />);

      await waitFor(() => {
        expect(screen.getByText('+ Create New Template')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ Create New Template'));

      await waitFor(() => {
        expect(screen.getByText('Create Task Template')).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      await user.click(screen.getByText('Save Template'));

      // Form should not submit due to HTML5 validation
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('can cancel template form', async () => {
      renderWithProviders(<TaskAdministration />);

      await waitFor(() => {
        expect(screen.getByText('+ Create New Template')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ Create New Template'));

      await waitFor(() => {
        expect(screen.getByText('Create Task Template')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.getByText('Task Template Management')).toBeInTheDocument();
        expect(screen.queryByText('Create Task Template')).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('renders quickly', () => {
      const startTime = performance.now();
      renderWithProviders(<TaskAdministration />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      renderWithProviders(<TaskAdministration />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /task template management/i })).toBeInTheDocument();
      });
    });

    it('has accessible buttons', async () => {
      renderWithProviders(<TaskAdministration />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create new template/i })).toBeInTheDocument();
      });

      // Wait for templates to load and check edit/delete buttons
      await waitFor(() => {
        const editButtons = screen.getAllByRole('button', { name: /edit/i });
        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

        expect(editButtons.length).toBeGreaterThan(0);
        expect(deleteButtons.length).toBeGreaterThan(0);
      });
    });
  });
});
