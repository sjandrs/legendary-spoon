/**
 * Field Service Scheduling E2E Tests - Phase 4 Enhancement
 * Tests the complete field service scheduling workflow with FullCalendar integration
 */

describe('Field Service Scheduling Workflow', () => {
  beforeEach(() => {
    // Login and navigate to field service scheduling
    cy.visit('/login');
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');

    // Navigate to scheduling page
    cy.get('[data-testid="nav-field-service"]').trigger('mouseenter');
    cy.contains('Schedule').click();
    cy.url().should('include', '/schedule');
    cy.wait(1000); // Allow FullCalendar to load
  });

  describe('Calendar Interface', () => {
    it('should load FullCalendar with proper configuration', () => {
      // Verify calendar container exists
      cy.get('[data-testid="fullcalendar"]').should('be.visible');

      // Check for calendar navigation controls
      cy.get('.fc-toolbar').should('be.visible');
      cy.get('.fc-prev-button').should('be.visible');
      cy.get('.fc-next-button').should('be.visible');
      cy.get('.fc-today-button').should('be.visible');

      // Verify view options
      cy.get('.fc-dayGridMonth-button').should('be.visible');
      cy.get('.fc-timeGridWeek-button').should('be.visible');
      cy.get('.fc-timeGridDay-button').should('be.visible');
    });

    it('should display scheduled events on calendar', () => {
      // Wait for events to load
      cy.get('.fc-event', { timeout: 10000 }).should('exist');

      // Verify event elements have required attributes
      cy.get('.fc-event').first().should('have.attr', 'data-event-id');
      cy.get('.fc-event').first().should('contain.text');
    });

    it('should switch between calendar views', () => {
      // Test week view
      cy.get('.fc-timeGridWeek-button').click();
      cy.get('.fc-timeGridWeek-view').should('be.visible');

      // Test day view
      cy.get('.fc-timeGridDay-button').click();
      cy.get('.fc-timeGridDay-view').should('be.visible');

      // Return to month view
      cy.get('.fc-dayGridMonth-button').click();
      cy.get('.fc-dayGridMonth-view').should('be.visible');
    });
  });

  describe('Event Creation Workflow', () => {
    it('should create new scheduled event', () => {
      // Click new appointment button
      cy.get('[data-testid="new-appointment-btn"]').click();

      // Fill event form
      cy.get('input[name="title"]').type('Emergency HVAC Repair');
      cy.get('textarea[name="description"]').type('Customer reported heating system failure');
      cy.get('input[name="start_time"]').type('2025-10-15T09:00');
      cy.get('input[name="end_time"]').type('2025-10-15T11:00');

      // Select technician
      cy.get('select[name="technician"]').select(1);

      // Select work order (if available)
      cy.get('select[name="workOrder"]').select(1);

      // Customer information
      cy.get('input[name="customer"]').type('John Smith');
      cy.get('input[name="address"]').type('123 Main St, City, State 12345');

      // Submit form
      cy.get('button[type="submit"]').click();

      // Verify success message
      cy.get('[data-testid="success-message"]').should('contain', 'Event created successfully');

      // Verify event appears on calendar
      cy.get('.fc-event').should('contain', 'Emergency HVAC Repair');
    });

    it('should validate required fields', () => {
      cy.get('[data-testid="new-appointment-btn"]').click();

      // Try to submit without required fields
      cy.get('button[type="submit"]').click();

      // Check for validation messages
      cy.get('input[name="title"]:invalid').should('exist');
      cy.get('input[name="start_time"]:invalid').should('exist');
    });

    it('should handle recurring events', () => {
      cy.get('[data-testid="new-appointment-btn"]').click();

      // Fill basic event details
      cy.get('input[name="title"]').type('Weekly Maintenance');
      cy.get('input[name="start_time"]').type('2025-10-15T14:00');
      cy.get('input[name="end_time"]').type('2025-10-15T16:00');

      // Set recurrence
      cy.get('input[name="isRecurring"]').check();
      cy.get('select[name="recurrencePattern"]').select('weekly');
      cy.get('input[name="recurrenceEnd"]').type('2025-12-15');

      cy.get('button[type="submit"]').click();

      // Verify recurring event creation
      cy.get('[data-testid="success-message"]').should('contain', 'Recurring event created');
    });
  });

  describe('Event Management', () => {
    beforeEach(() => {
      // Ensure we have at least one event to work with
      cy.get('.fc-event').first().as('testEvent');
    });

    it('should edit existing event', () => {
      // Click on event to open details
      cy.get('@testEvent').click();

      // Click edit button
      cy.get('[data-testid="edit-event-btn"]').click();

      // Modify event details
      cy.get('input[name="title"]').clear().type('Updated Event Title');
      cy.get('textarea[name="description"]').clear().type('Updated description');

      // Save changes
      cy.get('button[type="submit"]').click();

      // Verify update
      cy.get('[data-testid="success-message"]').should('contain', 'Event updated');
      cy.get('.fc-event').should('contain', 'Updated Event Title');
    });

    it('should reschedule event via drag and drop', () => {
      cy.get('.fc-timeGridWeek-button').click();

      // Get initial event position
      cy.get('@testEvent').then($event => {
        const initialTime = $event.attr('data-start-time');

        // Drag event to new time slot (simulate drag and drop)
        cy.get('@testEvent').trigger('mousedown', { button: 0 });
        cy.get('.fc-timegrid-slot[data-time="10:00:00"]').trigger('mousemove').trigger('mouseup');

        // Verify event moved
        cy.get('[data-testid="success-message"]').should('contain', 'Event rescheduled');
      });
    });

    it('should cancel event', () => {
      cy.get('@testEvent').click();
      cy.get('[data-testid="cancel-event-btn"]').click();

      // Confirm cancellation
      cy.get('[data-testid="confirm-cancel"]').click();

      // Verify cancellation
      cy.get('[data-testid="success-message"]').should('contain', 'Event cancelled');
    });

    it('should mark event as completed', () => {
      cy.get('@testEvent').click();
      cy.get('[data-testid="complete-event-btn"]').click();

      // Verify completion
      cy.get('[data-testid="success-message"]').should('contain', 'Event marked as completed');
      cy.get('@testEvent').should('have.class', 'fc-event-completed');
    });
  });

  describe('Route Optimization', () => {
    it('should trigger route optimization', () => {
      // Select multiple events for optimization
      cy.get('[data-testid="select-events-btn"]').click();
      cy.get('.fc-event').first().click();
      cy.get('.fc-event').eq(1).click();

      // Trigger route optimization
      cy.get('[data-testid="optimize-route-btn"]').click();

      // Verify optimization results
      cy.get('[data-testid="route-optimization-results"]').should('be.visible');
      cy.get('[data-testid="estimated-travel-time"]').should('contain', 'minutes');
      cy.get('[data-testid="optimized-sequence"]').should('be.visible');
    });

    it('should display ETA markers', () => {
      cy.get('.fc-timeGridWeek-button').click();

      // Enable ETA display
      cy.get('[data-testid="show-eta-btn"]').click();

      // Verify ETA markers appear
      cy.get('.fc-event-eta').should('be.visible');
      cy.get('.fc-event-eta').should('contain', 'ETA:');
    });
  });

  describe('Technician Filtering', () => {
    it('should filter events by technician', () => {
      // Open technician filter
      cy.get('[data-testid="technician-filter"]').click();

      // Select specific technician
      cy.get('[data-testid="technician-option"]').first().click();

      // Verify filtered results
      cy.get('.fc-event').should('have.length.greaterThan', 0);

      // Clear filter
      cy.get('[data-testid="clear-filter-btn"]').click();
      cy.get('.fc-event').should('have.length.greaterThan', 0);
    });

    it('should filter events by date range', () => {
      cy.get('[data-testid="date-range-filter"]').click();
      cy.get('input[name="startDate"]').type('2025-10-15');
      cy.get('input[name="endDate"]').type('2025-10-20');
      cy.get('[data-testid="apply-date-filter"]').click();

      // Verify calendar shows filtered date range
      cy.get('.fc-daygrid-day[data-date="2025-10-15"]').should('be.visible');
    });
  });

  describe('Notification Integration', () => {
    it('should send reminder notification', () => {
      cy.get('.fc-event').first().click();
      cy.get('[data-testid="send-reminder-btn"]').click();

      // Verify notification sent
      cy.get('[data-testid="success-message"]').should('contain', 'Reminder sent');
    });

    it('should send on-my-way notification', () => {
      cy.get('.fc-event').first().click();
      cy.get('[data-testid="on-my-way-btn"]').click();

      // Verify notification sent with ETA
      cy.get('[data-testid="success-message"]').should('contain', 'On my way notification sent');
      cy.get('[data-testid="eta-display"]').should('be.visible');
    });
  });

  describe('Accessibility Validation', () => {
    it('should meet accessibility standards', () => {
      // Inject axe for accessibility testing
      cy.injectAxe();

      // Check accessibility of main scheduling interface
      cy.checkA11y('[data-testid="scheduling-container"]');

      // Open event creation modal and check accessibility
      cy.get('[data-testid="new-appointment-btn"]').click();
      cy.checkA11y('[data-testid="event-modal"]');
    });

    it('should support keyboard navigation', () => {
      // Navigate calendar using keyboard
      cy.get('.fc-toolbar').focus();
      cy.focused().type('{rightarrow}'); // Next month
      cy.focused().type('{leftarrow}'); // Previous month
      cy.focused().type('{enter}'); // Select current date

      // Tab through calendar events
      cy.get('.fc-event').first().focus();
      cy.focused().type('{tab}');
      cy.focused().should('have.class', 'fc-event');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Intercept API call to simulate error
      cy.intercept('POST', '/api/scheduled-events/', { statusCode: 500 }).as('createEventError');

      cy.get('[data-testid="new-appointment-btn"]').click();
      cy.get('input[name="title"]').type('Test Event');
      cy.get('input[name="start_time"]').type('2025-10-15T09:00');
      cy.get('input[name="end_time"]').type('2025-10-15T10:00');
      cy.get('button[type="submit"]').click();

      cy.wait('@createEventError');

      // Verify error message displayed
      cy.get('[data-testid="error-message"]').should('contain', 'Failed to create event');
    });

    it('should validate event conflicts', () => {
      // Create overlapping event
      cy.get('[data-testid="new-appointment-btn"]').click();
      cy.get('input[name="title"]').type('Conflicting Event');
      cy.get('input[name="start_time"]').type('2025-10-15T09:00');
      cy.get('input[name="end_time"]').type('2025-10-15T11:00');
      cy.get('select[name="technician"]').select(1);
      cy.get('button[type="submit"]').click();

      // Verify conflict warning
      cy.get('[data-testid="conflict-warning"]').should('contain', 'Schedule conflict detected');
    });
  });

  describe('Performance Validation', () => {
    it('should load calendar within performance budget', () => {
      const startTime = Date.now();

      cy.visit('/schedule');
      cy.get('[data-testid="fullcalendar"]').should('be.visible');

      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // 3 second budget
      });
    });

    it('should handle large numbers of events efficiently', () => {
      // Switch to month view to see more events
      cy.get('.fc-dayGridMonth-button').click();

      // Verify calendar renders without performance issues
      cy.get('.fc-event').should('have.length.greaterThan', 0);
      cy.get('.fc-daygrid-body').should('be.visible');

      // Navigate between months smoothly
      cy.get('.fc-next-button').click();
      cy.get('.fc-prev-button').click();

      // Verify responsive interactions
      cy.get('.fc-event').first().click({ timeout: 1000 });
    });
  });
});
