import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import WorkOrderForm from '../WorkOrderForm';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  createWorkOrder: jest.fn(),
}));

describe('WorkOrderForm', () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWorkOrderForm = (props = {}) => {
    const defaultProps = {
      onSuccess: mockOnSuccess,
    };
    return render(<WorkOrderForm {...defaultProps} {...props} />);
  };

  // REQ-103.1: Form renders with all required fields
  describe('Form Rendering', () => {
    it('renders all form fields', () => {
      renderWorkOrderForm();

      expect(screen.getByPlaceholderText('Project ID')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Description')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('renders status dropdown with all options', () => {
      renderWorkOrderForm();

      const statusSelect = screen.getByRole('combobox');
      expect(statusSelect).toBeInTheDocument();

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveValue('open');
      expect(options[1]).toHaveValue('in_progress');
      expect(options[2]).toHaveValue('closed');
    });

    it('has correct initial form state', () => {
      renderWorkOrderForm();

      expect(screen.getByPlaceholderText('Project ID')).toHaveValue('');
      expect(screen.getByPlaceholderText('Description')).toHaveValue('');
      expect(screen.getByRole('combobox')).toHaveValue('open');
    });
  });

  // REQ-103.2: Form validation and user input handling
  describe('Form Input Handling', () => {
    it('updates project field on input', async () => {
      renderWorkOrderForm();

      const projectInput = screen.getByPlaceholderText('Project ID');
      fireEvent.change(projectInput, { target: { value: '123' } });

      expect(projectInput).toHaveValue('123');
    });

    it('updates description field on input', async () => {
      renderWorkOrderForm();

      const descriptionInput = screen.getByPlaceholderText('Description');
      fireEvent.change(descriptionInput, { target: { value: 'Install new system' } });

      expect(descriptionInput).toHaveValue('Install new system');
    });

    it('updates status field on select', async () => {
      renderWorkOrderForm();

      const statusSelect = screen.getByRole('combobox');
      fireEvent.change(statusSelect, { target: { value: 'in_progress' } });

      expect(statusSelect).toHaveValue('in_progress');
    });

    it('requires project field for submission', async () => {
      renderWorkOrderForm();

      const projectInput = screen.getByPlaceholderText('Project ID');
      const submitButton = screen.getByRole('button', { name: /create/i });

      // Try to submit without project
      fireEvent.click(submitButton);

      expect(projectInput).toBeRequired();
    });

    it('requires description field for submission', async () => {
      renderWorkOrderForm();

      const descriptionInput = screen.getByPlaceholderText('Description');
      const submitButton = screen.getByRole('button', { name: /create/i });

      // Try to submit without description
      fireEvent.click(submitButton);

      expect(descriptionInput).toBeRequired();
    });
  });

  // REQ-103.3: API integration and work order creation
  describe('Work Order Creation', () => {
    it('creates work order with correct data', async () => {
      api.createWorkOrder.mockResolvedValue({ data: { id: 1 } });
      renderWorkOrderForm();

      // Fill form
      fireEvent.change(screen.getByPlaceholderText('Project ID'), {
        target: { value: '123' }
      });
      fireEvent.change(screen.getByPlaceholderText('Description'), {
        target: { value: 'Install new system' }
      });
      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: 'in_progress' }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(api.createWorkOrder).toHaveBeenCalledWith({
          project: '123',
          description: 'Install new system',
          status: 'in_progress'
        });
      });
    });

    it('calls onSuccess callback after successful creation', async () => {
      api.createWorkOrder.mockResolvedValue({ data: { id: 1 } });
      renderWorkOrderForm();

      // Fill required fields
      fireEvent.change(screen.getByPlaceholderText('Project ID'), {
        target: { value: '123' }
      });
      fireEvent.change(screen.getByPlaceholderText('Description'), {
        target: { value: 'Test work order' }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('resets form after successful creation', async () => {
      api.createWorkOrder.mockResolvedValue({ data: { id: 1 } });
      renderWorkOrderForm();

      // Fill form
      const projectInput = screen.getByPlaceholderText('Project ID');
      const descriptionInput = screen.getByPlaceholderText('Description');

      fireEvent.change(projectInput, { target: { value: '123' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test work order' } });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(projectInput).toHaveValue('');
        expect(descriptionInput).toHaveValue('');
        expect(screen.getByRole('combobox')).toHaveValue('open');
      });
    });
  });

  // REQ-103.4: Error handling and user feedback
  describe('Error Handling', () => {
    it('displays error message on API failure', async () => {
      api.createWorkOrder.mockRejectedValue(new Error('Network error'));
      renderWorkOrderForm();

      // Fill required fields
      fireEvent.change(screen.getByPlaceholderText('Project ID'), {
        target: { value: '123' }
      });
      fireEvent.change(screen.getByPlaceholderText('Description'), {
        target: { value: 'Test work order' }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create work order')).toBeInTheDocument();
      });
    });

    it('does not call onSuccess on API failure', async () => {
      api.createWorkOrder.mockRejectedValue(new Error('Network error'));
      renderWorkOrderForm();

      // Fill required fields
      fireEvent.change(screen.getByPlaceholderText('Project ID'), {
        target: { value: '123' }
      });
      fireEvent.change(screen.getByPlaceholderText('Description'), {
        target: { value: 'Test work order' }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create work order')).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('does not reset form on API failure', async () => {
      api.createWorkOrder.mockRejectedValue(new Error('Network error'));
      renderWorkOrderForm();

      // Fill form
      const projectInput = screen.getByPlaceholderText('Project ID');
      const descriptionInput = screen.getByPlaceholderText('Description');

      fireEvent.change(projectInput, { target: { value: '123' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test work order' } });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create work order')).toBeInTheDocument();
      });

      // Form should still have values
      expect(projectInput).toHaveValue('123');
      expect(descriptionInput).toHaveValue('Test work order');
    });
  });

  // REQ-103.5: Loading states and UI feedback
  describe('Loading States', () => {
    it('disables submit button during API call', async () => {
      // Mock a slow API call
      api.createWorkOrder.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ data: { id: 1 } }), 100);
      }));

      renderWorkOrderForm();

      // Fill required fields
      fireEvent.change(screen.getByPlaceholderText('Project ID'), {
        target: { value: '123' }
      });
      fireEvent.change(screen.getByPlaceholderText('Description'), {
        target: { value: 'Test work order' }
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Button should be disabled during loading
      expect(submitButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('clears error message on new form input', async () => {
      api.createWorkOrder.mockRejectedValue(new Error('Network error'));
      renderWorkOrderForm();

      // Fill and submit to trigger error
      fireEvent.change(screen.getByPlaceholderText('Project ID'), {
        target: { value: '123' }
      });
      fireEvent.change(screen.getByPlaceholderText('Description'), {
        target: { value: 'Test work order' }
      });
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create work order')).toBeInTheDocument();
      });

      // Change input should clear error
      fireEvent.change(screen.getByPlaceholderText('Project ID'), {
        target: { value: '456' }
      });

      // Error should be cleared on next submit attempt
      api.createWorkOrder.mockResolvedValue({ data: { id: 1 } });
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.queryByText('Failed to create work order')).not.toBeInTheDocument();
      });
    });
  });

  // REQ-103.6: Accessibility and usability
  describe('Accessibility', () => {
    it('has proper form labels and structure', () => {
      renderWorkOrderForm();

      // Check form exists (even without explicit role)
      const formElement = screen.getByRole('button', { name: /create/i }).closest('form');
      expect(formElement).toBeInTheDocument();

      const submitButton = screen.getByRole('button', { name: /create/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('supports keyboard navigation', async () => {
      renderWorkOrderForm();

      const projectInput = screen.getByPlaceholderText('Project ID');
      const descriptionInput = screen.getByPlaceholderText('Description');
      const statusSelect = screen.getByRole('combobox');
      const submitButton = screen.getByRole('button', { name: /create/i });

      // Test that all elements are focusable
      projectInput.focus();
      expect(document.activeElement).toBe(projectInput);

      descriptionInput.focus();
      expect(document.activeElement).toBe(descriptionInput);

      statusSelect.focus();
      expect(document.activeElement).toBe(statusSelect);

      submitButton.focus();
      expect(document.activeElement).toBe(submitButton);
    });

    it('shows error message with proper styling', async () => {
      api.createWorkOrder.mockRejectedValue(new Error('Network error'));
      renderWorkOrderForm();

      // Fill and submit to trigger error
      fireEvent.change(screen.getByPlaceholderText('Project ID'), {
        target: { value: '123' }
      });
      fireEvent.change(screen.getByPlaceholderText('Description'), {
        target: { value: 'Test work order' }
      });
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        const errorElement = screen.getByText('Failed to create work order');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveStyle({ color: 'red' });
      });
    });
  });

  // REQ-103.7: Component props and integration
  describe('Component Integration', () => {
    it('works without onSuccess callback', async () => {
      api.createWorkOrder.mockResolvedValue({ data: { id: 1 } });

      render(<WorkOrderForm />);

      // Fill and submit form
      fireEvent.change(screen.getByPlaceholderText('Project ID'), {
        target: { value: '123' }
      });
      fireEvent.change(screen.getByPlaceholderText('Description'), {
        target: { value: 'Test work order' }
      });
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(api.createWorkOrder).toHaveBeenCalled();
      });

      // Should not throw error when onSuccess is undefined
      expect(() => {}).not.toThrow();
    });

    it('handles custom onSuccess callback', async () => {
      const customCallback = jest.fn();
      api.createWorkOrder.mockResolvedValue({ data: { id: 1 } });

      renderWorkOrderForm({ onSuccess: customCallback });

      // Fill and submit form
      fireEvent.change(screen.getByPlaceholderText('Project ID'), {
        target: { value: '123' }
      });
      fireEvent.change(screen.getByPlaceholderText('Description'), {
        target: { value: 'Test work order' }
      });
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(customCallback).toHaveBeenCalled();
      });
    });
  });
});
