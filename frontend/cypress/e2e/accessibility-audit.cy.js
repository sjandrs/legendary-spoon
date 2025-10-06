/**
 * Comprehensive Accessibility Audit using cypress-axe
 * Tests WCAG 2.1 AA compliance across all new CMS and Admin pages
 * 
 * TASK-086: Accessibility audit with axe-core on all new pages
 */

describe('Accessibility Audit - WCAG 2.1 AA Compliance', () => {
  beforeEach(() => {
    // Login as admin to access all features
    cy.login('admin', 'admin');
  });

  afterEach(() => {
    cy.logout();
  });

  describe('CRM Pages - Accessibility', () => {
    it('should have no accessibility violations on Accounts List page', () => {
      cy.visit('/accounts');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
        rules: {
          'color-contrast': { enabled: true },
          'label': { enabled: true },
          'button-name': { enabled: true },
          'link-name': { enabled: true },
        },
      });
    });

    it('should have no accessibility violations on Account Detail page', () => {
      cy.visit('/accounts/1');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
      });
    });

    it('should have no accessibility violations on Quotes List page', () => {
      cy.visit('/quotes');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
      });
    });

    it('should have no accessibility violations on Quote Detail page', () => {
      cy.visit('/quotes/1');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
      });
    });

    it('should have no accessibility violations on Interactions List page', () => {
      cy.visit('/interactions');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
      });
    });

    it('should have no accessibility violations on Activity Timeline page', () => {
      cy.visit('/activity-timeline');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
      });
    });
  });

  describe('Analytics Pages - Accessibility', () => {
    it('should have no accessibility violations on Deal Predictions page', () => {
      cy.visit('/analytics/deal-predictions');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
        rules: {
          'aria-required-children': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
        },
      });
    });

    it('should have no accessibility violations on Customer Lifetime Value page', () => {
      cy.visit('/analytics/customer-lifetime-value');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
      });
    });

    it('should have no accessibility violations on Revenue Forecast page', () => {
      cy.visit('/analytics/revenue-forecast');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
      });
    });

    it('should have no accessibility violations on Analytics Snapshots page', () => {
      cy.visit('/analytics/snapshots');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
      });
    });

    it('should have no accessibility violations on Analytics Dashboard page', () => {
      cy.visit('/analytics/dashboard');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
      });
    });
  });

  describe('CMS Pages - Accessibility', () => {
    it('should have no accessibility violations on Blog Posts List page', () => {
      cy.visit('/blog');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
        rules: {
          'list': { enabled: true },
          'listitem': { enabled: true },
        },
      });
    });

    it('should have no accessibility violations on Blog Post Form (new)', () => {
      cy.visit('/blog/new');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
        rules: {
          'label': { enabled: true },
          'form-field-multiple-labels': { enabled: true },
        },
      });
    });

    it('should have no accessibility violations on Pages List page', () => {
      cy.visit('/pages');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
      });
    });

    it('should have no accessibility violations on Page Form (new)', () => {
      cy.visit('/pages/new');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
        rules: {
          'label': { enabled: true },
          'form-field-multiple-labels': { enabled: true },
        },
      });
    });

    it('should have no accessibility violations on Tags Management page', () => {
      cy.visit('/tags');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
      });
    });
  });

  describe('Admin Pages - Accessibility', () => {
    it('should have no accessibility violations on Notification Center page', () => {
      cy.visit('/notifications');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
        rules: {
          'aria-allowed-role': { enabled: true },
        },
      });
    });

    it('should have no accessibility violations on Activity Logs page', () => {
      cy.visit('/admin/activity-logs');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
        rules: {
          'table': { enabled: true },
          'th-has-data-cells': { enabled: true },
        },
      });
    });

    it('should have no accessibility violations on System Logs page', () => {
      cy.visit('/admin/system-logs');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
        rules: {
          'table': { enabled: true },
          'th-has-data-cells': { enabled: true },
        },
      });
    });
  });

  describe('Project Management Pages - Accessibility', () => {
    it('should have no accessibility violations on Project Templates List page', () => {
      cy.visit('/project-templates');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
      });
    });

    it('should have no accessibility violations on Project Template Form (new)', () => {
      cy.visit('/project-templates/new');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
      });
    });

    it('should have no accessibility violations on Certifications List page', () => {
      cy.visit('/certifications');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
      });
    });

    it('should have no accessibility violations on Certification Form (new)', () => {
      cy.visit('/certifications/new');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
      });
    });

    it('should have no accessibility violations on Technician Payroll page', () => {
      cy.visit('/technicians/1/payroll');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
      });
    });
  });

  describe('Keyboard Navigation - Accessibility', () => {
    it('should support Tab navigation through all interactive elements on Accounts page', () => {
      cy.visit('/accounts');
      cy.waitForLoad();

      // Test tab order
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid').and('match', /button|link|input/);

      // Test tab through first few elements
      cy.realPress('Tab');
      cy.realPress('Tab');
      cy.realPress('Tab');

      // Verify we can reach interactive elements
      cy.focused().should('be.visible');
    });

    it('should support Enter key for button activation', () => {
      cy.visit('/blog');
      cy.waitForLoad();

      // Focus on "New Blog Post" button and activate with Enter
      cy.get('[data-testid="new-blog-post-button"]').focus();
      cy.focused().realPress('Enter');

      // Should navigate to form
      cy.url().should('include', '/blog/new');
    });

    it('should support Escape key to close dropdowns', () => {
      cy.visit('/');
      cy.waitForLoad();

      // Open a dropdown menu
      cy.get('[data-testid="crm-dropdown"]').click();
      cy.get('[data-testid="crm-dropdown-menu"]').should('be.visible');

      // Press Escape to close
      cy.realPress('Escape');
      cy.get('[data-testid="crm-dropdown-menu"]').should('not.be.visible');
    });

    it('should support Arrow keys for dropdown navigation', () => {
      cy.visit('/');
      cy.waitForLoad();

      // Open dropdown with Enter
      cy.get('[data-testid="crm-dropdown"]').focus().realPress('Enter');

      // Navigate with arrow keys
      cy.realPress('ArrowDown');
      cy.realPress('ArrowDown');
      cy.realPress('Enter');

      // Should navigate to selected item
      cy.url().should('match', /accounts|contacts|deals/);
    });
  });

  describe('Focus Management - Accessibility', () => {
    it('should maintain focus on form error messages', () => {
      cy.visit('/blog/new');
      cy.waitForLoad();

      // Submit empty form
      cy.get('[data-testid="submit-button"]').click();

      // Focus should move to first error
      cy.focused().should('have.attr', 'aria-invalid', 'true');
    });

    it('should restore focus after modal closes', () => {
      cy.visit('/accounts');
      cy.waitForLoad();

      // Click button that opens modal
      cy.get('[data-testid="add-account-button"]').click();

      // Close modal with Escape
      cy.realPress('Escape');

      // Focus should return to button
      cy.focused().should('have.attr', 'data-testid', 'add-account-button');
    });

    it('should have visible focus indicators on all interactive elements', () => {
      cy.visit('/dashboard');
      cy.waitForLoad();

      // Tab through elements and verify focus indicators
      const elements = [
        '[data-testid="dashboard-link"]',
        '[data-testid="crm-dropdown"]',
        '[data-testid="tasks-dropdown"]',
      ];

      elements.forEach((selector) => {
        cy.get(selector).focus();
        cy.focused().should('have.css', 'outline').and('not.equal', 'none');
      });
    });
  });

  describe('Screen Reader Support - Accessibility', () => {
    it('should have proper ARIA labels on icon buttons', () => {
      cy.visit('/accounts');
      cy.waitForLoad();

      // Verify icon buttons have aria-label or aria-labelledby
      cy.get('button[data-testid*="icon"]').each(($btn) => {
        cy.wrap($btn).should('satisfy', ($el) => {
          return $el.attr('aria-label') || $el.attr('aria-labelledby');
        });
      });
    });

    it('should have proper heading hierarchy on all pages', () => {
      const pages = [
        '/accounts',
        '/quotes',
        '/blog',
        '/pages',
        '/analytics/deal-predictions',
      ];

      pages.forEach((page) => {
        cy.visit(page);
        cy.waitForLoad();
        cy.injectAxe();

        // Check heading order
        cy.checkA11y(null, {
          rules: {
            'heading-order': { enabled: true },
          },
        });
      });
    });

    it('should have proper form labels and descriptions', () => {
      cy.visit('/blog/new');
      cy.waitForLoad();

      // All form inputs should have labels
      cy.get('input, textarea, select').each(($input) => {
        const id = $input.attr('id');
        if (id) {
          cy.get(`label[for="${id}"]`).should('exist');
        }
      });
    });

    it('should announce loading states to screen readers', () => {
      cy.visit('/accounts');

      // Loading indicator should have aria-live
      cy.get('[data-testid="loading"]')
        .should('have.attr', 'aria-live', 'polite')
        .or('have.attr', 'role', 'status');
    });

    it('should announce error messages to screen readers', () => {
      cy.visit('/blog/new');
      cy.waitForLoad();

      // Submit empty form
      cy.get('[data-testid="submit-button"]').click();

      // Error messages should have aria-live or role=alert
      cy.get('[data-testid*="error"]')
        .should('satisfy', ($el) => {
          return $el.attr('aria-live') === 'assertive' || $el.attr('role') === 'alert';
        });
    });
  });

  describe('Color Contrast - Accessibility', () => {
    it('should have sufficient color contrast on all pages', () => {
      const pages = [
        '/accounts',
        '/quotes',
        '/blog',
        '/pages',
        '/notifications',
        '/admin/activity-logs',
      ];

      pages.forEach((page) => {
        cy.visit(page);
        cy.waitForLoad();
        cy.injectAxe();

        // Check color contrast (WCAG AA requires 4.5:1 for normal text)
        cy.checkA11y(null, {
          rules: {
            'color-contrast': { enabled: true },
          },
          includedImpacts: ['serious', 'critical'],
        });
      });
    });
  });

  describe('Responsive Accessibility - Mobile', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should be accessible on mobile viewport - Accounts page', () => {
      cy.visit('/accounts');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
      });
    });

    it('should be accessible on mobile viewport - Blog page', () => {
      cy.visit('/blog');
      cy.waitForLoad();
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious'],
      });
    });

    it('should have touch-friendly tap targets on mobile', () => {
      cy.visit('/accounts');
      cy.waitForLoad();

      // All buttons should have minimum tap target size (44x44px per WCAG)
      cy.get('button, a').each(($el) => {
        const rect = $el[0].getBoundingClientRect();
        expect(rect.width).to.be.at.least(44);
        expect(rect.height).to.be.at.least(44);
      });
    });
  });
});
