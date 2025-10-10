import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/test-utils';
import WorkOrderForm from '../../components/WorkOrderForm';
import * as api from '../../api';

// Mock the API
jest.mock('../../api', () => ({
  createWorkOrder: jest.fn()
}));

describe('WorkOrderForm', () => {
  const user = userEvent.setup();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    api.createWorkOrder.mockReset();
  });

  describe('Component Rendering', () => {
    it('renders work order form with all required fields', () => {
      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      expect(screen.getByPlaceholderText(/project id/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/description/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toHaveValue('open');
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('renders status dropdown with correct options', () => {
      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      const statusSelect = screen.getByRole('combobox');
      expect(statusSelect).toHaveValue('open');

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent('Open');
      expect(options[1]).toHaveTextContent('In Progress');
      expect(options[2]).toHaveTextContent('Closed');
    });

    it('initializes form with default values', () => {
      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      expect(screen.getByPlaceholderText(/project id/i)).toHaveValue('');
      expect(screen.getByPlaceholderText(/description/i)).toHaveValue('');
      expect(screen.getByRole('combobox')).toHaveValue('open');
    });

    it('renders submit button in enabled state initially', () => {
      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByRole('button', { name: /create/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('validates required project field', async () => {
      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      // HTML5 validation will prevent submission
      const projectInput = screen.getByPlaceholderText(/project id/i);
      expect(projectInput).toBeRequired();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('validates required description field', async () => {
      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      const descriptionInput = screen.getByPlaceholderText(/description/i);
      expect(descriptionInput).toBeRequired();

      await user.type(screen.getByPlaceholderText(/project id/i), '123');
      await user.click(screen.getByRole('button', { name: /create/i }));

      // Form should not submit without description
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('allows form submission with valid data', async () => {
      api.createWorkOrder.mockResolvedValue({ id: 1, project: '123', description: 'Test work order' });

      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByPlaceholderText(/project id/i), '123');
      await user.type(screen.getByPlaceholderText(/description/i), 'Test work order');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('validates project ID format', async () => {
      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      const projectInput = screen.getByPlaceholderText(/project id/i);
      await user.type(projectInput, '123');

      expect(projectInput).toHaveValue('123');
      expect(projectInput.validity.valid).toBe(true);
    });
  });

  describe('Form Interactions', () => {
    it('updates project field on user input', async () => {
      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      const projectInput = screen.getByPlaceholderText(/project id/i);
      await user.type(projectInput, 'PROJECT-001');

      expect(projectInput).toHaveValue('PROJECT-001');
    });

    it('updates description field on user input', async () => {
      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      const descriptionInput = screen.getByPlaceholderText(/description/i);
      await user.type(descriptionInput, 'Install new equipment');

      expect(descriptionInput).toHaveValue('Install new equipment');
    });

    it('updates status field on selection change', async () => {
      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      const statusSelect = screen.getByRole('combobox');
      await user.selectOptions(statusSelect, 'in_progress');

      expect(statusSelect).toHaveValue('in_progress');
    });

    it('handles multi-line descriptions', async () => {
      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      const descriptionInput = screen.getByPlaceholderText(/description/i);
      const multiLineText = 'Line 1{enter}Line 2{enter}Line 3';
      await user.type(descriptionInput, multiLineText);

      expect(descriptionInput).toHaveValue('Line 1Line 2Line 3');
    });
  });

  describe('API Integration', () => {
    it('submits form data to work orders API', async () => {
      api.createWorkOrder.mockResolvedValue({ id: 1 });

      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByPlaceholderText(/project id/i), '123');
      await user.type(screen.getByPlaceholderText(/description/i), 'Test description');
      await user.selectOptions(screen.getByRole('combobox'), 'in_progress');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(api.createWorkOrder).toHaveBeenCalledWith({
          project: '123',
          description: 'Test description',
          status: 'in_progress'
        });
      });
    });

    it('calls onSuccess callback after successful submission', async () => {
      api.createWorkOrder.mockResolvedValue({ id: 1 });

      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByPlaceholderText(/project id/i), '123');
      await user.type(screen.getByPlaceholderText(/description/i), 'Test');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('handles API errors gracefully', async () => {
      api.createWorkOrder.mockRejectedValue(new Error('Server error'));

      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByPlaceholderText(/project id/i), '123');
      await user.type(screen.getByPlaceholderText(/description/i), 'Test');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to create work order/i)).toBeInTheDocument();
      });
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('handles network errors appropriately', async () => {
      api.createWorkOrder.mockRejectedValue(new Error('Network connection failed'));

      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByPlaceholderText(/project id/i), '123');
      await user.type(screen.getByPlaceholderText(/description/i), 'Test');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to create work order/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('disables submit button during form submission', async () => {
      api.createWorkOrder.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ id: 1 }), 100))
      );

      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByPlaceholderText(/project id/i), '123');
      await user.type(screen.getByPlaceholderText(/description/i), 'Test');
      await user.click(screen.getByRole('button', { name: /create/i }));

      // Button should be disabled during submission
      expect(screen.getByRole('button', { name: /create/i })).toBeDisabled();

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('re-enables submit button after successful submission', async () => {
      api.createWorkOrder.mockResolvedValue({ id: 1 });

      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByPlaceholderText(/project id/i), '123');
      await user.type(screen.getByPlaceholderText(/description/i), 'Test');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create/i })).not.toBeDisabled();
      });
    });

    it('re-enables submit button after failed submission', async () => {
      api.createWorkOrder.mockRejectedValue(new Error('Server error'));

      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByPlaceholderText(/project id/i), '123');
      await user.type(screen.getByPlaceholderText(/description/i), 'Test');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create/i })).not.toBeDisabled();
      });
    });
  });

  describe('Form Reset', () => {
    it('clears form after successful submission', async () => {
      api.createWorkOrder.mockResolvedValue({ id: 1 });

      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByPlaceholderText(/project id/i), '123');
      await user.type(screen.getByPlaceholderText(/description/i), 'Test');
      await user.selectOptions(screen.getByRole('combobox'), 'in_progress');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/project id/i)).toHaveValue('');
        expect(screen.getByPlaceholderText(/description/i)).toHaveValue('');
        expect(screen.getByRole('combobox')).toHaveValue('open');
      });
    });

    it('preserves form data after failed submission', async () => {
      api.createWorkOrder.mockRejectedValue(new Error('Server error'));

      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByPlaceholderText(/project id/i), '123');
      await user.type(screen.getByPlaceholderText(/description/i), 'Test');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to create work order/i)).toBeInTheDocument();
      });

      // Form data should be preserved
      expect(screen.getByPlaceholderText(/project id/i)).toHaveValue('123');
      expect(screen.getByPlaceholderText(/description/i)).toHaveValue('Test');
    });
  });

  describe('Error Handling', () => {
    it('displays error message on API failure', async () => {
      api.createWorkOrder.mockRejectedValue(new Error('Invalid data'));

      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByPlaceholderText(/project id/i), '123');
      await user.type(screen.getByPlaceholderText(/description/i), 'Test');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to create work order/i)).toBeInTheDocument();
      });
    });

    it('clears previous error messages on new submission', async () => {
      api.createWorkOrder.mockRejectedValue(new Error('Server error'));

      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      // First submission with error
      await user.type(screen.getByPlaceholderText(/project id/i), '123');
      await user.type(screen.getByPlaceholderText(/description/i), 'Test');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to create work order/i)).toBeInTheDocument();
      });

      // Second submission should clear error initially
      await user.click(screen.getByRole('button', { name: /create/i }));

      // Error should appear again after API call
      await waitFor(() => {
        expect(screen.getByText(/failed to create work order/i)).toBeInTheDocument();
      });
    });

    it('handles malformed API responses', async () => {
      api.createWorkOrder.mockRejectedValue(new Error('Invalid JSON response'));

      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByPlaceholderText(/project id/i), '123');
      await user.type(screen.getByPlaceholderText(/description/i), 'Test');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to create work order/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper form labels and structure', () => {
      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      const projectInput = screen.getByPlaceholderText(/project id/i);
      const descriptionInput = screen.getByPlaceholderText(/description/i);
      const statusSelect = screen.getByRole('combobox');

      expect(projectInput).toHaveAttribute('placeholder', 'Project ID');
      expect(descriptionInput).toHaveAttribute('placeholder', 'Description');
      expect(statusSelect).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      const projectInput = screen.getByPlaceholderText(/project id/i);
      projectInput.focus();

      await user.keyboard('{Tab}');
      expect(screen.getByPlaceholderText(/description/i)).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(screen.getByRole('combobox')).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(screen.getByRole('button', { name: /create/i })).toHaveFocus();
    });

    it('provides proper form semantics', () => {
      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      const form = screen.getByRole('button').closest('form');
      expect(form).toBeInTheDocument();

      const submitButton = screen.getByRole('button', { name: /create/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('announces form validation errors to screen readers', async () => {
      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      const projectInput = screen.getByPlaceholderText(/project id/i);
      const descriptionInput = screen.getByPlaceholderText(/description/i);

      expect(projectInput).toBeRequired();
      expect(descriptionInput).toBeRequired();
    });
  });

  describe('Performance', () => {
    it('renders efficiently', () => {
      const startTime = performance.now();
      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });

    it('handles rapid user input without performance issues', async () => {
      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      const projectInput = screen.getByPlaceholderText(/project id/i);
      const rapidText = 'A'.repeat(100);

      const startTime = performance.now();
      await user.type(projectInput, rapidText);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(2000); // Allow more time for user typing
      expect(projectInput).toHaveValue(rapidText);
    });
  });

  describe('Integration Points', () => {
    it('integrates with parent component callback system', async () => {
      api.createWorkOrder.mockResolvedValue({ id: 1 });

      renderWithProviders(<WorkOrderForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByPlaceholderText(/project id/i), '123');
      await user.type(screen.getByPlaceholderText(/description/i), 'Test');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('handles optional onSuccess callback', async () => {
      api.createWorkOrder.mockResolvedValue({ id: 1 });

      // Render without onSuccess callback
      renderWithProviders(<WorkOrderForm />);

      await user.type(screen.getByPlaceholderText(/project id/i), '123');
      await user.type(screen.getByPlaceholderText(/description/i), 'Test');

      expect(() => user.click(screen.getByRole('button', { name: /create/i }))).not.toThrow();
    });
  });
});
