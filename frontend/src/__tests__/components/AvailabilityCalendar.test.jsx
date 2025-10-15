import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AvailabilityCalendar from '../../components/AvailabilityCalendar';
import { getTechnicianAvailability, updateTechnicianAvailability, getTechnicians } from '../../api';
import { renderWithProviders } from '../helpers/test-utils';

// Mock the API calls
jest.mock('../../api', () => ({
  getTechnicianAvailability: jest.fn(),
  updateTechnicianAvailability: jest.fn(),
  getTechnicians: jest.fn(),
}));

// Mock FullCalendar
jest.mock('@fullcalendar/react', () => {
  return function MockFullCalendar({ events, eventClick, select, dateClick, ...props }) {
    return (
      <div
        data-testid="fullcalendar"
        data-events={JSON.stringify(events)}
        data-view={props.initialView || 'dayGridMonth'}
      >
        <div data-testid="calendar-header">
          <button onClick={() => props.headerToolbar?.left?.includes('prev') && fireEvent.click(document.createElement('button'))}>
            Previous
          </button>
          <span data-testid="calendar-title">Mock Calendar</span>
          <button onClick={() => props.headerToolbar?.left?.includes('next') && fireEvent.click(document.createElement('button'))}>
            Next
          </button>
        </div>
        <div data-testid="calendar-body">
          {events?.map((event, index) => (
            <div
              key={index}
              data-testid="calendar-event"
              data-title={event.title}
              data-start={event.start}
              data-end={event.end}
              data-color={event.backgroundColor}
              onClick={() => eventClick && eventClick({ event })}
            >
              {event.title}
            </div>
          ))}
          <div
            data-testid="calendar-selectable-area"
            onClick={(e) => {
              if (select) {
                select({
                  start: new Date('2024-12-15T09:00:00'),
                  end: new Date('2024-12-15T17:00:00'),
                  allDay: false
                });
              }
              if (dateClick) {
                dateClick({
                  date: new Date('2024-12-15T09:00:00'),
                  allDay: false
                });
              }
            }}
          >
            Selectable Area
          </div>
        </div>
      </div>
    );
  };
});

// Mock date picker
jest.mock('react-datepicker', () => {
  return function MockDatePicker({ selected, onChange, ...props }) {
    return (
      <input
        data-testid="date-picker"
        type="date"
        value={selected ? selected.toISOString().split('T')[0] : ''}
        onChange={(e) => onChange && onChange(new Date(e.target.value))}
        {...props}
      />
    );
  };
});

const createMockTechnician = (overrides = {}) => ({
  id: 1,
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  is_active: true,
  ...overrides,
});

const createMockAvailability = (overrides = {}) => ({
  id: 1,
  technician: 1,
  date: '2024-12-15',
  start_time: '09:00:00',
  end_time: '17:00:00',
  is_available: true,
  availability_type: 'work',
  notes: 'Regular work hours',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

const createMockRecurringAvailability = (overrides = {}) => ({
  id: 1,
  technician: 1,
  day_of_week: 1, // Monday
  start_time: '09:00:00',
  end_time: '17:00:00',
  is_active: true,
  availability_type: 'work',
  effective_from: '2024-01-01',
  effective_until: null,
  ...overrides,
});

describe('AvailabilityCalendar', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    getTechnicians.mockResolvedValue({
      data: { results: [createMockTechnician()] }
    });
    getTechnicianAvailability.mockResolvedValue({
      data: { results: [createMockAvailability()] }
    });
    updateTechnicianAvailability.mockResolvedValue({
      data: createMockAvailability()
    });
  });

  const renderAvailabilityCalendar = (props = {}) => {
    const defaultProps = {
      technicianId: 1,
      ...props,
    };
    return renderWithProviders(<AvailabilityCalendar {...defaultProps} />);
  };

  describe('Calendar Rendering', () => {
    it('renders calendar with technician selector', async () => {
      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByText('Availability Calendar')).toBeInTheDocument();
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: /select technician/i })).toBeInTheDocument();
      });
    });

    it('loads and displays availability events', async () => {
      const availability = [
        createMockAvailability({
          date: '2024-12-15',
          start_time: '09:00:00',
          end_time: '17:00:00',
          availability_type: 'work'
        }),
        createMockAvailability({
          id: 2,
          date: '2024-12-16',
          start_time: '10:00:00',
          end_time: '18:00:00',
          availability_type: 'overtime',
          is_available: false
        }),
      ];

      getTechnicianAvailability.mockResolvedValue({ data: { results: availability } });

      renderAvailabilityCalendar();

      await waitFor(() => {
        const calendar = screen.getByTestId('fullcalendar');
        const events = JSON.parse(calendar.getAttribute('data-events'));
        expect(events).toHaveLength(2);
        expect(events[0]).toMatchObject({
          title: 'Available (Work)',
          start: '2024-12-15T09:00:00',
          end: '2024-12-15T17:00:00',
        });
        expect(events[1]).toMatchObject({
          title: 'Unavailable (Overtime)',
          start: '2024-12-16T10:00:00',
          end: '2024-12-16T18:00:00',
        });
      });
    });

    it('shows loading state while fetching data', () => {
      getTechnicianAvailability.mockImplementation(() => new Promise(() => {}));

      renderAvailabilityCalendar();

      expect(screen.getByText(/loading availability/i)).toBeInTheDocument();
      expect(screen.getByTestId('availability-skeleton')).toBeInTheDocument();
    });
  });

  describe('Technician Selection', () => {
    it('displays technician options in dropdown', async () => {
      const technicians = [
        createMockTechnician({ id: 1, first_name: 'John', last_name: 'Doe' }),
        createMockTechnician({ id: 2, first_name: 'Jane', last_name: 'Smith' }),
      ];

      getTechnicians.mockResolvedValue({ data: { results: technicians } });

      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /select technician/i })).toBeInTheDocument();
      });

      const selector = screen.getByRole('combobox', { name: /select technician/i });
      await user.click(selector);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('changes technician and reloads availability', async () => {
      const technicians = [
        createMockTechnician({ id: 1, first_name: 'John', last_name: 'Doe' }),
        createMockTechnician({ id: 2, first_name: 'Jane', last_name: 'Smith' }),
      ];

      getTechnicians.mockResolvedValue({ data: { results: technicians } });

      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /select technician/i })).toBeInTheDocument();
      });

      const selector = screen.getByRole('combobox', { name: /select technician/i });
      await user.click(selector);

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Jane Smith'));

      await waitFor(() => {
        expect(getTechnicianAvailability).toHaveBeenCalledWith(
          expect.objectContaining({ technician: 2 })
        );
      });
    });
  });

  describe('Calendar Views', () => {
    it('switches between calendar views', async () => {
      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      const monthViewButton = screen.getByRole('button', { name: /month view/i });
      const weekViewButton = screen.getByRole('button', { name: /week view/i });
      const dayViewButton = screen.getByRole('button', { name: /day view/i });

      expect(monthViewButton).toBeInTheDocument();
      expect(weekViewButton).toBeInTheDocument();
      expect(dayViewButton).toBeInTheDocument();

      await user.click(weekViewButton);

      // Verify view change (this would typically update the calendar view)
      await waitFor(() => {
        expect(weekViewButton).toHaveClass('active');
      });
    });

    it('navigates between dates', async () => {
      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByTestId('calendar-header')).toBeInTheDocument();
      });

      const prevButton = screen.getByText('Previous');
      const nextButton = screen.getByText('Next');

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();

      await user.click(nextButton);
      // Navigation would typically trigger data reload for new date range
    });
  });

  describe('Availability Creation', () => {
    it('opens create availability modal on date click', async () => {
      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByTestId('calendar-selectable-area')).toBeInTheDocument();
      });

      const selectableArea = screen.getByTestId('calendar-selectable-area');
      await user.click(selectableArea);

      await waitFor(() => {
        expect(screen.getByText('Create Availability')).toBeInTheDocument();
        expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/availability type/i)).toBeInTheDocument();
      });
    });

    it('creates new availability entry', async () => {
      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByTestId('calendar-selectable-area')).toBeInTheDocument();
      });

      const selectableArea = screen.getByTestId('calendar-selectable-area');
      await user.click(selectableArea);

      await waitFor(() => {
        expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/start time/i), '09:00');
      await user.type(screen.getByLabelText(/end time/i), '17:00');

      const typeSelect = screen.getByLabelText(/availability type/i);
      await user.selectOptions(typeSelect, 'work');

      const saveButton = screen.getByRole('button', { name: /save availability/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(updateTechnicianAvailability).toHaveBeenCalledWith(
          expect.objectContaining({
            technician: 1,
            date: '2024-12-15',
            start_time: '09:00',
            end_time: '17:00',
            availability_type: 'work',
            is_available: true,
          })
        );
      });
    });

    it('validates time input fields', async () => {
      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByTestId('calendar-selectable-area')).toBeInTheDocument();
      });

      const selectableArea = screen.getByTestId('calendar-selectable-area');
      await user.click(selectableArea);

      await waitFor(() => {
        expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
      });

      // Enter invalid time (end before start)
      await user.type(screen.getByLabelText(/start time/i), '17:00');
      await user.type(screen.getByLabelText(/end time/i), '09:00');

      const saveButton = screen.getByRole('button', { name: /save availability/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/end time must be after start time/i)).toBeInTheDocument();
      });

      expect(updateTechnicianAvailability).not.toHaveBeenCalled();
    });
  });

  describe('Availability Editing', () => {
    it('opens edit modal when clicking existing event', async () => {
      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByTestId('calendar-event')).toBeInTheDocument();
      });

      const event = screen.getByTestId('calendar-event');
      await user.click(event);

      await waitFor(() => {
        expect(screen.getByText('Edit Availability')).toBeInTheDocument();
        expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
        expect(screen.getByDisplayValue('17:00')).toBeInTheDocument();
      });
    });

    it('updates existing availability', async () => {
      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByTestId('calendar-event')).toBeInTheDocument();
      });

      const event = screen.getByTestId('calendar-event');
      await user.click(event);

      await waitFor(() => {
        expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
      });

      const startTimeField = screen.getByDisplayValue('09:00');
      await user.clear(startTimeField);
      await user.type(startTimeField, '08:00');

      const updateButton = screen.getByRole('button', { name: /update availability/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(updateTechnicianAvailability).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            start_time: '08:00',
          })
        );
      });
    });

    it('deletes availability entry', async () => {
      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByTestId('calendar-event')).toBeInTheDocument();
      });

      const event = screen.getByTestId('calendar-event');
      await user.click(event);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete availability/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete availability/i });
      await user.click(deleteButton);

      // Mock confirm dialog
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalledWith(
          'Are you sure you want to delete this availability entry?'
        );
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Recurring Availability', () => {
    it('opens recurring availability setup', async () => {
      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /setup recurring/i })).toBeInTheDocument();
      });

      const recurringButton = screen.getByRole('button', { name: /setup recurring/i });
      await user.click(recurringButton);

      await waitFor(() => {
        expect(screen.getByText('Setup Recurring Availability')).toBeInTheDocument();
        expect(screen.getByLabelText(/days of week/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/effective from/i)).toBeInTheDocument();
      });
    });

    it('creates recurring availability pattern', async () => {
      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /setup recurring/i })).toBeInTheDocument();
      });

      const recurringButton = screen.getByRole('button', { name: /setup recurring/i });
      await user.click(recurringButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/days of week/i)).toBeInTheDocument();
      });

      // Select Monday and Tuesday
      const mondayCheckbox = screen.getByRole('checkbox', { name: /monday/i });
      const tuesdayCheckbox = screen.getByRole('checkbox', { name: /tuesday/i });

      await user.click(mondayCheckbox);
      await user.click(tuesdayCheckbox);

      await user.type(screen.getByLabelText(/start time/i), '09:00');
      await user.type(screen.getByLabelText(/end time/i), '17:00');

      const effectiveFromPicker = screen.getByTestId('date-picker');
      await user.type(effectiveFromPicker, '2024-01-01');

      const saveButton = screen.getByRole('button', { name: /save recurring pattern/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(updateTechnicianAvailability).toHaveBeenCalledWith(
          expect.objectContaining({
            recurring_pattern: {
              days_of_week: [1, 2], // Monday, Tuesday
              start_time: '09:00',
              end_time: '17:00',
              effective_from: '2024-01-01',
            }
          })
        );
      });
    });

    it('displays existing recurring patterns', async () => {
      const recurringAvailability = [
        createMockRecurringAvailability({
          day_of_week: 1,
          start_time: '09:00:00',
          end_time: '17:00:00'
        }),
        createMockRecurringAvailability({
          id: 2,
          day_of_week: 2,
          start_time: '10:00:00',
          end_time: '18:00:00'
        }),
      ];

      getTechnicianAvailability.mockResolvedValue({
        data: {
          results: [],
          recurring_patterns: recurringAvailability
        }
      });

      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByText('Recurring Patterns')).toBeInTheDocument();
        expect(screen.getByText('Monday: 09:00 - 17:00')).toBeInTheDocument();
        expect(screen.getByText('Tuesday: 10:00 - 18:00')).toBeInTheDocument();
      });
    });
  });

  describe('Availability Types and Status', () => {
    it('displays different availability types with distinct colors', async () => {
      const availability = [
        createMockAvailability({
          availability_type: 'work',
          is_available: true
        }),
        createMockAvailability({
          id: 2,
          availability_type: 'overtime',
          is_available: true
        }),
        createMockAvailability({
          id: 3,
          availability_type: 'on_call',
          is_available: true
        }),
      ];

      getTechnicianAvailability.mockResolvedValue({ data: { results: availability } });

      renderAvailabilityCalendar();

      await waitFor(() => {
        const calendar = screen.getByTestId('fullcalendar');
        const events = JSON.parse(calendar.getAttribute('data-events'));

        expect(events[0].backgroundColor).toBe('#10B981'); // Work - green
        expect(events[1].backgroundColor).toBe('#F59E0B'); // Overtime - amber
        expect(events[2].backgroundColor).toBe('#8B5CF6'); // On-call - purple
      });
    });

    it('shows unavailable periods with different styling', async () => {
      const availability = [
        createMockAvailability({
          availability_type: 'vacation',
          is_available: false,
          notes: 'Annual leave'
        }),
      ];

      getTechnicianAvailability.mockResolvedValue({ data: { results: availability } });

      renderAvailabilityCalendar();

      await waitFor(() => {
        const calendar = screen.getByTestId('fullcalendar');
        const events = JSON.parse(calendar.getAttribute('data-events'));

        expect(events[0].title).toBe('Unavailable (Vacation)');
        expect(events[0].backgroundColor).toBe('#EF4444'); // Unavailable - red
      });
    });
  });

  describe('Bulk Operations', () => {
    it('selects multiple dates for bulk editing', async () => {
      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /bulk edit/i })).toBeInTheDocument();
      });

      const bulkEditButton = screen.getByRole('button', { name: /bulk edit/i });
      await user.click(bulkEditButton);

      await waitFor(() => {
        expect(screen.getByText('Bulk Edit Mode')).toBeInTheDocument();
        expect(screen.getByText('Select dates to edit')).toBeInTheDocument();
      });
    });

    it('applies bulk availability changes', async () => {
      renderAvailabilityCalendar();

      const bulkEditButton = screen.getByRole('button', { name: /bulk edit/i });
      await user.click(bulkEditButton);

      await waitFor(() => {
        expect(screen.getByText('Select dates to edit')).toBeInTheDocument();
      });

      // Simulate selecting multiple dates
      const selectableArea = screen.getByTestId('calendar-selectable-area');
      await user.click(selectableArea);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /apply to selected/i })).toBeInTheDocument();
      });

      const applyButton = screen.getByRole('button', { name: /apply to selected/i });
      await user.click(applyButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/bulk start time/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/bulk end time/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/bulk start time/i), '08:00');
      await user.type(screen.getByLabelText(/bulk end time/i), '16:00');

      const saveBulkButton = screen.getByRole('button', { name: /save bulk changes/i });
      await user.click(saveBulkButton);

      await waitFor(() => {
        expect(updateTechnicianAvailability).toHaveBeenCalledWith(
          expect.objectContaining({
            bulk_update: true,
            start_time: '08:00',
            end_time: '16:00',
          })
        );
      });
    });
  });

  describe('Time Zone Handling', () => {
    it('displays times in technician local timezone', async () => {
      const availability = createMockAvailability({
        start_time: '09:00:00',
        end_time: '17:00:00',
        timezone: 'America/New_York'
      });

      getTechnicianAvailability.mockResolvedValue({
        data: { results: [availability] }
      });

      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByText('EST/EDT')).toBeInTheDocument();
      });
    });

    it('converts times when creating availability in different timezone', async () => {
      renderAvailabilityCalendar({ timezone: 'America/Los_Angeles' });

      await waitFor(() => {
        expect(screen.getByTestId('calendar-selectable-area')).toBeInTheDocument();
      });

      const selectableArea = screen.getByTestId('calendar-selectable-area');
      await user.click(selectableArea);

      await waitFor(() => {
        expect(screen.getByText('PST/PDT')).toBeInTheDocument();
        expect(screen.getByText('Times will be converted to technician timezone')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles availability loading errors', async () => {
      getTechnicianAvailability.mockRejectedValue(new Error('Failed to load availability'));

      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByText(/failed to load availability/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('handles availability update errors', async () => {
      updateTechnicianAvailability.mockRejectedValue({
        response: { data: { error: 'Conflicting availability' } }
      });

      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByTestId('calendar-selectable-area')).toBeInTheDocument();
      });

      const selectableArea = screen.getByTestId('calendar-selectable-area');
      await user.click(selectableArea);

      await waitFor(() => {
        expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/start time/i), '09:00');
      await user.type(screen.getByLabelText(/end time/i), '17:00');

      const saveButton = screen.getByRole('button', { name: /save availability/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Conflicting availability')).toBeInTheDocument();
      });
    });

    it('retries failed requests', async () => {
      getTechnicianAvailability.mockRejectedValueOnce(new Error('Network error'))
                              .mockResolvedValue({ data: { results: [createMockAvailability()] } });

      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      expect(getTechnicianAvailability).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Availability Calendar', level: 1 })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Calendar Controls', level: 2 })).toBeInTheDocument();
      });
    });

    it('provides keyboard navigation for calendar events', async () => {
      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByTestId('calendar-event')).toBeInTheDocument();
      });

      const event = screen.getByTestId('calendar-event');
      expect(event).toHaveAttribute('tabindex', '0');
      expect(event).toHaveAttribute('role', 'button');
      expect(event).toHaveAttribute('aria-label');
    });

    it('supports screen reader announcements for availability changes', async () => {
      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByTestId('calendar-selectable-area')).toBeInTheDocument();
      });

      const selectableArea = screen.getByTestId('calendar-selectable-area');
      await user.click(selectableArea);

      await waitFor(() => {
        expect(screen.getByRole('region', { name: /availability form/i })).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('renders calendar within performance budget', async () => {
      const startTime = performance.now();
      renderAvailabilityCalendar();

      await waitFor(() => {
        expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(300);
    });

    it('implements efficient re-rendering on date navigation', async () => {
      const renderSpy = jest.fn();
      const MockAvailabilityCalendar = jest.fn().mockImplementation(() => {
        renderSpy();
        return renderAvailabilityCalendar();
      });

      render(<MockAvailabilityCalendar />);

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      // Navigate to next month
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      // Should not cause unnecessary re-renders
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });
});
