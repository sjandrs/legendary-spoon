// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// API Testing Commands
Cypress.Commands.add('apiLogin', (username = 'testuser', password = 'password') => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login/`,
    body: {
      username,
      password,
    },
  }).then((response) => {
    expect(response.status).to.eq(200);
    window.localStorage.setItem('authToken', response.body.token);
    return response.body;
  });
});

Cypress.Commands.add('apiLogout', () => {
  const token = window.localStorage.getItem('authToken');
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/logout/`,
    headers: {
      Authorization: `Token ${token}`,
    },
  }).then(() => {
    window.localStorage.removeItem('authToken');
  });
});

Cypress.Commands.add('apiCreateContact', (contactData = {}) => {
  const token = window.localStorage.getItem('authToken');
  const defaultContact = {
    name: 'API Test Contact',
    email: 'apitest@example.com',
    phone: '555-0123',
    company: 'API Test Company',
  };

  const contact = { ...defaultContact, ...contactData };

  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/contacts/`,
    headers: {
      Authorization: `Token ${token}`,
    },
    body: contact,
  }).then((response) => {
    expect(response.status).to.eq(201);
    return response.body;
  });
});

Cypress.Commands.add('apiCreateDeal', (dealData = {}) => {
  const token = window.localStorage.getItem('authToken');
  const defaultDeal = {
    title: 'API Test Deal',
    amount: 5000.00,
    stage: 'qualified',
    probability: 75,
    expected_close_date: '2025-12-31',
  };

  const deal = { ...defaultDeal, ...dealData };

  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/deals/`,
    headers: {
      Authorization: `Token ${token}`,
    },
    body: deal,
  }).then((response) => {
    expect(response.status).to.eq(201);
    return response.body;
  });
});

// Data cleanup commands
Cypress.Commands.add('cleanupTestData', () => {
  const token = window.localStorage.getItem('authToken');

  // Clean up test contacts
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/contacts/`,
    headers: {
      Authorization: `Token ${token}`,
    },
  }).then((response) => {
    response.body.results.forEach((contact) => {
      if (contact.email.includes('test') || contact.email.includes('cypress')) {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.env('apiUrl')}/contacts/${contact.id}/`,
          headers: {
            Authorization: `Token ${token}`,
          },
          failOnStatusCode: false,
        });
      }
    });
  });
});

// Form interaction commands
Cypress.Commands.add('fillContactForm', (contactData) => {
  if (contactData.name) {
    cy.get('[data-testid="contact-name-input"]').clear().type(contactData.name);
  }
  if (contactData.email) {
    cy.get('[data-testid="contact-email-input"]').clear().type(contactData.email);
  }
  if (contactData.phone) {
    cy.get('[data-testid="contact-phone-input"]').clear().type(contactData.phone);
  }
  if (contactData.company) {
    cy.get('[data-testid="contact-company-input"]').clear().type(contactData.company);
  }
});

Cypress.Commands.add('fillDealForm', (dealData) => {
  if (dealData.title) {
    cy.get('[data-testid="deal-title-input"]').clear().type(dealData.title);
  }
  if (dealData.amount) {
    cy.get('[data-testid="deal-amount-input"]').clear().type(dealData.amount.toString());
  }
  if (dealData.stage) {
    cy.get('[data-testid="deal-stage-select"]').select(dealData.stage);
  }
  if (dealData.probability) {
    cy.get('[data-testid="deal-probability-input"]').clear().type(dealData.probability.toString());
  }
});

// Wait for specific elements or conditions
Cypress.Commands.add('waitForTableLoad', () => {
  cy.get('[data-testid="data-table"]').should('be.visible');
  cy.get('[data-testid="loading"]').should('not.exist');
});

Cypress.Commands.add('waitForFormSubmit', () => {
  cy.get('[data-testid="submit-button"]').should('not.be.disabled');
  cy.get('[data-testid="form-loading"]').should('not.exist');
});

// Navigation helpers
Cypress.Commands.add('navigateToModule', (moduleName) => {
  cy.get(`[data-testid="nav-${moduleName.toLowerCase()}"]`).click();
  cy.url().should('include', `/${moduleName.toLowerCase()}`);
});

// Accessibility testing shortcuts
Cypress.Commands.add('testPageAccessibility', () => {
  cy.checkA11y(null, {
    rules: {
      'color-contrast': { enabled: false },
      'landmark-one-main': { enabled: false },
    },
  });
});

// Performance testing
Cypress.Commands.add('measurePageLoad', () => {
  cy.window().then((win) => {
    const loadTime = win.performance.timing.loadEventEnd - win.performance.timing.navigationStart;
    cy.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).to.be.lessThan(3000); // Assert page loads within 3 seconds
  });
});
