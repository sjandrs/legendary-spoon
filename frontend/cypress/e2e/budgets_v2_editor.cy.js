/* eslint-env cypress */
/* global cy, Cypress */
// E2E happy path for Budgets V2 editor: visual validation, normalize, save, copy last year

describe('Budgets V2 Editor', () => {
  beforeEach(() => {
    // Assume user is logged in via token for simplicity
    window.localStorage.setItem('authToken', 'test-token');

    // Intercept initial budgets and cost centers
    cy.intercept('GET', '**/api/budgets-v2/**', {
      statusCode: 200,
      body: [
        {
          id: 1,
          name: 'Marketing FY2025',
          year: 2025,
          cost_center: 10,
          distributions: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, percent: 8.33 }))
        }
      ],
    }).as('getBudgets');

    cy.intercept('GET', '**/api/cost-centers/**', {
      statusCode: 200,
      body: [
        { id: 10, name: 'Marketing' },
      ],
    }).as('getCostCenters');

    // Intercept update call
    cy.intercept('PUT', '**/api/budgets-v2/1/**', (req) => {
      expect(req.body).to.have.property('distributions');
      expect(req.body.distributions).to.have.length(12);
      const total = req.body.distributions.reduce((s, r) => s + Number(r.percent || 0), 0);
      expect(Number(total.toFixed(2))).to.eq(100.00);
      req.reply({
        statusCode: 200,
        body: {
          id: 1,
          name: 'Marketing FY2025',
          year: 2025,
          cost_center: 10,
          distributions: req.body.distributions,
        },
      });
    }).as('updateBudget');

    // Visit page
    cy.visit('/budgets-v2');
    cy.wait(['@getBudgets', '@getCostCenters']);
    // Initial accessibility check
    cy.checkAccessibility();
  });

  it('shows red total when invalid, normalizes to 100%, and saves', () => {
  // Change month 1 to 20% to make total > 100
    cy.get('[data-testid="percent-input-1"]').clear().type('20');
    cy.get('[data-testid="total-display"]').should('contain.text', 'Total:');
    cy.get('[data-testid="total-display"]').should('have.css', 'color').and('match', /rgb\(255, 0, 0\)|red/);
  // A11y check in error state
  cy.checkAccessibility();

    // Save should be disabled when total != 100
    cy.get('[data-testid="save-button"]').should('be.disabled');

    // Normalize to 100
  cy.get('[data-testid="normalize-button"]').click();
    cy.get('[data-testid="total-display"]').should('not.have.css', 'color', 'rgb(255, 0, 0)');
    cy.get('[data-testid="save-button"]').should('not.be.disabled');
  // A11y check in valid state
  cy.checkAccessibility();

    // Save
    cy.get('[data-testid="save-button"]').click();
    cy.wait('@updateBudget');
  });

  it('copies last year distributions when available', () => {
    // Intercept budgets GET again to include prior year
    cy.intercept('GET', '**/api/budgets-v2/**', {
      statusCode: 200,
      body: [
        {
          id: 1,
          name: 'Marketing FY2025',
          year: 2025,
          cost_center: 10,
          distributions: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, percent: 8.33 }))
        },
        {
          id: 2,
          name: 'Marketing FY2024',
          year: 2024,
          cost_center: 10,
          distributions: [
            { month: 1, percent: 10 },
            { month: 2, percent: 10 },
            { month: 3, percent: 10 },
            { month: 4, percent: 10 },
            { month: 5, percent: 10 },
            { month: 6, percent: 10 },
            { month: 7, percent: 10 },
            { month: 8, percent: 10 },
            { month: 9, percent: 5 },
            { month: 10, percent: 5 },
            { month: 11, percent: 5 },
            { month: 12, percent: 5 },
          ],
        },
      ],
    }).as('getBudgetsWithPrev');

    // Click copy last year
    cy.get('[data-testid="copy-last-year-button"]').click();
    cy.wait('@getBudgetsWithPrev');

    // Spot check that month 1 updated to 10
    cy.get('[data-testid="percent-input-1"]').should('have.value', '10');
  });
});
