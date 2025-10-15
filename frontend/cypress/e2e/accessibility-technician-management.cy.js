/**
 * Accessibility Testing Configuration for Technician Management
 *
 * Comprehensive accessibility testing using cypress-axe to ensure
 * WCAG 2.1 AA compliance across all technician management components.
 *
 * Test Coverage:
 * - Color contrast ratios
 * - Keyboard navigation
 * - Screen reader compatibility
 * - ARIA labels and roles
 * - Focus management
 * - Form accessibility
 * - Interactive element accessibility
 * - Alternative text for images
 */

describe('Accessibility Testing - Technician Management', () => {
  beforeEach(() => {
    cy.login('admin', 'password')
    cy.injectAxe() // Inject axe-core for accessibility testing
  })

  describe('Technician List Accessibility', () => {
    it('should meet WCAG 2.1 AA standards', () => {
      cy.visit('/staff/technicians')
      cy.waitForTechnicianList()

      // Comprehensive accessibility check
      cy.checkA11y('[data-testid="technician-list"]', {
        tags: ['wcag2a', 'wcag2aa'],
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-order-semantics': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          'aria-required-attr': { enabled: true }
        }
      })
    })

    it('should support keyboard navigation', () => {
      cy.visit('/staff/technicians')
      cy.waitForTechnicianList()

      // Test tab navigation
      cy.get('body').tab()
      cy.focused().should('have.attr', 'data-testid', 'technician-search')

      cy.tab()
      cy.focused().should('have.attr', 'data-testid', 'status-filter')

      cy.tab()
      cy.focused().should('have.attr', 'data-testid', 'add-technician-button')

      // Test enter key activation
      cy.focused().type('{enter}')
      cy.url().should('include', '/technicians/new')
    })

    it('should have proper ARIA labels and roles', () => {
      cy.visit('/staff/technicians')

      // Verify search input accessibility
      cy.get('[data-testid="technician-search"]')
        .should('have.attr', 'aria-label', 'Search technicians')
        .should('have.attr', 'role', 'searchbox')

      // Verify filter accessibility
      cy.get('[data-testid="status-filter"]')
        .should('have.attr', 'aria-label', 'Filter by status')

      // Verify list accessibility
      cy.get('[data-testid="technician-list"]')
        .should('have.attr', 'role', 'list')

      // Verify card accessibility
      cy.get('[data-testid="technician-card"]').first()
        .should('have.attr', 'role', 'listitem')
        .should('have.attr', 'tabindex', '0')
        .should('have.attr', 'aria-label')
    })

    it('should support screen readers', () => {
      cy.visit('/staff/technicians')

      // Verify live region for search results
      cy.get('[data-testid="search-results-summary"]')
        .should('have.attr', 'aria-live', 'polite')
        .should('have.attr', 'aria-atomic', 'true')

      // Test search and verify announcement
      cy.get('[data-testid="technician-search"]').type('John')
      cy.get('[data-testid="search-results-summary"]')
        .should('contain', 'Found')
        .should('contain', 'technician')
    })
  })

  describe('Technician Form Accessibility', () => {
    it('should meet form accessibility standards', () => {
      cy.visit('/staff/technicians/new')

      // Check form accessibility
      cy.checkA11y('[data-testid="technician-form"]', {
        tags: ['wcag2a', 'wcag2aa'],
        rules: {
          'label': { enabled: true },
          'form-field-multiple-labels': { enabled: true },
          'required-fields': { enabled: true }
        }
      })
    })

    it('should have proper form labels and associations', () => {
      cy.visit('/staff/technicians/new')

      // Verify all form fields have proper labels
      cy.get('#firstName').should('have.attr', 'aria-describedby')
      cy.get('label[for="firstName"]').should('exist').and('be.visible')

      cy.get('#lastName').should('have.attr', 'aria-describedby')
      cy.get('label[for="lastName"]').should('exist').and('be.visible')

      cy.get('#email').should('have.attr', 'aria-describedby')
      cy.get('label[for="email"]').should('exist').and('be.visible')

      // Verify required field indicators
      cy.get('[aria-required="true"]').should('have.length.greaterThan', 0)
    })

    it('should provide accessible error messages', () => {
      cy.visit('/staff/technicians/new')

      // Submit empty form to trigger validation
      cy.get('[data-testid="save-technician"]').click()

      // Verify error messages are accessible
      cy.get('[data-testid="firstName-error"]')
        .should('be.visible')
        .should('have.attr', 'role', 'alert')
        .should('have.attr', 'aria-live', 'assertive')

      // Verify field association with error
      cy.get('#firstName')
        .should('have.attr', 'aria-invalid', 'true')
        .should('have.attr', 'aria-describedby')
        .then(($el) => {
          const describedBy = $el.attr('aria-describedby')
          cy.get(`#${describedBy}`).should('contain', 'required')
        })
    })

    it('should support keyboard form navigation', () => {
      cy.visit('/staff/technicians/new')

      // Test tab order through form
      cy.get('#firstName').focus()

      cy.tab()
      cy.focused().should('have.attr', 'id', 'lastName')

      cy.tab()
      cy.focused().should('have.attr', 'id', 'email')

      // Test shift+tab reverse navigation
      cy.focused().tab({ shift: true })
      cy.focused().should('have.attr', 'id', 'lastName')
    })
  })

  describe('Certification Dashboard Accessibility', () => {
    it('should meet dashboard accessibility standards', () => {
      cy.visit('/staff/certifications')

      cy.checkA11y('[data-testid="certification-dashboard"]', {
        tags: ['wcag2a', 'wcag2aa'],
        rules: {
          'region': { enabled: true },
          'landmark-banner': { enabled: true },
          'landmark-contentinfo': { enabled: true }
        }
      })
    })

    it('should have accessible data visualizations', () => {
      cy.visit('/staff/certifications')

      // Verify chart accessibility
      cy.get('[data-testid="certification-chart"]')
        .should('have.attr', 'role', 'img')
        .should('have.attr', 'aria-label')

      // Verify data table alternative
      cy.get('[data-testid="certification-data-table"]')
        .should('have.attr', 'role', 'table')
        .should('have.attr', 'aria-label', 'Certification statistics')

      // Verify table headers
      cy.get('[data-testid="certification-data-table"] th')
        .should('have.attr', 'scope', 'col')
    })

    it('should provide keyboard access to interactive elements', () => {
      cy.visit('/staff/certifications')

      // Test certification card interactions
      cy.get('[data-testid="certification-card"]').first()
        .should('have.attr', 'tabindex', '0')
        .focus()
        .type('{enter}')

      // Verify modal or detail view opens
      cy.get('[data-testid="certification-details"]').should('be.visible')

      // Test escape key to close
      cy.get('body').type('{esc}')
      cy.get('[data-testid="certification-details"]').should('not.exist')
    })
  })

  describe('Availability Calendar Accessibility', () => {
    it('should meet calendar accessibility standards', () => {
      cy.visit('/staff/availability')
      cy.waitForCalendarLoad()

      cy.checkA11y('[data-testid="availability-calendar"]', {
        tags: ['wcag2a', 'wcag2aa'],
        rules: {
          'aria-valid-attr': { enabled: true },
          'button-name': { enabled: true },
          'focus-order-semantics': { enabled: true }
        }
      })
    })

    it('should provide keyboard calendar navigation', () => {
      cy.visit('/staff/availability')
      cy.waitForCalendarLoad()

      // Test calendar navigation buttons
      cy.get('.fc-prev-button')
        .should('have.attr', 'aria-label', 'Previous month')
        .should('have.attr', 'type', 'button')

      cy.get('.fc-next-button')
        .should('have.attr', 'aria-label', 'Next month')
        .should('have.attr', 'type', 'button')

      // Test date navigation with arrow keys
      cy.get('.fc-daygrid-day').first().focus()
      cy.focused().type('{rightarrow}')

      // Verify focus moves to next day
      cy.focused().should('not.be', '.fc-daygrid-day:first')
    })

    it('should announce calendar changes to screen readers', () => {
      cy.visit('/staff/availability')
      cy.waitForCalendarLoad()

      // Verify live region for calendar updates
      cy.get('[data-testid="calendar-announcements"]')
        .should('have.attr', 'aria-live', 'polite')
        .should('have.attr', 'aria-atomic', 'false')

      // Test month navigation announcement
      cy.get('.fc-next-button').click()
      cy.get('[data-testid="calendar-announcements"]')
        .should('contain', 'Calendar updated')
    })
  })

  describe('Organization Chart Accessibility', () => {
    it('should meet organizational chart accessibility standards', () => {
      cy.visit('/staff/organization')

      cy.checkA11y('[data-testid="org-chart"]', {
        tags: ['wcag2a', 'wcag2aa'],
        rules: {
          'aria-valid-attr-value': { enabled: true },
          'nested-interactive': { enabled: true },
          'focus-order-semantics': { enabled: true }
        }
      })
    })

    it('should provide accessible tree navigation', () => {
      cy.visit('/staff/organization')

      // Verify tree structure
      cy.get('[data-testid="org-chart"]')
        .should('have.attr', 'role', 'tree')

      // Verify tree items
      cy.get('[data-testid="org-node"]')
        .should('have.attr', 'role', 'treeitem')
        .should('have.attr', 'tabindex')

      // Test keyboard navigation
      cy.get('[data-testid="org-node"]').first().focus()
      cy.focused().type('{downarrow}')

      // Verify focus moves correctly
      cy.focused().should('have.attr', 'data-testid', 'org-node')
    })

    it('should support expandable/collapsible interactions', () => {
      cy.visit('/staff/organization')

      // Find expandable node
      cy.get('[data-testid="org-node"][aria-expanded="false"]').first().as('expandableNode')

      // Verify accessibility attributes
      cy.get('@expandableNode')
        .should('have.attr', 'aria-expanded', 'false')
        .should('have.attr', 'aria-controls')

      // Test keyboard expansion
      cy.get('@expandableNode').focus().type('{rightarrow}')
      cy.get('@expandableNode').should('have.attr', 'aria-expanded', 'true')

      // Test keyboard collapse
      cy.focused().type('{leftarrow}')
      cy.get('@expandableNode').should('have.attr', 'aria-expanded', 'false')
    })
  })

  describe('Coverage Area Map Accessibility', () => {
    it('should meet map accessibility standards', () => {
      cy.visit('/staff/coverage-areas')

      cy.checkA11y('[data-testid="coverage-map-container"]', {
        tags: ['wcag2a', 'wcag2aa'],
        rules: {
          'region': { enabled: true },
          'aria-valid-attr': { enabled: true }
        }
      })
    })

    it('should provide map alternatives for screen readers', () => {
      cy.visit('/staff/coverage-areas')

      // Verify map has proper role and label
      cy.get('[data-testid="coverage-map"]')
        .should('have.attr', 'role', 'application')
        .should('have.attr', 'aria-label', 'Coverage area map')

      // Verify alternative data table exists
      cy.get('[data-testid="coverage-areas-table"]')
        .should('be.visible')
        .should('have.attr', 'role', 'table')
        .should('have.attr', 'aria-label', 'Coverage areas data table')

      // Verify skip to table link
      cy.get('[data-testid="skip-to-table"]')
        .should('be.visible')
        .should('contain', 'Skip to data table')
    })

    it('should support keyboard map interactions', () => {
      cy.visit('/staff/coverage-areas')

      // Test map controls accessibility
      cy.get('[data-testid="zoom-in"]')
        .should('have.attr', 'aria-label', 'Zoom in')
        .should('have.attr', 'type', 'button')

      cy.get('[data-testid="zoom-out"]')
        .should('have.attr', 'aria-label', 'Zoom out')
        .should('have.attr', 'type', 'button')

      // Test keyboard map navigation
      cy.get('[data-testid="coverage-map"]').focus()
      cy.focused().type('{arrowup}{arrowup}') // Pan up

      // Verify map responds to keyboard
      cy.get('[data-testid="map-position-indicator"]')
        .should('contain', 'Map position updated')
    })
  })

  describe('Focus Management', () => {
    it('should manage focus during modal interactions', () => {
      cy.visit('/staff/technicians')

      // Open modal
      cy.get('[data-testid="add-technician-button"]').click()

      // Verify focus moves to modal
      cy.focused().should('be.visible')
      cy.focused().closest('[role="dialog"]').should('exist')

      // Verify focus trap
      cy.get('body').tab({ shift: true })
      cy.focused().closest('[role="dialog"]').should('exist')

      // Close modal and verify focus returns
      cy.get('body').type('{esc}')
      cy.focused().should('have.attr', 'data-testid', 'add-technician-button')
    })

    it('should maintain focus order during dynamic updates', () => {
      cy.visit('/staff/technicians')

      // Focus on search input
      cy.get('[data-testid="technician-search"]').focus()

      // Type search to trigger list update
      cy.focused().type('John')

      // Verify focus remains on search input
      cy.focused().should('have.attr', 'data-testid', 'technician-search')

      // Verify search results are announced
      cy.get('[data-testid="search-results-summary"]')
        .should('be.visible')
        .should('have.attr', 'aria-live', 'polite')
    })
  })

  describe('Color Contrast and Visual Accessibility', () => {
    it('should meet color contrast requirements', () => {
      cy.visit('/staff/technicians')

      // Test with specific color contrast rules
      cy.checkA11y(null, {
        rules: {
          'color-contrast': { enabled: true }
        }
      })
    })

    it('should be usable without color alone', () => {
      cy.visit('/staff/technicians')

      // Verify status indicators use more than just color
      cy.get('[data-testid="status-active"]')
        .should('contain.text', 'Active')
        .should('have.attr', 'aria-label')

      cy.get('[data-testid="status-inactive"]')
        .should('contain.text', 'Inactive')
        .should('have.attr', 'aria-label')

      // Verify certification status uses icons and text
      cy.get('[data-testid="certification-valid"]')
        .find('[data-testid="valid-icon"]').should('exist')

      cy.get('[data-testid="certification-expired"]')
        .find('[data-testid="expired-icon"]').should('exist')
    })
  })

  describe('Mobile Accessibility', () => {
    it('should maintain accessibility on mobile devices', () => {
      cy.viewport('iphone-6')
      cy.visit('/staff/technicians')

      // Check mobile-specific accessibility
      cy.checkA11y('[data-testid="mobile-technician-list"]', {
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
      })
    })

    it('should provide accessible touch targets', () => {
      cy.viewport('iphone-6')
      cy.visit('/staff/technicians')

      // Verify touch targets meet minimum size (44px)
      cy.get('[data-testid="technician-card"]')
        .should('have.css', 'min-height')
        .and('match', /[4-9]\d+px|[1-9]\d{2,}px/) // At least 44px

      cy.get('[data-testid="mobile-menu-toggle"]')
        .should('have.css', 'min-width')
        .and('match', /[4-9]\d+px|[1-9]\d{2,}px/) // At least 44px
    })
  })

  describe('Error and Loading State Accessibility', () => {
    it('should provide accessible error messages', () => {
      // Mock API error
      cy.intercept('GET', '/api/technicians/', { statusCode: 500, body: { error: 'Server error' } })

      cy.visit('/staff/technicians')

      // Verify error message accessibility
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .should('have.attr', 'role', 'alert')
        .should('have.attr', 'aria-live', 'assertive')
    })

    it('should provide accessible loading states', () => {
      cy.visit('/staff/technicians')

      // Verify loading indicator accessibility
      cy.get('[data-testid="loading-spinner"]')
        .should('have.attr', 'role', 'status')
        .should('have.attr', 'aria-label', 'Loading technicians')

      // Verify loading text for screen readers
      cy.get('[data-testid="loading-text"]')
        .should('contain', 'Loading')
        .should('have.attr', 'aria-live', 'polite')
    })
  })
})
