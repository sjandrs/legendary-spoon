---
applyTo: '.copilot-tracking/changes/20251013-msw-esm-setup-fix-changes.md'
---
<!-- markdownlint-disable-file -->
# Task Checklist: MSW ESM import setup fix

## Overview

Eliminate MSW import warnings by switching the Jest setup to ESM-based MSW integration and, if needed, add a resolver mapping to ensure clean resolution in all environments.

## Objectives

- Replace CommonJS require usage with ESM imports for MSW in `setupTests.js` and wire lifecycle hooks
- Ensure no "MSW import failed" warnings appear during frontend tests

## Research Summary

### Project Files
- frontend/src/setupTests.js - Current MSW setup using require with a fallback branch producing warnings
- frontend/jest.config.js - Jest configuration referencing the setup file and transforms

### External References
- #file:../research/20251013-msw-fallback-and-test-warnings-research.md - ESM-first MSW integration guidance and Jest ESM considerations


## Implementation Checklist

### [x] Phase 1: Switch setupTests to ESM MSW imports

- [x] Task 1.1: Replace require with ESM imports and wire server lifecycle
  - Details: .copilot-tracking/details/20251013-msw-esm-setup-fix-details.md (Lines 10-39)

- [x] Task 1.2: Provide minimal compatibility fallback (optional) and expose msw globals
  - Details: .copilot-tracking/details/20251013-msw-esm-setup-fix-details.md (Lines 41-59)

### [x] Phase 2: Ensure Jest resolution compatibility (only if needed)

- [x] Task 2.1: Add moduleNameMapper for 'msw/node' and verify transforms
  - Details: .copilot-tracking/details/20251013-msw-esm-setup-fix-details.md (Lines 63-79)

## Dependencies

- Jest 29 with babel-jest
- MSW 2.x

## Success Criteria

- No MSW import failure warnings during tests
- MSW handlers active via server.listen without fallback
