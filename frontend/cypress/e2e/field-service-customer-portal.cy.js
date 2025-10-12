/**
 * Customer Portal E2E Tests - Phase 4 Enhancement
 * Tests customer self-service booking and appointment request workflows
 */

describe('Customer Portal Workflow', () => {
  beforeEach(() => {
    // Navigate directly to customer portal (public access)
    cy.visit('/customer-portal');
  });

  describe('Portal Interface and Navigation', () => {
    it('should display customer portal welcome interface', () => {
      // Verify main portal elements
      cy.get('[data-testid="customer-portal-header"]').should('be.visible');
      cy.get('[data-testid="service-booking-section"]').should('be.visible');
      cy.get('[data-testid="existing-request-lookup"]').should('be.visible');

      // Check navigation tabs
      cy.get('[data-testid="tab-booking"]').should('be.visible');
      cy.get('[data-testid="tab-status"]').should('be.visible');
    });

    it('should switch between portal tabs', () => {
      // Test booking tab (default)
      cy.get('[data-testid="tab-booking"]').should('have.class', 'active');
      cy.get('[data-testid="booking-form"]').should('be.visible');

      // Switch to status tab
      cy.get('[data-testid="tab-status"]').click();
      cy.get('[data-testid="status-lookup-form"]').should('be.visible');

      // Return to booking tab
      cy.get('[data-testid="tab-booking"]').click();
      cy.get('[data-testid="booking-form"]').should('be.visible');
    });
  });

  describe('Service Booking Workflow', () => {
    beforeEach(() => {
      // Ensure we're on the booking tab
      cy.get('[data-testid="tab-booking"]').click();
    });

    it('should display available service types', () => {
      // Verify service type options
      cy.get('select[name="service_type"]').should('be.visible');
      cy.get('select[name="service_type"] option').should('contain', 'HVAC Maintenance');
      cy.get('select[name="service_type"] option').should('contain', 'HVAC Repair');
      cy.get('select[name="service_type"] option').should('contain', 'Plumbing Repair');
      cy.get('select[name="service_type"] option').should('contain', 'Electrical Repair');
      cy.get('select[name="service_type"] option').should('contain', 'Emergency Service');
    });

    it('should show available time slots for selected date', () => {
      // Select service type
      cy.get('select[name="service_type"]').select('HVAC Repair');

      // Select preferred date
      cy.get('input[name="preferred_date"]').type('2025-10-20');

      // Verify time slots load
      cy.get('[data-testid="available-slots"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-testid="time-slot"]').should('have.length.greaterThan', 0);

      // Select time slot
      cy.get('[data-testid="time-slot"]').first().click();
      cy.get('[data-testid="time-slot"].selected').should('exist');
    });

    it('should complete full booking workflow', () => {
      // Step 1: Service Selection
      cy.get('select[name="service_type"]').select('HVAC Maintenance');
      cy.get('textarea[name="description"]').type('Annual heating system maintenance needed before winter season');
      cy.get('select[name="urgency_level"]').select('normal');

      // Step 2: Date and Time Selection
      cy.get('input[name="preferred_date"]').type('2025-10-25');
      cy.get('[data-testid="available-slots"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-testid="time-slot"]').contains('09:00 AM').click();

      // Step 3: Customer Information
      cy.get('input[name="customer_name"]').type('Sarah Johnson');
      cy.get('input[name="customer_email"]').type('sarah.johnson@email.com');
      cy.get('input[name="customer_phone"]').type('(555) 123-4567');
      cy.get('input[name="customer_address"]').type('456 Oak Street, Springfield, IL 62701');

      // Step 4: Additional Details
      cy.get('textarea[name="additional_notes"]').type('Please call before arriving. Dog in backyard.');

      // Step 5: Submit Request
      cy.get('[data-testid="submit-request-btn"]').click();

      // Verify successful submission
      cy.get('[data-testid="success-message"]').should('be.visible');
      cy.get('[data-testid="confirmation-number"]').should('be.visible');
      cy.get('[data-testid="confirmation-details"]').should('contain', 'Sarah Johnson');
      cy.get('[data-testid="confirmation-details"]').should('contain', 'HVAC Maintenance');
      cy.get('[data-testid="confirmation-details"]').should('contain', '2025-10-25');
    });

    it('should handle emergency service requests', () => {
      // Select emergency service
      cy.get('select[name="service_type"]').select('Emergency Service');
      cy.get('select[name="urgency_level"]').select('emergency');

      // Emergency description
      cy.get('textarea[name="description"]').type('No heat in house, temperature dropping rapidly');

      // Emergency requests should show immediate availability
      cy.get('input[name="preferred_date"]').type('2025-10-15'); // Today
      cy.get('[data-testid="emergency-slots"]').should('be.visible');
      cy.get('[data-testid="emergency-notice"]').should('contain', 'Emergency service available within 2 hours');

      // Complete emergency booking
      cy.get('input[name="customer_name"]').type('Robert Emergency');
      cy.get('input[name="customer_email"]').type('robert@email.com');
      cy.get('input[name="customer_phone"]').type('(555) 999-0000');
      cy.get('input[name="customer_address"]').type('123 Emergency Lane');

      cy.get('[data-testid="submit-emergency-btn"]').click();

      // Verify emergency handling
      cy.get('[data-testid="emergency-confirmation"]').should('contain', 'Emergency service request submitted');
      cy.get('[data-testid="emergency-eta"]').should('contain', 'Technician will arrive within');
    });

    it('should validate required fields', () => {
      // Attempt to submit without required fields
      cy.get('[data-testid="submit-request-btn"]').click();

      // Check validation messages
      cy.get('select[name="service_type"]:invalid').should('exist');
      cy.get('input[name="customer_name"]:invalid').should('exist');
      cy.get('input[name="customer_email"]:invalid').should('exist');
      cy.get('input[name="customer_phone"]:invalid').should('exist');
    });

    it('should validate email format', () => {
      // Enter invalid email
      cy.get('input[name="customer_email"]').type('invalid-email');
      cy.get('input[name="customer_name"]').type('Test User').blur();

      // Check email validation
      cy.get('[data-testid="email-validation-error"]').should('contain', 'Please enter a valid email address');
    });
  });

  describe('Appointment Status Lookup', () => {
    beforeEach(() => {
      cy.get('[data-testid="tab-status"]').click();
    });

    it('should look up existing appointment by confirmation number', () => {
      // Enter confirmation number
      cy.get('input[name="confirmation_number"]').type('CONF-123456');
      cy.get('[data-testid="lookup-btn"]').click();

      // Verify appointment details displayed
      cy.get('[data-testid="appointment-details"]').should('be.visible');
      cy.get('[data-testid="appointment-status"]').should('be.visible');
      cy.get('[data-testid="scheduled-date"]').should('be.visible');
      cy.get('[data-testid="technician-info"]').should('be.visible');
    });

    it('should look up appointment by email and phone', () => {
      // Switch to email/phone lookup
      cy.get('[data-testid="lookup-method-email"]').click();

      // Enter customer details
      cy.get('input[name="lookup_email"]').type('customer@email.com');
      cy.get('input[name="lookup_phone"]').type('(555) 123-4567');
      cy.get('[data-testid="lookup-btn"]').click();

      // Verify results
      cy.get('[data-testid="appointment-list"]').should('be.visible');
      cy.get('[data-testid="appointment-item"]').should('have.length.greaterThan', 0);
    });

    it('should display appointment modification options', () => {
      cy.get('input[name="confirmation_number"]').type('CONF-123456');
      cy.get('[data-testid="lookup-btn"]').click();

      // Check available actions
      cy.get('[data-testid="reschedule-btn"]').should('be.visible');
      cy.get('[data-testid="cancel-btn"]').should('be.visible');
      cy.get('[data-testid="add-notes-btn"]').should('be.visible');
    });

    it('should handle reschedule request', () => {
      cy.get('input[name="confirmation_number"]').type('CONF-123456');
      cy.get('[data-testid="lookup-btn"]').click();

      // Request reschedule
      cy.get('[data-testid="reschedule-btn"]').click();

      // Select new date and time
      cy.get('input[name="new_date"]').type('2025-10-28');
      cy.get('[data-testid="new-time-slot"]').contains('02:00 PM').click();
      cy.get('textarea[name="reschedule_reason"]').type('Schedule conflict with work');

      // Submit reschedule request
      cy.get('[data-testid="submit-reschedule-btn"]').click();

      // Verify reschedule request
      cy.get('[data-testid="success-message"]').should('contain', 'Reschedule request submitted');
      cy.get('[data-testid="pending-approval"]').should('be.visible');
    });

    it('should handle appointment cancellation', () => {
      cy.get('input[name="confirmation_number"]').type('CONF-123456');
      cy.get('[data-testid="lookup-btn"]').click();

      // Cancel appointment
      cy.get('[data-testid="cancel-btn"]').click();
      cy.get('textarea[name="cancellation_reason"]').type('No longer needed');
      cy.get('[data-testid="confirm-cancel-btn"]').click();

      // Verify cancellation
      cy.get('[data-testid="success-message"]').should('contain', 'Appointment cancelled');
      cy.get('[data-testid="cancellation-confirmation"]').should('be.visible');
    });
  });

  describe('Real-time Updates and Notifications', () => {
    it('should display technician on-the-way notification', () => {
      cy.get('input[name="confirmation_number"]').type('CONF-ACTIVE');
      cy.get('[data-testid="lookup-btn"]').click();

      // Simulate receiving "on my way" notification
      cy.intercept('GET', '/api/appointment-requests/CONF-ACTIVE/status', {
        statusCode: 200,
        body: {
          status: 'technician_en_route',
          eta: '15 minutes',
          technician_name: 'Mike Johnson',
          technician_phone: '(555) 123-9999'
        }
      }).as('statusUpdate');

      cy.wait('@statusUpdate');

      // Verify notification display
      cy.get('[data-testid="tech-en-route"]').should('be.visible');
      cy.get('[data-testid="eta-display"]').should('contain', '15 minutes');
      cy.get('[data-testid="technician-contact"]').should('contain', 'Mike Johnson');
    });

    it('should show live status updates', () => {
      cy.get('input[name="confirmation_number"]').type('CONF-PROGRESS');
      cy.get('[data-testid="lookup-btn"]').click();

      // Verify real-time status updates
      cy.get('[data-testid="status-timeline"]').should('be.visible');
      cy.get('[data-testid="status-current"]').should('contain', 'Work in Progress');
      cy.get('[data-testid="last-updated"]').should('be.visible');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should work properly on mobile viewport', () => {
      cy.viewport('iphone-x');

      // Verify mobile layout
      cy.get('[data-testid="customer-portal-header"]').should('be.visible');
      cy.get('[data-testid="mobile-menu-btn"]').should('be.visible');

      // Test mobile form interaction
      cy.get('select[name="service_type"]').select('HVAC Repair');
      cy.get('input[name="customer_name"]').type('Mobile Test User');

      // Verify mobile-optimized time slot selection
      cy.get('input[name="preferred_date"]').type('2025-10-20');
      cy.get('[data-testid="mobile-time-slots"]').should('be.visible');
    });

    it('should support touch interactions on mobile', () => {
      cy.viewport('iphone-x');

      // Test touch interactions
      cy.get('[data-testid="tab-status"]').click();
      cy.get('[data-testid="status-lookup-form"]').should('be.visible');

      // Swipe gesture simulation (if supported)
      cy.get('[data-testid="tab-container"]').trigger('touchstart', { touches: [{ clientX: 200, clientY: 100 }] });
      cy.get('[data-testid="tab-container"]').trigger('touchmove', { touches: [{ clientX: 100, clientY: 100 }] });
      cy.get('[data-testid="tab-container"]').trigger('touchend');
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should meet accessibility standards', () => {
      cy.injectAxe();
      cy.checkA11y('[data-testid="customer-portal-container"]');

      // Test form accessibility
      cy.get('[data-testid="tab-booking"]').click();
      cy.checkA11y('[data-testid="booking-form"]');
    });

    it('should support keyboard navigation', () => {
      // Navigate through form with keyboard
      cy.get('select[name="service_type"]').focus();
      cy.focused().type('{downarrow}{enter}'); // Select service type

      cy.focused().type('{tab}'); // Move to description
      cy.focused().should('have.attr', 'name', 'description');

      cy.focused().type('{tab}'); // Move to urgency
      cy.focused().should('have.attr', 'name', 'urgency_level');
    });

    it('should provide clear progress indicators', () => {
      // Start booking process
      cy.get('select[name="service_type"]').select('HVAC Repair');

      // Check progress indicator
      cy.get('[data-testid="booking-progress"]').should('be.visible');
      cy.get('[data-testid="step-1"]').should('have.class', 'completed');
      cy.get('[data-testid="step-2"]').should('have.class', 'current');
    });

    it('should show helpful error messages', () => {
      // Submit incomplete form
      cy.get('[data-testid="submit-request-btn"]').click();

      // Verify helpful error messages
      cy.get('[data-testid="service-type-error"]').should('contain', 'Please select a service type');
      cy.get('[data-testid="customer-name-error"]').should('contain', 'Customer name is required');
    });
  });

  describe('Integration with Backend Systems', () => {
    it('should handle API errors gracefully', () => {
      // Intercept API to simulate error
      cy.intercept('POST', '/api/appointment-requests/', { statusCode: 500 }).as('bookingError');

      // Complete form and submit
      cy.get('select[name="service_type"]').select('HVAC Repair');
      cy.get('input[name="customer_name"]').type('Test User');
      cy.get('input[name="customer_email"]').type('test@email.com');
      cy.get('input[name="customer_phone"]').type('(555) 123-4567');
      cy.get('[data-testid="submit-request-btn"]').click();

      cy.wait('@bookingError');

      // Verify error handling
      cy.get('[data-testid="error-message"]').should('contain', 'Unable to submit request at this time');
      cy.get('[data-testid="retry-btn"]').should('be.visible');
    });

    it('should validate available time slots in real-time', () => {
      cy.get('select[name="service_type"]').select('Emergency Service');
      cy.get('input[name="preferred_date"]').type('2025-10-15');

      // Verify real-time slot availability checking
      cy.intercept('GET', '/api/scheduling/availability-check*', { fixture: 'available-slots.json' }).as('availabilityCheck');

      cy.wait('@availabilityCheck');
      cy.get('[data-testid="available-slots"]').should('be.visible');
    });

    it('should send confirmation email after booking', () => {
      // Complete booking
      cy.get('select[name="service_type"]').select('HVAC Maintenance');
      cy.get('input[name="customer_name"]').type('Email Test User');
      cy.get('input[name="customer_email"]').type('emailtest@example.com');
      cy.get('input[name="customer_phone"]').type('(555) 123-4567');
      cy.get('[data-testid="submit-request-btn"]').click();

      // Verify confirmation email notification
      cy.get('[data-testid="email-confirmation"]').should('contain', 'Confirmation email sent to emailtest@example.com');
    });
  });
});
