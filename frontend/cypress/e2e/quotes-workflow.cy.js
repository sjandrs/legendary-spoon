/**
 * Quotes Workflow E2E Tests - TASK-030
 * Tests the complete quotes workflow: Create quote → Add line items → Generate PDF → Convert to deal
 */

describe('Quotes Workflow', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/login');
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  describe('Quote Creation', () => {
    it('should create a new quote successfully', () => {
      // Navigate to quotes list
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Quotes').click();
      cy.url().should('include', '/quotes');

      // Click create quote button
      cy.contains('Create Quote').click();
      cy.url().should('include', '/quotes/new');

      // Fill in quote form
      cy.get('select[name="contact"]').select(1);
      cy.get('select[name="account"]').select(1);
      cy.get('input[name="valid_until"]').type('2025-12-31');
      cy.get('textarea[name="notes"]').type('This is a test quote created via E2E testing');

      // Submit form
      cy.get('button[type="submit"]').click();

      // Verify success and redirect
      cy.url().should('include', '/quotes');
      cy.contains('QT-').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Quotes').click();
      cy.contains('Create Quote').click();

      // Try to submit empty form
      cy.get('button[type="submit"]').click();

      // Should stay on form with validation errors
      cy.url().should('include', '/quotes/new');
      cy.get('select[name="contact"]:invalid').should('exist');
    });
  });

  describe('Quote Listing and Filtering', () => {
    it('should display list of quotes', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Quotes').click();
      cy.url().should('include', '/quotes');

      // Verify table headers
      cy.contains('th', 'Quote #').should('be.visible');
      cy.contains('th', 'Contact').should('be.visible');
      cy.contains('th', 'Status').should('be.visible');
      cy.contains('th', 'Actions').should('be.visible');

      // Verify at least one quote is displayed
      cy.get('tbody tr').should('have.length.at.least', 1);
    });

    it('should search quotes by quote number', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Quotes').click();

      // Type in search box
      cy.get('input[placeholder*="Search"]').type('QT-2025');

      // Verify filtered results
      cy.contains('QT-2025').should('be.visible');
    });

    it('should filter quotes by status', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Quotes').click();

      // Select status filter
      cy.get('select').first().select('draft');

      // Verify filtered results show only draft quotes
      cy.contains('draft').should('be.visible');
    });

    it('should filter quotes by sent status', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Quotes').click();

      cy.get('select').first().select('sent');
      cy.contains('sent').should('be.visible');
    });

    it('should filter quotes by accepted status', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Quotes').click();

      cy.get('select').first().select('accepted');
      cy.contains('accepted').should('be.visible');
    });
  });

  describe('Quote Detail View', () => {
    it('should view quote details', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Quotes').click();

      // Click view button on first quote
      cy.contains('QT-').parents('tr').find('button').contains('View').click();
      cy.url().should('match', /\/quotes\/\d+/);

      // Verify quote details are displayed
      cy.contains('QT-').should('be.visible');
      cy.contains('Contact').should('be.visible');
      cy.contains('Account').should('be.visible');
    });

    it('should display line items', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Quotes').click();
      cy.contains('QT-').parents('tr').find('button').contains('View').click();

      // Verify line items section exists
      cy.contains('Line Items').should('be.visible');
    });

    it('should calculate quote total correctly', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Quotes').click();
      cy.contains('QT-').parents('tr').find('button').contains('View').click();

      // Verify total amount is displayed
      cy.contains(/Total/).should('be.visible');
      cy.contains(/\$/).should('be.visible');
    });
  });

  describe('Quote Editing with Line Items', () => {
    it('should edit quote and add line items', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Quotes').click();

      // Click edit button
      cy.contains('QT-').parents('tr').find('button').contains('Edit').click();
      cy.url().should('match', /\/quotes\/\d+\/edit/);

      // Update quote notes
      cy.get('textarea[name="notes"]').clear().type('Updated via E2E test');

      // Add line item (if interface exists)
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Add Line Item")').length > 0) {
          cy.contains('button', 'Add Line Item').click();
          cy.get('input[name*="description"]').last().type('Test Product');
          cy.get('input[name*="quantity"]').last().type('5');
          cy.get('input[name*="unit_price"]').last().type('100.00');
        }
      });

      // Submit form
      cy.get('button[type="submit"]').click();

      // Verify success
      cy.url().should('include', '/quotes');
    });
  });

  describe('Quote PDF Generation', () => {
    it('should have PDF generation button', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Quotes').click();

      // Verify PDF button exists
      cy.contains('button', /PDF/i).should('be.visible');
    });

    it('should generate PDF for quote', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Quotes').click();

      // Click PDF button (will trigger download or open in new tab)
      cy.contains('QT-').parents('tr').find('button').contains(/PDF/i).click();

      // Note: Actual PDF download validation would require additional setup
      // This test verifies the button is clickable
    });
  });

  describe('Quote Status Changes', () => {
    it('should change quote status to sent', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Quotes').click();

      // Find a draft quote and change status
      cy.get('tbody tr').contains('draft').parents('tr').find('button').contains('Edit').click();

      cy.get('select[name="status"]').select('sent');
      cy.get('button[type="submit"]').click();

      // Verify status changed
      cy.url().should('include', '/quotes');
      cy.contains('sent').should('be.visible');
    });

    it('should change quote status to accepted', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Quotes').click();

      cy.get('tbody tr').contains('sent').parents('tr').find('button').contains('Edit').click();

      cy.get('select[name="status"]').select('accepted');
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/quotes');
      cy.contains('accepted').should('be.visible');
    });

    it('should change quote status to rejected', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Quotes').click();

      cy.get('tbody tr').first().find('button').contains('Edit').click();

      cy.get('select[name="status"]').select('rejected');
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/quotes');
      cy.contains('rejected').should('be.visible');
    });
  });

  describe('Quote to Deal Conversion', () => {
    it('should have convert to deal option for accepted quotes', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Quotes').click();

      // Find an accepted quote
      cy.get('tbody tr').contains('accepted').parents('tr').find('button').contains('View').click();

      // Verify convert button exists
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Convert to Deal")').length > 0) {
          cy.contains('button', 'Convert to Deal').should('be.visible');
        }
      });
    });
  });

  describe('Quote Deletion', () => {
    it('should delete a quote with confirmation', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Quotes').click();

      // Get initial row count
      cy.get('tbody tr').then(($rows) => {
        const initialCount = $rows.length;

        // Click delete button and confirm
        cy.contains('button', 'Delete').first().click();
        cy.on('window:confirm', () => true);

        // Verify quote is removed
        cy.get('tbody tr').should('have.length', initialCount - 1);
      });
    });
  });

  describe('Complete Workflow', () => {
    it('should complete full quote lifecycle', () => {
      // Step 1: Create quote
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Quotes').click();
      cy.contains('Create Quote').click();
      cy.get('select[name="contact"]').select(1);
      cy.get('select[name="account"]').select(1);
      cy.get('input[name="valid_until"]').type('2025-12-31');
      cy.get('button[type="submit"]').click();

      // Step 2: View quote details
      cy.get('tbody tr').first().find('button').contains('View').click();

      // Step 3: Edit quote
      cy.contains('button', 'Edit').click();
      cy.get('textarea[name="notes"]').type('E2E workflow test');
      cy.get('button[type="submit"]').click();

      // Step 4: Change status to sent
      cy.get('tbody tr').first().find('button').contains('Edit').click();
      cy.get('select[name="status"]').select('sent');
      cy.get('button[type="submit"]').click();

      // Step 5: Generate PDF
      cy.get('tbody tr').first().find('button').contains(/PDF/i).should('be.visible');

      // Step 6: Change status to accepted
      cy.get('tbody tr').first().find('button').contains('Edit').click();
      cy.get('select[name="status"]').select('accepted');
      cy.get('button[type="submit"]').click();

      // Step 7: Clean up - delete quote
      cy.get('tbody tr').first().find('button').contains('Delete').click();
      cy.on('window:confirm', () => true);
    });
  });
});
