<!-- markdownlint-disable-file -->
# Task Details: Comprehensive Test Failure Fixes for 100% Pass Rate

## Research Reference

**Source Research**: #file:../research/20251012-comprehensive-test-failure-analysis-research.md

## Phase 1: Critical Backend Model Constraint Verification & Fixes

### Task 1.1: Fix Deal.stage_id Assignment Logic

Resolve Deal model stage_id NOT NULL constraint failures affecting 7 tests with a verification-first approach: confirm the default stage assignment in `Deal.save()` is executed during test object creation and only enhance paths that bypass it if failures persist.

- **Files**:
  - main/models.py (Deal.save method) - Verify default stage assignment exists and is active
  - Tests/factories/serializers that create Deal objects - Patch only if they bypass `save()` and cause failures
- **Success**:
  - All Deal creation in tests automatically assigns a valid stage_id
  - Tests in test_permissions_deeper.py, test_preview_migration_0032.py, test_search_and_routes.py, test_serializer_backcompat.py pass
- **Research References**:
  - #file:../research/20251012-comprehensive-test-failure-analysis-research.md (Lines 71-93) - Deal.stage_id constraint analysis and solution
- **Dependencies**:
  - DealStage model with proper ordering
  - Deal model save method modification

### Task 1.2: Resolve ScheduledEvent.technician_id Constraint Issues

Use verification-first: `ScheduledEventManager.create()` attempts to ensure a technician exists (and creates a default technician if none). Confirm this manager path is exercised by tests; if NOT NULL failures remain, augment the specific test setup/factory to create or pass a technician rather than duplicating model logic.

- **Files**:
  - main/tests/test_activity_log.py - Update test setup to include technician creation when needed
  - main/tests/test_activity_log_projects_events.py - Ensure manager create() path is used or provide technician explicitly
  - main/models.py (ScheduledEventManager.create) - Verify the default technician fallback exists
- **Success**:
  - All ScheduledEvent creation tests pass without technician_id constraint errors
  - Test methods test_inventory_consume_logs_activity and test_event_reschedule_and_complete_logs_activity pass
- **Research References**:
  - #file:../research/20251012-comprehensive-test-failure-analysis-research.md (Lines 94-105) - ScheduledEvent.technician_id constraint analysis
- **Dependencies**:
  - Technician model available for test data creation
  - Test setup methods enhanced with proper model creation

### Task 1.3: Fix DigitalSignature.content_type_id Default Assignment

Verification-first: This is already implemented in `DigitalSignature.save()` (defaults for `object_id`, `content_type` to WorkOrder, and `ip_address`). Validate with tests; no code changes unless failures prove otherwise.

- **Files**:
  - main/models.py (DigitalSignature.save) - Verify defaults are set as expected
- **Success**:
  - DigitalSignature creation without explicit content_type succeeds
  - Test method test_signature_verify_logs_activity passes
- **Research References**:
  - #file:../research/20251012-comprehensive-test-failure-analysis-research.md (Lines 106-117) - DigitalSignature.content_type_id constraint solution
- **Dependencies**:
  - ContentType framework available
  - WorkOrder model as default content_type reference

### Task 1.4: Add BudgetV2 Post-Save Signal for Distribution Seeding

Verification-first: The post_save signal `seed_budget_distributions` already seeds 12 `MonthlyDistribution` rows on create. Confirm it runs and totals 100.00; ensure there are no duplicate seeding paths (keep the signal as the single source of truth).

- **Files**:
  - main/signals.py - Verify `seed_budget_distributions` exists and is imported
  - main/apps.py - Ensure signals are imported
- **Success**:
  - BudgetV2 creation automatically creates 12 MonthlyDistribution records
  - Test method test_seed_default_distribution passes with len(rows) == 12
- **Research References**:
  - #file:../research/20251012-comprehensive-test-failure-analysis-research.md (Lines 135-147) - BudgetV2 seeding solution with signal implementation
- **Dependencies**:
  - Django signals framework
  - MonthlyDistribution model for record creation

## Phase 2: Backend API Authentication and URL Pattern Fixes

### Task 2.1: Fix URL Name Mismatch in Activity Log Tests

Correct the URL name reference in activity log tests from 'send_invoice_email' to the actual pattern 'send-invoice-email'.

- **Files**:
  - main/tests/test_activity_log.py (line 38) - Update reverse() call to use correct URL name
- **Success**:
  - Test method test_send_invoice_email_logs_activity resolves URL correctly
  - No more NoReverseMatch exceptions for invoice email endpoint
- **Research References**:
  - #file:../research/20251012-comprehensive-test-failure-analysis-research.md (Lines 118-127) - URL pattern name mismatch analysis
- **Dependencies**:
  - main/api_urls.py URL pattern 'send-invoice-email' exists (verified)

### Task 2.2: Verify JsonSchema Dependency for Dev Validator

Verify `jsonschema` is installed (present in `requirements.txt`) and that the dev validator endpoint behaves correctly in DEBUG mode; prevent 501 Not Implemented responses.

- **Files**:
  - requirements.txt - Confirm `jsonschema` dependency exists
  - main/api_views.py (dev_validate_json function) - Verify behavior under DEBUG
- **Success**:
  - Dev validator endpoints return 200 OK with proper validation results
  - Test methods test_validate_json_happy_path and test_validate_json_returns_errors_when_invalid pass
- **Research References**:
  - #file:../research/20251012-comprehensive-test-failure-analysis-research.md (Lines 128-134) - Dev validator implementation analysis
- **Dependencies**:
  - Python jsonschema library installation
  - Schema files in .copilot-tracking/research/ directory (already exist)

### Task 2.3: Fix Account API Authentication Enforcement

Verification-first: Confirm `AccountViewSet` requires authentication (e.g., `IsAuthenticated`). If unauthenticated requests erroneously return 200, update permission classes accordingly and validate with tests.

- **Files**:
  - main/api_views.py (AccountViewSet) - Verify permission classes enforce auth
  - main/permissions.py - Ensure proper permission classes are defined and used
- **Success**:
  - Unauthenticated requests to Account API return 401 status code
  - Test method test_unauthenticated_401_accounts passes with proper error response
- **Research References**:
  - #file:../research/20251012-comprehensive-test-failure-analysis-research.md (Lines 148-155) - Account API authentication bypass analysis
- **Dependencies**:
  - Django REST Framework authentication classes
  - Proper permission class configuration

## Phase 3: Frontend Component Structure and Accessibility Fixes

### Task 3.1: Fix CertificationDashboard Heading Structure

Add the missing "Overview" heading section and ensure proper semantic structure to match test expectations.

- **Files**:
  - frontend/src/components/CertificationDashboard.jsx (or equivalent) - Add Overview h2 heading and restructure component
- **Success**:
  - Component renders h1 "Certification Dashboard", h2 "Overview", and h2 "Certifications" headings
  - Test method 'has proper heading structure' passes with all expected headings found
  - Proper semantic HTML structure for accessibility
- **Research References**:
  - #file:../research/20251012-comprehensive-test-failure-analysis-research.md (Lines 162-185) - CertificationDashboard structure analysis and solution
- **Dependencies**:
  - React component restructuring
  - CSS class maintenance for styling

### Task 3.2: Add Missing Accessibility Attributes and ARIA Labels

Enhance CertificationDashboard and related components with proper ARIA labels, screen reader support, and accessibility compliance.

- **Files**:
  - frontend/src/components/CertificationDashboard.jsx (or equivalent) - Add ARIA attributes and screen reader text
  - frontend/src/components/BlogPostList.jsx - Fix accessibility issues
  - frontend/src/components/NotificationCenter.jsx - Add proper ARIA labeling
- **Success**:
  - Screen reader friendly status indicators with proper text alternatives
  - ARIA labels for interactive elements and status information
  - Test method 'provides screen reader friendly status indicators' passes
- **Research References**:
  - #file:../research/20251012-comprehensive-test-failure-analysis-research.md (Lines 186-205) - Accessibility requirements and WCAG compliance
- **Dependencies**:
  - WCAG 2.1 AA compliance guidelines
  - React accessibility best practices

### Task 3.3: Expand MSW Handler Coverage for Missing API Endpoints

Add comprehensive MSW handlers for all API endpoints used in tests to prevent network request failures and improve test reliability.

- **Files**:
  - frontend/src/__tests__/utils/msw-handlers.js - Add missing endpoint handlers
  - frontend/src/setupTests.js - Ensure comprehensive mock coverage
  - frontend/src/__tests__/components/*.test.jsx - Update tests to use proper mock responses
- **Success**:
  - All API endpoints used in tests have corresponding MSW handlers
  - Reduced test failures due to unmocked network requests
  - Improved test reliability and consistency
- **Research References**:
  - #file:../research/20251012-comprehensive-test-failure-analysis-research.md (Lines 206-215) - MSW handler coverage analysis
- **Dependencies**:
  - MSW 2.11.3 with http.* API patterns
  - Consistent mock data structures

## Phase 4: Test Infrastructure and Component Lifecycle Optimization

### Task 4.1: Enhance Test Data Factory Constraint Handling

Improve test data factories and setup methods to properly handle model constraints and create valid test objects consistently.

- **Files**:
  - frontend/src/__tests__/helpers/test-utils.jsx - Enhance mock data validation
  - main/tests/ (various test files) - Update test setup methods for proper model creation
- **Success**:
  - Test data factories create valid objects respecting all model constraints
  - Reduced test failures due to invalid test data setup
  - Consistent test object creation patterns
- **Research References**:
  - #file:../research/20251012-comprehensive-test-failure-analysis-research.md (Lines 220-235) - Test data factory improvements
- **Dependencies**:
  - Model constraint awareness in test factories
  - Proper foreign key and required field handling

### Task 4.2: Optimize Async Test Patterns and Component Mounting

Improve async test patterns with proper waitFor usage, component lifecycle management, and async state handling.

- **Files**:
  - frontend/src/__tests__/components/CertificationDashboard.test.jsx - Fix async patterns
  - frontend/src/__tests__/integration/business-workflows.test.jsx - Improve component interaction tests
  - Multiple component test files - Standardize async testing patterns
- **Success**:
  - Proper async/await patterns in all component tests
  - Consistent use of waitFor for DOM updates and state changes
  - Reduced flaky tests due to timing issues
- **Research References**:
  - #file:../research/20251012-comprehensive-test-failure-analysis-research.md (Lines 236-250) - Async test pattern optimization
- **Dependencies**:
  - React Testing Library best practices
  - Proper async component testing patterns

### Task 4.3: Fix Business Workflow Integration Test Patterns

Resolve component interaction failures in business workflow tests by improving component communication and state management patterns.

- **Files**:
  - frontend/src/__tests__/integration/business-workflows.test.jsx - Fix component interaction patterns
  - frontend/src/components/ (various components) - Ensure proper prop passing and event handling
- **Success**:
  - Business workflow integration tests pass with proper component communication
  - State management between components works correctly in tests
  - Component interaction patterns are consistent and reliable
- **Research References**:
  - #file:../research/20251012-comprehensive-test-failure-analysis-research.md (Lines 251-265) - Business workflow test analysis
- **Dependencies**:
  - Component interaction patterns
  - State management consistency

## Phase 5: Validation and Performance Verification

### Task 5.1: Run Complete Test Suite Validation

Execute comprehensive test suite validation to ensure all fixes work correctly and no regressions are introduced.

- **Files**:
  - All backend and frontend test files - Comprehensive execution and validation
  - CI/CD pipeline configuration - Ensure proper test execution environment
- **Success**:
  - Backend test pass rate: 100% (139/139 tests passing)
  - Frontend test pass rate: 100% (1959/1959 tests passing)
  - No test regressions introduced by fixes
- **Research References**:
  - #file:../research/20251012-comprehensive-test-failure-analysis-research.md (Lines 270-285) - Complete validation requirements
- **Dependencies**:
  - All previous phase completions
  - Proper test environment setup

### Task 5.2: Verify Accessibility Compliance and Component Performance

Validate that accessibility fixes meet WCAG 2.1 AA standards and component performance remains optimal.

- **Files**:
  - frontend/src/components/ (all components) - Accessibility validation
  - Test performance metrics - Component rendering and interaction performance
- **Success**:
  - All components meet WCAG 2.1 AA accessibility standards
  - Component performance remains within acceptable thresholds
  - Screen reader compatibility verified across all interactive elements
- **Research References**:
  - #file:../research/20251012-comprehensive-test-failure-analysis-research.md (Lines 286-300) - Accessibility compliance verification
- **Dependencies**:
  - WCAG 2.1 AA compliance tools
  - Component performance monitoring

## Dependencies

- Django 4.2+ with model signals and ContentType framework
- jsonschema library for dev validator endpoint functionality
- React Testing Library 16.0.0+ with proper async handling patterns
- MSW 2.11.3+ for comprehensive API endpoint mocking
- WCAG 2.1 AA compliance tools for accessibility validation

## Success Criteria

- Backend test pass rate: 100% (139/139 tests passing)
- Frontend test pass rate: 100% (1959/1959 tests passing)
- All model constraint failures resolved with proper defaults
- All component accessibility issues fixed with ARIA compliance
- Test infrastructure optimized for consistent execution
- No skipped tests and comprehensive error handling coverage
