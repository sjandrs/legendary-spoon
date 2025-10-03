import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppointmentRequestQueue from '../../components/AppointmentRequestQueue';
import { renderWithProviders } from '../../__tests__/helpers/test-utils';
import { testComponentAccessibility } from '../../__tests__/helpers/test-utils';

// Mock the API module
jest.mock('../../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedApi = require('../../api').default;

describe('AppointmentRequestQueue Component - REQ-203.3', () => {
  const mockRequests = [
    {
      id: 1,
      customer_name: 'John Doe',
      customer_phone: '555-123-4567',
      customer_email: 'john@example.com',
      customer_address: '123 Main St',
      service_type: 'hvac_repair',
      description: 'AC not working',
      preferred_date: '2025-10-15',
      preferred_time: '10:00',
      urgency_level: 'high',
      status: 'pending',
      submitted_at: '2025-10-10T09:00:00Z',
      additional_notes: 'Please call first'
    },
    {
      id: 2,
      customer_name: 'Jane Smith',
      customer_phone: '555-987-6543',
      customer_email: 'jane@example.com',
      customer_address: '456 Oak Ave',
      service_type: 'plumbing_repair',
      description: 'Leaky faucet',
      preferred_date: '2025-10-16',
      preferred_time: '14:00',
      urgency_level: 'normal',
      status: 'approved',
      submitted_at: '2025-10-09T14:30:00Z'
    },
    {
      id: 3,
      customer_name: 'Bob Johnson',
      customer_phone: '555-555-5555',
      customer_email: 'bob@example.com',
      customer_address: '789 Pine St',
      service_type: 'emergency_service',
      description: 'Water leak',
      preferred_date: '2025-10-14',
      preferred_time: '08:00',
      urgency_level: 'emergency',
      status: 'scheduled',
      submitted_at: '2025-10-11T16:45:00Z'
    }
  ];

  const mockTechnicians = [
    {
      id: 1,
      first_name: 'Alice',
      last_name: 'Technician',
      specialization: 'HVAC'
    },
    {
      id: 2,
      first_name: 'Bob',
      last_name: 'Plumber',
      specialization: 'Plumbing'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful API responses
    mockedApi.get.mockImplementation((url) => {
      if (url.includes('/api/appointment-requests/')) {
        return Promise.resolve({ data: mockRequests });
      }
      if (url.includes('/api/technicians/')) {
        return Promise.resolve({ data: mockTechnicians });
      }
      return Promise.resolve({ data: [] });
    });
    mockedApi.patch.mockResolvedValue({ status: 200 });
    mockedApi.post.mockResolvedValue({ status: 201, data: { id: 4 } });
  });

  describe('Component Rendering', () => {
    it('renders appointment request queue with header and stats', async () => {
      renderWithProviders(<AppointmentRequestQueue />);

      expect(screen.getByText('Appointment Request Queue')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Emergency')).toBeInTheDocument();
        expect(screen.getByText('Scheduled')).toBeInTheDocument();
      });
    });

    it('loads and displays appointment requests', async () => {
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    it('displays correct statistics', async () => {
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        const pendingStats = screen.getByText('Pending').previousElementSibling;
        expect(pendingStats).toHaveTextContent('1');

        const emergencyStats = screen.getByText('Emergency').previousElementSibling;
        expect(emergencyStats).toHaveTextContent('1');

        const scheduledStats = screen.getByText('Scheduled').previousElementSibling;
        expect(scheduledStats).toHaveTextContent('1');
      });
    });

    it('shows loading state initially', () => {
      renderWithProviders(<AppointmentRequestQueue />);

      expect(screen.getByText('Loading requests...')).toBeInTheDocument();
    });

    it('displays filter buttons with counts', async () => {
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('All (3)')).toBeInTheDocument();
        expect(screen.getByText('Pending (1)')).toBeInTheDocument();
        expect(screen.getByText('Emergency (1)')).toBeInTheDocument();
        expect(screen.getByText('High Priority (1)')).toBeInTheDocument();
        expect(screen.getByText('Scheduled (1)')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering Functionality', () => {
    it('shows all requests by default', async () => {
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    it('filters to pending requests only', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('Pending (1)')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Pending (1)'));

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    });

    it('filters to emergency requests only', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('Emergency (1)')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Emergency (1)'));

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('filters to scheduled requests only', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('Scheduled (1)')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Scheduled (1)'));

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('sorts requests by urgency and submission date', async () => {
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        const requestCards = screen.getAllByText(/John Doe|Jane Smith|Bob Johnson/);
        expect(requestCards.length).toBeGreaterThan(0);
      });

      // Emergency (Bob) should appear first, then high priority (John), then normal (Jane)
      const requestElements = screen.getAllByText(/John Doe|Jane Smith|Bob Johnson/).map(el => el.textContent);
      expect(requestElements).toEqual(['Bob Johnson', 'John Doe', 'Jane Smith']);
    });
  });

  describe('Request Status Management', () => {
    it('allows approving pending requests', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Find the approve button for John's request (pending status)
      const johnCard = screen.getByText('John Doe').closest('.request-card');
      const approveButton = within(johnCard).getByText('Approve');

      await user.click(approveButton);

      expect(mockedApi.patch).toHaveBeenCalledWith('/api/appointment-requests/1/', {
        status: 'approved',
        updated_at: expect.any(String)
      });
    });

    it('allows rejecting pending requests', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen.getByText('John Doe').closest('.request-card');
      const rejectButton = within(johnCard).getByText('Reject');

      await user.click(rejectButton);

      expect(mockedApi.patch).toHaveBeenCalledWith('/api/appointment-requests/1/', {
        status: 'rejected',
        updated_at: expect.any(String)
      });
    });

    it('allows marking scheduled requests as completed', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });

      const bobCard = screen.getByText('Bob Johnson').closest('.request-card');
      const completeButton = within(bobCard).getByText('Mark Completed');

      await user.click(completeButton);

      expect(mockedApi.patch).toHaveBeenCalledWith('/api/appointment-requests/3/', {
        status: 'completed',
        updated_at: expect.any(String)
      });
    });

    it('shows appropriate action buttons based on status', async () => {
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Pending request should have Approve, Schedule, Reject buttons
      const johnCard = screen.getByText('John Doe').closest('.request-card');
      expect(within(johnCard).getByText('Approve')).toBeInTheDocument();
      expect(within(johnCard).getByText('Schedule')).toBeInTheDocument();
      expect(within(johnCard).getByText('Reject')).toBeInTheDocument();

      // Approved request should have Schedule button
      const janeCard = screen.getByText('Jane Smith').closest('.request-card');
      expect(within(janeCard).getByText('Schedule Appointment')).toBeInTheDocument();

      // Scheduled request should have Mark Completed button
      const bobCard = screen.getByText('Bob Johnson').closest('.request-card');
      expect(within(bobCard).getByText('Mark Completed')).toBeInTheDocument();
    });
  });

  describe('Scheduling Modal', () => {
    it('opens scheduling modal when schedule button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen.getByText('John Doe').closest('.request-card');
      const scheduleButton = within(johnCard).getByText('Schedule');

      await user.click(scheduleButton);

      expect(screen.getByText('Schedule Appointment - John Doe')).toBeInTheDocument();
      expect(screen.getByText('Assigned Technician')).toBeInTheDocument();
      expect(screen.getByText('Scheduled Date & Time')).toBeInTheDocument();
    });

    it('pre-fills schedule form with preferred date/time', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen.getByText('John Doe').closest('.request-card');
      await user.click(within(johnCard).getByText('Schedule'));

      const dateTimeInput = screen.getByLabelText('Scheduled Date & Time');
      expect(dateTimeInput.value).toBe('2025-10-15T10:00');
    });

    it('loads and displays available technicians', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen.getByText('John Doe').closest('.request-card');
      await user.click(within(johnCard).getByText('Schedule'));

      const technicianSelect = screen.getByLabelText('Assigned Technician');
      expect(technicianSelect).toBeInTheDocument();

      // Should have technician options
      expect(screen.getByText('Alice Technician - HVAC')).toBeInTheDocument();
      expect(screen.getByText('Bob Plumber - Plumbing')).toBeInTheDocument();
    });

    it('submits schedule form successfully', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Open schedule modal
      const johnCard = screen.getByText('John Doe').closest('.request-card');
      await user.click(within(johnCard).getByText('Schedule'));

      // Fill form using fireEvent for datetime input
      await user.selectOptions(screen.getByLabelText('Assigned Technician'), '1');
      const dateTimeInput = screen.getByLabelText('Scheduled Date & Time');
      fireEvent.change(dateTimeInput, { target: { value: '2025-10-15T10:00' } });
      await user.selectOptions(screen.getByLabelText('Estimated Duration (minutes)'), '120');
      await user.type(screen.getByLabelText('Scheduling Notes'), 'Test notes');

      // Submit
      await user.click(screen.getByText('Confirm Schedule'));

      await waitFor(() => {
        expect(mockedApi.patch).toHaveBeenCalledWith('/api/appointment-requests/1/', {
          status: 'scheduled',
          assigned_technician: '1',
          updated_at: expect.any(String)
        });

        expect(mockedApi.post).toHaveBeenCalledWith('/api/scheduled-events/', {
          title: 'hvac_repair - John Doe',
          description: 'AC not working',
          scheduled_date: '2025-10-15T10:00',
          estimated_end_time: expect.any(String),
          technician: '1',
          customer_name: 'John Doe',
          customer_phone: '555-123-4567',
          customer_email: 'john@example.com',
          address: '123 Main St',
          status: 'scheduled',
          notes: 'Test notes'
        });
      });

      expect(screen.queryByText('Schedule Appointment - John Doe')).not.toBeInTheDocument();
    });

    it('closes modal when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen.getByText('John Doe').closest('.request-card');
      await user.click(within(johnCard).getByText('Schedule'));

      expect(screen.getByText('Schedule Appointment - John Doe')).toBeInTheDocument();

      await user.click(screen.getByText('Cancel'));

      expect(screen.queryByText('Schedule Appointment - John Doe')).not.toBeInTheDocument();
    });

    it('closes modal when X button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen.getByText('John Doe').closest('.request-card');
      await user.click(within(johnCard).getByText('Schedule'));

      const closeButton = screen.getByText('×');
      await user.click(closeButton);

      expect(screen.queryByText('Schedule Appointment - John Doe')).not.toBeInTheDocument();
    });
  });

  describe('Request Details Display', () => {
    it('displays customer information correctly', async () => {
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen.getByText('John Doe').closest('.request-card');
      expect(within(johnCard).getByText('555-123-4567 • john@example.com')).toBeInTheDocument();
    });

    it('displays service details', async () => {
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen.getByText('John Doe').closest('.request-card');
      expect(within(johnCard).getByText('HVAC REPAIR')).toBeInTheDocument();
      expect(within(johnCard).getByText('123 Main St')).toBeInTheDocument();
      expect(within(johnCard).getByText('2025-10-15 at 10:00')).toBeInTheDocument();
    });

    it('displays urgency and status badges', async () => {
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Check for urgency and status badges (text content)
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('PENDING')).toBeInTheDocument();
      expect(screen.getByText('EMERGENCY')).toBeInTheDocument();
      expect(screen.getByText('SCHEDULED')).toBeInTheDocument();
    });

    it('displays description and additional notes', async () => {
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen.getByText('John Doe').closest('.request-card');
      expect(within(johnCard).getByText('AC not working')).toBeInTheDocument();
      expect(within(johnCard).getByText('Please call first')).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('handles API errors gracefully when loading requests', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('Loading requests...')).toBeInTheDocument();
      });

      // Should not crash, requests array should remain empty
      await waitFor(() => {
        expect(screen.getByText('No appointment requests found.')).toBeInTheDocument();
      });
    });

    it('handles API errors when updating status', async () => {
      const user = userEvent.setup();
      mockedApi.patch.mockRejectedValueOnce(new Error('Update failed'));

      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen.getByText('John Doe').closest('.request-card');
      await user.click(within(johnCard).getByText('Approve'));

      // Should not crash, request should still be visible
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('handles API errors when scheduling', async () => {
      const user = userEvent.setup();
      mockedApi.post.mockRejectedValueOnce(new Error('Scheduling failed'));

      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen.getByText('John Doe').closest('.request-card');
      await user.click(within(johnCard).getByText('Schedule'));

      await user.selectOptions(screen.getByLabelText('Assigned Technician'), '1');
      await user.type(screen.getByLabelText('Scheduled Date & Time'), '2025-10-15T10:00');

      await user.click(screen.getByText('Confirm Schedule'));

      // Modal should still be open on error
      expect(screen.getByText('Schedule Appointment - John Doe')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG 2.1 AA standards', async () => {
      await testComponentAccessibility(<AppointmentRequestQueue />);
    });

    it('has proper heading structure', async () => {
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('Appointment Request Queue');
      });
    });

    it('provides descriptive button labels', async () => {
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Schedule' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation in modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen.getByText('John Doe').closest('.request-card');
      await user.click(within(johnCard).getByText('Schedule'));

      // Focus should be on the technician select (first form element)
      const technicianSelect = screen.getByLabelText('Assigned Technician');
      technicianSelect.focus();
      expect(technicianSelect).toHaveFocus();

      // Tab to next element
      await user.tab();
      const dateTimeInput = screen.getByLabelText('Scheduled Date & Time');
      expect(dateTimeInput).toHaveFocus();
    });

    it('provides proper form labels', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AppointmentRequestQueue />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen.getByText('John Doe').closest('.request-card');
      await user.click(within(johnCard).getByText('Schedule'));

      expect(screen.getByLabelText('Assigned Technician')).toBeInTheDocument();
      expect(screen.getByLabelText('Scheduled Date & Time')).toBeInTheDocument();
      expect(screen.getByLabelText('Estimated Duration (minutes)')).toBeInTheDocument();
      expect(screen.getByLabelText('Scheduling Notes')).toBeInTheDocument();
    });
  });
});
