import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, testComponentAccessibility } from '../../__tests__/helpers/test-utils';
import LineItemForm from '../LineItemForm';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  createLineItem: jest.fn(),
}));
const mockedApi = api;

describe('LineItemForm Component', () => {
  const user = userEvent.setup();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('renders form with all required fields', () => {
      renderWithProviders(<LineItemForm />);

      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/work order id/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/line item description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/unit price/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('initializes with default values', () => {
      renderWithProviders(<LineItemForm />);

      expect(screen.getByLabelText(/work order id/i)).toHaveValue('');
      expect(screen.getByLabelText(/line item description/i)).toHaveValue('');
      expect(screen.getByLabelText(/quantity/i)).toHaveValue(1);
      expect(screen.getByLabelText(/unit price/i)).toHaveValue(0);
    });
  });

  describe('Form Validation', () => {
    it('validates required work order field', async () => {
      renderWithProviders(<LineItemForm />);

      await user.type(screen.getByLabelText(/line item description/i), 'Test Item');
      await user.type(screen.getByLabelText(/quantity/i), '2');
      await user.type(screen.getByLabelText(/unit price/i), '10.50');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      expect(mockedApi.createLineItem).not.toHaveBeenCalled();
    });

    it('validates required description field', async () => {
      renderWithProviders(<LineItemForm />);

      await user.type(screen.getByLabelText(/work order id/i), 'WO-001');
      await user.type(screen.getByLabelText(/quantity/i), '2');
      await user.type(screen.getByLabelText(/unit price/i), '10.50');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      expect(mockedApi.createLineItem).not.toHaveBeenCalled();
    });

    it('validates quantity minimum value', async () => {
      renderWithProviders(<LineItemForm />);

      const quantityInput = screen.getByLabelText(/quantity/i);
      await user.clear(quantityInput);
      await user.type(quantityInput, '0');

      expect(quantityInput).toHaveAttribute('min', '1');
    });

    it('validates unit price minimum value', async () => {
      renderWithProviders(<LineItemForm />);

      const priceInput = screen.getByLabelText(/unit price/i);
      expect(priceInput).toHaveAttribute('min', '0');
      expect(priceInput).toHaveAttribute('step', '0.01');
    });

    it('allows form submission with valid data', async () => {
      mockedApi.createLineItem.mockResolvedValue({ id: 1 });

      renderWithProviders(<LineItemForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByLabelText(/work order id/i), 'WO-001');
      await user.type(screen.getByLabelText(/line item description/i), 'Test Item');
      await user.clear(screen.getByLabelText(/quantity/i));
      await user.type(screen.getByLabelText(/quantity/i), '2');
      await user.clear(screen.getByLabelText(/unit price/i));
      await user.type(screen.getByLabelText(/unit price/i), '10.50');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockedApi.createLineItem).toHaveBeenCalledWith({
          work_order: 'WO-001',
          description: 'Test Item',
          quantity: '2',
          unit_price: '10.5',
        });
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form data successfully', async () => {
      const mockLineItem = {
        id: 1,
        work_order: 'WO-001',
        description: 'Test Item',
        quantity: 2,
        unit_price: 10.50,
        total: 21.00
      };
      mockedApi.createLineItem.mockResolvedValue(mockLineItem);

      renderWithProviders(<LineItemForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByLabelText(/work order id/i), 'WO-001');
      await user.type(screen.getByLabelText(/line item description/i), 'Test Item');
      await user.clear(screen.getByLabelText(/quantity/i));
      await user.type(screen.getByLabelText(/quantity/i), '2');
      await user.clear(screen.getByLabelText(/unit price/i));
      await user.type(screen.getByLabelText(/unit price/i), '10.50');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockedApi.createLineItem).toHaveBeenCalledWith({
          work_order: 'WO-001',
          description: 'Test Item',
          quantity: '2',
          unit_price: '10.5',
        });
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('resets form after successful submission', async () => {
      mockedApi.createLineItem.mockResolvedValue({ id: 1 });

      renderWithProviders(<LineItemForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByLabelText(/work order id/i), 'WO-001');
      await user.type(screen.getByLabelText(/line item description/i), 'Test Item');
      await user.clear(screen.getByLabelText(/quantity/i));
      await user.type(screen.getByLabelText(/quantity/i), '3');
      await user.clear(screen.getByLabelText(/unit price/i));
      await user.type(screen.getByLabelText(/unit price/i), '15.75');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      expect(screen.getByLabelText(/work order id/i)).toHaveValue('');
      expect(screen.getByLabelText(/line item description/i)).toHaveValue('');
      expect(screen.getByLabelText(/quantity/i)).toHaveValue(1);
      expect(screen.getByLabelText(/unit price/i)).toHaveValue(0);
    });

    it('handles API errors gracefully', async () => {
      mockedApi.createLineItem.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<LineItemForm />);

      await user.type(screen.getByLabelText(/work order id/i), 'WO-001');
      await user.type(screen.getByLabelText(/line item description/i), 'Test Item');
      await user.clear(screen.getByLabelText(/quantity/i));
      await user.type(screen.getByLabelText(/quantity/i), '1');
      await user.clear(screen.getByLabelText(/unit price/i));
      await user.type(screen.getByLabelText(/unit price/i), '5.00');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create line item')).toBeInTheDocument();
      });
    });

    it('shows loading state during submission', async () => {
      mockedApi.createLineItem.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ id: 1 }), 100))
      );

      renderWithProviders(<LineItemForm />);

      await user.type(screen.getByLabelText(/work order id/i), 'WO-001');
      await user.type(screen.getByLabelText(/line item description/i), 'Test Item');
      await user.clear(screen.getByLabelText(/quantity/i));
      await user.type(screen.getByLabelText(/quantity/i), '1');
      await user.clear(screen.getByLabelText(/unit price/i));
      await user.type(screen.getByLabelText(/unit price/i), '5.00');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Form Interaction', () => {
    it('updates form state on input change', async () => {
      renderWithProviders(<LineItemForm />);

      const workOrderInput = screen.getByLabelText(/work order id/i);
      const descriptionInput = screen.getByLabelText(/line item description/i);
      const quantityInput = screen.getByLabelText(/quantity/i);
      const priceInput = screen.getByLabelText(/unit price/i);

      await user.type(workOrderInput, 'WO-123');
      await user.type(descriptionInput, 'Updated Description');
      await user.clear(quantityInput);
      await user.type(quantityInput, '5');
      await user.clear(priceInput);
      await user.type(priceInput, '25.99');

      expect(workOrderInput).toHaveValue('WO-123');
      expect(descriptionInput).toHaveValue('Updated Description');
      expect(quantityInput).toHaveValue(5);
      expect(priceInput).toHaveValue(25.99);
    });

    it('prevents form submission when loading', async () => {
      mockedApi.createLineItem.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ id: 1 }), 100))
      );

      renderWithProviders(<LineItemForm />);

      await user.type(screen.getByLabelText(/work order id/i), 'WO-001');
      await user.type(screen.getByLabelText(/line item description/i), 'Test Item');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      // Try to click again while loading
      await user.click(submitButton);

      // Should only be called once
      await waitFor(() => {
        expect(mockedApi.createLineItem).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG 2.1 AA standards', async () => {
      await testComponentAccessibility(<LineItemForm />);
    });

    it('has proper form labels', () => {
      renderWithProviders(<LineItemForm />);

      expect(screen.getByLabelText(/work order id/i)).toBeRequired();
      expect(screen.getByLabelText(/line item description/i)).toBeRequired();
      expect(screen.getByLabelText(/quantity/i)).toBeRequired();
      expect(screen.getByLabelText(/unit price/i)).toBeRequired();
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<LineItemForm />);

      const workOrderInput = screen.getByLabelText(/work order id/i);
      const descriptionInput = screen.getByLabelText(/line item description/i);
      const quantityInput = screen.getByLabelText(/quantity/i);
      const priceInput = screen.getByLabelText(/unit price/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      workOrderInput.focus();
      expect(workOrderInput).toHaveFocus();

      await user.tab();
      expect(descriptionInput).toHaveFocus();

      await user.tab();
      expect(quantityInput).toHaveFocus();

      await user.tab();
      expect(priceInput).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('has proper ARIA attributes', () => {
      renderWithProviders(<LineItemForm />);

      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/work order id/i)).toHaveAttribute('aria-label', 'Work Order ID');
      expect(screen.getByLabelText(/line item description/i)).toHaveAttribute('aria-label', 'Line Item Description');
      expect(screen.getByLabelText(/quantity/i)).toHaveAttribute('aria-label', 'Quantity');
      expect(screen.getByLabelText(/unit price/i)).toHaveAttribute('aria-label', 'Unit Price');
    });
  });

  describe('Error Handling', () => {
    it('clears previous errors on new submission', async () => {
      mockedApi.createLineItem
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({ id: 1 });

      renderWithProviders(<LineItemForm />);

      // First submission fails
      await user.type(screen.getByLabelText(/work order id/i), 'WO-001');
      await user.type(screen.getByLabelText(/line item description/i), 'Test Item');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create line item')).toBeInTheDocument();
      });

      // Second submission succeeds
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.queryByText('Failed to create line item')).not.toBeInTheDocument();
      });
    });

    it('handles network errors', async () => {
      mockedApi.createLineItem.mockRejectedValue({
        message: 'Network Error',
        isAxiosError: true
      });

      renderWithProviders(<LineItemForm />);

      await user.type(screen.getByLabelText(/work order id/i), 'WO-001');
      await user.type(screen.getByLabelText(/line item description/i), 'Test Item');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create line item')).toBeInTheDocument();
      });
    });
  });

  describe('Data Type Validation', () => {
    it('handles numeric inputs correctly', async () => {
      mockedApi.createLineItem.mockResolvedValue({ id: 1 });

      renderWithProviders(<LineItemForm onSuccess={mockOnSuccess} />);

      await user.type(screen.getByLabelText(/work order id/i), 'WO-001');
      await user.type(screen.getByLabelText(/line item description/i), 'Test Item');

      // Test decimal prices
      await user.clear(screen.getByLabelText(/unit price/i));
      await user.type(screen.getByLabelText(/unit price/i), '19.99');

      // Test larger quantities
      await user.clear(screen.getByLabelText(/quantity/i));
      await user.type(screen.getByLabelText(/quantity/i), '100');

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockedApi.createLineItem).toHaveBeenCalledWith(
          expect.objectContaining({
            quantity: '100',
            unit_price: '19.99'
          })
        );
      });
    });

    it('handles zero and negative values appropriately', async () => {
      renderWithProviders(<LineItemForm />);

      const quantityInput = screen.getByLabelText(/quantity/i);
      const priceInput = screen.getByLabelText(/unit price/i);

      // Quantity should not allow zero or negative
      await user.clear(quantityInput);
      await user.type(quantityInput, '0');
      expect(quantityInput).toHaveAttribute('min', '1');

      // Price can be zero but not negative
      await user.clear(priceInput);
      await user.type(priceInput, '0');
      expect(priceInput).toHaveAttribute('min', '0');
    });
  });
});
