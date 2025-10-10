// Import commands.js using ES2015 syntax:
import './commands';
import 'cypress-axe';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global test setup
beforeEach(() => {
  // Inject axe for accessibility testing
  cy.injectAxe();

  // Set viewport size
  cy.viewport(1280, 720);
});

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  // on certain expected errors
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  return true;
});

// Custom commands for common testing patterns
Cypress.Commands.add('login', (username = 'admin', password = 'admin') => {
  cy.visit('/login');
  cy.get('[data-testid="username-input"]').type(username);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  // Wait for navigation away from login page
  cy.url().should('not.include', '/login');
  // Wait for dashboard to load
  cy.get('[data-testid="dashboard-page"]', { timeout: 10000 }).should('be.visible');
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/login');
});

Cypress.Commands.add('checkAccessibility', () => {
  cy.checkA11y(null, {
    rules: {
      'color-contrast': { enabled: false }, // Disable if you have custom themes
    },
  });
});

Cypress.Commands.add('waitForLoad', () => {
  cy.get('[data-testid="loading"]').should('not.exist');
});

Cypress.Commands.add('createContact', (contactData = {}) => {
  const defaultContact = {
    name: 'Test Contact',
    email: 'test@example.com',
    phone: '555-0123',
    company: 'Test Company',
  };

  const contact = { ...defaultContact, ...contactData };

  cy.visit('/contacts');
  cy.get('[data-testid="add-contact-button"]').click();
  cy.get('[data-testid="contact-name-input"]').type(contact.name);
  cy.get('[data-testid="contact-email-input"]').type(contact.email);
  cy.get('[data-testid="contact-phone-input"]').type(contact.phone);
  cy.get('[data-testid="contact-company-input"]').type(contact.company);
  cy.get('[data-testid="save-contact-button"]').click();
  cy.get('[data-testid="success-message"]').should('be.visible');
});

// Add support for file uploads
Cypress.Commands.add('uploadFile', (selector, fileName, fileType = 'text/plain') => {
  cy.get(selector).selectFile({
    contents: Cypress.Buffer.from('file contents'),
    fileName,
    mimeType: fileType,
  });
});
