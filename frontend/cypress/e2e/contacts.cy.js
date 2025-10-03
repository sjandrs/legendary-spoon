describe('Contacts Management', () => {
  beforeEach(() => {
    // Log in before each test
    cy.login();
    cy.visit('/contacts');
    cy.waitForTableLoad();
  });

  afterEach(() => {
    // Clean up test data
    cy.cleanupTestData();
  });

  it('should display contacts list page', () => {
    cy.get('[data-testid="contacts-page"]').should('be.visible');
    cy.get('[data-testid="page-title"]').should('contain', 'Contacts');
    cy.get('[data-testid="add-contact-button"]').should('be.visible');
    cy.get('[data-testid="search-input"]').should('be.visible');
  });

  it('should create a new contact', () => {
    const testContact = {
      name: 'Cypress Test Contact',
      email: 'cypress@example.com',
      phone: '555-0199',
      company: 'Cypress Testing Inc',
    };

    // Click add contact button
    cy.get('[data-testid="add-contact-button"]').click();

    // Should open contact form
    cy.get('[data-testid="contact-form"]').should('be.visible');

    // Fill out form
    cy.fillContactForm(testContact);

    // Submit form
    cy.get('[data-testid="save-contact-button"]').click();

    // Should show success message
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.get('[data-testid="success-message"]').should('contain', 'Contact created successfully');

    // Should redirect to contacts list
    cy.url().should('include', '/contacts');

    // New contact should appear in list
    cy.get('[data-testid="contacts-table"]').should('contain', testContact.name);
    cy.get('[data-testid="contacts-table"]').should('contain', testContact.email);
  });

  it('should validate required fields', () => {
    cy.get('[data-testid="add-contact-button"]').click();

    // Try to submit empty form
    cy.get('[data-testid="save-contact-button"]').click();

    // Should show validation errors
    cy.get('[data-testid="name-error"]').should('contain', 'Name is required');
    cy.get('[data-testid="email-error"]').should('contain', 'Email is required');
  });

  it('should validate email format', () => {
    cy.get('[data-testid="add-contact-button"]').click();

    // Enter invalid email
    cy.get('[data-testid="contact-name-input"]').type('Test Contact');
    cy.get('[data-testid="contact-email-input"]').type('invalid-email');
    cy.get('[data-testid="save-contact-button"]').click();

    // Should show email validation error
    cy.get('[data-testid="email-error"]').should('contain', 'Please enter a valid email address');
  });

  it('should search contacts', () => {
    // Create a test contact first
    cy.createContact({
      name: 'Searchable Contact',
      email: 'searchable@example.com',
    });

    // Search for the contact
    cy.get('[data-testid="search-input"]').type('Searchable');

    // Should filter results
    cy.get('[data-testid="contacts-table"]').should('contain', 'Searchable Contact');

    // Clear search
    cy.get('[data-testid="search-input"]').clear();

    // Should show all contacts again
    cy.waitForTableLoad();
  });

  it('should edit existing contact', () => {
    // Create a test contact via API
    cy.apiCreateContact({
      name: 'Edit Test Contact',
      email: 'edit@example.com',
    }).then((contact) => {
      // Refresh page to see new contact
      cy.reload();
      cy.waitForTableLoad();

      // Click edit button for the contact
      cy.get(`[data-testid="edit-contact-${contact.id}"]`).click();

      // Should open edit form
      cy.get('[data-testid="contact-form"]').should('be.visible');

      // Update contact information
      cy.get('[data-testid="contact-name-input"]').clear().type('Updated Contact Name');
      cy.get('[data-testid="contact-phone-input"]').clear().type('555-9999');

      // Save changes
      cy.get('[data-testid="save-contact-button"]').click();

      // Should show success message
      cy.get('[data-testid="success-message"]').should('contain', 'Contact updated successfully');

      // Should show updated information
      cy.get('[data-testid="contacts-table"]').should('contain', 'Updated Contact Name');
      cy.get('[data-testid="contacts-table"]').should('contain', '555-9999');
    });
  });

  it('should delete contact', () => {
    // Create a test contact via API
    cy.apiCreateContact({
      name: 'Delete Test Contact',
      email: 'delete@example.com',
    }).then((contact) => {
      // Refresh page to see new contact
      cy.reload();
      cy.waitForTableLoad();

      // Click delete button
      cy.get(`[data-testid="delete-contact-${contact.id}"]`).click();

      // Should show confirmation dialog
      cy.get('[data-testid="delete-confirmation"]').should('be.visible');
      cy.get('[data-testid="confirm-delete-button"]').click();

      // Should show success message
      cy.get('[data-testid="success-message"]').should('contain', 'Contact deleted successfully');

      // Contact should be removed from list
      cy.get('[data-testid="contacts-table"]').should('not.contain', 'Delete Test Contact');
    });
  });

  it('should handle pagination', () => {
    cy.get('[data-testid="contacts-table"]').should('be.visible');

    // Check if pagination controls exist (only if there are multiple pages)
    cy.get('body').then($body => {
      if ($body.find('[data-testid="pagination"]').length > 0) {
        // Test pagination
        cy.get('[data-testid="next-page"]').click();
        cy.waitForTableLoad();

        // Should update URL with page parameter
        cy.url().should('include', 'page=2');

        // Should show different results
        cy.get('[data-testid="page-info"]').should('contain', 'Page 2');

        // Go back to previous page
        cy.get('[data-testid="prev-page"]').click();
        cy.waitForTableLoad();
        cy.url().should('include', 'page=1');
      }
    });
  });

  it('should view contact details', () => {
    // Create a test contact via API
    cy.apiCreateContact({
      name: 'Detail View Contact',
      email: 'detail@example.com',
      phone: '555-0123',
      company: 'Detail Test Company',
    }).then((contact) => {
      // Refresh page to see new contact
      cy.reload();
      cy.waitForTableLoad();

      // Click on contact name to view details
      cy.get(`[data-testid="contact-name-${contact.id}"]`).click();

      // Should navigate to contact detail page
      cy.url().should('include', `/contacts/${contact.id}`);

      // Should show contact details
      cy.get('[data-testid="contact-detail"]').should('be.visible');
      cy.get('[data-testid="contact-name"]').should('contain', 'Detail View Contact');
      cy.get('[data-testid="contact-email"]').should('contain', 'detail@example.com');
      cy.get('[data-testid="contact-phone"]').should('contain', '555-0123');
      cy.get('[data-testid="contact-company"]').should('contain', 'Detail Test Company');
    });
  });

  it('should be accessible', () => {
    cy.checkAccessibility();

    // Check table accessibility
    cy.get('[data-testid="contacts-table"]').should('have.attr', 'role');
    cy.get('[data-testid="add-contact-button"]').should('have.attr', 'aria-label');
    cy.get('[data-testid="search-input"]').should('have.attr', 'aria-label');
  });

  it('should handle API errors gracefully', () => {
    // Intercept API call and return error
    cy.intercept('GET', '**/api/contacts/**', {
      statusCode: 500,
      body: { message: 'Server error' },
    }).as('getContactsError');

    cy.reload();

    // Should show error message
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', 'Error loading contacts');
  });

  it('should maintain sort order', () => {
    // Click on name column header to sort
    cy.get('[data-testid="sort-name"]').click();

    // Should update URL with sort parameter
    cy.url().should('include', 'ordering=name');

    // Click again to reverse sort
    cy.get('[data-testid="sort-name"]').click();
    cy.url().should('include', 'ordering=-name');
  });
});
