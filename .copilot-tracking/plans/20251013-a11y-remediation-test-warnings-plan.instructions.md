---
applyTo: '.copilot-tracking/changes/20251013-a11y-remediation-test-warnings-changes.md'
---
<!-- markdownlint-disable-file -->
# Task Checklist: Accessibility test warnings remediation

## Overview

Remediate accessibility warnings seen during Jest and Cypress runs by preventing issues with static linting, expanding automated detection, and validating key component patterns.

## Objectives

- Add static a11y linting to prevent regressions
- Expand automated tests to fail on violations and compute contrast

## Research Summary

### Project Files
- frontend/eslint.config.js - Current ESLint lacks jsx-a11y plugin
- frontend/cypress/support/accessibility-commands.js - Rich a11y helpers exist; add enforcement and contrast checks
- frontend/lighthouserc.json - CI asserts accessibility score >= 0.9

### External References
- #file:../research/20251013-a11y-remediation-100pct-research.md - Comprehensive a11y remediation plan and WCAG/axe mapping
- #fetch:https://dequeuniversity.com/rules/axe/4.8 - Axe rules and WCAG mapping

### Standards References
- #file:../../docs/DEVELOPMENT.md - Project development conventions relevant to component updates

## Implementation Checklist

### [x] Phase 1: Prevent issues with static linting

- [x] Task 1.1: Add eslint-plugin-jsx-a11y and enable recommended rules
  - Details: .copilot-tracking/details/20251013-a11y-remediation-test-warnings-details.md (Lines 9-28)

- [x] Task 1.2: Standardize form labeling patterns and utilities
  - Details: .copilot-tracking/details/20251013-a11y-remediation-test-warnings-details.md (Lines 30-49)

### [x] Phase 2: Detect issues via automated tests

- [x] Task 2.1: Expand cypress-axe checks to include moderate/minor on priority pages
  - Details: .copilot-tracking/details/20251013-a11y-remediation-test-warnings-details.md (Lines 51-72)

- [x] Task 2.2: Implement concrete color contrast assertions
  - Details: .copilot-tracking/details/20251013-a11y-remediation-test-warnings-details.md (Lines 74-96)

- [x] Task 2.3: Strengthen jest/dom a11y tests with jest-axe helpers
  - Details: .copilot-tracking/details/20251013-a11y-remediation-test-warnings-details.md (Lines 98-118)

### [x] Phase 3: Validate & remediate component patterns

- [x] Task 3.1: Ensure global layout landmarks and titles
  - Details: .copilot-tracking/details/20251013-a11y-remediation-test-warnings-details.md (Lines 120-138)

- [x] Task 3.2: Focus visibility and modal focus management
  - Details: .copilot-tracking/details/20251013-a11y-remediation-test-warnings-details.md (Lines 140-159)

- [x] Task 3.3: Data tables and charts accessibility (Dashboard tables updated; WorkOrderList updated; Contacts, Deals, and DealsByStageChart updated)
  - Details: .copilot-tracking/details/20251013-a11y-remediation-test-warnings-details.md (Lines 161-178)

## Dependencies

- eslint-plugin-jsx-a11y
- cypress-axe

## Success Criteria

- Zero axe violations on priority flows; no warnings in Jest a11y helpers
- Lighthouse accessibility score >= 0.9 across audited routes
- ESLint a11y rules clean across src and tests
