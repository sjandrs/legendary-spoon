<!-- markdownlint-disable-file -->
# Task Details: Phase 3 — Technician & User Management Frontend (Phase 4A)

## Research Reference

**Source Research**: .copilot-tracking/research/20251012-phase-3-technician-user-management-frontend-research.md

## Phase 1: Core Technician Components & API Integration

### Task 1.1: Extend API client with Phase 4 endpoints

Extend the centralized API client to support all technician and user management endpoints with proper error handling and loading states.

- **Files**:
  - frontend/src/api.js - Add technician management API methods
- **Success**:
  - All Phase 4 endpoints accessible via api.technicians, api.certifications, api.enhancedUsers methods
  - Proper error handling and response validation for all new endpoints
- **Research References**:
  - .copilot-tracking/research/20251012-phase-3-technician-user-management-frontend-research.md (Lines 16-26) - Backend API inventory
  - main/api_views.py (Lines 2122-2220) - TechnicianViewSet and CertificationViewSet implementation
- **Dependencies**:
  - Existing API client structure and authentication patterns

### Task 1.2: Create TechnicianList component with virtualization and filtering

Build a performant technician list component with search, filtering, and role-based data access.

- **Files**:
  - frontend/src/components/TechnicianList.jsx - Main list component
  - frontend/src/components/TechnicianList.css - Styling for list layout
- **Success**:
  - Virtualized list handling 100+ technicians smoothly
  - Real-time search by name, employee_id, phone
  - Filtering by is_active, hire_date, base_hourly_rate
  - RBAC enforcement (Sales Reps see only their technicians)
- **Research References**:
  - .copilot-tracking/research/20251012-phase-3-technician-user-management-frontend-research.md (Lines 64-74) - Component architecture recommendations
  - main/api_views.py (Lines 2142-2190) - TechnicianViewSet with filtering implementation
- **Dependencies**:
  - Task 1.1 completion (API client extensions)

### Task 1.3: Build TechnicianDetail component with photo upload and certifications display

Create detailed technician profile view with photo management and certification overview.

- **Files**:
  - frontend/src/components/TechnicianDetail.jsx - Profile display component
  - frontend/src/components/TechnicianDetail.css - Profile layout styling
- **Success**:
  - Complete technician profile display with all fields
  - Photo upload functionality with preview and validation
  - Certifications overview with expiration status indicators
  - Coverage areas display with map preview
- **Research References**:
  - .copilot-tracking/research/20251012-phase-3-technician-user-management-frontend-research.md (Lines 34-44) - Frontend patterns for complex UIs
  - main/models.py - Technician model structure with all relationships
- **Dependencies**:
  - Task 1.1 completion (API client extensions)

### Task 1.4: Implement TechnicianForm component with validation and error handling

Build comprehensive form component for creating and editing technician profiles.

- **Files**:
  - frontend/src/components/TechnicianForm.jsx - Form component with validation
  - frontend/src/components/TechnicianForm.css - Form styling and layout
- **Success**:
  - Complete form handling for all technician fields
  - Client-side validation with proper error display
  - Server error integration with field-specific messaging
  - Optimistic updates for better user experience
- **Research References**:
  - .copilot-tracking/research/20251012-phase-3-technician-user-management-frontend-research.md (Lines 34-44) - Form libraries and validation patterns
  - main/serializers.py - TechnicianSerializer validation rules
- **Dependencies**:
  - Task 1.1 completion (API client extensions)

## Phase 2: Advanced Features & User Management

### Task 2.1: Create CertificationDashboard with expiration tracking

Build a comprehensive dashboard for managing technician certifications with renewal workflows.

- **Files**:
  - frontend/src/components/CertificationDashboard.jsx - Dashboard component
  - frontend/src/components/CertificationDashboard.css - Dashboard styling
- **Success**:
  - Expiration alerts with color-coded status indicators
  - Certification renewal workflow with form integration
  - Filtering by category, tech_level, and expiration status
  - Bulk operations for certification management
- **Research References**:
  - .copilot-tracking/research/20251012-phase-3-technician-user-management-frontend-research.md (Lines 45-55) - Accessibility and performance considerations
  - main/api_views.py (Lines 2122-2140) - CertificationViewSet with filtering
- **Dependencies**:
  - Task 1.1 completion (API client extensions)

### Task 2.2: Build AvailabilityCalendar with FullCalendar integration

Implement interactive calendar for managing technician availability schedules.

- **Files**:
  - frontend/src/components/AvailabilityCalendar.jsx - Calendar component
  - frontend/src/components/AvailabilityCalendar.css - Calendar styling
- **Success**:
  - FullCalendar integration with drag-and-drop functionality
  - Weekly availability view with time slot management
  - Real-time availability updates and conflict detection
  - WCAG 2.1 AA compliant calendar interface
- **Research References**:
  - .copilot-tracking/research/20251012-phase-3-technician-user-management-frontend-research.md (Lines 34-44) - FullCalendar patterns and accessibility
  - main/models.py - TechnicianAvailability model structure
- **Dependencies**:
  - Task 1.1 completion (API client extensions)
  - FullCalendar library installation

### Task 2.3: Implement OrgChart component with multiple view modes

Create organization chart visualization with interactive hierarchy management.

- **Files**:
  - frontend/src/components/OrgChart.jsx - Organization chart component
  - frontend/src/components/OrgChart.css - Chart visualization styling
- **Success**:
  - Tree view with expandable/collapsible nodes
  - Grid and list view modes for different use cases
  - Drag-and-drop reorganization capability
  - Keyboard navigation support for accessibility
- **Research References**:
  - .copilot-tracking/research/20251012-phase-3-technician-user-management-frontend-research.md (Lines 34-44) - Organization chart libraries
  - main/api_views.py (Lines 2460-2510) - EnhancedUserViewSet hierarchy methods
- **Dependencies**:
  - Task 1.1 completion (API client extensions)
  - Organization chart library selection and installation

### Task 2.4: Create CoverageAreaMap for interactive territory management

Build interactive map component for managing technician service territories.

- **Files**:
  - frontend/src/components/CoverageAreaMap.jsx - Map component
  - frontend/src/components/CoverageAreaMap.css - Map styling
- **Success**:
  - Interactive map with territory drawing/editing capabilities
  - Technician assignment to coverage areas
  - Geographical search and filtering
  - Mobile-responsive map interface
- **Research References**:
  - .copilot-tracking/research/20251012-phase-3-technician-user-management-frontend-research.md (Lines 34-44) - Map libraries and performance
  - main/models.py - CoverageArea model with geographic data
- **Dependencies**:
  - Task 1.1 completion (API client extensions)
  - Map library selection and installation (Leaflet/Mapbox)

## Phase 3: Testing & Navigation Integration

### Task 3.1: Add Jest/RTL component tests for all technician components

Create comprehensive unit and integration tests for all technician management components.

- **Files**:
  - frontend/src/components/__tests__/TechnicianList.test.jsx - List component tests
  - frontend/src/components/__tests__/TechnicianDetail.test.jsx - Detail component tests
  - frontend/src/components/__tests__/TechnicianForm.test.jsx - Form component tests
  - frontend/src/components/__tests__/CertificationDashboard.test.jsx - Dashboard tests
- **Success**:
  - 100% test coverage for all new components
  - API integration tests with MSW mocking
  - Error scenario testing with proper error boundary validation
  - Performance testing for virtualized components
- **Research References**:
  - .copilot-tracking/research/20251012-phase-3-technician-user-management-frontend-research.md (Lines 76-86) - Testing strategy and patterns
  - frontend/src/setupTests.js - Jest configuration and testing utilities
- **Dependencies**:
  - All Phase 1 and Phase 2 components completed
  - MSW configuration for API mocking

### Task 3.2: Create Cypress E2E tests for complete workflows

Build end-to-end tests covering complete technician management workflows.

- **Files**:
  - frontend/cypress/e2e/technician-management.cy.js - E2E workflow tests
  - frontend/cypress/fixtures/technician-data.json - Test data fixtures
- **Success**:
  - Complete create/edit/delete technician workflows tested
  - Certification management workflows validated
  - RBAC testing with different user roles
  - Cross-browser compatibility validation
- **Research References**:
  - .copilot-tracking/research/20251012-phase-3-technician-user-management-frontend-research.md (Lines 76-86) - E2E testing patterns
  - frontend/cypress/e2e/ - Existing E2E test patterns
- **Dependencies**:
  - All Phase 1 and Phase 2 components completed
  - Cypress configuration and test data setup

### Task 3.3: Integrate technician management into main navigation

Add technician management routes and navigation to the main application.

- **Files**:
  - frontend/src/App.jsx - Add technician management routes
  - frontend/src/components/Navigation.jsx - Add navigation menu items
- **Success**:
  - Technician management accessible from main navigation
  - Proper route protection based on user roles
  - Navigation breadcrumbs and active state indicators
  - Mobile-responsive navigation integration
- **Research References**:
  - .copilot-tracking/research/20251012-phase-3-technician-user-management-frontend-research.md (Lines 64-74) - State management patterns
  - frontend/src/App.jsx - Existing routing and navigation patterns
- **Dependencies**:
  - All Phase 1 and Phase 2 components completed

### Task 3.4: Add accessibility testing with cypress-axe

Implement comprehensive accessibility testing for all new components.

- **Files**:
  - frontend/cypress/e2e/technician-accessibility.cy.js - Accessibility tests
  - frontend/src/utils/a11yHelpers.js - Accessibility utility functions
- **Success**:
  - WCAG 2.1 AA compliance validated for all components
  - Keyboard navigation tested and functional
  - Screen reader compatibility verified
  - Color contrast and focus management validated
- **Research References**:
  - .copilot-tracking/research/20251012-phase-3-technician-user-management-frontend-research.md (Lines 45-55) - Accessibility best practices
  - frontend/cypress/support/commands.js - Existing accessibility testing patterns
- **Dependencies**:
  - All Phase 1 and Phase 2 components completed
  - cypress-axe installation and configuration

## Dependencies

- React 18 with Hooks for modern component patterns
- FullCalendar React library for availability scheduling
- Map library (Leaflet or Mapbox) for coverage area management
- React Hook Form for complex form validation and error handling

## Success Criteria

- Complete frontend implementation for all Phase 4 backend APIs
- Comprehensive testing coverage with Jest/RTL and Cypress E2E
- WCAG 2.1 AA accessibility compliance across all components
- Performance optimization for large data sets with virtualization
