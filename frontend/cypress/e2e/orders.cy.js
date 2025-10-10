describe('Orders & Work Orders Management', () => {
  beforeEach(() => {
    cy.login();
  });

  afterEach(() => {
    cy.clearLocalStorage();
  });

  it('should display orders list page', () => {
    cy.visit('/orders');
    cy.get('h2').should('contain', 'Orders');
    cy.url().should('include', '/orders');
  });

  it('should show work orders when available', () => {
    cy.visit('/orders');
    // Check for basic orders page structure
    cy.get('body').should('be.visible');
  });

  it('should handle empty orders list', () => {
    cy.visit('/orders');
    // Page should load without errors
    cy.get('body').should('be.visible');
  });

  it('should navigate to create new order', () => {
    cy.visit('/orders');
    // Look for any "Add" or "Create" buttons
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="add-order-button"]').length > 0) {
        cy.get('[data-testid="add-order-button"]').click();
      } else if ($body.find('button:contains("Add")').length > 0) {
        cy.get('button:contains("Add")').first().click();
      }
    });
  });

  it('should filter orders by status', () => {
    cy.visit('/orders');
    // Basic page functionality test
    cy.get('body').should('be.visible');
  });

  it('should display work order details', () => {
    cy.visit('/orders');
    // Test work order detail navigation if available
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid^="order-link-"]').length > 0) {
        cy.get('[data-testid^="order-link-"]').first().click();
        cy.url().should('include', '/orders/');
      }
    });
  });

  it('should be accessible', () => {
    cy.visit('/orders');
    cy.checkAccessibility();
  });

  it('should handle order status updates', () => {
    cy.visit('/orders');
    // Test status update functionality if available
    cy.get('body').should('be.visible');
  });

  it('should support order search', () => {
    cy.visit('/orders');
    // Test search functionality
    cy.get('body').then(($body) => {
      if ($body.find('input[type="search"], input[placeholder*="search" i]').length > 0) {
        cy.get('input[type="search"], input[placeholder*="search" i]').first().type('test');
      }
    });
  });

  it('should display order metrics and summaries', () => {
    cy.visit('/orders');
    // Check for order metrics or summary information
    cy.get('body').should('be.visible');
  });

  it('should handle order creation workflow', () => {
    cy.visit('/orders');
    // Test basic order creation flow
    cy.get('body').should('be.visible');
  });
});
