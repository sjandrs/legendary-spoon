<!-- markdownlint-disable-file -->
# Task Research: Phase 3 — Technician & User Management Frontend (Phase 4A)

Date: 2025-10-12
Owner: Platform Engineering

## Research Executed

### Internal File Analysis
- main/models.py → Technician, EnhancedUser, Certification, CoverageArea, TechnicianAvailability, TechnicianCertification models confirmed
- main/api_views.py → TechnicianViewSet, EnhancedUserViewSet, CertificationViewSet, CoverageAreaViewSet, TechnicianAvailabilityViewSet, TechnicianCertificationViewSet complete with filtering/search/ordering
- main/serializers.py → Complete serializers for all technician/user management entities
- main/api_urls.py → Router registration for technicians, enhanced-users, certifications, coverage-areas, technician-availability endpoints
- main/tests/ → Phase 4 tests exist for technician lifecycle, certification, user hierarchy (validated in TESTING_STATUS.md)
- docs/API.md → Technician & User Management API section with complete endpoint documentation

### External Research and Frontend Patterns
- React component patterns for complex UIs:
  - FullCalendar integration for availability scheduling (drag-and-drop support)
  - Map libraries (Leaflet/Mapbox) for coverage area visualization
  - Organization chart visualization (react-orgchart, d3-hierarchy)
  - Form libraries (React Hook Form) for complex nested forms
- Accessibility best practices:
  - WCAG 2.1 AA compliance for calendar interfaces
  - Screen reader support for drag-and-drop operations
  - Keyboard navigation for org charts and maps
- Performance considerations:
  - Virtualization for large technician lists
  - Memoization for expensive hierarchy calculations
  - Lazy loading for map tiles and data

### Concrete Code Examples (verified from backend)
```python
# Technician availability filtering (from TechnicianViewSet)
@action(detail=False, methods=["get"])
def available(self, request):
    """Filter technicians by availability"""
    date = request.query_params.get('date')
    start_time = request.query_params.get('start_time')
    end_time = request.query_params.get('end_time')
    # Implementation returns available technicians
```

```python
# User hierarchy traversal (from EnhancedUserViewSet)
@action(detail=True, methods=["get"])
def hierarchy(self, request, pk=None):
    """Get full hierarchy tree for a user"""
    # Returns nested subordinate structure
```

### Project Structure Analysis (current repo)
- Backend APIs (complete):
  - GET/POST /api/technicians/ (with filtering by is_active, hire_date, base_hourly_rate)
  - GET/POST /api/certifications/ (with filtering by category, tech_level, requires_renewal)
  - GET/POST /api/technician-certifications/ (join table management)
  - GET/POST /api/coverage-areas/ (geographic service territories)
  - GET/POST /api/technician-availability/ (weekly schedules + time windows)
  - GET/POST /api/enhanced-users/ (hierarchy management with manager-subordinate relationships)
- Permission model: IsAuthenticated base; Sales Reps see only their technicians; Managers see all
- Search/filtering implemented with DjangoFilterBackend and standard DRF patterns

### Specifications and Contracts
- JSON Schemas: draft-07 for Technician and EnhancedUser (see .copilot-tracking/research/20251011-technician-staff-schemas-research.md)
- API response shapes follow canonical pagination {count,next,previous,results}
- RBAC: Role-based filtering implemented in viewset get_queryset() methods

## Technical Requirements for Phase 3
1) React components for technician profile management (list/detail/edit with photo upload capability)
2) Certification dashboard with expiration tracking and renewal workflows
3) Interactive coverage area map management (create/edit service territories)
4) Availability calendar with drag-and-drop weekly scheduling
5) Organization chart visualization (tree/grid/list view modes)
6) Real-time status updates via polling/WebSocket (config-driven)
7) Jest/RTL component tests for all major interactions
8) Cypress E2E tests for create/edit workflows with a11y validation
9) API integration with robust loading/error states throughout

## Frontend Architecture Recommendations
- Component structure:
  - TechnicianList.jsx → virtualized list with search/filters
  - TechnicianDetail.jsx → profile view with photo, certifications, coverage areas
  - TechnicianForm.jsx → create/edit technician with validation
  - CertificationDashboard.jsx → expiration alerts, renewal tracking
  - CoverageAreaMap.jsx → interactive map for territory management
  - AvailabilityCalendar.jsx → FullCalendar with custom drag-and-drop
  - OrgChart.jsx → hierarchical visualization with multiple view modes
  - EnhancedUserList.jsx → user management with hierarchy context
- State management: React Context for technician/user data, URL state for filters
- API integration: Extend frontend/src/api.js with all Phase 4 endpoints
- Testing: Jest for component behavior, MSW for API mocking, Cypress for E2E flows

## Implementation Guidance (by area)
- Backend Dependencies: All APIs implemented and tested (verified in codebase)
- Frontend Development:
  - Implement progressive enhancement (basic lists first, then advanced features)
  - Use loading skeletons and error boundaries throughout
  - Implement optimistic updates for better UX
  - Add proper TypeScript types for all API responses
- Testing Strategy:
  - Unit tests for data transformations and business logic
  - Integration tests for API interactions
  - E2E tests for complete user workflows
  - Accessibility tests with cypress-axe
- Documentation: Update frontend component docs and API integration examples

## Sources and Cross-Refs
- Backend implementation: main/api_views.py (TechnicianViewSet, EnhancedUserViewSet, etc.)
- Prior research: #file:../research/20251011-technician-staff-schemas-research.md
- Specs: spec/spec-design-phase4-technician-user-management.md
- API docs: docs/API.md → Technician & User Management API section
- Phase 4A spec: spec/spec-design-phase4a-react-frontend.md
