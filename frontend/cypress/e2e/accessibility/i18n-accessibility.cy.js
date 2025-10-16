/// <reference types="cypress" />

// Multi-locale accessibility smoke tests including RTL

const locales = [
  { code: 'en', dir: 'ltr' },
  { code: 'es', dir: 'ltr' },
  { code: 'fr', dir: 'ltr' },
  { code: 'ar', dir: 'rtl' },
];

describe('Internationalization Accessibility', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe();
  });

  locales.forEach(({ code, dir }) => {
    it(`has no critical accessibility issues on Dashboard in ${code.toUpperCase()} (${dir})`, () => {
      // Set language via localStorage to simulate persisted choice
      cy.window().then(win => {
        win.localStorage.setItem('i18nextLng', code);
      });
      cy.reload();

      // Check direction
      cy.get('html').should('have.attr', 'dir', dir);

      // Axe core check (limit to serious/critical to reduce flakiness)
      cy.checkA11y(null, { includedImpacts: ['critical', 'serious'] });
    });
  });
});
