/**
 * Scheduling Drag-and-Drop E2E Tests - Phase 4 Enhancement
 * Tests advanced FullCalendar drag-and-drop functionality for field service scheduling
 */

describe('Scheduling Drag-and-Drop Workflow', () => {
  beforeEach(() => {
    // Login and navigate to scheduling
    cy.visit('/login');
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();

    // Navigate to schedule page
    cy.visit('/schedule');
    cy.get('[data-testid="fullcalendar"]').should('be.visible');

    // Switch to week view for better drag-and-drop testing
    cy.get('.fc-timeGridWeek-button').click();
    cy.wait(1000); // Allow calendar to render
  });

  describe('Event Drag-and-Drop Operations', () => {
    it('should drag event to new time slot', () => {
      // Find first draggable event
      cy.get('.fc-event[data-event-draggable="true"]').first().as('draggableEvent');

      // Get initial event time
      cy.get('@draggableEvent').then($event => {
        const initialTime = $event.attr('data-start-time');

        // Perform drag operation
        cy.get('@draggableEvent')
          .trigger('mousedown', { button: 0, clientX: 100, clientY: 100 })
          .wait(100);

        // Drag to new time slot (2 hours later)
        cy.get('.fc-timegrid-slot[data-time="14:00:00"]')
          .trigger('mousemove', { clientX: 100, clientY: 200 })
          .trigger('mouseup');

        // Verify drag operation
        cy.get('[data-testid="drag-confirmation-modal"]').should('be.visible');
        cy.get('[data-testid="confirm-reschedule-btn"]').click();

        // Verify success message
        cy.get('[data-testid="success-message"]').should('contain', 'Event rescheduled successfully');

        // Verify event moved to new position
        cy.get('.fc-event').should('contain.attr', 'data-start-time').and('not.eq', initialTime);
      });
    });

    it('should drag event to different day', () => {
      cy.get('.fc-event[data-event-draggable="true"]').first().as('sourceEvent');

      // Drag event to next day
      cy.get('@sourceEvent')
        .trigger('mousedown', { button: 0 })
        .wait(100);

      // Target next day at same time
      cy.get('.fc-daygrid-day[data-date]').eq(1)
        .trigger('mousemove')
        .trigger('mouseup');

      // Handle potential conflicts
      cy.get('body').then($body => {
        if ($body.find('[data-testid="conflict-warning"]').length > 0) {
          cy.get('[data-testid="resolve-conflict-btn"]').click();
        } else {
          cy.get('[data-testid="confirm-reschedule-btn"]').click();
        }
      });

      // Verify success
      cy.get('[data-testid="success-message"]').should('contain', 'Event moved to new day');
    });

    it('should handle drag-and-drop conflicts', () => {
      // Create overlapping time slot scenario
      cy.get('.fc-event').first().as('event1');
      cy.get('.fc-event').eq(1).as('event2');

      // Drag second event to overlap with first
      cy.get('@event2')
        .trigger('mousedown', { button: 0 });

      cy.get('@event1').then($event1 => {
        const targetTime = $event1.attr('data-start-time');

        cy.get('.fc-timegrid-slot[data-time="' + targetTime + '"]')
          .trigger('mousemove')
          .trigger('mouseup');
      });

      // Verify conflict detection
      cy.get('[data-testid="schedule-conflict-modal"]').should('be.visible');
      cy.get('[data-testid="conflict-details"]').should('contain', 'overlaps with existing');

      // Test conflict resolution options
      cy.get('[data-testid="resolve-auto-btn"]').should('be.visible');
      cy.get('[data-testid="resolve-manual-btn"]').should('be.visible');
      cy.get('[data-testid="cancel-drag-btn"]').should('be.visible');

      // Cancel the conflicting drag
      cy.get('[data-testid="cancel-drag-btn"]').click();

      // Verify event returned to original position
      cy.get('[data-testid="drag-cancelled"]').should('contain', 'Drag operation cancelled');
    });

    it('should resize event duration by dragging', () => {
      cy.get('.fc-event').first().as('resizableEvent');

      // Get original event duration
      cy.get('@resizableEvent').then($event => {
        const startTime = $event.attr('data-start-time');
        const endTime = $event.attr('data-end-time');

        // Find resize handle and drag to extend duration
        cy.get('@resizableEvent').find('.fc-event-resizer').as('resizeHandle');

        cy.get('@resizeHandle')
          .trigger('mousedown', { button: 0, clientX: 100, clientY: 100 })
          .wait(100);

        // Drag to extend by 1 hour
        cy.get('.fc-timegrid-slot')
          .trigger('mousemove', { clientX: 100, clientY: 200 })
          .trigger('mouseup');

        // Verify resize confirmation
        cy.get('[data-testid="resize-confirmation-modal"]').should('be.visible');
        cy.get('[data-testid="new-duration"]').should('be.visible');
        cy.get('[data-testid="confirm-resize-btn"]').click();

        // Verify success
        cy.get('[data-testid="success-message"]').should('contain', 'Event duration updated');
      });
    });
  });

  describe('Multi-Event Selection and Batch Operations', () => {
    it('should select multiple events for batch operations', () => {
      // Enable multi-select mode
      cy.get('[data-testid="multi-select-btn"]').click();

      // Select multiple events
      cy.get('.fc-event').eq(0).click({ ctrlKey: true });
      cy.get('.fc-event').eq(1).click({ ctrlKey: true });
      cy.get('.fc-event').eq(2).click({ ctrlKey: true });

      // Verify selection count
      cy.get('[data-testid="selected-count"]').should('contain', '3 events selected');

      // Test batch operations
      cy.get('[data-testid="batch-operations"]').should('be.visible');
      cy.get('[data-testid="batch-reschedule-btn"]').should('be.visible');
      cy.get('[data-testid="batch-assign-technician-btn"]').should('be.visible');
      cy.get('[data-testid="batch-cancel-btn"]').should('be.visible');
    });

    it('should perform batch reschedule operation', () => {
      // Select multiple events
      cy.get('[data-testid="multi-select-btn"]').click();
      cy.get('.fc-event').eq(0).click({ ctrlKey: true });
      cy.get('.fc-event').eq(1).click({ ctrlKey: true });

      // Initiate batch reschedule
      cy.get('[data-testid="batch-reschedule-btn"]').click();

      // Set new date/time parameters
      cy.get('[data-testid="batch-reschedule-modal"]').should('be.visible');
      cy.get('input[name="new_date"]').type('2025-10-20');
      cy.get('select[name="time_adjustment"]').select('shift_by_hours');
      cy.get('input[name="hours_shift"]').type('2');

      // Apply batch reschedule
      cy.get('[data-testid="apply-batch-reschedule-btn"]').click();

      // Verify batch operation success
      cy.get('[data-testid="success-message"]').should('contain', '2 events rescheduled successfully');
    });

    it('should drag multiple selected events together', () => {
      // Select multiple adjacent events
      cy.get('[data-testid="multi-select-btn"]').click();
      cy.get('.fc-event').eq(0).click({ ctrlKey: true });
      cy.get('.fc-event').eq(1).click({ ctrlKey: true });

      // Drag the group
      cy.get('.fc-event.selected').first()
        .trigger('mousedown', { button: 0 })
        .wait(100);

      // Drag to new location
      cy.get('.fc-timegrid-slot[data-time="16:00:00"]')
        .trigger('mousemove')
        .trigger('mouseup');

      // Verify group move confirmation
      cy.get('[data-testid="group-move-modal"]').should('be.visible');
      cy.get('[data-testid="group-move-details"]').should('contain', '2 events will be moved');
      cy.get('[data-testid="confirm-group-move-btn"]').click();

      // Verify group move success
      cy.get('[data-testid="success-message"]').should('contain', 'Event group moved successfully');
    });
  });

  describe('External Event Dragging', () => {
    it('should drag external items onto calendar', () => {
      // Verify external events panel
      cy.get('[data-testid="external-events"]').should('be.visible');
      cy.get('[data-testid="external-event-item"]').should('have.length.greaterThan', 0);

      // Drag external event onto calendar
      cy.get('[data-testid="external-event-item"]').first().as('externalEvent');

      cy.get('@externalEvent')
        .trigger('mousedown', { button: 0 })
        .wait(100);

      // Drop onto specific time slot
      cy.get('.fc-timegrid-slot[data-time="10:00:00"]')
        .trigger('mousemove')
        .trigger('mouseup');

      // Fill quick event details
      cy.get('[data-testid="quick-event-modal"]').should('be.visible');
      cy.get('input[name="event_title"]').type('New External Event');
      cy.get('select[name="technician"]').select(1);
      cy.get('[data-testid="create-event-btn"]').click();

      // Verify external event creation
      cy.get('[data-testid="success-message"]').should('contain', 'Event created from external item');
      cy.get('.fc-event').should('contain', 'New External Event');
    });

    it('should create recurring events from external drag', () => {
      cy.get('[data-testid="external-event-item"]').contains('Weekly Maintenance').as('recurringExternal');

      cy.get('@recurringExternal')
        .trigger('mousedown', { button: 0 })
        .wait(100);

      cy.get('.fc-timegrid-slot[data-time="14:00:00"]')
        .trigger('mousemove')
        .trigger('mouseup');

      // Configure recurrence
      cy.get('[data-testid="quick-event-modal"]').should('be.visible');
      cy.get('input[name="is_recurring"]').check();
      cy.get('select[name="recurrence_pattern"]').select('weekly');
      cy.get('input[name="recurrence_end"]').type('2025-12-31');

      cy.get('[data-testid="create-recurring-btn"]').click();

      // Verify recurring event series creation
      cy.get('[data-testid="success-message"]').should('contain', 'Recurring event series created');
    });
  });

  describe('Touch and Mobile Drag Support', () => {
    it('should support touch-based dragging on mobile', () => {
      cy.viewport('iphone-x');

      // Test touch drag operation
      cy.get('.fc-event').first().as('touchEvent');

      cy.get('@touchEvent')
        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] })
        .wait(100);

      // Touch move
      cy.get('.fc-timegrid-slot[data-time="11:00:00"]')
        .trigger('touchmove', { touches: [{ clientX: 100, clientY: 150 }] })
        .trigger('touchend');

      // Verify touch drag success
      cy.get('[data-testid="confirm-reschedule-btn"]').click();
      cy.get('[data-testid="success-message"]').should('contain', 'Event rescheduled');
    });

    it('should handle long-press for multi-select on mobile', () => {
      cy.viewport('iphone-x');

      // Long press to start multi-select
      cy.get('.fc-event').first()
        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] })
        .wait(1000) // Long press duration
        .trigger('touchend');

      // Verify multi-select mode activated
      cy.get('[data-testid="mobile-multi-select-mode"]').should('be.visible');

      // Tap additional events to select
      cy.get('.fc-event').eq(1).trigger('touchstart').trigger('touchend');

      // Verify selection
      cy.get('[data-testid="selected-count"]').should('contain', '2 events selected');
    });
  });

  describe('Accessibility for Drag Operations', () => {
    it('should support keyboard-based event moving', () => {
      // Focus on event
      cy.get('.fc-event').first().focus();

      // Enter move mode with keyboard
      cy.focused().type('{enter}'); // Enter move mode
      cy.get('[data-testid="keyboard-move-mode"]').should('be.visible');

      // Navigate with arrow keys
      cy.focused().type('{downarrow}'); // Move down one hour
      cy.focused().type('{rightarrow}'); // Move to next day

      // Confirm move
      cy.focused().type('{enter}');

      // Verify keyboard move success
      cy.get('[data-testid="success-message"]').should('contain', 'Event moved via keyboard');
    });

    it('should provide screen reader feedback for drag operations', () => {
      // Start drag operation
      cy.get('.fc-event').first().trigger('mousedown', { button: 0 });

      // Verify screen reader announcements
      cy.get('[aria-live="polite"]').should('contain', 'Dragging event');

      // Move to valid drop zone
      cy.get('.fc-timegrid-slot[data-time="15:00:00"]').trigger('mousemove');
      cy.get('[aria-live="polite"]').should('contain', 'Valid drop zone');

      // Complete drag
      cy.get('.fc-timegrid-slot[data-time="15:00:00"]').trigger('mouseup');
      cy.get('[aria-live="polite"]').should('contain', 'Event moved successfully');
    });

    it('should meet accessibility standards during drag operations', () => {
      cy.injectAxe();

      // Check accessibility during drag state
      cy.get('.fc-event').first().trigger('mousedown', { button: 0 });
      cy.checkA11y('.fc-view-harness', {
        rules: {
          'color-contrast': { enabled: false }, // May be adjusted during drag
        }
      });

      cy.get('.fc-timegrid-slot[data-time="13:00:00"]').trigger('mouseup');
    });
  });

  describe('Performance During Drag Operations', () => {
    it('should maintain performance with many events during drag', () => {
      const startTime = Date.now();

      // Perform drag operation with many events visible
      cy.get('.fc-event').first()
        .trigger('mousedown', { button: 0 })
        .wait(100);

      cy.get('.fc-timegrid-slot[data-time="12:00:00"]')
        .trigger('mousemove')
        .trigger('mouseup');

      cy.then(() => {
        const dragTime = Date.now() - startTime;
        expect(dragTime).to.be.lessThan(1000); // 1 second budget for drag operation
      });
    });

    it('should handle rapid successive drag operations smoothly', () => {
      // Perform multiple quick drags
      for (let i = 0; i < 3; i++) {
        cy.get('.fc-event').eq(i)
          .trigger('mousedown', { button: 0 })
          .wait(50);

        cy.get('.fc-timegrid-slot')
          .trigger('mousemove')
          .trigger('mouseup');

        cy.get('[data-testid="confirm-reschedule-btn"]').click();
        cy.wait(100);
      }

      // Verify all operations completed successfully
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });
});
