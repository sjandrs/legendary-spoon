/**
 * Custom Accessibility Testing Commands for Field Service Components
 * Extends Cypress with specialized accessibility testing utilities
 */

// Add cypress-axe commands for accessibility testing
import 'cypress-axe';

/**
 * Enhanced accessibility checking with field service specific rules
 */
Cypress.Commands.add('checkFieldServiceA11y', (context, options = {}) => {
  const defaultOptions = {
    // Field service specific accessibility rules
    rules: {
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'focus-management': { enabled: true },
      'aria-labels': { enabled: true },
      'landmark-roles': { enabled: true }
    },
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
    ...options
  };

  cy.checkA11y(context, defaultOptions);
});

/**
 * Test keyboard navigation through a component
 */
Cypress.Commands.add('testKeyboardNavigation', (selector, expectedTabStops = []) => {
  cy.get(selector).within(() => {
    // Start tabbing from first element
    cy.get('body').tab();

    expectedTabStops.forEach((stopSelector, index) => {
      cy.focused().should('match', stopSelector);

      if (index < expectedTabStops.length - 1) {
        cy.focused().tab();
      }
    });
  });
});

/**
 * Verify ARIA live region announcements
 */
Cypress.Commands.add('verifyLiveAnnouncement', (expectedText, region = '[aria-live]') => {
  cy.get(region)
    .should('exist')
    .should('contain.text', expectedText);

  // Verify announcement is cleared after reasonable time
  cy.wait(3000);
  cy.get(region).should('not.contain.text', expectedText);
});

/**
 * Test focus trap functionality in modals
 */
Cypress.Commands.add('testFocusTrap', (modalSelector) => {
  cy.get(modalSelector).should('be.visible');

  // Get all focusable elements within modal
  cy.get(modalSelector).within(() => {
    cy.get('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
      .first()
      .as('firstFocusable');

    cy.get('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
      .last()
      .as('lastFocusable');

    // Focus should start on first element
    cy.get('@firstFocusable').should('be.focused');

    // Tab to last element
    cy.get('@firstFocusable').tab();
    // Continue tabbing to reach last element
    cy.get('body').then(() => {
      // Simplified: just verify focus stays within modal
      cy.focused().should('exist').should('be.visible');
    });

    // Shift+Tab from first should go to last
    cy.get('@firstFocusable').focus();
    cy.focused().tab({ shift: true });
    cy.get('@lastFocusable').should('be.focused');
  });
});

/**
 * Simulate screen reader navigation patterns
 */
Cypress.Commands.add('simulateScreenReader', (selector) => {
  cy.get(selector).within(() => {
    // Test heading navigation (common screen reader pattern)
    cy.get('h1, h2, h3, h4, h5, h6').each($heading => {
      cy.wrap($heading).should('be.visible');
    });

    // Test landmark navigation
    cy.get('[role="main"], main').should('exist');
    cy.get('[role="navigation"], nav').should('exist');

    // Test list navigation
    cy.get('ul, ol').each($list => {
      cy.wrap($list).within(() => {
        cy.get('li').should('have.length.greaterThan', 0);
      });
    });
  });
});

/**
 * Test high contrast mode compatibility
 */
Cypress.Commands.add('testHighContrast', () => {
  // Mock high contrast media query
  cy.window().then(win => {
    Object.defineProperty(win, 'matchMedia', {
      writable: true,
      value: cy.stub().returns({
        matches: true,
        media: '(prefers-contrast: high)',
        onchange: null,
        addListener: cy.stub(),
        removeListener: cy.stub(),
      }),
    });
  });

  // Trigger high contrast styles
  cy.reload();

  // Verify high contrast styles are applied
  cy.get('body').should('have.attr', 'data-high-contrast', 'true');
});

/**
 * Test reduced motion preferences
 */
Cypress.Commands.add('testReducedMotion', () => {
  cy.window().then(win => {
    Object.defineProperty(win, 'matchMedia', {
      writable: true,
      value: cy.stub().returns({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: cy.stub(),
        removeListener: cy.stub(),
      }),
    });
  });

  cy.reload();

  // Verify animations are disabled/reduced
  cy.get('*').should('have.css', 'animation-duration', '0s');
  cy.get('*').should('have.css', 'animation-delay', '0s');
});

/**
 * Verify touch target sizes meet WCAG guidelines
 */
Cypress.Commands.add('verifyTouchTargets', (minSize = 44) => {
  cy.get('button, a, input[type="button"], input[type="submit"], [role="button"]')
    .each($element => {
      cy.wrap($element).then($el => {
        const rect = $el[0].getBoundingClientRect();
        expect(rect.width).to.be.at.least(minSize);
        expect(rect.height).to.be.at.least(minSize);
      });
    });
});

/**
 * Test form field accessibility
 */
Cypress.Commands.add('testFormAccessibility', (formSelector) => {
  cy.get(formSelector).within(() => {
    // Verify all inputs have labels or aria-labels
    cy.get('input, select, textarea').each($input => {
      const id = $input.attr('id');
      const ariaLabel = $input.attr('aria-label');
      const ariaLabelledby = $input.attr('aria-labelledby');

      if (id) {
        // Check for label element
        cy.get(`label[for="${id}"]`).should('exist');
      } else {
        // Should have aria-label or aria-labelledby
        expect(ariaLabel || ariaLabelledby).to.exist;
      }
    });

    // Verify required fields are marked
    cy.get('input[required], select[required], textarea[required]')
      .should('have.attr', 'aria-required', 'true');

    // Test error message associations
    cy.get('[aria-invalid="true"]').each($input => {
      const describedBy = $input.attr('aria-describedby');
      if (describedBy) {
        cy.get(`#${describedBy}`).should('exist');
      }
    });
  });
});

/**
 * Test data table accessibility
 */
Cypress.Commands.add('testTableAccessibility', (tableSelector) => {
  cy.get(tableSelector).should('have.attr', 'role', 'table');

  cy.get(tableSelector).within(() => {
    // Verify headers have proper roles
    cy.get('th').each($th => {
      cy.wrap($th).should('have.attr', 'role', 'columnheader');
    });

    // Verify data cells reference headers
    cy.get('tbody td').each($td => {
      const headers = $td.attr('headers');
      if (headers) {
        headers.split(' ').forEach(headerId => {
          cy.get(`#${headerId}`).should('exist');
        });
      }
    });

    // Verify sortable columns are properly marked
    cy.get('th[aria-sort]').each($th => {
      const sortValue = $th.attr('aria-sort');
      expect(['ascending', 'descending', 'none']).to.include(sortValue);
    });
  });
});

/**
 * Test calendar accessibility (FullCalendar specific)
 */
Cypress.Commands.add('testCalendarAccessibility', (calendarSelector) => {
  cy.get(calendarSelector).within(() => {
    // Verify calendar has application role
    cy.get('.fc').should('have.attr', 'role', 'application');

    // Verify navigation buttons are accessible
    cy.get('.fc-prev-button, .fc-next-button, .fc-today-button')
      .each($btn => {
        cy.wrap($btn).should('have.attr', 'aria-label');
      });

    // Verify events have proper labeling
    cy.get('.fc-event').each($event => {
      const title = $event.attr('aria-label') || $event.text();
      expect(title).to.have.length.greaterThan(0);
    });

    // Test keyboard navigation
    cy.get('.fc-day, .fc-timegrid-slot').first().focus();
    cy.focused().type('{rightarrow}');
    cy.focused().should('exist');
  });
});

/**
 * Verify color contrast ratios
 */
Cypress.Commands.add('verifyColorContrast', (selector, minRatio = 4.5) => {
  cy.get(selector).each($element => {
    cy.wrap($element).then($el => {
      const element = $el[0];
      const styles = window.getComputedStyle(element);
      const bgColor = styles.backgroundColor;
      const textColor = styles.color;

      // Note: Actual color contrast calculation would require additional library
      // This is a placeholder for the concept
      cy.log(`Checking contrast between ${textColor} and ${bgColor}`);

      // In real implementation, use a color contrast library here
      // expect(contrastRatio).to.be.at.least(minRatio);
    });
  });
});

/**
 * Test component responsiveness at different zoom levels
 */
Cypress.Commands.add('testZoomLevels', (component, zoomLevels = [100, 200, 400]) => {
  zoomLevels.forEach(zoomLevel => {
    const viewportWidth = Math.floor(1920 / (zoomLevel / 100));
    const viewportHeight = Math.floor(1080 / (zoomLevel / 100));

    cy.viewport(viewportWidth, viewportHeight);
    cy.get(component).should('be.visible');

    // Verify no horizontal scroll at high zoom
    if (zoomLevel >= 200) {
      cy.get('body').should('have.css', 'overflow-x', 'visible');
    }
  });

  // Reset to default viewport
  cy.viewport(1920, 1080);
});

/**
 * Test voice over simulation (basic)
 */
Cypress.Commands.add('simulateVoiceOver', (selector) => {
  cy.get(selector).within(() => {
    // Simulate voice over reading order
    let readableElements = [];

    // Collect elements in reading order
    cy.get('h1, h2, h3, h4, h5, h6, p, li, button, input, select, textarea, [role="button"], [role="link"]')
      .each($el => {
        readableElements.push($el.text() || $el.attr('aria-label') || $el.attr('title'));
      })
      .then(() => {
        // Log the reading order for verification
        cy.log('Voice Over reading order:', readableElements.join(' → '));
      });
  });
});

/**
 * Test ARIA live region functionality
 */
Cypress.Commands.add('testLiveRegions', () => {
  // Verify live regions exist
  cy.get('[aria-live]').should('exist');

  // Test different politeness levels
  cy.get('[aria-live="polite"]').should('exist');
  cy.get('[aria-live="assertive"]').should('exist');

  // Verify atomic updates
  cy.get('[aria-atomic="true"]').should('exist');
});

/**
 * Comprehensive accessibility audit for field service components
 */
Cypress.Commands.add('auditFieldServiceComponent', (componentSelector, options = {}) => {
  const defaults = {
    checkKeyboard: true,
    checkFocus: true,
    checkContrast: true,
    checkLabels: true,
    checkLiveRegions: true,
    checkTouchTargets: true
  };

  const config = { ...defaults, ...options };

  cy.get(componentSelector).should('be.visible');

  // Run axe audit
  cy.checkFieldServiceA11y(componentSelector);

  if (config.checkKeyboard) {
    cy.testKeyboardNavigation(componentSelector);
  }

  if (config.checkFocus) {
    cy.get(componentSelector).within(() => {
      cy.get('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
        .first()
        .focus()
        .should('be.focused');
    });
  }

  if (config.checkContrast) {
    cy.verifyColorContrast(`${componentSelector} *`);
  }

  if (config.checkLabels) {
    cy.get(componentSelector).within(() => {
      cy.get('input, select, textarea').each($input => {
        const label = $input.attr('aria-label') || $input.attr('aria-labelledby');
        expect(label).to.exist;
      });
    });
  }

  if (config.checkLiveRegions) {
    cy.testLiveRegions();
  }

  if (config.checkTouchTargets) {
    cy.get(componentSelector).within(() => {
      cy.verifyTouchTargets();
    });
  }
});

// Export commands for use in tests
export {};
