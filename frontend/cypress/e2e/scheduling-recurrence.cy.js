/**
 * Scheduling Recurrence E2E Tests - Phase 4 Enhancement
 * Tests recurring appointment scheduling functionality with RRULE integration
 */

describe('Scheduling Recurrence Workflow', () => {
  beforeEach(() => {
    // Login and navigate to scheduling
    cy.visit('/login');
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();

    cy.visit('/schedule');
    cy.get('[data-testid="fullcalendar"]').should('be.visible');
  });

  describe('Basic Recurring Event Creation', () => {
    it('should create daily recurring event', () => {
      // Create new recurring event
      cy.get('[data-testid="new-appointment-btn"]').click();

      // Fill basic event details
      cy.get('input[name="title"]').type('Daily Team Standup');
      cy.get('textarea[name="description"]').type('Daily morning team synchronization meeting');
      cy.get('input[name="start_time"]').type('2025-10-15T09:00');
      cy.get('input[name="end_time"]').type('2025-10-15T09:30');

      // Configure daily recurrence
      cy.get('input[name="is_recurring"]').check();
      cy.get('select[name="recurrence_type"]').select('daily');
      cy.get('input[name="recurrence_interval"]').type('1'); // Every day
      cy.get('input[name="recurrence_end_date"]').type('2025-11-15');

      // Select technician
      cy.get('select[name="assigned_technician"]').select(1);

      // Create recurring series
      cy.get('[data-testid="create-recurring-btn"]').click();

      // Verify recurring series creation
      cy.get('[data-testid="success-message"]').should('contain', 'Recurring event series created');
      cy.get('[data-testid="series-info"]').should('contain', '31 events created');

      // Verify events appear on calendar
      cy.get('.fc-event[data-recurring="true"]').should('have.length.greaterThan', 5);
      cy.get('.fc-event').should('contain', 'Daily Team Standup');
    });

    it('should create weekly recurring event with specific days', () => {
      cy.get('[data-testid="new-appointment-btn"]').click();

      // Event details
      cy.get('input[name="title"]').type('Weekly Client Check-ins');
      cy.get('input[name="start_time"]').type('2025-10-15T14:00');
      cy.get('input[name="end_time"]').type('2025-10-15T15:00');

      // Weekly recurrence configuration
      cy.get('input[name="is_recurring"]').check();
      cy.get('select[name="recurrence_type"]').select('weekly');
      cy.get('input[name="recurrence_interval"]').type('1'); // Every week

      // Select specific days
      cy.get('[data-testid="weekly-days"]').should('be.visible');
      cy.get('input[name="recur_monday"]').check();
      cy.get('input[name="recur_wednesday"]').check();
      cy.get('input[name="recur_friday"]').check();

      // End date
      cy.get('input[name="recurrence_end_date"]').type('2025-12-31');

      cy.get('[data-testid="create-recurring-btn"]').click();

      // Verify weekly pattern
      cy.get('[data-testid="success-message"]').should('contain', 'Weekly recurring events created');

      // Check calendar shows correct pattern (MWF only)
      cy.get('.fc-timeGridWeek-button').click();
      cy.get('.fc-event[data-recurring="true"]').should('be.visible');

      // Verify no events on Tuesday/Thursday
      cy.get('.fc-day-tue .fc-event').should('not.contain', 'Weekly Client Check-ins');
      cy.get('.fc-day-thu .fc-event').should('not.contain', 'Weekly Client Check-ins');
    });

    it('should create monthly recurring event', () => {
      cy.get('[data-testid="new-appointment-btn"]').click();

      cy.get('input[name="title"]').type('Monthly Equipment Maintenance');
      cy.get('input[name="start_time"]').type('2025-10-15T10:00');
      cy.get('input[name="end_time"]').type('2025-10-15T12:00');

      // Monthly recurrence
      cy.get('input[name="is_recurring"]').check();
      cy.get('select[name="recurrence_type"]').select('monthly');

      // Monthly pattern options
      cy.get('[data-testid="monthly-pattern"]').should('be.visible');
      cy.get('input[name="monthly_pattern"]').check(); // Same day each month
      cy.get('input[name="recurrence_end_date"]').type('2026-10-15');

      cy.get('[data-testid="create-recurring-btn"]').click();

      // Verify monthly series
      cy.get('[data-testid="success-message"]').should('contain', 'Monthly recurring events created');
      cy.get('[data-testid="series-info"]').should('contain', '12 events created');
    });

    it('should create custom recurring pattern with RRULE', () => {
      cy.get('[data-testid="new-appointment-btn"]').click();

      cy.get('input[name="title"]').type('Custom Pattern Event');
      cy.get('input[name="start_time"]').type('2025-10-15T16:00');
      cy.get('input[name="end_time"]').type('2025-10-15T17:00');

      // Advanced/Custom recurrence
      cy.get('input[name="is_recurring"]').check();
      cy.get('select[name="recurrence_type"]').select('custom');

      // Enter RRULE manually
      cy.get('textarea[name="rrule"]').type('FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH;COUNT=10');

      // Validate RRULE
      cy.get('[data-testid="validate-rrule-btn"]').click();
      cy.get('[data-testid="rrule-validation"]').should('contain', 'Valid RRULE pattern');
      cy.get('[data-testid="rrule-preview"]').should('contain', 'Every 2 weeks on Tuesday and Thursday, 10 occurrences');

      cy.get('[data-testid="create-recurring-btn"]').click();

      // Verify custom pattern creation
      cy.get('[data-testid="success-message"]').should('contain', 'Custom recurring pattern created');
    });
  });

  describe('Recurring Event Management', () => {
    beforeEach(() => {
      // Ensure we have a recurring event to work with
      cy.get('.fc-event[data-recurring="true"]').should('exist');
    });

    it('should edit single occurrence of recurring event', () => {
      // Click on a recurring event
      cy.get('.fc-event[data-recurring="true"]').first().click();

      // Edit this occurrence
      cy.get('[data-testid="edit-event-btn"]').click();
      cy.get('[data-testid="edit-options-modal"]').should('be.visible');

      // Choose to edit only this occurrence
      cy.get('[data-testid="edit-this-occurrence"]').click();

      // Modify event details
      cy.get('input[name="title"]').clear().type('Modified Single Occurrence');
      cy.get('textarea[name="description"]').type('This occurrence has been modified');

      // Save changes
      cy.get('[data-testid="save-occurrence-btn"]').click();

      // Verify single occurrence modification
      cy.get('[data-testid="success-message"]').should('contain', 'Single occurrence updated');
      cy.get('.fc-event').should('contain', 'Modified Single Occurrence');

      // Verify other occurrences unchanged
      cy.get('.fc-next-button').click();
      cy.get('.fc-event[data-recurring="true"]').should('not.contain', 'Modified Single Occurrence');
    });

    it('should edit entire recurring series', () => {
      cy.get('.fc-event[data-recurring="true"]').first().click();
      cy.get('[data-testid="edit-event-btn"]').click();

      // Choose to edit entire series
      cy.get('[data-testid="edit-entire-series"]').click();

      // Modify series details
      cy.get('input[name="title"]').clear().type('Updated Recurring Series');
      cy.get('select[name="assigned_technician"]').select(2);

      // Update recurrence pattern
      cy.get('input[name="recurrence_interval"]').clear().type('2'); // Every 2 days instead of 1

      cy.get('[data-testid="update-series-btn"]').click();

      // Verify series update
      cy.get('[data-testid="success-message"]').should('contain', 'Entire series updated');
      cy.get('[data-testid="series-update-info"]').should('contain', 'pattern changed');

      // Verify all occurrences updated
      cy.get('.fc-event').should('contain', 'Updated Recurring Series');
    });

    it('should delete single occurrence from series', () => {
      cy.get('.fc-event[data-recurring="true"]').first().click();
      cy.get('[data-testid="delete-event-btn"]').click();

      // Choose deletion scope
      cy.get('[data-testid="delete-options-modal"]').should('be.visible');
      cy.get('[data-testid="delete-this-occurrence"]').click();

      // Confirm deletion
      cy.get('[data-testid="confirm-delete-occurrence"]').click();

      // Verify single occurrence deleted
      cy.get('[data-testid="success-message"]').should('contain', 'Occurrence deleted from series');

      // Verify gap in series but other events remain
      cy.get('.fc-event[data-recurring="true"]').should('exist');
    });

    it('should delete entire recurring series', () => {
      cy.get('.fc-event[data-recurring="true"]').first().click();
      cy.get('[data-testid="delete-event-btn"]').click();

      // Delete entire series
      cy.get('[data-testid="delete-entire-series"]').click();
      cy.get('[data-testid="confirm-delete-series"]').click();

      // Verify series deletion
      cy.get('[data-testid="success-message"]').should('contain', 'Entire recurring series deleted');

      // Verify all occurrences removed
      cy.wait(1000);
      cy.get('.fc-event[data-series-id]').should('not.exist');
    });
  });

  describe('Complex Recurrence Patterns', () => {
    it('should handle monthly recurrence by day position', () => {
      cy.get('[data-testid="new-appointment-btn"]').click();

      cy.get('input[name="title"]').type('Monthly Board Meeting');
      cy.get('input[name="start_time"]').type('2025-10-15T19:00');
      cy.get('input[name="end_time"]').type('2025-10-15T21:00');

      cy.get('input[name="is_recurring"]').check();
      cy.get('select[name="recurrence_type"]').select('monthly');

      // Set to "third Tuesday of each month"
      cy.get('select[name="monthly_by"]').select('by_day_position');
      cy.get('select[name="month_week"]').select('3'); // Third
      cy.get('select[name="month_day"]').select('TU'); // Tuesday

      cy.get('input[name="recurrence_end_date"]').type('2026-10-15');

      cy.get('[data-testid="create-recurring-btn"]').click();

      // Verify complex monthly pattern
      cy.get('[data-testid="success-message"]').should('contain', 'Monthly pattern by day position created');
    });

    it('should handle yearly recurring events', () => {
      cy.get('[data-testid="new-appointment-btn"]').click();

      cy.get('input[name="title"]').type('Annual Company Retreat');
      cy.get('input[name="start_time"]').type('2025-10-15T09:00');
      cy.get('input[name="end_time"]').type('2025-10-15T17:00');

      cy.get('input[name="is_recurring"]').check();
      cy.get('select[name="recurrence_type"]').select('yearly');

      // Set end after 5 years
      cy.get('input[name="recurrence_end_date"]').type('2030-10-15');

      cy.get('[data-testid="create-recurring-btn"]').click();

      // Verify yearly recurrence
      cy.get('[data-testid="success-message"]').should('contain', 'Yearly recurring event created');
      cy.get('[data-testid="series-info"]').should('contain', '5 events created');
    });

    it('should handle recurrence with exceptions', () => {
      // Create standard weekly recurring event first
      cy.get('[data-testid="new-appointment-btn"]').click();
      cy.get('input[name="title"]').type('Weekly Team Meeting');
      cy.get('input[name="start_time"]').type('2025-10-15T10:00');
      cy.get('input[name="end_time"]').type('2025-10-15T11:00');

      cy.get('input[name="is_recurring"]').check();
      cy.get('select[name="recurrence_type"]').select('weekly');
      cy.get('input[name="recurrence_end_date"]').type('2025-12-31');

      // Add exception dates (holidays, etc.)
      cy.get('[data-testid="add-exceptions-btn"]').click();
      cy.get('[data-testid="exception-dates"]').should('be.visible');

      // Add Thanksgiving week as exception
      cy.get('input[name="exception_date_1"]').type('2025-11-27');
      cy.get('input[name="exception_date_2"]').type('2025-11-28');

      cy.get('[data-testid="create-recurring-btn"]').click();

      // Verify series with exceptions
      cy.get('[data-testid="success-message"]').should('contain', 'Recurring series with exceptions created');

      // Navigate to exception date and verify no event
      cy.get('.fc-dayGridMonth-button').click();
      // Navigate to November 2025 and verify no events on exception dates
    });
  });

  describe('Recurrence and Technician Assignment', () => {
    it('should handle technician conflicts in recurring events', () => {
      cy.get('[data-testid="new-appointment-btn"]').click();

      cy.get('input[name="title"]').type('Conflicting Recurring Event');
      cy.get('input[name="start_time"]').type('2025-10-15T14:00');
      cy.get('input[name="end_time"]').type('2025-10-15T16:00');

      // Assign to potentially conflicted technician
      cy.get('select[name="assigned_technician"]').select(1);

      cy.get('input[name="is_recurring"]').check();
      cy.get('select[name="recurrence_type"]').select('daily');
      cy.get('input[name="recurrence_end_date"]').type('2025-11-15');

      cy.get('[data-testid="create-recurring-btn"]').click();

      // Check for conflicts during creation
      cy.get('body').then($body => {
        if ($body.find('[data-testid="technician-conflict-warning"]').length > 0) {
          cy.get('[data-testid="conflict-resolution-modal"]').should('be.visible');
          cy.get('[data-testid="auto-assign-alternatives"]').click();
        }
      });

      // Verify conflict resolution
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should rotate technicians in recurring series', () => {
      cy.get('[data-testid="new-appointment-btn"]').click();

      cy.get('input[name="title"]').type('Rotating Maintenance Schedule');
      cy.get('input[name="start_time"]').type('2025-10-15T08:00');
      cy.get('input[name="end_time"]').type('2025-10-15T10:00');

      cy.get('input[name="is_recurring"]').check();
      cy.get('select[name="recurrence_type"]').select('weekly');

      // Enable technician rotation
      cy.get('input[name="rotate_technicians"]').check();
      cy.get('[data-testid="rotation-config"]').should('be.visible');

      // Select technicians for rotation
      cy.get('select[name="rotation_technicians"]').select(['1', '2', '3']);
      cy.get('select[name="rotation_pattern"]').select('sequential');

      cy.get('input[name="recurrence_end_date"]').type('2025-12-31');

      cy.get('[data-testid="create-recurring-btn"]').click();

      // Verify rotation setup
      cy.get('[data-testid="success-message"]').should('contain', 'Rotating technician series created');
      cy.get('[data-testid="rotation-info"]').should('contain', '3 technicians in rotation');
    });
  });

  describe('Recurrence Validation and Error Handling', () => {
    it('should validate recurrence end date', () => {
      cy.get('[data-testid="new-appointment-btn"]').click();

      cy.get('input[name="title"]').type('Invalid End Date Test');
      cy.get('input[name="start_time"]').type('2025-10-15T12:00');

      cy.get('input[name="is_recurring"]').check();
      cy.get('select[name="recurrence_type"]').select('daily');

      // Set end date before start date
      cy.get('input[name="recurrence_end_date"]').type('2025-10-10');

      cy.get('[data-testid="create-recurring-btn"]').click();

      // Verify validation error
      cy.get('[data-testid="validation-error"]').should('contain', 'End date must be after start date');
    });

    it('should handle RRULE validation errors', () => {
      cy.get('[data-testid="new-appointment-btn"]').click();

      cy.get('input[name="title"]').type('Invalid RRULE Test');
      cy.get('input[name="start_time"]').type('2025-10-15T12:00');

      cy.get('input[name="is_recurring"]').check();
      cy.get('select[name="recurrence_type"]').select('custom');

      // Enter invalid RRULE
      cy.get('textarea[name="rrule"]').type('INVALID_RRULE_SYNTAX');

      cy.get('[data-testid="validate-rrule-btn"]').click();

      // Verify RRULE validation
      cy.get('[data-testid="rrule-error"]').should('contain', 'Invalid RRULE syntax');
      cy.get('[data-testid="create-recurring-btn"]').should('be.disabled');
    });

    it('should warn about excessive occurrences', () => {
      cy.get('[data-testid="new-appointment-btn"]').click();

      cy.get('input[name="title"]').type('Too Many Occurrences');
      cy.get('input[name="start_time"]').type('2025-10-15T12:00');

      cy.get('input[name="is_recurring"]').check();
      cy.get('select[name="recurrence_type"]').select('daily');

      // Set very long duration (5 years daily = ~1800 occurrences)
      cy.get('input[name="recurrence_end_date"]').type('2030-10-15');

      cy.get('[data-testid="create-recurring-btn"]').click();

      // Verify warning about large series
      cy.get('[data-testid="large-series-warning"]').should('contain', 'This will create over 1000 events');
      cy.get('[data-testid="confirm-large-series"]').should('be.visible');
      cy.get('[data-testid="reduce-scope-btn"]').should('be.visible');
    });
  });

  describe('Performance with Large Recurring Series', () => {
    it('should handle large recurring series efficiently', () => {
      const startTime = Date.now();

      cy.get('[data-testid="new-appointment-btn"]').click();

      cy.get('input[name="title"]').type('Large Series Performance Test');
      cy.get('input[name="start_time"]').type('2025-10-15T09:00');

      cy.get('input[name="is_recurring"]').check();
      cy.get('select[name="recurrence_type"]').select('daily');
      cy.get('input[name="recurrence_end_date"]').type('2026-04-15'); // 6 months daily

      cy.get('[data-testid="create-recurring-btn"]').click();
      cy.get('[data-testid="confirm-large-series"]').click();

      // Wait for completion
      cy.get('[data-testid="success-message"]', { timeout: 10000 }).should('be.visible');

      cy.then(() => {
        const creationTime = Date.now() - startTime;
        expect(creationTime).to.be.lessThan(5000); // 5 second budget for large series
      });
    });

    it('should paginate recurring event display efficiently', () => {
      // Navigate calendar to view recurring events
      cy.get('.fc-dayGridMonth-button').click();

      // Navigate through months with recurring events
      for (let i = 0; i < 6; i++) {
        cy.get('.fc-next-button').click();
        cy.wait(200); // Small delay between navigation
      }

      // Verify calendar remains responsive
      cy.get('.fc-event').should('be.visible');
      cy.get('.fc-daygrid-body').should('be.visible');
    });
  });
});
