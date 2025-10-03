describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear any existing auth state
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should display login page when not authenticated', () => {
    cy.visit('/');
    cy.get('[data-testid="login-page"]').should('be.visible');
    cy.get('[data-testid="username-input"]').should('be.visible');
    cy.get('[data-testid="password-input"]').should('be.visible');
    cy.get('[data-testid="login-button"]').should('be.visible');
  });

  it('should successfully log in with valid credentials', () => {
    cy.visit('/login');

    // Fill in login form
    cy.get('[data-testid="username-input"]').type('admin');
    cy.get('[data-testid="password-input"]').type('admin');
    cy.get('[data-testid="login-button"]').click();

    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="dashboard-page"]').should('be.visible');
  });

  it('should show error message with invalid credentials', () => {
    cy.visit('/login');

    // Fill in login form with invalid credentials
    cy.get('[data-testid="username-input"]').type('invaliduser');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();

    // Should show error message
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials');

    // Should remain on login page
    cy.url().should('include', '/login');
  });

  it('should handle form validation', () => {
    cy.visit('/login');

    // Check that required fields prevent empty submission
    cy.get('[data-testid="username-input"]').should('have.attr', 'required');
    cy.get('[data-testid="password-input"]').should('have.attr', 'required');
  });

  it('should successfully log out', () => {
    // First log in
    cy.login();

    // Verify we're on dashboard
    cy.url().should('include', '/dashboard');

    // Log out
    cy.get('[data-testid="logout-button"]').click();

    // Should redirect to login page
    cy.url().should('include', '/login');
    cy.get('[data-testid="login-page"]').should('be.visible');
  });

  it('should redirect to intended page after login', () => {
    // Try to access protected page while not authenticated
    cy.visit('/contacts');

    // Should redirect to login
    cy.url().should('include', '/login');

    // Log in
    cy.get('[data-testid="username-input"]').type('admin');
    cy.get('[data-testid="password-input"]').type('admin');
    cy.get('[data-testid="login-button"]').click();

    // Should redirect to originally intended page
    cy.url().should('include', '/contacts');
  });

  it('should persist authentication across page refreshes', () => {
    // Log in
    cy.login();
    cy.url().should('include', '/dashboard');

    // Refresh page
    cy.reload();

    // Should still be authenticated
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="dashboard-page"]').should('be.visible');
  });

  it('should handle session expiration', () => {
    // Log in
    cy.login();

    // Simulate session expiration by clearing token
    cy.window().then((win) => {
      win.localStorage.removeItem('authToken');
    });

    // Try to navigate to protected page
    cy.visit('/contacts');

    // Should redirect to login
    cy.url().should('include', '/login');
  });

  it('should be accessible', () => {
    cy.visit('/login');
    cy.checkAccessibility();

    // Check form accessibility
    cy.get('[data-testid="username-input"]').should('have.attr', 'aria-label');
    cy.get('[data-testid="password-input"]').should('have.attr', 'aria-label');
    cy.get('[data-testid="login-button"]').should('not.have.attr', 'aria-disabled', 'true');
  });

  it('should work with keyboard navigation', () => {
    cy.visit('/login');

    // Test basic keyboard navigation
    cy.get('[data-testid="username-input"]').should('be.visible');
    cy.get('[data-testid="password-input"]').should('be.visible');
    cy.get('[data-testid="login-button"]').should('be.visible');

    // Fill form using keyboard
    cy.get('[data-testid="username-input"]').type('admin');
    cy.get('[data-testid="password-input"]').type('admin{enter}');

    // Should submit form and redirect
    cy.url().should('include', '/dashboard');
  });
});
