/**
 * Customer Portal E2E Tests - Phase 4 Enhancement
 * Tests self-service customer booking functionality with appointment request workflow
 */

describe('Customer Portal Workflow', () => {
  beforeEach(() => {
    // Visit customer portal (public access)
    cy.visit('/customer-portal');

    // Verify portal loads correctly
    cy.get('[data-testid="customer-portal-header"]').should('contain', 'Request Service Appointment');
    cy.get('[data-testid="service-booking-form"]').should('be.visible');
  });

  describe('Service Request Form Validation', () => {
    it('should validate required fields before submission', () => {
      // Attempt to submit empty form
      cy.get('[data-testid="submit-request-btn"]').click();

      // Verify validation messages
      cy.get('[data-testid="validation-error-name"]').should('contain', 'Customer name is required');
      cy.get('[data-testid="validation-error-email"]').should('contain', 'Email address is required');
      cy.get('[data-testid="validation-error-service"]').should('contain', 'Please select a service type');
      cy.get('[data-testid="validation-error-date"]').should('contain', 'Preferred date is required');
    });

    it('should validate email format', () => {
      cy.get('input[name="customer_name"]').type('John Smith');
      cy.get('input[name="customer_email"]').type('invalid-email');
      cy.get('[data-testid="submit-request-btn"]').click();

      cy.get('[data-testid="validation-error-email"]').should('contain', 'Please enter a valid email address');
    });

    it('should validate phone number format', () => {
      cy.get('input[name="customer_phone"]').type('123');
      cy.get('[data-testid="submit-request-btn"]').click();

      cy.get('[data-testid="validation-error-phone"]').should('contain', 'Please enter a valid phone number');
    });

    it('should validate preferred date is not in the past', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];

      cy.get('input[name="preferred_date"]').type(yesterdayString);
      cy.get('[data-testid="submit-request-btn"]').click();

      cy.get('[data-testid="validation-error-date"]').should('contain', 'Preferred date cannot be in the past');
    });
  });

  describe('Service Type Selection', () => {
    it('should display all available service types', () => {
      cy.get('select[name="service_type"]').click();

      // Verify all service categories
      cy.get('option[value="HVAC Maintenance"]').should('exist');
      cy.get('option[value="HVAC Repair"]').should('exist');
      cy.get('option[value="Plumbing Repair"]').should('exist');
      cy.get('option[value="Electrical Repair"]').should('exist');
      cy.get('option[value="Emergency Service"]').should('exist');
      cy.get('option[value="Installation"]').should('exist');
    });

    it('should show service-specific fields for different service types', () => {
      // Test HVAC service specifics
      cy.get('select[name="service_type"]').select('HVAC Maintenance');
      cy.get('[data-testid="hvac-specific-fields"]').should('be.visible');
      cy.get('[data-testid="hvac-system-type"]').should('be.visible');
      cy.get('[data-testid="hvac-last-service"]').should('be.visible');

      // Test Emergency service specifics
      cy.get('select[name="service_type"]').select('Emergency Service');
      cy.get('[data-testid="emergency-fields"]').should('be.visible');
      cy.get('[data-testid="emergency-description"]').should('be.visible');
      cy.get('select[name="urgency_level"]').should('contain.value', 'critical');
    });

    it('should auto-populate urgency for emergency services', () => {
      cy.get('select[name="service_type"]').select('Emergency Service');

      // Verify urgency auto-set to high/critical for emergency
      cy.get('select[name="urgency_level"]').should('have.value', 'critical');
      cy.get('[data-testid="urgency-explanation"]').should('contain', 'Emergency services receive priority scheduling');
    });
  });

  describe('Time Slot Selection', () => {
    beforeEach(() => {
      // Fill required fields first
      cy.get('input[name="customer_name"]').type('Jane Doe');
      cy.get('input[name="customer_email"]').type('jane.doe@example.com');
      cy.get('select[name="service_type"]').select('HVAC Maintenance');
    });

    it('should display available time slots for selected date', () => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekString = nextWeek.toISOString().split('T')[0];

      cy.get('input[name="preferred_date"]').type(nextWeekString);

      // Wait for time slots to load
      cy.get('[data-testid="loading-time-slots"]').should('be.visible');
      cy.get('[data-testid="available-time-slots"]').should('be.visible');

      // Verify time slots are displayed
      cy.get('[data-testid="time-slot-option"]').should('have.length.greaterThan', 0);
      cy.get('[data-testid="time-slot-09:00"]').should('be.visible');
      cy.get('[data-testid="time-slot-13:00"]').should('be.visible');
    });

    it('should show no available slots message when fully booked', () => {
      // Select a date that might be fully booked (mock data dependent)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split('T')[0];

      cy.get('input[name="preferred_date"]').type(tomorrowString);

      // If no slots available
      cy.get('body').then($body => {
        if ($body.find('[data-testid="no-slots-available"]').length > 0) {
          cy.get('[data-testid="no-slots-available"]').should('contain', 'No available time slots');
          cy.get('[data-testid="suggest-alternative-dates"]').should('be.visible');
        }
      });
    });

    it('should allow selection of preferred time range', () => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekString = nextWeek.toISOString().split('T')[0];

      cy.get('input[name="preferred_date"]').type(nextWeekString);
      cy.get('[data-testid="available-time-slots"]').should('be.visible');

      // Select morning preference
      cy.get('[data-testid="time-preference-morning"]').click();

      // Verify morning slots are highlighted/prioritized
      cy.get('[data-testid="morning-slots"]').should('have.class', 'preferred');

      // Select specific time slot
      cy.get('[data-testid="time-slot-09:00"]').click();
      cy.get('[data-testid="selected-time-display"]').should('contain', '9:00 AM');
    });
  });

  describe('Address and Location Handling', () => {
    beforeEach(() => {
      cy.get('input[name="customer_name"]').type('Bob Wilson');
      cy.get('input[name="customer_email"]').type('bob.wilson@example.com');
      cy.get('select[name="service_type"]').select('Plumbing Repair');
    });

    it('should validate service address', () => {
      cy.get('textarea[name="service_address"]').type('123 Main St');
      cy.get('input[name="city"]').type('Anytown');
      cy.get('select[name="state"]').select('CA');
      cy.get('input[name="zip_code"]').type('12345');

      // Trigger address validation
      cy.get('[data-testid="validate-address-btn"]').click();

      // Verify address validation result
      cy.get('[data-testid="address-validation-result"]').should('be.visible');
    });

    it('should check service area coverage', () => {
      cy.get('textarea[name="service_address"]').type('999 Remote Road');
      cy.get('input[name="city"]').type('Faraway');
      cy.get('select[name="state"]').select('AK');
      cy.get('input[name="zip_code"]').type('99999');

      cy.get('[data-testid="check-coverage-btn"]').click();

      // Handle potential out-of-area message
      cy.get('body').then($body => {
        if ($body.find('[data-testid="out-of-service-area"]').length > 0) {
          cy.get('[data-testid="out-of-service-area"]').should('contain', 'outside our service area');
          cy.get('[data-testid="alternative-options"]').should('be.visible');
        } else {
          cy.get('[data-testid="service-area-confirmed"]').should('contain', 'within our service area');
        }
      });
    });

    it('should suggest nearest service location for out-of-area requests', () => {
      cy.get('textarea[name="service_address"]').type('Remote Location');
      cy.get('input[name="zip_code"]').type('00000');

      cy.get('[data-testid="check-coverage-btn"]').click();
      cy.get('[data-testid="out-of-service-area"]').should('be.visible');

      // Verify nearest location suggestion
      cy.get('[data-testid="nearest-location"]').should('be.visible');
      cy.get('[data-testid="travel-fee-notice"]').should('contain', 'additional travel fee may apply');
    });
  });

  describe('Complete Booking Workflow', () => {
    it('should complete successful appointment request', () => {
      // Fill all required fields
      cy.get('input[name="customer_name"]').type('Sarah Johnson');
      cy.get('input[name="customer_email"]').type('sarah.johnson@example.com');
      cy.get('input[name="customer_phone"]').type('(555) 123-4567');

      cy.get('select[name="service_type"]').select('HVAC Repair');

      // Service description
      cy.get('textarea[name="service_description"]').type('Air conditioning not cooling properly. Started yesterday evening.');

      // Address information
      cy.get('textarea[name="service_address"]').type('456 Oak Avenue');
      cy.get('input[name="city"]').type('Springfield');
      cy.get('select[name="state"]').select('IL');
      cy.get('input[name="zip_code"]').type('62701');

      // Select preferred date and time
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekString = nextWeek.toISOString().split('T')[0];

      cy.get('input[name="preferred_date"]').type(nextWeekString);
      cy.get('[data-testid="available-time-slots"]').should('be.visible');
      cy.get('[data-testid="time-slot-10:00"]').click();

      // Set urgency level
      cy.get('select[name="urgency_level"]').select('normal');

      // Add special instructions
      cy.get('textarea[name="special_instructions"]').type('Please call 30 minutes before arrival. Dog on premises - friendly but excitable.');

      // Agree to terms
      cy.get('input[name="terms_agreement"]').check();

      // Submit request
      cy.get('[data-testid="submit-request-btn"]').click();

      // Verify successful submission
      cy.get('[data-testid="success-message"]').should('be.visible');
      cy.get('[data-testid="confirmation-details"]').should('contain', 'Request ID:');
      cy.get('[data-testid="next-steps"]').should('contain', 'manager will review');
    });

    it('should handle emergency service request workflow', () => {
      // Fill emergency service request
      cy.get('input[name="customer_name"]').type('Emergency Customer');
      cy.get('input[name="customer_email"]').type('emergency@example.com');
      cy.get('input[name="customer_phone"]').type('(555) 911-1234');

      cy.get('select[name="service_type"]').select('Emergency Service');

      // Emergency details
      cy.get('textarea[name="emergency_description"]').type('Burst pipe flooding basement. Water everywhere!');
      cy.get('select[name="urgency_level"]').should('have.value', 'critical'); // Auto-set

      // Address
      cy.get('textarea[name="service_address"]').type('789 Emergency Lane');
      cy.get('input[name="city"]').type('Urgentville');
      cy.get('select[name="state"]').select('TX');
      cy.get('input[name="zip_code"]').type('77001');

      // For emergency, date should default to today
      cy.get('input[name="preferred_date"]').should('have.value', new Date().toISOString().split('T')[0]);

      // Emergency contact checkbox
      cy.get('input[name="emergency_contact_ok"]').check();

      cy.get('[data-testid="submit-request-btn"]').click();

      // Verify emergency handling
      cy.get('[data-testid="emergency-confirmation"]').should('be.visible');
      cy.get('[data-testid="emergency-response-time"]').should('contain', 'within 2 hours');
      cy.get('[data-testid="emergency-contact-info"]').should('contain', 'emergency dispatch');
    });

    it('should send confirmation email after successful submission', () => {
      // Complete standard booking
      cy.get('input[name="customer_name"]').type('Test Customer');
      cy.get('input[name="customer_email"]').type('test@example.com');
      cy.get('select[name="service_type"]').select('Installation');
      cy.get('textarea[name="service_address"]').type('123 Test Street');

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      cy.get('input[name="preferred_date"]').type(nextWeek.toISOString().split('T')[0]);

      cy.get('input[name="terms_agreement"]').check();
      cy.get('[data-testid="submit-request-btn"]').click();

      // Verify email confirmation notice
      cy.get('[data-testid="email-confirmation-notice"]').should('contain', 'confirmation email sent');
      cy.get('[data-testid="email-instructions"]').should('contain', 'check your inbox');
    });
  });

  describe('Customer Portal Error Handling', () => {
    it('should handle server errors gracefully', () => {
      // Mock server error
      cy.intercept('POST', '/api/appointment-requests/', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('serverError');

      // Fill minimum required fields
      cy.get('input[name="customer_name"]').type('Error Test');
      cy.get('input[name="customer_email"]').type('error@example.com');
      cy.get('select[name="service_type"]').select('HVAC Maintenance');

      cy.get('[data-testid="submit-request-btn"]').click();

      // Wait for error response
      cy.wait('@serverError');

      // Verify error handling
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');
      cy.get('[data-testid="contact-support"]').should('contain', 'contact support');
    });

    it('should handle network connectivity issues', () => {
      // Simulate network failure
      cy.intercept('POST', '/api/appointment-requests/', { forceNetworkError: true }).as('networkError');

      cy.get('input[name="customer_name"]').type('Network Test');
      cy.get('input[name="customer_email"]').type('network@example.com');
      cy.get('select[name="service_type"]').select('Electrical Repair');

      cy.get('[data-testid="submit-request-btn"]').click();

      cy.wait('@networkError');

      // Verify network error handling
      cy.get('[data-testid="network-error"]').should('contain', 'connection problem');
      cy.get('[data-testid="offline-mode-notice"]').should('be.visible');
    });

    it('should validate business hours and show after-hours message', () => {
      // Mock after-hours time
      cy.clock(new Date(2025, 9, 15, 22, 0)); // 10 PM

      cy.visit('/customer-portal');

      // Verify after-hours notice
      cy.get('[data-testid="after-hours-notice"]').should('be.visible');
      cy.get('[data-testid="business-hours-info"]').should('contain', 'business hours are');
      cy.get('[data-testid="emergency-contact"]').should('be.visible');
    });
  });

  describe('Accessibility and Mobile Experience', () => {
    it('should be fully keyboard navigable', () => {
      // Tab through all form fields
      cy.get('body').tab();
      cy.focused().should('have.attr', 'name', 'customer_name');

      cy.focused().tab();
      cy.focused().should('have.attr', 'name', 'customer_email');

      cy.focused().tab();
      cy.focused().should('have.attr', 'name', 'customer_phone');

      // Continue tabbing through all interactive elements
      cy.focused().tab();
      cy.focused().should('have.attr', 'name', 'service_type');
    });

    it('should work on mobile viewport', () => {
      cy.viewport('iphone-x');

      // Verify mobile-responsive layout
      cy.get('[data-testid="customer-portal-header"]').should('be.visible');
      cy.get('[data-testid="service-booking-form"]').should('be.visible');

      // Test mobile form interaction
      cy.get('input[name="customer_name"]').type('Mobile User');
      cy.get('select[name="service_type"]').select('HVAC Maintenance');

      // Verify mobile-specific UI elements
      cy.get('[data-testid="mobile-date-picker"]').should('be.visible');
    });

    it('should have proper ARIA labels and screen reader support', () => {
      // Check form labels and ARIA attributes
      cy.get('input[name="customer_name"]')
        .should('have.attr', 'aria-label')
        .should('have.attr', 'aria-required', 'true');

      cy.get('select[name="service_type"]')
        .should('have.attr', 'aria-label')
        .should('have.attr', 'aria-required', 'true');

      // Check error message associations
      cy.get('[data-testid="submit-request-btn"]').click();
      cy.get('[data-testid="validation-error-name"]')
        .should('have.attr', 'aria-live', 'polite')
        .should('have.attr', 'role', 'alert');
    });
  });
});
