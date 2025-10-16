/// <reference types="cypress" />

describe('Work Orders i18n + a11y', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe();
  });

  it('switches language via UI and updates dir for Arabic', () => {
    // Navigate to a route where the utility nav is present
    cy.visit('/orders');

    // Language selector should exist
    cy.findByRole('combobox', { name: /select language/i }).select('ar');
    cy.get('html').should('have.attr', 'dir', 'rtl');

    // Switch back to English
    cy.findByRole('combobox', { name: /select language/i }).select('en');
    cy.get('html').should('have.attr', 'dir', 'ltr');
  });

  it('loads Work Orders table and passes basic a11y in multiple locales', () => {
    const locales = ['en', 'es', 'fr', 'ar'];

    locales.forEach((lng) => {
      cy.window().then(win => win.localStorage.setItem('i18nextLng', lng));
      cy.visit('/orders');

      // Table should render
      cy.findByRole('table', { name: /work orders|__string_not_translated__/i }).should('exist');

      // Basic axe check (serious+)
      cy.checkA11y(null, { includedImpacts: ['critical', 'serious'] });
    });
  });
});
