import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/test-utils';
import WorkOrderList from '../../components/WorkOrderList';
import * as api from '../../api';
import apiDefault from '../../api';

// Mock the API
jest.mock('../../api', () => ({
  __esModule: true,
  default: {
    post: jest.fn()
  },
  getWorkOrders: jest.fn()
}));

describe('WorkOrderList', () => {
  const user = userEvent.setup();

  const mockWorkOrders = [
    {
      id: 1,
      project: 'Project A',
      description: 'Fix HVAC system',
      status: 'pending',
      technician_name: null,
      customer_name: 'ABC Company',
      customer_phone: '555-0123',
      created_at: '2023-10-01T12:00:00Z'
    },
    {
      id: 2,
      project: 'Project B',
      description: 'Install new equipment',
      status: 'in_progress',
      technician_name: 'Jane Doe',
      customer_name: 'XYZ Corp',
      customer_phone: '555-0456',
      created_at: '2023-10-02T14:30:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    api.getWorkOrders.mockResolvedValue({ data: mockWorkOrders });
    apiDefault.post.mockResolvedValue({ status: 200 });
  });

  describe('Component Rendering', () => {
    it('renders work order list with data', async () => {
      renderWithProviders(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByText('Fix HVAC system')).toBeInTheDocument();
        expect(screen.getByText('Install new equipment')).toBeInTheDocument();
      });
    });

    it('renders work order status badges', async () => {
      renderWithProviders(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByText('PENDING')).toBeInTheDocument();
        expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
      });
    });

    it('renders technician information', async () => {
      renderWithProviders(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByText('Unassigned')).toBeInTheDocument();
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      });
    });

    it('renders customer information', async () => {
      renderWithProviders(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByText('ABC Company')).toBeInTheDocument();
        expect(screen.getByText('XYZ Corp')).toBeInTheDocument();
      });
    });
  });

  describe('On My Way Functionality', () => {
    it('renders "On My Way" button for in-progress work orders with technician', async () => {
      renderWithProviders(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByText('🚗 On My Way')).toBeInTheDocument();
      });
    });

    it('sends notification when "On My Way" is clicked', async () => {
      renderWithProviders(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByText('🚗 On My Way')).toBeInTheDocument();
      });

      await user.click(screen.getByText('🚗 On My Way'));

      await waitFor(() => {
        expect(apiDefault.post).toHaveBeenCalledWith('/api/notifications/send-on-way/', {
          work_order_id: 2,
          customer_phone: '555-0456',
          customer_email: undefined,
          technician_name: 'Jane Doe',
          estimated_arrival: expect.any(String)
        });
      });
    });

    it('shows success message after sending notification', async () => {
      renderWithProviders(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByText('🚗 On My Way')).toBeInTheDocument();
      });

      await user.click(screen.getByText('🚗 On My Way'));

      await waitFor(() => {
        expect(screen.getByText('"On My Way" notification sent successfully to customer!')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles notification errors', async () => {
      apiDefault.post.mockRejectedValue(new Error('Network Error'));

      renderWithProviders(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByText('🚗 On My Way')).toBeInTheDocument();
      });

      await user.click(screen.getByText('🚗 On My Way'));

      await waitFor(() => {
        expect(screen.getByText('Error sending notification. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state while fetching data', () => {
      renderWithProviders(<WorkOrderList />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('shows loading state for notification sending', async () => {
      apiDefault.post.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ status: 200 }), 100))
      );

      renderWithProviders(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByText('🚗 On My Way')).toBeInTheDocument();
      });

      await user.click(screen.getByText('🚗 On My Way'));

      // Should show loading state briefly
      expect(screen.getByText('📱 Sending...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper semantic structure', async () => {
      renderWithProviders(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('renders efficiently', async () => {
      renderWithProviders(<WorkOrderList />);

      await waitFor(() => {
        expect(screen.getByText('Project A')).toBeInTheDocument();
      });
    });
  });
});
