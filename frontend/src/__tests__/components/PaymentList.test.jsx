import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PaymentList from '../../components/PaymentList';
import { getPayments } from '../../api';

// Mock the API
jest.mock('../../api', () => ({
  getPayments: jest.fn()
}));
const mockGetPayments = getPayments;

describe('PaymentList', () => {
  const mockPayments = [
    {
      id: 1,
      related_object: 'Invoice #001',
      amount: '1500.00',
      payment_date: '2025-10-01',
      method: 'credit_card',
      received_by: 'John Smith'
    },
    {
      id: 2,
      related_object: 'Invoice #002',
      amount: '750.50',
      payment_date: '2025-10-02',
      method: 'bank_transfer',
      received_by: 'Jane Doe'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading message initially', () => {
      mockGetPayments.mockReturnValue(new Promise(() => {})); // Never resolves

      render(<PaymentList />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    beforeEach(() => {
      mockGetPayments.mockResolvedValue({ data: { results: mockPayments } });
    });

    it('renders payment list after loading', async () => {
      render(<PaymentList />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('displays table headers correctly', async () => {
      render(<PaymentList />);

      await waitFor(() => {
        expect(screen.getByText('ID')).toBeInTheDocument();
        expect(screen.getByText('Invoice')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('Payment Date')).toBeInTheDocument();
        expect(screen.getByText('Method')).toBeInTheDocument();
        expect(screen.getByText('Received By')).toBeInTheDocument();
      });
    });

    it('displays payment data correctly', async () => {
      render(<PaymentList />);

      await waitFor(() => {
        // First payment
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('Invoice #001')).toBeInTheDocument();
        expect(screen.getByText('1500.00')).toBeInTheDocument();
        expect(screen.getByText('2025-10-01')).toBeInTheDocument();
        expect(screen.getByText('credit_card')).toBeInTheDocument();
        expect(screen.getByText('John Smith')).toBeInTheDocument();

        // Second payment
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('Invoice #002')).toBeInTheDocument();
        expect(screen.getByText('750.50')).toBeInTheDocument();
        expect(screen.getByText('2025-10-02')).toBeInTheDocument();
        expect(screen.getByText('bank_transfer')).toBeInTheDocument();
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      });
    });

    it('handles response with direct data array', async () => {
      mockGetPayments.mockResolvedValue({ data: mockPayments });

      render(<PaymentList />);

      await waitFor(() => {
        expect(screen.getByText('Invoice #001')).toBeInTheDocument();
        expect(screen.getByText('Invoice #002')).toBeInTheDocument();
      });
    });

    it('displays correct number of payment rows', async () => {
      render(<PaymentList />);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // 1 header row + 2 data rows = 3 total
        expect(rows).toHaveLength(3);
      });
    });
  });

  describe('Empty State', () => {
    it('handles empty payment list', async () => {
      mockGetPayments.mockResolvedValue({ data: { results: [] } });

      render(<PaymentList />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        const rows = screen.getAllByRole('row');
        // Only header row should be present
        expect(rows).toHaveLength(1);
      });
    });

    it('handles null or undefined results', async () => {
      mockGetPayments.mockResolvedValue({ data: {} });

      render(<PaymentList />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('calls getPayments API on mount', async () => {
      mockGetPayments.mockResolvedValue({ data: { results: mockPayments } });

      render(<PaymentList />);

      expect(mockGetPayments).toHaveBeenCalledTimes(1);

      await waitFor(() => {
        expect(screen.getByText('Invoice #001')).toBeInTheDocument();
      });
    });

    it('handles API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetPayments.mockRejectedValue(new Error('Network error'));

      render(<PaymentList />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Table Structure', () => {
    beforeEach(() => {
      mockGetPayments.mockResolvedValue({ data: { results: mockPayments } });
    });

    it('has proper table structure', async () => {
      render(<PaymentList />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toHaveClass('striped-table');

        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        expect(thead).toBeInTheDocument();
        expect(tbody).toBeInTheDocument();
      });
    });

    it('has correct column headers', async () => {
      render(<PaymentList />);

      await waitFor(() => {
        const headers = screen.getAllByRole('columnheader');
        expect(headers).toHaveLength(6);

        expect(headers[0]).toHaveTextContent('ID');
        expect(headers[1]).toHaveTextContent('Invoice');
        expect(headers[2]).toHaveTextContent('Amount');
        expect(headers[3]).toHaveTextContent('Payment Date');
        expect(headers[4]).toHaveTextContent('Method');
        expect(headers[5]).toHaveTextContent('Received By');
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockGetPayments.mockResolvedValue({ data: { results: mockPayments } });
    });

    it('has accessible table structure', async () => {
      render(<PaymentList />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();

        // Check for proper table roles
        expect(screen.getAllByRole('columnheader')).toHaveLength(6);
        expect(screen.getAllByRole('row')).toHaveLength(3); // 1 header + 2 data rows
      });
    });

    it('has proper semantic structure', async () => {
      render(<PaymentList />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        expect(thead).toBeInTheDocument();
        expect(tbody).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('renders within performance budget', async () => {
      mockGetPayments.mockResolvedValue({ data: { results: mockPayments } });

      const startTime = performance.now();
      render(<PaymentList />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should render in under 100ms

      await waitFor(() => {
        expect(screen.getByText('Invoice #001')).toBeInTheDocument();
      });
    });

    it('handles large datasets efficiently', async () => {
      const largePayments = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        related_object: `Invoice #${String(i + 1).padStart(3, '0')}`,
        amount: `${(Math.random() * 1000 + 100).toFixed(2)}`,
        payment_date: '2025-10-01',
        method: 'credit_card',
        received_by: `User ${i + 1}`
      }));

      mockGetPayments.mockResolvedValue({ data: { results: largePayments } });

      const startTime = performance.now();
      render(<PaymentList />);

      await waitFor(() => {
        expect(screen.getByText('Invoice #001')).toBeInTheDocument();
        expect(screen.getByText('Invoice #100')).toBeInTheDocument();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should handle 100 items in under 1 second
    });
  });
});
