/**
 * Field Service Accessibility E2E Tests - Phase 4 Enhancement
 * Comprehensive WCAG 2.1 AA accessibility testing for all field service components
 */

describe('Field Service Accessibility Compliance', () => {
  beforeEach(() => {
    // Inject axe-core for accessibility testing
    cy.injectAxe();

    // Login as test user
    cy.visit('/login');
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();
  });

  describe('SchedulePage Accessibility', () => {
    beforeEach(() => {
      cy.visit('/schedule');
      cy.get('[data-testid="fullcalendar"]').should('be.visible');
    });

    it('should pass axe accessibility audit', () => {
      // Run comprehensive accessibility scan
      cy.checkA11y();
    });

    it('should have proper ARIA labels for calendar', () => {
      // Check calendar container has proper labeling
      cy.get('[data-testid="fullcalendar"]')
        .should('have.attr', 'aria-label')
        .and('contain', 'Field service appointment calendar');

      cy.get('[data-testid="fullcalendar"]')
        .should('have.attr', 'role', 'application');
    });

    it('should be fully keyboard navigable', () => {
      // Test keyboard navigation through calendar
      cy.get('body').tab();
      cy.focused().should('have.class', 'fc-prev-button');

      cy.focused().tab();
      cy.focused().should('have.class', 'fc-next-button');

      cy.focused().tab();
      cy.focused().should('have.class', 'fc-today-button');

      // Navigate to calendar grid
      cy.get('.fc-daygrid-body').click();
      cy.get('.fc-day').first().focus();

      // Test arrow key navigation
      cy.focused().type('{rightarrow}');
      cy.focused().type('{downarrow}');
      cy.focused().type('{leftarrow}');
      cy.focused().type('{uparrow}');
    });

    it('should announce calendar changes to screen readers', () => {
      // Test screen reader announcements
      cy.get('.fc-next-button').click();

      // Verify announcement element is created
      cy.get('[aria-live="polite"]').should('exist');

      // Test event creation announcement
      cy.get('[data-testid="new-appointment-btn"]').click();
      cy.get('[aria-live="polite"]').should('contain.text', 'Opening new appointment form');
    });

    it('should support high contrast mode', () => {
      // Simulate high contrast preference
      cy.window().then(win => {
        // Mock prefers-contrast media query
        Object.defineProperty(win, 'matchMedia', {
          writable: true,
          value: cy.stub().returns({
            matches: true,
            media: '(prefers-contrast: high)',
            onchange: null,
            addListener: cy.stub(),
            removeListener: cy.stub(),
          }),
        });
      });

      cy.reload();

      // Verify high contrast styles are applied
      cy.get('.fc-event').should('have.css', 'border-width', '2px');
      cy.get('.fc-day-today').should('have.css', 'background-color', 'rgb(0, 0, 128)'); // #000080
    });

    it('should handle reduced motion preferences', () => {
      // Mock prefers-reduced-motion
      cy.window().then(win => {
        Object.defineProperty(win, 'matchMedia', {
          writable: true,
          value: cy.stub().returns({
            matches: true,
            media: '(prefers-reduced-motion: reduce)',
            onchange: null,
            addListener: cy.stub(),
            removeListener: cy.stub(),
          }),
        });
      });

      cy.reload();

      // Verify animations are disabled/reduced
      cy.get('.fc-event').should('have.css', 'transition', 'none');
    });

    it('should provide focus management for appointment modal', () => {
      cy.get('[data-testid="new-appointment-btn"]').click();
      cy.get('[data-testid="appointment-modal"]').should('be.visible');

      // Verify focus is trapped within modal
      cy.focused().should('be.visible');

      // Tab through modal and verify focus stays within
      cy.focused().tab();
      cy.focused().should('exist');

      // Verify Escape key closes modal
      cy.get('body').type('{esc}');
      cy.get('[data-testid="appointment-modal"]').should('not.exist');
    });
  });

  describe('DigitalSignaturePad Accessibility', () => {
    beforeEach(() => {
      // Navigate to a work order that requires signature
      cy.visit('/work-orders');
      cy.get('[data-testid="work-order-row"]').first().click();
      cy.get('[data-testid="capture-signature-btn"]').click();
    });

    it('should pass axe accessibility audit', () => {
      cy.checkA11y();
    });

    it('should provide alternative signature methods', () => {
      // Verify text signature option
      cy.get('[data-testid="text-signature-option"]').should('be.visible');
      cy.get('input[name="text_signature"]')
        .should('have.attr', 'aria-label')
        .and('contain', 'Type your full name as text signature');

      // Test text signature functionality
      cy.get('input[name="text_signature"]').type('John Smith');
      cy.get('[data-testid="text-signature-preview"]').should('contain', 'John Smith');
    });

    it('should have proper touch target sizes', () => {
      // Verify signature pad meets minimum touch target size (44px)
      cy.get('[data-testid="signature-canvas"]')
        .should('have.css', 'min-height', '44px')
        .should('have.css', 'min-width', '44px');

      // Verify control buttons meet size requirements
      cy.get('[data-testid="clear-signature-btn"]')
        .invoke('outerHeight')
        .should('be.gte', 44);

      cy.get('[data-testid="save-signature-btn"]')
        .invoke('outerHeight')
        .should('be.gte', 44);
    });

    it('should announce signature status changes', () => {
      // Clear signature and verify announcement
      cy.get('[data-testid="clear-signature-btn"]').click();
      cy.get('[aria-live="assertive"]').should('contain', 'Signature cleared');

      // Save signature and verify announcement
      cy.get('[data-testid="signature-canvas"]').trigger('mousedown', { x: 50, y: 50 });
      cy.get('[data-testid="signature-canvas"]').trigger('mousemove', { x: 100, y: 100 });
      cy.get('[data-testid="signature-canvas"]').trigger('mouseup');

      cy.get('[data-testid="save-signature-btn"]').click();
      cy.get('[aria-live="assertive"]').should('contain', 'Signature saved successfully');
    });

    it('should support voice signature recording', () => {
      // Test voice signature option (if implemented)
      cy.get('[data-testid="voice-signature-option"]').should('be.visible');
      cy.get('[data-testid="start-voice-recording"]')
        .should('have.attr', 'aria-label')
        .and('contain', 'Voice signature recording');
    });
  });

  describe('CustomerPortal Accessibility', () => {
    beforeEach(() => {
      cy.visit('/customer-portal');
    });

    it('should pass axe accessibility audit', () => {
      cy.checkA11y();
    });

    it('should have proper form labeling and validation', () => {
      // Verify all form fields have labels
      cy.get('input[name="customer_name"]')
        .should('have.attr', 'aria-label')
        .should('have.attr', 'aria-required', 'true');

      cy.get('input[name="customer_email"]')
        .should('have.attr', 'aria-label')
        .should('have.attr', 'aria-required', 'true');

      cy.get('select[name="service_type"]')
        .should('have.attr', 'aria-label')
        .should('have.attr', 'aria-required', 'true');
    });

    it('should provide accessible error messages', () => {
      // Trigger validation errors
      cy.get('[data-testid="submit-request-btn"]').click();

      // Verify error messages are properly associated
      cy.get('[data-testid="validation-error-name"]')
        .should('have.attr', 'role', 'alert')
        .should('have.attr', 'aria-live', 'polite');

      cy.get('input[name="customer_name"]')
        .should('have.attr', 'aria-invalid', 'true')
        .should('have.attr', 'aria-describedby');
    });

    it('should announce service type descriptions', () => {
      // Select service type and verify announcement
      cy.get('select[name="service_type"]').select('HVAC Maintenance');

      // Verify service description is announced
      cy.get('[aria-live="polite"]')
        .should('contain', 'Service description')
        .should('contain', 'Regular maintenance and tune-up services');
    });

    it('should be fully keyboard navigable', () => {
      // Tab through all form fields
      cy.get('body').tab();
      cy.focused().should('have.attr', 'name', 'customer_name');

      cy.focused().tab();
      cy.focused().should('have.attr', 'name', 'customer_email');

      cy.focused().tab();
      cy.focused().should('have.attr', 'name', 'customer_phone');

      // Continue through all interactive elements
      cy.focused().tab();
      cy.focused().should('have.attr', 'name', 'service_type');
    });

    it('should work with screen reader technology', () => {
      // Verify landmark roles
      cy.get('main').should('have.attr', 'role', 'main');
      cy.get('form').should('have.attr', 'role', 'form');

      // Verify heading structure
      cy.get('h1').should('exist').should('be.visible');
      cy.get('h2').should('exist');

      // Verify skip links
      cy.get('.skip-link').should('exist');
      cy.get('.skip-link').focus();
      cy.focused().should('be.visible');
    });
  });

  describe('AppointmentRequestQueue Accessibility', () => {
    beforeEach(() => {
      cy.visit('/appointment-requests');
      cy.get('[data-testid="appointment-queue-table"]').should('be.visible');
    });

    it('should pass axe accessibility audit', () => {
      cy.checkA11y();
    });

    it('should have accessible data table structure', () => {
      // Verify table has proper roles and labels
      cy.get('[data-testid="appointment-queue-table"]')
        .should('have.attr', 'role', 'grid')
        .should('have.attr', 'aria-label', 'Appointment requests queue');

      // Verify column headers
      cy.get('th').each($th => {
        cy.wrap($th).should('have.attr', 'role', 'columnheader');
        cy.wrap($th).should('have.attr', 'id');
      });

      // Verify data cells reference headers
      cy.get('tbody td').each($td => {
        cy.wrap($td)
          .should('have.attr', 'role', 'gridcell')
          .should('have.attr', 'headers');
      });
    });

    it('should have accessible action buttons', () => {
      // Verify action buttons have descriptive labels
      cy.get('[data-testid="approve-btn"]').first()
        .should('have.attr', 'aria-label')
        .should('contain', 'Approve appointment request');

      cy.get('[data-testid="reject-btn"]').first()
        .should('have.attr', 'aria-label')
        .should('contain', 'Reject appointment request');
    });

    it('should announce status changes', () => {
      // Approve a request and verify announcement
      cy.get('[data-testid="approve-btn"]').first().click();

      cy.get('[aria-live="polite"]')
        .should('contain', 'status changed')
        .should('contain', 'approved');
    });

    it('should support sortable columns with keyboard', () => {
      // Test keyboard sorting
      cy.get('th button').first().focus();
      cy.focused().type('{enter}');

      // Verify sort state is announced
      cy.get('th').first().should('have.attr', 'aria-sort');
    });
  });

  describe('PaperworkTemplateManager Accessibility', () => {
    beforeEach(() => {
      cy.visit('/paperwork-templates');
      cy.get('[data-testid="template-editor"]').should('be.visible');
    });

    it('should pass axe accessibility audit', () => {
      cy.checkA11y();
    });

    it('should have accessible template editor', () => {
      // Verify editor has proper role and labeling
      cy.get('[data-testid="template-editor"]')
        .should('have.attr', 'role', 'textbox')
        .should('have.attr', 'aria-multiline', 'true')
        .should('have.attr', 'aria-label')
        .should('have.attr', 'aria-describedby');

      // Verify instructions are available
      cy.get('#template-editor-instructions')
        .should('exist')
        .should('contain', 'Template editor');
    });

    it('should have accessible variable insertion buttons', () => {
      // Verify variable buttons have proper labels
      cy.get('.variable-button').each($btn => {
        cy.wrap($btn).should('have.attr', 'aria-label');
        cy.wrap($btn).should('have.attr', 'title');
      });

      // Test variable insertion
      cy.get('[data-variable="customer_name"]').click();
      cy.get('[data-testid="template-editor"]').should('contain', '{{customer_name}}');
    });

    it('should support keyboard shortcuts', () => {
      // Test Ctrl+S for save
      cy.get('[data-testid="template-editor"]').type('{ctrl+s}');

      // Test Ctrl+P for preview
      cy.get('[data-testid="template-editor"]').type('{ctrl+p}');
    });
  });

  describe('SchedulingDashboard Accessibility', () => {
    beforeEach(() => {
      cy.visit('/scheduling-dashboard');
      cy.get('[data-testid="analytics-charts"]').should('be.visible');
    });

    it('should pass axe accessibility audit', () => {
      cy.checkA11y();
    });

    it('should have accessible charts with data tables', () => {
      // Verify charts have proper ARIA labels
      cy.get('.chart-container canvas').each($canvas => {
        cy.wrap($canvas)
          .should('have.attr', 'role', 'img')
          .should('have.attr', 'aria-label');
      });

      // Verify data tables exist for each chart
      cy.get('.chart-data-table').should('have.length.greaterThan', 0);

      // Verify data table structure
      cy.get('.chart-data-table').first().within(() => {
        cy.get('thead th').should('exist');
        cy.get('tbody td').should('exist');
      });
    });

    it('should have accessible tab navigation', () => {
      // Verify dashboard tabs have proper roles
      cy.get('[role="tablist"]').should('exist');
      cy.get('[role="tab"]').should('have.length.greaterThan', 1);

      // Test keyboard navigation between tabs
      cy.get('[role="tab"]').first().focus();
      cy.focused().should('have.attr', 'aria-selected', 'true');

      cy.focused().type('{rightarrow}');
      cy.focused().should('have.attr', 'aria-selected', 'true');
    });

    it('should respect motion preferences for animations', () => {
      // Mock prefers-reduced-motion
      cy.window().then(win => {
        Object.defineProperty(win, 'matchMedia', {
          writable: true,
          value: cy.stub().returns({
            matches: true,
            media: '(prefers-reduced-motion: reduce)',
            onchange: null,
            addListener: cy.stub(),
            removeListener: cy.stub(),
          }),
        });
      });

      cy.reload();

      // Verify chart animations are disabled
      cy.get('.chart-container canvas').should('have.attr', 'data-reduced-motion', 'true');
    });
  });

  describe('Global Accessibility Features', () => {
    beforeEach(() => {
      cy.visit('/schedule');
    });

    it('should have skip links for keyboard navigation', () => {
      // Test skip to main content
      cy.get('body').tab();
      cy.focused().should('have.class', 'skip-link');
      cy.focused().should('contain', 'Skip to main content');

      cy.focused().type('{enter}');
      cy.focused().should('have.attr', 'id', 'main-content');
    });

    it('should have consistent focus indicators', () => {
      // Test focus indicators are visible
      cy.get('button').first().focus();
      cy.focused().should('have.css', 'outline-color', 'rgb(0, 95, 204)'); // #005fcc
      cy.focused().should('have.css', 'outline-width', '2px');
    });

    it('should respect user color scheme preferences', () => {
      // Test dark mode support (if implemented)
      cy.window().then(win => {
        Object.defineProperty(win, 'matchMedia', {
          writable: true,
          value: cy.stub().returns({
            matches: true,
            media: '(prefers-color-scheme: dark)',
            onchange: null,
            addListener: cy.stub(),
            removeListener: cy.stub(),
          }),
        });
      });

      cy.reload();

      // Verify dark mode styles are applied
      cy.get('body').should('have.class', 'dark-mode');
    });
  });

  describe('Performance with Accessibility Tools', () => {
    it('should maintain performance with screen readers', () => {
      const startTime = Date.now();

      cy.visit('/schedule');
      cy.get('[data-testid="fullcalendar"]').should('be.visible');

      // Simulate screen reader interaction
      cy.get('.fc-event').first().focus();
      cy.focused().type('{enter}');

      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // 3 second budget
      });
    });

    it('should handle high magnification levels', () => {
      // Test 200% zoom level
      cy.viewport(800, 600); // Simulate high zoom

      cy.visit('/customer-portal');

      // Verify layout remains usable
      cy.get('[data-testid="service-booking-form"]').should('be.visible');
      cy.get('input[name="customer_name"]').should('be.visible');

      // Verify no horizontal scroll
      cy.get('body').should('not.have.css', 'overflow-x', 'scroll');
    });
  });
});
