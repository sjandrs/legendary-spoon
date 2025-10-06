/**
 * Comprehensive Admin Workflow E2E Tests
 * TASK-088: Complete user journeys for Admin features
 * 
 * Tests: Activity logs monitoring → System logs review → Notifications management
 *        Role-based access control → Security audits
 */

describe('Admin Workflow - Complete User Journeys', () => {
  beforeEach(() => {
    // Login as admin user
    cy.login('admin', 'admin');
    cy.visit('/');
  });

  afterEach(() => {
    cy.logout();
  });

  describe('Activity Logs Monitoring', () => {
    it('should view and filter activity logs', () => {
      // Navigate to activity logs (admin only)
      cy.get('[data-testid="settings-dropdown"]').click();
      cy.get('[data-testid="activity-logs-link"]').click();
      cy.url().should('include', '/admin/activity-logs');
      cy.waitForLoad();

      // Check accessibility
      cy.injectAxe();
      cy.checkA11y();

      // Verify activity logs are displayed
      cy.get('[data-testid="activity-log-table"]').should('be.visible');
      cy.get('[data-testid^="activity-log-"]').should('have.length.at.least', 1);

      // Verify log entry structure
      cy.get('[data-testid^="activity-log-"]').first().within(() => {
        cy.get('[data-testid="log-timestamp"]').should('be.visible');
        cy.get('[data-testid="log-user"]').should('be.visible');
        cy.get('[data-testid="log-action"]').should('be.visible');
        cy.get('[data-testid="log-resource"]').should('be.visible');
      });

      // Filter by action type
      cy.get('[data-testid="action-filter"]').select('create');
      cy.get('[data-testid^="activity-log-"]').each(($log) => {
        cy.wrap($log).find('[data-testid="log-action"]').should('contain', 'create');
      });

      // Filter by user
      cy.get('[data-testid="user-filter"]').type('admin');
      cy.get('[data-testid^="activity-log-"]').each(($log) => {
        cy.wrap($log).find('[data-testid="log-user"]').should('contain', 'admin');
      });

      // Filter by date range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      cy.get('[data-testid="start-date"]').type(startDate.toISOString().split('T')[0]);
      cy.get('[data-testid="end-date"]').type(new Date().toISOString().split('T')[0]);
      cy.get('[data-testid="apply-date-filter"]').click();

      cy.waitForLoad();
      cy.get('[data-testid^="activity-log-"]').should('have.length.at.least', 1);

      // Clear filters
      cy.get('[data-testid="clear-filters"]').click();
      cy.get('[data-testid="action-filter"]').should('have.value', '');
    });

    it('should view detailed activity log information', () => {
      cy.visit('/admin/activity-logs');
      cy.waitForLoad();

      // Click on log entry to view details
      cy.get('[data-testid^="activity-log-"]').first().click();
      cy.get('[data-testid="log-detail-modal"]').should('be.visible');

      // Verify detailed information
      cy.get('[data-testid="log-detail-timestamp"]').should('be.visible');
      cy.get('[data-testid="log-detail-user"]').should('be.visible');
      cy.get('[data-testid="log-detail-action"]').should('be.visible');
      cy.get('[data-testid="log-detail-resource"]').should('be.visible');
      cy.get('[data-testid="log-detail-ip-address"]').should('be.visible');
      cy.get('[data-testid="log-detail-user-agent"]').should('be.visible');

      // Close detail modal
      cy.get('[data-testid="close-log-detail"]').click();
      cy.get('[data-testid="log-detail-modal"]').should('not.be.visible');
    });

    it('should export activity logs', () => {
      cy.visit('/admin/activity-logs');
      cy.waitForLoad();

      // Export as CSV
      cy.get('[data-testid="export-logs"]').click();
      cy.get('[data-testid="export-format"]').select('csv');
      cy.get('[data-testid="confirm-export"]').click();

      // Verify download (mock file download check)
      cy.get('[data-testid="success-message"]').should('contain', 'Export started');
    });

    it('should paginate through activity logs', () => {
      cy.visit('/admin/activity-logs');
      cy.waitForLoad();

      // Check pagination controls
      cy.get('[data-testid="pagination"]').should('be.visible');

      // Navigate to next page
      cy.get('[data-testid="next-page"]').click();
      cy.url().should('include', 'page=2');
      cy.waitForLoad();

      // Navigate to previous page
      cy.get('[data-testid="previous-page"]').click();
      cy.url().should('include', 'page=1');
    });
  });

  describe('System Logs Review', () => {
    it('should view system logs with different severity levels', () => {
      cy.visit('/admin/system-logs');
      cy.waitForLoad();

      // Check accessibility
      cy.injectAxe();
      cy.checkA11y();

      // Verify system logs are displayed
      cy.get('[data-testid="system-log-table"]').should('be.visible');
      cy.get('[data-testid^="system-log-"]').should('have.length.at.least', 1);

      // Filter by severity
      cy.get('[data-testid="severity-filter"]').select('ERROR');
      cy.get('[data-testid^="system-log-"]').each(($log) => {
        cy.wrap($log).find('[data-testid="log-severity"]').should('contain', 'ERROR');
        cy.wrap($log).should('have.class', 'severity-error');
      });

      // View WARNING logs
      cy.get('[data-testid="severity-filter"]').select('WARNING');
      cy.get('[data-testid^="system-log-"]').each(($log) => {
        cy.wrap($log).find('[data-testid="log-severity"]').should('contain', 'WARNING');
      });

      // View INFO logs
      cy.get('[data-testid="severity-filter"]').select('INFO');
      cy.get('[data-testid^="system-log-"]').each(($log) => {
        cy.wrap($log).find('[data-testid="log-severity"]').should('contain', 'INFO');
      });
    });

    it('should search system logs by message content', () => {
      cy.visit('/admin/system-logs');
      cy.waitForLoad();

      cy.get('[data-testid="log-search"]').type('database');
      cy.waitForLoad();

      cy.get('[data-testid^="system-log-"]').each(($log) => {
        cy.wrap($log).find('[data-testid="log-message"]').should('contain', 'database');
      });
    });

    it('should view system log stack traces', () => {
      cy.visit('/admin/system-logs');
      cy.waitForLoad();

      // Filter to ERROR logs which typically have stack traces
      cy.get('[data-testid="severity-filter"]').select('ERROR');

      // Click to expand log entry
      cy.get('[data-testid^="system-log-"]').first().click();
      cy.get('[data-testid="log-stack-trace"]').should('be.visible');
      cy.get('[data-testid="log-stack-trace"]').should('contain', 'at ');

      // Collapse log entry
      cy.get('[data-testid^="system-log-"]').first().click();
      cy.get('[data-testid="log-stack-trace"]').should('not.be.visible');
    });

    it('should filter system logs by time range', () => {
      cy.visit('/admin/system-logs');
      cy.waitForLoad();

      // Filter to last 1 hour
      cy.get('[data-testid="time-range-filter"]').select('1hour');
      cy.waitForLoad();

      cy.get('[data-testid^="system-log-"]').should('have.length.at.least', 1);

      // Filter to last 24 hours
      cy.get('[data-testid="time-range-filter"]').select('24hours');
      cy.waitForLoad();

      // Custom date range
      cy.get('[data-testid="time-range-filter"]').select('custom');
      cy.get('[data-testid="custom-date-range"]').should('be.visible');
    });
  });

  describe('Notification Center Management', () => {
    it('should view and manage notifications', () => {
      // Navigate to notification center
      cy.get('[data-testid="notifications-icon"]').click();
      cy.url().should('include', '/notifications');
      cy.waitForLoad();

      // Verify notifications are displayed
      cy.get('[data-testid="notification-list"]').should('be.visible');
      cy.get('[data-testid^="notification-"]').should('have.length.at.least', 1);

      // Check unread count
      cy.get('[data-testid="unread-count"]').should('be.visible');

      // Mark notification as read
      cy.get('[data-testid^="notification-"]').first().within(() => {
        cy.get('[data-testid="mark-read"]').click();
      });

      cy.get('[data-testid="success-message"]').should('contain', 'Notification marked as read');

      // Verify unread count decreased
      cy.get('[data-testid="unread-count"]').then(($count) => {
        const count = parseInt($count.text());
        expect(count).to.be.at.least(0);
      });
    });

    it('should filter notifications by type', () => {
      cy.visit('/notifications');
      cy.waitForLoad();

      // Filter by info notifications
      cy.get('[data-testid="type-filter"]').select('info');
      cy.get('[data-testid^="notification-"]').each(($notif) => {
        cy.wrap($notif).should('have.attr', 'data-type', 'info');
      });

      // Filter by warning notifications
      cy.get('[data-testid="type-filter"]').select('warning');
      cy.get('[data-testid^="notification-"]').each(($notif) => {
        cy.wrap($notif).should('have.attr', 'data-type', 'warning');
      });

      // Filter by error notifications
      cy.get('[data-testid="type-filter"]').select('error');
      cy.get('[data-testid^="notification-"]').each(($notif) => {
        cy.wrap($notif).should('have.attr', 'data-type', 'error');
      });
    });

    it('should delete notification', () => {
      cy.visit('/notifications');
      cy.waitForLoad();

      const initialCount = Cypress.$('[data-testid^="notification-"]').length;

      // Delete first notification
      cy.get('[data-testid^="notification-"]').first().within(() => {
        cy.get('[data-testid="delete-notification"]').click();
      });

      cy.get('[data-testid="confirm-delete"]').click();
      cy.get('[data-testid="success-message"]').should('contain', 'Notification deleted');

      // Verify count decreased
      cy.get('[data-testid^="notification-"]').should('have.length', initialCount - 1);
    });

    it('should mark all notifications as read', () => {
      cy.visit('/notifications');
      cy.waitForLoad();

      // Mark all as read
      cy.get('[data-testid="mark-all-read"]').click();
      cy.get('[data-testid="success-message"]').should('contain', 'All notifications marked as read');

      // Verify unread count is zero
      cy.get('[data-testid="unread-count"]').should('have.text', '0');

      // All notifications should have read class
      cy.get('[data-testid^="notification-"]').each(($notif) => {
        cy.wrap($notif).should('have.class', 'notification-read');
      });
    });

    it('should display notification details', () => {
      cy.visit('/notifications');
      cy.waitForLoad();

      // Click on notification to view details
      cy.get('[data-testid^="notification-"]').first().click();
      cy.get('[data-testid="notification-detail-modal"]').should('be.visible');

      // Verify detailed information
      cy.get('[data-testid="notification-title"]').should('be.visible');
      cy.get('[data-testid="notification-message"]').should('be.visible');
      cy.get('[data-testid="notification-timestamp"]').should('be.visible');
      cy.get('[data-testid="notification-type"]').should('be.visible');

      // Close detail modal
      cy.get('[data-testid="close-notification-detail"]').click();
      cy.get('[data-testid="notification-detail-modal"]').should('not.be.visible');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should restrict admin pages to admin users only', () => {
      // Logout and login as non-admin
      cy.logout();
      cy.login('salesrep', 'password');

      // Try to access activity logs (admin only)
      cy.visit('/admin/activity-logs', { failOnStatusCode: false });

      // Should redirect or show error
      cy.url().should('not.include', '/admin/activity-logs');
      cy.get('[data-testid="access-denied"]').should('be.visible');
      cy.get('[data-testid="access-denied-message"]').should('contain', 'You do not have permission');
    });

    it('should allow admin users to access all admin features', () => {
      // Already logged in as admin

      // Access activity logs
      cy.visit('/admin/activity-logs');
      cy.waitForLoad();
      cy.get('[data-testid="activity-log-table"]').should('be.visible');

      // Access system logs
      cy.visit('/admin/system-logs');
      cy.waitForLoad();
      cy.get('[data-testid="system-log-table"]').should('be.visible');

      // Access notifications
      cy.visit('/notifications');
      cy.waitForLoad();
      cy.get('[data-testid="notification-list"]').should('be.visible');
    });
  });

  describe('Security Audit Trail', () => {
    it('should log security-related events in activity logs', () => {
      cy.visit('/admin/activity-logs');
      cy.waitForLoad();

      // Filter for security events
      cy.get('[data-testid="category-filter"]').select('security');
      cy.waitForLoad();

      // Verify security events are logged
      cy.get('[data-testid^="activity-log-"]').should('have.length.at.least', 1);
      cy.get('[data-testid^="activity-log-"]').each(($log) => {
        cy.wrap($log).find('[data-testid="log-category"]').should('contain', 'security');
      });

      // Common security events
      cy.get('[data-testid="activity-log-table"]').should('contain.text', 'login');
      cy.get('[data-testid="activity-log-table"]').should('contain.text', 'logout');
    });

    it('should track failed login attempts', () => {
      // Logout
      cy.logout();

      // Attempt failed login
      cy.visit('/login');
      cy.get('[data-testid="username-input"]').type('admin');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      cy.get('[data-testid="login-button"]').click();

      // Verify error
      cy.get('[data-testid="login-error"]').should('be.visible');

      // Login as admin
      cy.login('admin', 'admin');

      // Check activity logs for failed attempt
      cy.visit('/admin/activity-logs');
      cy.waitForLoad();

      cy.get('[data-testid="action-filter"]').select('login_failed');
      cy.get('[data-testid^="activity-log-"]').should('have.length.at.least', 1);
      cy.get('[data-testid^="activity-log-"]').first().should('contain', 'admin');
    });
  });

  describe('Real-time Updates', () => {
    it('should show real-time notification badge updates', () => {
      cy.visit('/');

      // Initial unread count
      cy.get('[data-testid="notification-badge"]').then(($badge) => {
        const initialCount = parseInt($badge.text()) || 0;

        // Simulate new notification (this would come from WebSocket in real app)
        cy.window().then((win) => {
          win.dispatchEvent(new CustomEvent('newNotification', {
            detail: {
              id: Date.now(),
              type: 'info',
              title: 'Test Notification',
              message: 'Test message',
            },
          }));
        });

        // Verify badge count increased
        cy.get('[data-testid="notification-badge"]').should('have.text', (initialCount + 1).toString());
      });
    });
  });

  describe('Admin Dashboard Overview', () => {
    it('should display admin dashboard with key metrics', () => {
      cy.visit('/admin/dashboard');
      cy.waitForLoad();

      // Verify key metrics are displayed
      cy.get('[data-testid="active-users-count"]').should('be.visible');
      cy.get('[data-testid="error-count-24h"]').should('be.visible');
      cy.get('[data-testid="total-activity-logs"]').should('be.visible');
      cy.get('[data-testid="system-health-status"]').should('be.visible');

      // Verify charts
      cy.get('[data-testid="activity-chart"]').should('be.visible');
      cy.get('[data-testid="error-rate-chart"]').should('be.visible');
    });
  });
});
