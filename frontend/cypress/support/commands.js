// ***********************************************
// Cypress Support Commands for Technician Management Testing
//
// Custom commands and utilities for comprehensive E2E testing
// of the technician management module.
// ***********************************************

import 'cypress-file-upload'
import 'cypress-axe'

// Authentication Commands
Cypress.Commands.add('login', (username = 'admin', password = 'password') => {
  cy.session([username, password], () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/login/',
      body: {
        username,
        password
      }
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('token')

      // Store token in localStorage for subsequent requests
      cy.window().then((win) => {
        win.localStorage.setItem('authToken', response.body.token)
      })

      // Set default authorization header
      cy.intercept('**', (req) => {
        req.headers['authorization'] = `Token ${response.body.token}`
      })
    })
  })
})

Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('authToken')
  })
  cy.visit('/login')
})

// Data Setup Commands
Cypress.Commands.add('createTestTechnician', (technicianData = {}) => {
  const defaultData = {
    firstName: 'Test',
    lastName: 'Technician',
    email: `test.tech.${Date.now()}@company.com`,
    phone: '555-TEST-123',
    employeeId: `TEST${Date.now()}`,
    status: 'active',
    jobTitle: 'Test Technician',
    department: 'Field Service',
    hireDate: '2024-01-01',
    hourlyRate: '30.00'
  }

  const techData = { ...defaultData, ...technicianData }

  return cy.request({
    method: 'POST',
    url: '/api/technicians/',
    body: techData,
    headers: {
      'Authorization': `Token ${Cypress.env('authToken')}`
    }
  }).then((response) => {
    expect(response.status).to.eq(201)
    return cy.wrap(response.body)
  })
})

Cypress.Commands.add('createTestCertification', (certificationData = {}) => {
  const defaultData = {
    name: `Test Certification ${Date.now()}`,
    issuingAuthority: 'Test Authority',
    validityPeriod: 24,
    description: 'Test certification for E2E testing',
    isRequired: false,
    skillLevel: 'basic'
  }

  const certData = { ...defaultData, ...certificationData }

  return cy.request({
    method: 'POST',
    url: '/api/certifications/',
    body: certData
  }).then((response) => {
    expect(response.status).to.eq(201)
    return cy.wrap(response.body)
  })
})

// Navigation Commands
Cypress.Commands.add('navigateToTechnicians', () => {
  cy.visit('/staff/technicians')
  cy.get('[data-testid="technician-list"]').should('be.visible')
})

Cypress.Commands.add('navigateToCertifications', () => {
  cy.visit('/staff/certifications')
  cy.get('[data-testid="certification-dashboard"]').should('be.visible')
})

Cypress.Commands.add('navigateToOrganization', () => {
  cy.visit('/staff/organization')
  cy.get('[data-testid="org-chart"]').should('be.visible')
})

Cypress.Commands.add('navigateToCoverageAreas', () => {
  cy.visit('/staff/coverage-areas')
  cy.get('[data-testid="coverage-map"]').should('be.visible')
})

// Form Interaction Commands
Cypress.Commands.add('fillTechnicianForm', (technicianData) => {
  if (technicianData.firstName) {
    cy.get('#firstName').clear().type(technicianData.firstName)
  }
  if (technicianData.lastName) {
    cy.get('#lastName').clear().type(technicianData.lastName)
  }
  if (technicianData.email) {
    cy.get('#email').clear().type(technicianData.email)
  }
  if (technicianData.phone) {
    cy.get('#phone').clear().type(technicianData.phone)
  }
  if (technicianData.employeeId) {
    cy.get('#employeeId').clear().type(technicianData.employeeId)
  }
  if (technicianData.jobTitle) {
    cy.get('#jobTitle').clear().type(technicianData.jobTitle)
  }
  if (technicianData.department) {
    cy.get('#department').clear().type(technicianData.department)
  }
  if (technicianData.hireDate) {
    cy.get('#hireDate').clear().type(technicianData.hireDate)
  }
  if (technicianData.hourlyRate) {
    cy.get('#hourlyRate').clear().type(technicianData.hourlyRate)
  }
  if (technicianData.status) {
    cy.get('#status').select(technicianData.status)
  }
})

Cypress.Commands.add('saveTechnicianForm', () => {
  cy.get('[data-testid="save-technician"]').click()
  cy.get('[data-testid="success-message"]', { timeout: 10000 })
    .should('be.visible')
    .and('contain', 'successfully')
})

// Search and Filter Commands
Cypress.Commands.add('searchTechnicians', (searchTerm) => {
  cy.get('[data-testid="technician-search"]').clear().type(searchTerm)
  cy.get('[data-testid="technician-card"]').should('contain', searchTerm)
})

Cypress.Commands.add('filterTechniciansByStatus', (status) => {
  cy.get('[data-testid="status-filter"]').select(status)
  cy.get('[data-testid="technician-card"]').each(($card) => {
    cy.wrap($card).should('contain', status)
  })
})

// Calendar Interaction Commands
Cypress.Commands.add('selectCalendarDate', (date) => {
  cy.get(`.fc-daygrid-day[data-date="${date}"]`).click()
})

Cypress.Commands.add('addAvailabilityEntry', (availabilityData) => {
  cy.get('#startTime').type(availabilityData.startTime)
  cy.get('#endTime').type(availabilityData.endTime)

  if (availabilityData.type) {
    cy.get('#availabilityType').select(availabilityData.type)
  }

  if (availabilityData.notes) {
    cy.get('#notes').type(availabilityData.notes)
  }

  if (availabilityData.isRecurring) {
    cy.get('#isRecurring').check()
    if (availabilityData.recurringPattern) {
      cy.get('#recurringPattern').select(availabilityData.recurringPattern)
    }
  }

  cy.get('[data-testid="save-availability"]').click()
})

// Accessibility Testing
Cypress.Commands.add('testAccessibility', (context = null, options = {}) => {
  cy.injectAxe()

  const defaultOptions = {
    tags: ['wcag2a', 'wcag2aa'],
    includedImpacts: ['minor', 'moderate', 'serious', 'critical']
  }

  const axeOptions = { ...defaultOptions, ...options }

  if (context) {
    cy.checkA11y(context, axeOptions)
  } else {
    cy.checkA11y(null, axeOptions)
  }
})

// API Mocking Commands
Cypress.Commands.add('mockTechniciansAPI', (fixture = 'technicians') => {
  cy.intercept('GET', '/api/technicians/', { fixture })
  cy.intercept('POST', '/api/technicians/', { statusCode: 201, body: { id: 999 } })
  cy.intercept('PUT', '/api/technicians/*', { statusCode: 200 })
  cy.intercept('DELETE', '/api/technicians/*', { statusCode: 204 })
})

Cypress.Commands.add('mockCertificationsAPI', (fixture = 'certifications') => {
  cy.intercept('GET', '/api/certifications/', { fixture })
  cy.intercept('GET', '/api/certifications/dashboard/', { fixture })
})

// Cleanup Commands
Cypress.Commands.add('cleanupTestData', () => {
  // Clean up test technicians
  cy.request({
    method: 'GET',
    url: '/api/technicians/',
    qs: { search: 'test.tech.' },
    failOnStatusCode: false
  }).then((response) => {
    if (response.body && response.body.results) {
      response.body.results.forEach((tech) => {
        cy.request({
          method: 'DELETE',
          url: `/api/technicians/${tech.id}/`,
          failOnStatusCode: false
        })
      })
    }
  })
})

// Original CRM Commands (preserved for compatibility)
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

Cypress.Commands.add('waitForTableLoad', () => {
  cy.get('[data-testid="data-table"]').should('be.visible');
  cy.get('[data-testid="loading"]').should('not.exist');
});

Cypress.Commands.add('navigateToModule', (moduleName) => {
  cy.get(`[data-testid="nav-${moduleName.toLowerCase()}"]`).click();
  cy.url().should('include', `/${moduleName.toLowerCase()}`);
});

Cypress.Commands.add('testPageAccessibility', () => {
  cy.checkA11y(null, {
    rules: {
      'color-contrast': { enabled: false },
      'landmark-one-main': { enabled: false },
    },
  });
});

Cypress.Commands.add('measurePageLoad', () => {
  cy.window().then((win) => {
    const loadTime = win.performance.timing.loadEventEnd - win.performance.timing.navigationStart;
    cy.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).to.be.lessThan(3000); // Assert page loads within 3 seconds
  });
});
