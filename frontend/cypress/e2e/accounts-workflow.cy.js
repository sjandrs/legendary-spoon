/**
 * Accounts Workflow E2E Tests - TASK-030
 * Tests the complete accounts workflow: Create → Add contacts → View deals → Edit
 */

describe('Accounts Workflow', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/login');
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  describe('Account Creation', () => {
    it('should create a new account successfully', () => {
      // Navigate to accounts list
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Accounts').click();
      cy.url().should('include', '/accounts');

      // Click create account button
      cy.contains('Create Account').click();
      cy.url().should('include', '/accounts/new');

      // Fill in account form
      cy.get('input[name="name"]').type('Test Corporation Inc');
      cy.get('input[name="industry"]').type('Technology');
      cy.get('input[name="phone"]').type('555-0123');
      cy.get('input[name="email"]').type('contact@testcorp.com');
      cy.get('input[name="website"]').type('https://testcorp.com');
      cy.get('textarea[name="billing_address"]').type('123 Test Street, Test City, TC 12345');
      cy.get('textarea[name="shipping_address"]').type('123 Test Street, Test City, TC 12345');
      cy.get('textarea[name="notes"]').type('This is a test account created via E2E testing');

      // Submit form
      cy.get('button[type="submit"]').click();

      // Verify success and redirect
      cy.url().should('include', '/accounts');
      cy.contains('Test Corporation Inc').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Accounts').click();
      cy.contains('Create Account').click();

      // Try to submit empty form
      cy.get('button[type="submit"]').click();

      // Should stay on form with validation errors
      cy.url().should('include', '/accounts/new');
      cy.get('input[name="name"]:invalid').should('exist');
    });
  });

  describe('Account Listing and Search', () => {
    it('should display list of accounts', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Accounts').click();
      cy.url().should('include', '/accounts');

      // Verify table headers
      cy.contains('th', 'Name').should('be.visible');
      cy.contains('th', 'Industry').should('be.visible');
      cy.contains('th', 'Owner').should('be.visible');
      cy.contains('th', 'Actions').should('be.visible');

      // Verify at least one account is displayed
      cy.get('tbody tr').should('have.length.at.least', 1);
    });

    it('should search accounts by name', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Accounts').click();

      // Type in search box
      cy.get('input[placeholder*="Search"]').type('Test Corporation');

      // Verify filtered results
      cy.contains('Test Corporation Inc').should('be.visible');
    });

    it('should filter accounts by industry', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Accounts').click();

      // Select industry filter
      cy.get('select').select('Technology');

      // Verify filtered results show only technology companies
      cy.contains('Technology').should('be.visible');
    });
  });

  describe('Account Detail View', () => {
    it('should view account details', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Accounts').click();

      // Click view button on first account
      cy.contains('Test Corporation Inc').parents('tr').find('button').contains('View').click();
      cy.url().should('match', /\/accounts\/\d+/);

      // Verify account details are displayed
      cy.contains('Test Corporation Inc').should('be.visible');
      cy.contains('Technology').should('be.visible');
      cy.contains('555-0123').should('be.visible');
      cy.contains('contact@testcorp.com').should('be.visible');
    });

    it('should display related contacts', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Accounts').click();
      cy.contains('Test Corporation Inc').parents('tr').find('button').contains('View').click();

      // Verify contacts section exists
      cy.contains('h2', 'Contacts').should('be.visible');
      cy.contains('button', 'Add Contact').should('be.visible');
    });

    it('should display related deals', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Accounts').click();
      cy.contains('Test Corporation Inc').parents('tr').find('button').contains('View').click();

      // Verify deals section exists
      cy.contains('h2', 'Deals').should('be.visible');
      cy.contains('button', 'Create Deal').should('be.visible');
    });

    it('should display activity timeline', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Accounts').click();
      cy.contains('Test Corporation Inc').parents('tr').find('button').contains('View').click();

      // Verify activity section exists
      cy.contains('h2', 'Recent Activity').should('be.visible');
    });
  });

  describe('Account Editing', () => {
    it('should edit an existing account', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Accounts').click();

      // Click edit button
      cy.contains('Test Corporation Inc').parents('tr').find('button').contains('Edit').click();
      cy.url().should('match', /\/accounts\/\d+\/edit/);

      // Update account information
      cy.get('input[name="phone"]').clear().type('555-9999');
      cy.get('textarea[name="notes"]').clear().type('Updated notes via E2E test');

      // Submit form
      cy.get('button[type="submit"]').click();

      // Verify success and redirect
      cy.url().should('include', '/accounts');
      cy.contains('Test Corporation Inc').should('be.visible');
    });
  });

  describe('Account Deletion', () => {
    it('should delete an account with confirmation', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Accounts').click();

      // Get initial row count
      cy.get('tbody tr').then(($rows) => {
        const initialCount = $rows.length;

        // Click delete button and confirm
        cy.contains('Test Corporation Inc').parents('tr').find('button').contains('Delete').click();
        
        // Confirm deletion in dialog
        cy.on('window:confirm', () => true);

        // Verify account is removed
        cy.get('tbody tr').should('have.length', initialCount - 1);
        cy.contains('Test Corporation Inc').should('not.exist');
      });
    });

    it('should cancel account deletion', () => {
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Accounts').click();

      // Get initial row count
      cy.get('tbody tr').then(($rows) => {
        const initialCount = $rows.length;

        // Click delete but cancel
        cy.contains('button', 'Delete').first().click();
        cy.on('window:confirm', () => false);

        // Verify account still exists
        cy.get('tbody tr').should('have.length', initialCount);
      });
    });
  });

  describe('Complete Workflow', () => {
    it('should complete full account lifecycle', () => {
      // Step 1: Create account
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Accounts').click();
      cy.contains('Create Account').click();
      cy.get('input[name="name"]').type('E2E Test Account');
      cy.get('input[name="industry"]').type('E2E Testing');
      cy.get('input[name="email"]').type('e2e@test.com');
      cy.get('button[type="submit"]').click();

      // Step 2: View account details
      cy.contains('E2E Test Account').parents('tr').find('button').contains('View').click();
      cy.contains('E2E Test Account').should('be.visible');

      // Step 3: Add a contact (if button exists)
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Add Contact")').length > 0) {
          cy.contains('button', 'Add Contact').click();
        }
      });

      // Step 4: Create a deal (if button exists)
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Create Deal")').length > 0) {
          cy.contains('button', 'Create Deal').click();
        }
      });

      // Step 5: Navigate back to accounts list
      cy.get('[data-testid="nav-crm"]').trigger('mouseenter');
      cy.contains('Accounts').click();

      // Step 6: Edit account
      cy.contains('E2E Test Account').parents('tr').find('button').contains('Edit').click();
      cy.get('textarea[name="notes"]').type('Completed full E2E workflow');
      cy.get('button[type="submit"]').click();

      // Step 7: Clean up - delete account
      cy.contains('E2E Test Account').parents('tr').find('button').contains('Delete').click();
      cy.on('window:confirm', () => true);
      cy.contains('E2E Test Account').should('not.exist');
    });
  });
});
