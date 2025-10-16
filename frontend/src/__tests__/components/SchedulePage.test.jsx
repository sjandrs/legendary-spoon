import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/test-utils';
import { testComponentAccessibility } from '../helpers/test-utils';
import SchedulePage from '../../components/SchedulePage';

// Mock the API module
jest.mock('../../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedApi = require('../../api').default;

// Mock FullCalendar to avoid complex calendar rendering in tests
jest.mock('@fullcalendar/react', () => {
  return function MockFullCalendar({ events, dateClick, eventClick, eventDrop }) {
    return (
      <div data-testid="fullcalendar">
        <div data-testid="calendar-events">
          {events.map(event => (
            <div
              key={event.id}
              data-testid={`event-${event.id}`}
              data-event-id={event.id}
              data-event-title={event.title}
              data-event-start={event.start}
              data-event-end={event.end}
              data-event-status={event.extendedProps?.status}
              onClick={() => eventClick && eventClick({
                event: {
                  id: event.id,
                  title: event.title,
                  startStr: event.start,
                  endStr: event.end,
                  extendedProps: event.extendedProps
                }
              })}
            >
              {event.title}
            </div>
          ))}
        </div>
        <button
          data-testid="calendar-date-click"
          onClick={() => dateClick && dateClick({
            date: new Date('2025-01-15'),
            dateStr: '2025-01-15'
          })}
        >
          Date Click
        </button>
      </div>
    );
  };
});

jest.mock('@fullcalendar/daygrid', () => ({}));
jest.mock('@fullcalendar/timegrid', () => ({}));
jest.mock('@fullcalendar/interaction', () => ({}));

// Test utility for creating mock API calls
const createMockApiCall = (url, response, delay = 0, shouldReject = false) => {
  return jest.fn().mockImplementation(() => {
    if (shouldReject) {
      return Promise.reject(new Error('API Error'));
    }
    return new Promise(resolve => {
      setTimeout(() => resolve({ data: response }), delay);
    });
  });
};
jest.mock('@fullcalendar/timegrid', () => ({}));
jest.mock('@fullcalendar/interaction', () => ({}));

describe('SchedulePage Component - REQ-203.1', () => {
  const user = userEvent.setup();
  const mockEvents = [
    {
      id: 1,
      title: 'Service Call',
      scheduled_date: '2025-01-15T10:00:00Z',
      estimated_end_time: '2025-01-15T11:00:00Z',
      technician: 1,
      technician_name: 'John Doe',
      work_order: 101,
      customer_name: 'ABC Corp',
      address: '123 Main St',
      status: 'scheduled',
      description: 'Regular maintenance'
    },
    {
      id: 2,
      title: 'Emergency Repair',
      scheduled_date: '2025-01-16T14:00:00Z',
      estimated_end_time: '2025-01-16T15:30:00Z',
      technician: 2,
      technician_name: 'Jane Smith',
      work_order: 102,
      customer_name: 'XYZ Inc',
      address: '456 Oak Ave',
      status: 'in_progress',
      description: 'Urgent repair needed'
    }
  ];

  const mockTechnicians = [
    { id: 1, first_name: 'John', last_name: 'Doe' },
    { id: 2, first_name: 'Jane', last_name: 'Smith' }
  ];

  const mockWorkOrders = [
    { id: 101, description: 'Maintenance visit' },
    { id: 102, description: 'Emergency repair' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock API calls for initial data load
    mockedApi.get
      .mockResolvedValueOnce({ data: { results: mockEvents } })
      .mockResolvedValueOnce({ data: { results: mockTechnicians } })
      .mockResolvedValueOnce({ data: { results: mockWorkOrders } });
  });

  describe('Component Rendering', () => {
    it('renders schedule page with header and calendar', async () => {
      renderWithProviders(<SchedulePage />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Field Service Schedule');
      expect(screen.getByText('+ Schedule Appointment')).toBeInTheDocument();
      expect(screen.getByText('+ New Appointment')).toBeInTheDocument();
      expect(screen.getByText('Optimize Route')).toBeInTheDocument();
      expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
    });

    it('loads and displays scheduled events on mount', async () => {
      renderWithProviders(<SchedulePage />);

      await waitFor(() => {
        expect(screen.getByTestId('event-1')).toBeInTheDocument();
        expect(screen.getByTestId('event-2')).toBeInTheDocument();
      });

      expect(screen.getByText('Service Call - John Doe')).toBeInTheDocument();
      expect(screen.getByText('Emergency Repair - Jane Smith')).toBeInTheDocument();
    });

    it('displays events with correct status colors', async () => {
      renderWithProviders(<SchedulePage />);

      await waitFor(() => {
        const event1 = screen.getByTestId('event-1');
        const event2 = screen.getByTestId('event-2');

        expect(event1).toHaveAttribute('data-event-status', 'scheduled');
        expect(event2).toHaveAttribute('data-event-status', 'in_progress');
      });
    });
  });

  describe('Event Modal Management', () => {
    it('opens new appointment modal when button is clicked', async () => {
      renderWithProviders(<SchedulePage />);

  await user.click(screen.getByText('+ New Appointment'));

      expect(screen.getByText('Schedule Appointment')).toBeInTheDocument();
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });

    it('closes modal when cancel button is clicked', async () => {
      renderWithProviders(<SchedulePage />);

  await user.click(screen.getByText('+ New Appointment'));
      expect(screen.getByText('Schedule Appointment')).toBeInTheDocument();

      await user.click(screen.getByText('Cancel'));
      expect(screen.queryByText('Schedule Appointment')).not.toBeInTheDocument();
    });

    it('closes modal when close button is clicked', async () => {
      renderWithProviders(<SchedulePage />);

  await user.click(screen.getByText('+ New Appointment'));
      expect(screen.getByText('Schedule Appointment')).toBeInTheDocument();

      await user.click(screen.getByText('×'));
      expect(screen.queryByText('Schedule Appointment')).not.toBeInTheDocument();
    });
  });

  describe('Event Creation', () => {
    it('creates new appointment with valid data', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: { id: 3 } });

      renderWithProviders(<SchedulePage />);

      // Wait for initial data load
      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      // Open modal
    await user.click(screen.getByText('+ New Appointment'));

      // Fill form
      await user.type(screen.getByLabelText('Title'), 'New Service Call');
      await user.type(screen.getByLabelText('Description'), 'Test appointment');
      await user.type(screen.getByLabelText('Start Date/Time'), '2025-01-20T10:00');
      await user.type(screen.getByLabelText('End Date/Time'), '2025-01-20T11:00');

      // Select technician and work order
      await user.selectOptions(screen.getByLabelText('Technician'), '1');
      await user.selectOptions(screen.getByLabelText('Work Order'), '101');

      // Submit form
      await user.click(screen.getByText('Save Appointment'));

      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith('/api/scheduled-events/', {
          title: 'New Service Call',
          description: 'Test appointment',
          scheduled_date: '2025-01-20T10:00',
          estimated_end_time: '2025-01-20T11:00',
          technician: '1',
          work_order: '101',
          recurrence_rule: null
        });
      });
    });

    it('validates required fields before submission', async () => {
      renderWithProviders(<SchedulePage />);

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

    await user.click(screen.getByText('+ New Appointment'));
      await user.click(screen.getByText('Save Appointment'));

      // Form should still be open due to validation
      expect(screen.getByText('Schedule Appointment')).toBeInTheDocument();
    });

    it('shows loading state during submission', async () => {
      mockedApi.post.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { id: 3 } }), 1000)));

      renderWithProviders(<SchedulePage />);

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

    await user.click(screen.getByText('+ New Appointment'));

      // Fill required fields quickly
      await user.type(screen.getByLabelText('Title'), 'Test');
      await user.type(screen.getByLabelText('Start Date/Time'), '2025-01-20T10:00');

      await user.click(screen.getByText('Save Appointment'));

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('creates event with route optimization', async () => {
      // First call is for optimize-route, second is for scheduled-events
      mockedApi.post.mockResolvedValueOnce({ data: { optimized_route: true } });
      mockedApi.post.mockResolvedValueOnce({ data: { id: 3 } });

      renderWithProviders(<SchedulePage />);

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      // Click calendar date to set selectedDate
      await user.click(screen.getByTestId('calendar-date-click'));

      // Open modal
    await user.click(screen.getByText('+ New Appointment'));

      // Fill form (title is required, technician for optimization)
      await user.type(screen.getByLabelText('Title'), 'Optimized Event');
      await user.selectOptions(screen.getByLabelText('Technician'), '1');

      // Click Optimize Route button (in header)
      await user.click(screen.getByText('Optimize Route'));

      // Save event
      await user.click(screen.getByText('Save Appointment'));

      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith('/api/scheduling/optimize-route/', expect.any(Object));
        expect(mockedApi.post).toHaveBeenCalledWith('/api/scheduled-events/', expect.any(Object));
      });
    });
  });

  describe('Event Interaction', () => {
    it('opens edit modal when event is clicked', async () => {
      renderWithProviders(<SchedulePage />);

      await waitFor(() => {
        expect(screen.getByTestId('event-1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('event-1'));

      expect(screen.getByText('Schedule Appointment')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Service Call')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Regular maintenance')).toBeInTheDocument();
    });

    it('populates form with event data for editing', async () => {
      renderWithProviders(<SchedulePage />);

      await waitFor(() => {
        expect(screen.getByTestId('event-1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('event-1'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('#101 - Maintenance visit')).toBeInTheDocument();
      });
    });
  });

  describe('Route Optimization', () => {
    it('enables optimize route button when date is selected', async () => {
      renderWithProviders(<SchedulePage />);

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      const optimizeButton = screen.getByText('Optimize Route');
      expect(optimizeButton).toBeDisabled();

      // Simulate date selection
      await user.click(screen.getByTestId('calendar-date-click'));

      expect(optimizeButton).not.toBeDisabled();
    });

    it('calls route optimization API with correct parameters', async () => {
      mockedApi.post.mockResolvedValueOnce({
        total_distance: 25.5,
        total_time: 120,
        route_order: [
          { address: '123 Main St', appointment_time: '10:00' },
          { address: '456 Oak Ave', appointment_time: '11:30' }
        ]
      });

      renderWithProviders(<SchedulePage />);

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      // Select date and technician
      await user.click(screen.getByTestId('calendar-date-click'));
  await user.click(screen.getByText('+ Schedule Appointment'));
      await user.selectOptions(screen.getByLabelText('Technician'), '1');

      await user.click(screen.getByText('Optimize Route'));

      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith('/api/scheduling/optimize-route/', {
          date: '2025-01-15',
          technician_id: '1'
        });
      });
    });

    it('displays route optimization results', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: {
          total_distance: 25.5,
          total_time: 120,
          route_order: [
            { address: '123 Main St', appointment_time: '10:00' },
            { address: '456 Oak Ave', appointment_time: '11:30' }
          ]
        }
      });

      renderWithProviders(<SchedulePage />);

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      // Click calendar date to enable optimize route
      await user.click(screen.getByTestId('calendar-date-click'));

      // Open modal and select technician
  await user.click(screen.getByText('+ Schedule Appointment'));
      await user.selectOptions(screen.getByLabelText('Technician'), '1');

      // Click Optimize Route button (in header)
      await user.click(screen.getByText('Optimize Route'));

      await waitFor(() => {
        expect(screen.getByText('Route Optimization Suggestions')).toBeInTheDocument();
        expect(screen.getByText('Total Distance:')).toBeInTheDocument();
        expect(screen.getByText('Estimated Time:')).toBeInTheDocument();
        expect(screen.getByText('123 Main St - 10:00')).toBeInTheDocument();
        // Check that the optimization results contain the expected values
        const optimizationResults = screen.getByText('Route Optimization Suggestions').parentElement;
        expect(optimizationResults.textContent).toContain('25.5');
        expect(optimizationResults.textContent).toContain('120');
        expect(optimizationResults.textContent).toContain('miles');
        expect(optimizationResults.textContent).toContain('minutes');
      });
    });
  });

  describe('API Integration', () => {
    it('loads initial data on component mount', async () => {
      renderWithProviders(<SchedulePage />);

      await waitFor(() => {
        expect(mockedApi.get).toHaveBeenCalledWith('/api/scheduled-events/');
        expect(mockedApi.get).toHaveBeenCalledWith('/api/technicians/');
        expect(mockedApi.get).toHaveBeenCalledWith('/api/work-orders/');
      });
    });

    it('handles API errors gracefully', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<SchedulePage />);

      // Component should still render despite API error
      expect(screen.getByText('Field Service Schedule')).toBeInTheDocument();
    });

    it('reloads data after successful event creation', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: { id: 3 } });

      renderWithProviders(<SchedulePage />);

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      // Create event
      await user.click(screen.getByText('+ New Appointment'));
      await user.type(screen.getByLabelText('Title'), 'Test Event');
      await user.type(screen.getByLabelText('Start Date/Time'), '2025-01-20T10:00');
      await user.click(screen.getByText('Save Appointment'));

      await waitFor(() => {
        // Should call APIs again to reload data
        expect(mockedApi.get).toHaveBeenCalledTimes(6); // 3 initial + 3 reload
      });
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG 2.1 AA standards', async () => {
      await testComponentAccessibility(<SchedulePage />);
    });

    it('has proper heading structure', async () => {
      renderWithProviders(<SchedulePage />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Field Service Schedule');
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<SchedulePage />);

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ New Appointment'));

      // Title input should have focus due to autoFocus
      expect(screen.getByLabelText('Title')).toHaveFocus();

      // Tab to next field (description)
      await user.tab();
      expect(screen.getByLabelText('Description')).toHaveFocus();
    });

    it('provides descriptive button labels', async () => {
      renderWithProviders(<SchedulePage />);

      expect(screen.getByRole('button', { name: '+ New Appointment' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Optimize Route' })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles event creation API errors', async () => {
      mockedApi.post.mockImplementationOnce(() => Promise.reject(new Error('API Error')));

      renderWithProviders(<SchedulePage />);

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ New Appointment'));
      await user.type(screen.getByLabelText('Title'), 'Test');
      await user.type(screen.getByLabelText('Start Date/Time'), '2025-01-20T10:00');
      await user.click(screen.getByText('Save Appointment'));

      // Modal should remain open on error
      expect(screen.getByText('Schedule Appointment')).toBeInTheDocument();
    });

    it('handles route optimization API errors', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Optimization failed'));

      renderWithProviders(<SchedulePage />);

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('calendar-date-click'));
      await user.click(screen.getByText('+ New Appointment'));
      await user.selectOptions(screen.getByLabelText('Technician'), '1');
      await user.click(screen.getByText('Optimize Route'));

      // Should handle error gracefully without crashing
      expect(screen.getByText('Field Service Schedule')).toBeInTheDocument();
    });
  });
});
