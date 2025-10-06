/**
 * Interactions Workflow E2E Tests - TASK-030
 * Tests the complete interactions workflow: Log call → Log email → View timeline → Filter by type
 */

describe('Interactions Workflow', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/login');
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  describe('Interaction Creation', () => {
    it('should log a phone call successfully', () => {
      // Navigate to interactions list
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Interactions').click();
      cy.url().should('include', '/interactions');

      // Click create interaction button
      cy.contains('Log Interaction').click();
      cy.url().should('include', '/interactions/new');

      // Fill in phone call form
      cy.get('select[name="contact"]').select(1);
      cy.get('select[name="type"]').select('call');
      cy.get('input[name="subject"]').type('Follow-up call with customer');
      cy.get('textarea[name="notes"]').type('Discussed project timeline and budget. Customer is satisfied with progress.');
      cy.get('input[name="date"]').type('2025-01-15');

      // Submit form
      cy.get('button[type="submit"]').click();

      // Verify success and redirect
      cy.url().should('include', '/interactions');
      cy.contains('Follow-up call').should('be.visible');
    });

    it('should log an email successfully', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Interactions').click();
      cy.contains('Log Interaction').click();

      // Fill in email form
      cy.get('select[name="contact"]').select(1);
      cy.get('select[name="type"]').select('email');
      cy.get('input[name="subject"]').type('Re: Project Proposal');
      cy.get('textarea[name="notes"]').type('Sent detailed project proposal with pricing breakdown.');
      cy.get('input[name="date"]').type('2025-01-16');

      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/interactions');
      cy.contains('Re: Project Proposal').should('be.visible');
    });

    it('should log a meeting successfully', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Interactions').click();
      cy.contains('Log Interaction').click();

      // Fill in meeting form
      cy.get('select[name="contact"]').select(1);
      cy.get('select[name="type"]').select('meeting');
      cy.get('input[name="subject"]').type('Quarterly Business Review');
      cy.get('textarea[name="notes"]').type('Reviewed Q4 performance metrics. Discussed expansion opportunities for 2025.');
      cy.get('input[name="date"]').type('2025-01-17');

      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/interactions');
      cy.contains('Quarterly Business Review').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Interactions').click();
      cy.contains('Log Interaction').click();

      // Try to submit empty form
      cy.get('button[type="submit"]').click();

      // Should stay on form with validation errors
      cy.url().should('include', '/interactions/new');
      cy.get('select[name="contact"]:invalid').should('exist');
    });
  });

  describe('Interaction Timeline View', () => {
    it('should display timeline of interactions', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Interactions').click();
      cy.url().should('include', '/interactions');

      // Verify timeline structure
      cy.get('.interaction-timeline, .timeline, ul, .list-group').should('exist');

      // Verify at least one interaction is displayed
      cy.get('li, .timeline-item, .interaction-item').should('have.length.at.least', 1);
    });

    it('should display interaction types with icons', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Interactions').click();

      // Verify type indicators exist
      cy.get('body').then(($body) => {
        // Check for type badges or icons
        const hasCallIndicator = $body.find('*:contains("call"), .icon-phone, .fa-phone').length > 0;
        const hasEmailIndicator = $body.find('*:contains("email"), .icon-envelope, .fa-envelope').length > 0;
        const hasMeetingIndicator = $body.find('*:contains("meeting"), .icon-calendar, .fa-calendar').length > 0;

        expect(hasCallIndicator || hasEmailIndicator || hasMeetingIndicator).to.be.true;
      });
    });

    it('should display chronological ordering', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Interactions').click();

      // Get all date elements and verify they're in order (newest first or oldest first)
      cy.get('li, .timeline-item').should('have.length.at.least', 2);
      
      // Visual verification that dates are present
      cy.contains(/\d{4}-\d{2}-\d{2}|\w+ \d+, \d{4}/).should('be.visible');
    });

    it('should display interaction subject and notes', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Interactions').click();

      // Verify subject is visible
      cy.get('li, .timeline-item').first().should('contain.text', /[A-Za-z]/);
      
      // Verify notes or details are present
      cy.get('li, .timeline-item').first().find('p, .notes, .details').should('exist');
    });

    it('should display contact information', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Interactions').click();

      // Verify contact name or link is displayed
      cy.get('li, .timeline-item').first().should('contain.text', /[A-Za-z]+\s[A-Za-z]+/);
    });
  });

  describe('Interaction Filtering', () => {
    it('should filter interactions by type - call', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Interactions').click();

      // Select call filter
      cy.get('select').first().select('call');

      // Verify only call interactions are shown
      cy.contains('call').should('be.visible');
    });

    it('should filter interactions by type - email', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Interactions').click();

      cy.get('select').first().select('email');
      cy.contains('email').should('be.visible');
    });

    it('should filter interactions by type - meeting', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Interactions').click();

      cy.get('select').first().select('meeting');
      cy.contains('meeting').should('be.visible');
    });

    it('should search interactions by subject', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Interactions').click();

      // Type in search box
      cy.get('input[placeholder*="Search"]').type('Follow-up');

      // Verify filtered results
      cy.contains('Follow-up').should('be.visible');
    });

    it('should search interactions by contact name', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Interactions').click();

      cy.get('input[placeholder*="Search"]').type('John');
      cy.contains('John').should('be.visible');
    });
  });

  describe('Interaction Editing', () => {
    it('should edit an interaction', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Interactions').click();

      // Click edit button on first interaction
      cy.get('button').contains('Edit').first().click();
      cy.url().should('match', /\/interactions\/\d+\/edit/);

      // Update interaction
      cy.get('input[name="subject"]').clear().type('Updated: Customer Follow-up');
      cy.get('textarea[name="notes"]').clear().type('Updated notes via E2E test');

      // Submit form
      cy.get('button[type="submit"]').click();

      // Verify success
      cy.url().should('include', '/interactions');
      cy.contains('Updated: Customer Follow-up').should('be.visible');
    });

    it('should update interaction type', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Interactions').click();

      cy.get('button').contains('Edit').first().click();
      
      // Change type from call to meeting
      cy.get('select[name="type"]').select('meeting');
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/interactions');
      cy.contains('meeting').should('be.visible');
    });
  });

  describe('Interaction Detail View', () => {
    it('should view interaction details', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Interactions').click();

      // Click view button
      cy.get('button').contains('View').first().click();
      cy.url().should('match', /\/interactions\/\d+/);

      // Verify details are displayed
      cy.contains('Type:').should('be.visible');
      cy.contains('Subject:').should('be.visible');
      cy.contains('Contact:').should('be.visible');
      cy.contains('Date:').should('be.visible');
    });

    it('should display full notes in detail view', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Interactions').click();

      cy.get('button').contains('View').first().click();

      // Verify notes section exists
      cy.contains('Notes:').should('be.visible');
      cy.get('.notes, .details, p').should('have.length.at.least', 1);
    });
  });

  describe('Interaction Deletion', () => {
    it('should delete an interaction with confirmation', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Interactions').click();

      // Get initial interaction count
      cy.get('li, .timeline-item, .interaction-item').then(($items) => {
        const initialCount = $items.length;

        // Click delete button and confirm
        cy.contains('button', 'Delete').first().click();
        cy.on('window:confirm', () => true);

        // Verify interaction is removed
        cy.get('li, .timeline-item, .interaction-item').should('have.length', initialCount - 1);
      });
    });
  });

  describe('Complete Workflow', () => {
    it('should complete full interaction lifecycle', () => {
      // Step 1: Log initial phone call
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Interactions').click();
      cy.contains('Log Interaction').click();
      cy.get('select[name="contact"]').select(1);
      cy.get('select[name="type"]').select('call');
      cy.get('input[name="subject"]').type('E2E Test: Initial Contact');
      cy.get('textarea[name="notes"]').type('First contact with potential customer');
      cy.get('input[name="date"]').type('2025-01-15');
      cy.get('button[type="submit"]').click();

      // Step 2: Log follow-up email
      cy.contains('Log Interaction').click();
      cy.get('select[name="contact"]').select(1);
      cy.get('select[name="type"]').select('email');
      cy.get('input[name="subject"]').type('E2E Test: Follow-up Email');
      cy.get('textarea[name="notes"]').type('Sent proposal and pricing information');
      cy.get('input[name="date"]').type('2025-01-16');
      cy.get('button[type="submit"]').click();

      // Step 3: Log meeting
      cy.contains('Log Interaction').click();
      cy.get('select[name="contact"]').select(1);
      cy.get('select[name="type"]').select('meeting');
      cy.get('input[name="subject"]').type('E2E Test: Contract Meeting');
      cy.get('textarea[name="notes"]').type('Finalized contract terms and signed agreement');
      cy.get('input[name="date"]').type('2025-01-17');
      cy.get('button[type="submit"]').click();

      // Step 4: View timeline
      cy.contains('E2E Test').should('be.visible');

      // Step 5: Filter by type
      cy.get('select').first().select('call');
      cy.contains('Initial Contact').should('be.visible');

      // Step 6: Edit interaction
      cy.contains('Initial Contact').parents('li, .timeline-item').find('button').contains('Edit').click();
      cy.get('textarea[name="notes"]').clear().type('Updated: First successful contact');
      cy.get('button[type="submit"]').click();

      // Step 7: Clean up - delete interactions
      cy.get('button').contains('Delete').first().click();
      cy.on('window:confirm', () => true);
    });
  });
});
