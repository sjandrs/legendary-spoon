<!-- markdownlint-disable-file -->
# Task Details: Remedy accessibility warnings in test mode

## Research Reference

**Source Research**: #file:../research/20251013-a11y-remediation-100pct-research.md

## Phase 1: Prevent issues with static linting

### Task 1.1: Add eslint-plugin-jsx-a11y and enable recommended rules

Introduce eslint-plugin-jsx-a11y to catch common accessibility issues during development and CI, reducing runtime warnings in Jest and Cypress by preventing them at authoring time. Configure recommended and a minimal set of strict rules aligned with WCAG 2.1 AA that match our components (forms, dialogs, landmarks, tables).

- Files:
  - frontend/eslint.config.js - Add jsx-a11y plugin with recommended config and targeted rules (label, button-name, link-name, heading-order, landmark-roles, aria-props, aria-proptypes, no-autofocus, media-has-caption)
  - frontend/package.json - Add devDependency eslint-plugin-jsx-a11y@^6 and update lint scripts
- Success:
  - ESLint reports 0 a11y rule violations on src and test files
  - CI lint step fails if any a11y rules are violated
- Research References:
  - #file:../research/20251013-a11y-remediation-100pct-research.md (Lines 34-43) - ESLint gap analysis (no jsx-a11y)
  - #fetch:https://dequeuniversity.com/rules/axe/4.8 - Axe rules mapping for rule selection
- Dependencies:
  - Node/npm in frontend workspace

### Task 1.2: Standardize form labeling patterns and utilities

Codify preferred form labeling: visible <label> with htmlFor + input id, and aria-describedby for helper/error text. Provide a small utility or pattern guide so components stop relying only on aria-label where a visible label is appropriate.

- Files:
  - frontend/src/components/FormControls/Label.jsx - New helper component wrapping <label> with consistent classes and id/for linkage
  - frontend/src/components/FormControls/FieldHint.jsx - New helper for aria-describedby hookups
  - frontend/docs/ACCESSIBILITY.md - Add short patterns section for labels, errors, and status messages
- Success:
  - Representative forms (ContactForm, BudgetForm) updated to use Label + proper id/for bindings
  - Jest a11y tests stop emitting label/name warnings
- Research References:
  - #file:../research/20251013-a11y-remediation-100pct-research.md (Lines 46-60) - Labels/Names priority cluster
- Dependencies:
  - Task 1.1 completion (lint rules will enforce patterns)

## Phase 2: Detect issues via automated tests

### Task 2.1: Expand cypress-axe checks to include moderate/minor on priority pages and enforce failure on violations

Broaden the Axe impact levels we fail on for select flows (login, dashboard, contacts, schedule page, customer portal). Keep critical/serious globally, add moderate/minor for these flows. Ensure our custom accessibility-commands compute and assert on impacts, not just log.

- Files:
  - frontend/cypress/e2e/accessibility-audit.cy.js - Update checks to include moderate/minor for priority routes
  - frontend/cypress/support/accessibility-commands.js - Enforce failure behavior when any violations found for selected scopes
- Success:
  - Cypress a11y suite fails when any impact level violations occur on priority pages
  - Reduced flake by waiting for ready selectors before axe execution
- Research References:
  - #file:../research/20251013-a11y-remediation-100pct-research.md (Lines 17-33, 62-88) - Existing Cypress a11y setup and recommended expansion
- Dependencies:
  - Existing cypress-axe integration

### Task 2.2: Implement concrete color contrast assertions (replace placeholders)

Replace placeholder/console-based contrast checks with deterministic assertions using a small color library to compute WCAG contrast ratios. Target status badges, buttons, and alert banners in common components.

- Files:
  - frontend/cypress/support/accessibility-commands.js - Add assertContrast(selector, minRatio) using a color library
  - frontend/package.json - Add devDependency color@^4 or tinycolor2/chroma-js; wire into tests
- Success:
  - Cypress tests compute contrast and fail when below 4.5:1 (text) and 3:1 (large text/icons) on tested elements
  - Documented exceptions (brand palettes) include alternate states/high-contrast media queries
- Research References:
  - #file:../research/20251013-a11y-remediation-100pct-research.md (Lines 62-88) - Contrast plan; #fetch WCAG 1.4.3
- Dependencies:
  - Task 2.1 (foundation for a11y checks)

### Task 2.3: Strengthen jest/dom a11y tests with jest-axe helpers

Ensure component-level tests consistently call axe and assert toHaveNoViolations using our shared test-utils; add landmark and heading structure checks for app shell components rendered in Jest.

- Files:
  - frontend/src/__tests__/helpers/test-utils.jsx - Add helpers to validate landmarks (main, banner, contentinfo) and page title/heading existence
  - frontend/src/components/__tests__/* - Adopt helper in 3-5 representative suites that currently warn
- Success:
  - Jest logs show no a11y warnings; violations surface as test failures which are then fixed
  - Shared helpers reduce duplicated checks across suites
- Research References:
  - #file:../research/20251013-a11y-remediation-100pct-research.md (Lines 12-16, 89-118) - jest-axe usage and validation approach
- Dependencies:
  - None (uses existing jest-axe setup)

## Phase 3: Validate & remediate component patterns

### Task 3.1: Ensure global layout landmarks and titles

Confirm base layout renders unique banner, main, and contentinfo landmarks, exposes a skip-to-content link, and sets document titles per route.

- Files:
  - frontend/src/App.jsx - Verify/adjust landmarks and SkipLink component
  - frontend/src/components/SkipLink.jsx - New component if missing
  - frontend/src/index.html or React Helmet usage - Ensure <title> per route and <html lang> from i18n
- Success:
  - Axe rules region, bypass, page-has-heading-one, and document-title satisfied on core routes
- Research References:
  - #file:../research/20251013-a11y-remediation-100pct-research.md (Lines 62-88) - Landmarks/Structure cluster
- Dependencies:
  - None

### Task 3.2: Focus visibility and modal focus management

Guarantee high-visibility focus styles across interactive elements and verified focus trap/restore behavior for dialogs.

- Files:
  - frontend/src/styles/*.css - Ensure :focus-visible styles meet contrast/visibility requirements
  - frontend/src/components/Modal*.jsx - Verify focus trap, aria-modal, aria-labelledby; restore focus on close
- Success:
  - Cypress keyboard navigation and focus trap tests pass without warnings
  - Axe focus-visible and no-keyboard-trap rules satisfied
- Research References:
  - #file:../research/20251013-a11y-remediation-100pct-research.md (Lines 62-88)
- Dependencies:
  - Task 2.1 (tests will verify)

### Task 3.3: Data tables and charts accessibility

Ensure data tables have proper headers associations and charts provide accessible data tables or text summaries.

- Files:
  - frontend/src/components/*List.jsx - Verify table semantics (scope, headers, caption)
  - frontend/src/components/charts/* - Ensure offscreen table/summaries are present
- Success:
  - Axe table rules pass; no headings or table association warnings in tests
- Research References:
  - #file:../research/20251013-a11y-remediation-100pct-research.md (Lines 62-88)
- Dependencies:
  - None

## Dependencies

- eslint-plugin-jsx-a11y (new)
- cypress-axe (already present)
- color/chroma-js or similar library for contrast calculations (new)

## Success Criteria

- 0 critical/serious axe violations across audited pages; priority pages also free of moderate/minor
- Lighthouse accessibility score >= 0.9 for audited routes
- ESLint a11y rules pass across src and tests; CI blocks regressions
- Jest a11y helpers report no warnings; violations are fixed or tests fail until fixed
