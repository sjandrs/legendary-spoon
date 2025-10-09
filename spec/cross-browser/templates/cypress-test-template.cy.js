/**
 * Cypress Test Template for Cross-Browser Testing
 *
 * This template provides a standardized structure for Cypress E2E tests
 * that will run across Chrome, Firefox, and Edge browsers.
 *
 * Usage:
 * 1. Copy this template to cypress/e2e/
 * 2. Rename to describe your test (e.g., crm-account-creation.cy.js)
 * 3. Fill in test scenarios
 * 4. Run: npm run cypress:run -- --browser chrome
 */

describe('Feature Name - Cross-Browser Test Suite', () => {
  // Test Configuration
  const TEST_CONFIG = {
    baseUrl: Cypress.config('baseUrl'),
    timeout: 10000,
    retries: 2,
  };

  // Test Data
  const testData = {
    user: {
      email: 'test.user@example.com',
      password: 'TestPassword123!',
    },
    // Add your test data here
  };

  // Setup: Run before all tests
  before(() => {
    // Global setup (database seeding, etc.)
    cy.log('Setting up test environment...');
  });

  // Setup: Run before each test
  beforeEach(() => {
    // Reset state, login, navigate to starting page
    cy.visit('/');
    cy.login(testData.user.email, testData.user.password);
  });

  // Teardown: Run after each test
  afterEach(() => {
    // Cleanup (optional)
    // cy.clearCookies();
    // cy.clearLocalStorage();
  });

  // Teardown: Run after all tests
  after(() => {
    // Global cleanup (optional)
    cy.log('Tearing down test environment...');
  });

  /**
   * Test Group 1: Happy Path Scenarios
   */
  context('Happy Path - Core Functionality', () => {
    it('should complete primary user workflow', () => {
      // Arrange: Set up test conditions
      cy.log('Step 1: Navigate to feature');
      cy.get('[data-testid="nav-feature"]').click();

      // Act: Perform user actions
      cy.log('Step 2: Interact with feature');
      cy.get('[data-testid="feature-input"]')
        .type('Test input')
        .should('have.value', 'Test input');

      cy.get('[data-testid="submit-button"]').click();

      // Assert: Verify expected results
      cy.log('Step 3: Verify success');
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', 'Success');

      // Verify URL changed
      cy.url().should('include', '/success');

      // Verify data persisted
      cy.reload();
      cy.get('[data-testid="persisted-data"]')
        .should('contain', 'Test input');
    });

    it('should handle multi-step workflow', () => {
      // Step 1
      cy.get('[data-testid="step-1-button"]').click();
      cy.url().should('include', '/step/1');

      // Step 2
      cy.get('[data-testid="step-1-input"]').type('Step 1 data');
      cy.get('[data-testid="next-button"]').click();
      cy.url().should('include', '/step/2');

      // Step 3
      cy.get('[data-testid="step-2-input"]').type('Step 2 data');
      cy.get('[data-testid="submit-button"]').click();

      // Verify completion
      cy.get('[data-testid="completion-message"]')
        .should('be.visible');
    });
  });

  /**
   * Test Group 2: Form Validation
   */
  context('Form Validation', () => {
    it('should validate required fields', () => {
      cy.get('[data-testid="form-submit"]').click();

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'required');
    });

    it('should validate email format', () => {
      cy.get('[data-testid="email-input"]')
        .type('invalid-email')
        .blur();

      cy.get('[data-testid="email-error"]')
        .should('be.visible')
        .and('contain', 'valid email');
    });

    it('should enforce minimum/maximum length', () => {
      cy.get('[data-testid="text-input"]')
        .type('ab')
        .blur();

      cy.get('[data-testid="length-error"]')
        .should('be.visible')
        .and('contain', 'minimum');
    });
  });

  /**
   * Test Group 3: Browser-Specific Features
   */
  context('Browser-Specific Behavior', () => {
    it('should handle date picker across browsers', () => {
      // Use JavaScript to set date (works consistently)
      cy.get('input[type="date"]').then(\ => {
        \[0].value = '2025-10-04';
        \[0].dispatchEvent(new Event('change', { bubbles: true }));
      });

      cy.get('[data-testid="date-display"]')
        .should('contain', '2025-10-04');
    });

    it('should handle file upload', () => {
      // File upload testing
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('test file content'),
        fileName: 'test.txt',
        mimeType: 'text/plain',
      });

      cy.get('[data-testid="file-name"]')
        .should('contain', 'test.txt');
    });
  });

  /**
   * Test Group 4: Accessibility
   */
  context('Accessibility', () => {
    it('should be keyboard navigable', () => {
      // Tab through interactive elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'first-element');

      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'second-element');
    });

    it('should have proper ARIA labels', () => {
      cy.get('[data-testid="main-button"]')
        .should('have.attr', 'aria-label')
        .and('not.be.empty');
    });

    it('should have no accessibility violations', () => {
      cy.injectAxe();
      cy.checkA11y(null, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
    });
  });

  /**
   * Test Group 5: Error Handling
   */
  context('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Intercept API call and return error
      cy.intercept('POST', '/api/endpoint', {
        statusCode: 500,
        body: { error: 'Internal server error' },
      }).as('apiError');

      cy.get('[data-testid="submit-button"]').click();

      cy.wait('@apiError');

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'error occurred');
    });

    it('should handle network timeout', () => {
      cy.intercept('POST', '/api/endpoint', {
        delay: 30000, // 30 second delay
      }).as('slowRequest');

      cy.get('[data-testid="submit-button"]').click();

      cy.get('[data-testid="loading-spinner"]', { timeout: 5000 })
        .should('be.visible');
    });
  });

  /**
   * Test Group 6: Performance
   */
  context('Performance', () => {
    it('should load page quickly', () => {
      const startTime = Date.now();

      cy.visit('/feature-page');

      cy.get('[data-testid="main-content"]').should('be.visible');

      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // 3 seconds
      });
    });
  });
});

/**
 * Custom Commands (add to cypress/support/commands.js)
 *
 * Cypress.Commands.add('login', (email, password) => {
 *   cy.visit('/login');
 *   cy.get('[data-testid="email-input"]').type(email);
 *   cy.get('[data-testid="password-input"]').type(password);
 *   cy.get('[data-testid="login-button"]').click();
 *   cy.url().should('include', '/dashboard');
 * });
 *
 * Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject) => {
 *   cy.wrap(subject).trigger('keydown', { keyCode: 9, which: 9 });
 * });
 */
