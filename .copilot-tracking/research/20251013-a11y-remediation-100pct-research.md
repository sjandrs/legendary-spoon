<!-- markdownlint-disable-file -->
# Task Research Notes: 100% Accessibility Issues Remediation

## Research Executed

### File Analysis
- frontend/lighthouserc.json
  - Enforces Lighthouse CI assertions with categories:accessibility minScore 0.9 across key routes; runs Vite dev server on port 5174 for audits.
- frontend/cypress/support/accessibility-commands.js
  - Extensive custom Cypress commands built on cypress-axe: keyboard navigation, focus traps, live regions, touch targets, tables, calendars, color contrast placeholders; WCAG 2.1 AA tags used.
- frontend/cypress/e2e/accessibility-audit.cy.js
  - Broad axe audits over CRM, Analytics, CMS, Admin, Project Mgmt; includes keyboard navigation, focus, screen reader checks, and responsive mobile tests.
- frontend/cypress/e2e/accessibility/field-service-a11y.cy.js
  - Deep a11y tests for SchedulePage, DigitalSignaturePad, CustomerPortal, AppointmentRequestQueue, PaperworkTemplateManager, SchedulingDashboard; verifies ARIA roles, focus management, live regions, contrast, reduced motion, tablists, charts with data tables, skip links.
- frontend/cypress/support/e2e.js
  - Global setup injects axe in beforeEach; adds helpers like waitForLoad; handles common non-fatal errors.
- frontend/eslint.config.js
  - No jsx-a11y plugin configured; rules focus on core, hooks, import; separate sections for Jest and Cypress. Missing eslint-plugin-jsx-a11y enforcement.
- frontend/src/components/* (sampling via grep)
  - Many aria-* attributes and roles present; focus styles and high contrast media queries in component CSS files. Modal patterns exist with role="dialog"; inputs often use aria-label instead of <label>.

### Code Search Results
- a11y|accessib|aria-|role=|axe|jest-axe|cypress-axe|lighthouse|contrast|keyboard|focus|tabindex
  - 200+ matches across components and styles indicating a11y hooks are present.
- eslint jsx-a11y configuration
  - No matches for jsx-a11y in eslint config; indicates missing static linting for a11y.

### External Research
- #fetch:https://www.w3.org/WAI/WCAG21/quickref/
  - WCAG 2.1 success criteria across 4 principles; key SCs for app: 1.1.1, 1.3.x, 1.4.3/11/12/13, 2.1.1/2.1.2, 2.4.x, 2.5.3, 3.3.x, 4.1.2/4.1.3. Updated 22 Sep 2025.
- #fetch:https://dequeuniversity.com/rules/axe/4.8
  - Comprehensive list of axe-core v4.8 rules mapped to WCAG levels, including color-contrast, label, link-name, bypass, html-has-lang, document-title, region, headings, tables, autocomplete-valid.

### Project Conventions
- Standards referenced: docs/DEVELOPMENT.md, Cypress a11y helpers, Lighthouse CI config in lighthouserc.json.
- Instructions followed: Frontend testing and CI linting patterns; Cypress helpers for a11y.

## Key Discoveries

### Project Structure
The frontend already includes:
- End-to-end a11y checks with cypress-axe across core pages and field service flows.
- Lighthouse CI enforcing accessibility category >= 0.9 on multiple routes.
- Many aria roles/labels in JSX and focus/contrast CSS helpers.
Gaps:
- No eslint-plugin-jsx-a11y for static prevention of common issues.
- Some tests rely on aria-label instead of proper <label for> + id; potential 3.3.2/4.1.2 concerns and axe "label" rule.
- Color contrast checks are placeholder in Cypress (logs only), not computed.

### Implementation Patterns
- Cypress defines rich commands: checkFieldServiceA11y, testKeyboardNavigation, testFocusTrap, verifyLiveAnnouncement, testHighContrast, testReducedMotion, verifyTouchTargets, testFormAccessibility, testTableAccessibility, testCalendarAccessibility, simulateScreenReader, simulateVoiceOver, testLiveRegions, auditFieldServiceComponent.
- Lighthouse CI audits run via Vite dev server with minScore assertions.
- Tests use role="dialog", aria-live, aria-modal, aria-label conventions widely.

### Complete Examples
```javascript
// Cypress: page axe audit (source: frontend/cypress/e2e/accessibility-audit.cy.js)
cy.visit('/accounts');
cy.waitForLoad();
cy.injectAxe();
cy.checkA11y(null, { includedImpacts: ['critical', 'serious'] });
```

### API and Schema Documentation
- WCAG 2.1 quick reference enumerates SCs; axe-core 4.8 rules map to SCs and drive cypress-axe automated findings. Manual checks needed for headings order, content reflow, motion, timing, etc.

### Configuration Examples
```json
// lighthouserc.json (source: frontend/lighthouserc.json)
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:5174/",
        "http://localhost:5174/login",
        "http://localhost:5174/dashboard",
        "http://localhost:5174/contacts"
      ],
      "startServerCommand": "npm run dev",
      "startServerReadyPattern": "Local:.*:5174",
      "startServerReadyTimeout": 30000,
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", {"minScore": 0.9}]
      }
    }
  }
}
```

### Technical Requirements
- Achieve zero critical/serious axe violations across pages in Cypress runs.
- Meet Lighthouse accessibility score >= 0.9 for audited routes.
- Align with WCAG 2.1 AA for core criteria: keyboard operability, focus visibility, headings/labels, landmarks, color contrast, form labeling/error messaging, status messages, name/role/value.

## Recommended Approach
Adopt a three-layer remediation pipeline to drive 100% issue closure:
1) Prevent: Add eslint-plugin-jsx-a11y with recommended rules to catch issues pre-commit.
2) Detect: Expand cypress-axe to fail on all impacts (not just critical/serious) on scoped components and key pages, and integrate targeted tests for landmarks, headings hierarchy, labels, and tables.
3) Validate: Strengthen Lighthouse CI to cover representative routes per app area, keep minScore 0.9+ and investigate any dropped scores.

Prioritize fixes by rule clusters:
- Labels/Names: axe rules label, button-name, link-name, select-name, input-button-name; migrate aria-label to proper <label for> where appropriate, preserve name computation.
- Landmarks/Structure: bypass (skip links), region, heading-order, page-has-heading-one, main/banner/contentinfo uniqueness; enforce consistent landmarks in layout.
- Keyboard/Focus: focus-visible, scrollable-region-focusable, no keyboard traps; ensure visible focus styles and tab order; confirm modal focus trap and restore.
- Contrast/Visuals: color-contrast, non-text-contrast; adopt tokenized colors and test high-contrast media queries.
- Language/Meta: html-has-lang, document-title; ensure <html lang> from i18n and titles per route.
- Forms/Errors: 3.3.x mapping; aria-invalid, aria-describedby, polite/assertive live regions; autocomplete-valid.

## Implementation Guidance
- Objectives: Eliminate all axe violations; ensure WCAG 2.1 AA conformance on targeted criteria; sustain via lint + tests + CI audits.
- Key Tasks:
  - Add eslint-plugin-jsx-a11y to frontend ESLint config with recommended rules; enable during CI.
  - Update Cypress audits to include moderate/minor impacts for key flows; add assertions for landmark uniqueness and skip links; add color contrast calculation using a library (e.g., chroma.js or Color Contrast Checker) instead of logging placeholders.
  - Standardize form labeling patterns: id/for, aria-describedby for errors, aria-live for status; refactor components relying solely on aria-label when appropriate labels exist.
  - Ensure global layout provides: <main>, unique banner/contentinfo, skip-to-content link, page title and h1, html lang propagation.
  - Harden focus styles across components; ensure focus trap and restore on modals consistently.
  - Verify tables with correct roles/headers associations; supply data tables for charts.
  - Track progress in CI: Lighthouse CI runs on representative routes and blocks PRs below threshold; Cypress a11y suite fails on any violation introduced.
- Dependencies: cypress-axe (already present), eslint-plugin-jsx-a11y (new), optional contrast calc lib.
- Success Criteria:
  - 0 critical/serious axe violations across all audited pages; no violations at any impact on priority pages.
  - Lighthouse accessibility score >= 0.9 on audited routes.
  - ESLint a11y rules pass across src and tests.
