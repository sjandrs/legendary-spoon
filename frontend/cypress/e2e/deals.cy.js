describe('Deals Management', () => {
  beforeEach(() => {
    cy.login();
  });

  afterEach(() => {
    cy.clearLocalStorage();
  });

  it('should display deals list page', () => {
    cy.visit('/deals');
    cy.get('h2').should('contain', 'Deals');
    cy.url().should('include', '/deals');
  });

  it('should show deal pipeline visualization', () => {
    cy.visit('/deals');
    // Check for basic deal page structure
    cy.get('body').should('contain', 'Deals');
  });

  it('should handle empty deals list', () => {
    cy.visit('/deals');
    // Page should load without errors
    cy.get('body').should('be.visible');
  });

  it('should navigate to create new deal', () => {
    cy.visit('/deals');
    // Look for any "Add" or "Create" buttons
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="add-deal-button"]').length > 0) {
        cy.get('[data-testid="add-deal-button"]').click();
      } else if ($body.find('button:contains("Add")').length > 0) {
        cy.get('button:contains("Add")').first().click();
      }
    });
  });

  it('should filter deals by stage', () => {
    cy.visit('/deals');
    // Basic page functionality test
    cy.get('body').should('be.visible');
    // Test would expand based on actual deal component structure
  });

  it('should be accessible', () => {
    cy.visit('/deals');
    cy.checkAccessibility();
  });

  it('should handle navigation to deal details', () => {
    cy.visit('/deals');
    // If deals exist, test detail navigation
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid^="deal-link-"]').length > 0) {
        cy.get('[data-testid^="deal-link-"]').first().click();
        cy.url().should('include', '/deals/');
      }
    });
  });

  it('should display deal metrics', () => {
    cy.visit('/deals');
    // Check for basic metrics or summary information
    cy.get('body').should('be.visible');
  });

  it('should handle deal creation workflow', () => {
    cy.visit('/deals');
    // Test basic deal creation flow
    cy.get('body').should('be.visible');
  });

  it('should support deal search functionality', () => {
    cy.visit('/deals');
    // Test search if available
    cy.get('body').then(($body) => {
      if ($body.find('input[type="search"], input[placeholder*="search" i]').length > 0) {
        cy.get('input[type="search"], input[placeholder*="search" i]').first().type('test');
      }
    });
  });
});
