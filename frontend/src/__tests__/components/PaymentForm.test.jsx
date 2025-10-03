import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentForm from '../../components/PaymentForm';
import { createPayment } from '../../api';

// Mock the API
jest.mock('../../api', () => ({
  createPayment: jest.fn()
}));
const mockCreatePayment = createPayment;

describe('PaymentForm', () => {
  const mockOnSuccess = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreatePayment.mockResolvedValue({ data: { id: 1 } });
  });

  describe('Rendering', () => {
    it('renders all form fields', () => {
      render(<PaymentForm />);

      expect(screen.getByPlaceholderText('Content Type (e.g. invoice)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Object ID')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Amount')).toBeInTheDocument();
      expect(document.querySelector('input[name="payment_date"]')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Method')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Received By (User ID)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('renders without crashing', () => {
      render(<PaymentForm />);
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    const fillRequiredFields = async () => {
      await user.type(screen.getByPlaceholderText('Content Type (e.g. invoice)'), 'invoice');
      await user.type(screen.getByPlaceholderText('Object ID'), '123');
      await user.type(screen.getByPlaceholderText('Amount'), '1500');
      await user.type(document.querySelector('input[name="payment_date"]'), '2025-10-02');
      await user.type(screen.getByPlaceholderText('Method'), 'credit_card');
    };

    it('updates form fields when user types', async () => {
      render(<PaymentForm />);

      const contentTypeInput = screen.getByPlaceholderText('Content Type (e.g. invoice)');
      const objectIdInput = screen.getByPlaceholderText('Object ID');
      const amountInput = screen.getByPlaceholderText('Amount');

      await user.type(contentTypeInput, 'invoice');
      await user.type(objectIdInput, '123');
      await user.type(amountInput, '1500');

      expect(contentTypeInput).toHaveValue('invoice');
      expect(objectIdInput).toHaveValue('123');
      expect(amountInput).toHaveValue(1500);
    });

    it('submits form with correct data', async () => {
      render(<PaymentForm onSuccess={mockOnSuccess} />);

      await fillRequiredFields();
      await user.type(screen.getByPlaceholderText('Received By (User ID)'), '1');

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockCreatePayment).toHaveBeenCalledWith({
          content_type: 'invoice',
          object_id: '123',
          amount: '1500',
          payment_date: '2025-10-02',
          method: 'credit_card',
          received_by: '1'
        });
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('submits form successfully', async () => {
      render(<PaymentForm />);

      await fillRequiredFields();
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockCreatePayment).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    const fillRequiredFields = async () => {
      await user.type(screen.getByPlaceholderText('Content Type (e.g. invoice)'), 'invoice');
      await user.type(screen.getByPlaceholderText('Object ID'), '123');
      await user.type(screen.getByPlaceholderText('Amount'), '1500');
      await user.type(document.querySelector('input[name="payment_date"]'), '2025-10-02');
      await user.type(screen.getByPlaceholderText('Method'), 'credit_card');
    };

    it('displays error message when API call fails', async () => {
      mockCreatePayment.mockRejectedValue(new Error('Network error'));

      render(<PaymentForm />);

      await fillRequiredFields();
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create payment')).toBeInTheDocument();
      });
    });

    it('recovers from API errors on retry', async () => {
      mockCreatePayment.mockRejectedValueOnce(new Error('Network error'));
      mockCreatePayment.mockResolvedValueOnce({ data: { id: 1 } });

      render(<PaymentForm />);

      await fillRequiredFields();

      // First submission - should fail
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create payment')).toBeInTheDocument();
      });

      // Second submission - should succeed and clear error
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.queryByText('Failed to create payment')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('disables submit button while loading', async () => {
      let resolvePromise;
      mockCreatePayment.mockReturnValue(new Promise(resolve => {
        resolvePromise = resolve;
      }));

      render(<PaymentForm />);

      await user.type(screen.getByPlaceholderText('Content Type (e.g. invoice)'), 'invoice');
      await user.type(screen.getByPlaceholderText('Object ID'), '123');
      await user.type(screen.getByPlaceholderText('Amount'), '1500');
      await user.type(document.querySelector('input[name="payment_date"]'), '2025-10-02');
      await user.type(screen.getByPlaceholderText('Method'), 'credit_card');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();

      // Resolve the promise
      resolvePromise({ data: { id: 1 } });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form structure', () => {
      render(<PaymentForm />);

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('has required fields marked appropriately', () => {
      render(<PaymentForm />);

      expect(screen.getByPlaceholderText('Content Type (e.g. invoice)')).toBeRequired();
      expect(screen.getByPlaceholderText('Object ID')).toBeRequired();
      expect(screen.getByPlaceholderText('Amount')).toBeRequired();
            expect(document.querySelector('input[name="payment_date"]')).toHaveAttribute('required');
      expect(screen.getByPlaceholderText('Method')).toBeRequired();
    });
  });

  describe('Performance', () => {
    it('renders within performance budget', () => {
      const startTime = performance.now();
      render(<PaymentForm />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should render in under 100ms
    });
  });
});
