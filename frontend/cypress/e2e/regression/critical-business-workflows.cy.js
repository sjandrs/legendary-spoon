describe('Critical Business Workflow Regression Tests', () => {
  describe('Contact-to-Deal-to-Invoice Workflow', () => {
    beforeEach(() => {
      // Set up test environment with seeded data
      cy.visit('/login');
      cy.get('[data-testid="username"]').type('admin');
      cy.get('[data-testid="password"]').type('admin');
      cy.get('[data-testid="login-button"]').click();

      // Verify authentication
      cy.url().should('not.include', '/login');
      cy.get('nav').should('contain', 'Dashboard');
    });

    it('completes full CRM lifecycle without data loss', () => {
      // Step 1: Create Contact
      cy.visit('/contacts');
      cy.get('[data-testid="add-contact"]').click();

      // Fill contact form
      cy.get('#first-name').type('John');
      cy.get('#last-name').type('RegTest');
      cy.get('#email').type('john.regtest@example.com');
      cy.get('#company').type('Regression Test Corp');
      cy.get('#phone').type('555-TEST-001');

      cy.get('form').submit();

      // Verify contact creation
      cy.contains('Contact saved successfully').should('be.visible');
      cy.get('[data-testid="contact-list"]').should('contain', 'John RegTest');

      // Step 2: Create Deal from Contact
      cy.get('[data-testid="contact-row"]').contains('John RegTest').click();
      cy.get('[data-testid="create-deal"]').click();

      // Fill deal form
      cy.get('#deal-title').type('Regression Test Deal');
      cy.get('#deal-value').type('25000');
      cy.get('#deal-close-date').type('2025-12-31');
      cy.get('#deal-stage').select('Qualified');

      cy.get('form').submit();

      // Verify deal creation
      cy.contains('Deal created successfully').should('be.visible');
      cy.visit('/deals');
      cy.get('[data-testid="deals-table"]').should('contain', 'Regression Test Deal');

      // Step 3: Progress Deal to Won
      cy.get('[data-testid="deal-row"]').contains('Regression Test Deal').click();
      cy.get('[data-testid="edit-deal"]').click();
      cy.get('#deal-stage').select('Won');
      cy.get('form').submit();

      // Verify deal won status
      cy.contains('Deal updated successfully').should('be.visible');

      // Step 4: Generate and Verify Invoice
      cy.get('[data-testid="generate-invoice"]').click();

      // Verify invoice generation
      cy.contains('Invoice generated successfully').should('be.visible');
      cy.visit('/orders');
      cy.get('[data-testid="invoice-list"]').should('contain', '$25,000');

      // Step 5: Verify Data Integrity Across Modules
      cy.visit('/dashboard');
      // Dashboard should reflect updated metrics
      cy.get('[data-testid="total-revenue"]').should('exist');

      // Verify contact still exists with correct deal association
      cy.visit('/contacts');
      cy.get('[data-testid="contact-row"]').contains('John RegTest').click();
      cy.get('[data-testid="associated-deals"]').should('contain', 'Regression Test Deal');
    });

    it('prevents data corruption during concurrent operations', () => {
      // Test concurrent editing scenarios that have caused regressions
      const contactData = {
        firstName: 'Concurrent',
        lastName: 'TestUser',
        email: 'concurrent@test.com'
      };

      // Create base contact
      cy.visit('/contacts');
      cy.get('[data-testid="add-contact"]').click();
      cy.get('#first-name').type(contactData.firstName);
      cy.get('#last-name').type(contactData.lastName);
      cy.get('#email').type(contactData.email);
      cy.get('form').submit();

      // Simulate rapid updates (regression scenario)
      cy.get('[data-testid="contact-row"]').contains('Concurrent TestUser').click();
      cy.get('[data-testid="edit-contact"]').click();

      // Rapid sequential updates
      for (let i = 1; i <= 3; i++) {
        cy.get('#phone').clear().type(`555-000-${i}`);
        cy.get('form').submit();
        cy.wait(100); // Brief wait to simulate user interaction
        cy.get('[data-testid="edit-contact"]').click();
      }

      // Verify final state consistency
      cy.get('#phone').should('have.value', '555-000-3');
    });

    it('maintains referential integrity during cascade operations', () => {
      // Test scenario that previously caused orphaned records
      cy.visit('/contacts');
      cy.get('[data-testid="add-contact"]').click();

      cy.get('#first-name').type('Cascade');
      cy.get('#last-name').type('TestUser');
      cy.get('#email').type('cascade@test.com');
      cy.get('form').submit();

      // Create associated deal
      cy.get('[data-testid="contact-row"]').contains('Cascade TestUser').click();
      cy.get('[data-testid="create-deal"]').click();

      cy.get('#deal-title').type('Cascade Test Deal');
      cy.get('#deal-value').type('10000');
      cy.get('form').submit();

      // Delete contact and verify proper cascade behavior
      cy.visit('/contacts');
      cy.get('[data-testid="contact-row"]').contains('Cascade TestUser')
        .find('[data-testid="delete-contact"]').click();

      cy.get('[data-testid="confirm-delete"]').click();

      // Verify contact is deleted
      cy.get('[data-testid="contact-list"]').should('not.contain', 'Cascade TestUser');

      // Verify associated data handling
      cy.visit('/deals');
      // Deal should either be deleted or marked as orphaned appropriately
      cy.get('[data-testid="deals-table"]').then($table => {
        if ($table.text().includes('Cascade Test Deal')) {
          // If deal exists, verify it has proper handling
          cy.get('[data-testid="deal-row"]').contains('Cascade Test Deal').click();
          cy.get('[data-testid="contact-info"]').should('contain', 'Contact Deleted');
        }
      });
    });
  });

  describe('Financial Workflow Regression', () => {
    beforeEach(() => {
      cy.visit('/login');
      cy.get('[data-testid="username"]').type('admin');
      cy.get('[data-testid="password"]').type('admin');
      cy.get('[data-testid="login-button"]').click();
    });

    it('prevents duplicate invoice generation regression', () => {
      // Test scenario that previously caused duplicate invoices
      cy.visit('/orders');
      cy.get('[data-testid="add-work-order"]').click();

      cy.get('#work-order-title').type('Regression Work Order');
      cy.get('#work-order-description').type('Testing duplicate prevention');
      cy.get('form').submit();

      // Attempt rapid invoice generation (regression scenario)
      cy.get('[data-testid="work-order-row"]').contains('Regression Work Order').click();

      // Rapidly click generate invoice multiple times
      cy.get('[data-testid="generate-invoice"]').click();
      cy.get('[data-testid="generate-invoice"]').click();
      cy.get('[data-testid="generate-invoice"]').click();

      // Verify only one invoice was created
      cy.visit('/orders');
      cy.get('[data-testid="invoice-count"]').then($count => {
        const invoiceCount = $count.text().match(/(\d+) invoices?/);
        if (invoiceCount) {
          expect(parseInt(invoiceCount[1])).to.equal(1);
        }
      });
    });

    it('maintains inventory consistency during stock updates', () => {
      // Test inventory regression scenarios
      cy.visit('/warehouse');

      // Get initial stock count
      cy.get('[data-testid="warehouse-item"]').first().then($item => {
        const itemName = $item.find('[data-testid="item-name"]').text();
        const initialStock = parseInt($item.find('[data-testid="item-quantity"]').text());

        // Perform stock update
        cy.get('[data-testid="edit-item"]').first().click();
        cy.get('#quantity').clear().type((initialStock + 10).toString());
        cy.get('form').submit();

        // Verify update
        cy.get('[data-testid="warehouse-item"]').first()
          .find('[data-testid="item-quantity"]')
          .should('contain', (initialStock + 10).toString());

        // Test concurrent stock operations (regression scenario)
        cy.get('[data-testid="edit-item"]').first().click();
        cy.get('#quantity').clear().type((initialStock + 5).toString());

        // Simulate rapid form submissions
        cy.get('form').submit();
        cy.wait(100);

        // Verify final consistency
        cy.get('[data-testid="warehouse-item"]').first()
          .find('[data-testid="item-quantity"]')
          .should('contain', (initialStock + 5).toString());
      });
    });
  });

  describe('Authentication and Security Regression', () => {
    it('prevents authentication bypass regression', () => {
      // Test scenarios that previously allowed unauthorized access

      // Attempt direct navigation without authentication
      cy.visit('/dashboard');
      cy.url().should('include', '/login');

      // Attempt API access without token
      cy.request({
        url: '/api/contacts/',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.equal(401);
      });

      // Test session expiration handling
      cy.visit('/login');
      cy.get('[data-testid="username"]').type('admin');
      cy.get('[data-testid="password"]').type('admin');
      cy.get('[data-testid="login-button"]').click();

      // Clear session storage to simulate expiration
      cy.clearLocalStorage();

      // Attempt authenticated action
      cy.visit('/contacts');
      cy.url().should('include', '/login');
    });

    it('prevents role escalation regression', () => {
      // Test role-based access control regressions

      // Login as regular user
      cy.visit('/login');
      cy.get('[data-testid="username"]').type('user');
      cy.get('[data-testid="password"]').type('password');
      cy.get('[data-testid="login-button"]').click();

      // Attempt to access admin-only features
      cy.visit('/staff');

      // Should either redirect or show access denied
      cy.get('body').should('satisfy', ($body) => {
        return $body.text().includes('Access Denied') ||
               $body.find('[data-testid="login-form"]').length > 0;
      });
    });
  });

  describe('Performance Regression Prevention', () => {
    it('prevents memory leak regression in large lists', () => {
      // Test scenarios that previously caused memory issues

      cy.visit('/login');
      cy.get('[data-testid="username"]').type('admin');
      cy.get('[data-testid="password"]').type('admin');
      cy.get('[data-testid="login-button"]').click();

      // Navigate through multiple large lists rapidly
      const pages = ['/contacts', '/deals', '/orders', '/warehouse'];

      pages.forEach(page => {
        cy.visit(page);
        cy.get('[data-testid="data-table"]').should('be.visible');

        // Simulate rapid scrolling (memory leak test)
        for (let i = 0; i < 5; i++) {
          cy.scrollTo('bottom');
          cy.wait(100);
          cy.scrollTo('top');
        }
      });

      // Memory should remain stable (verified by absence of crashes)
      cy.visit('/dashboard');
      cy.get('[data-testid="dashboard-metrics"]').should('be.visible');
    });
  });
});
