<!-- markdownlint-disable-file -->
# Task Details: Implement Phase 7 Unimplemented Features

## Research Reference

**Source Research**: #file:../research/20251015-unimplemented-features-implementation-research.md

## Phase 1: Backend foundations (models, serializers, viewsets, actions)

### Task 1.1: Add CoverageShape model + serializer + viewset + routes

Implement a new JSON-backed geometry resource to persist polygon and circle shapes for coverage mapping, without introducing GeoDjango.

- Model: `CoverageShape(technician: FK -> Technician, name, description, area_type: choices['polygon','circle'], geometry: JSONField, color: CharField, priority_level: PositiveSmallInteger(1..3), properties: JSONField(default={}), is_active: bool, created_at)`
- Serializer: `CoverageShapeSerializer` with validation ensuring geometry matches area_type schema.
- ViewSet: `CoverageShapeViewSet` with filters: technician, is_active, area_type, priority_level, properties__service_types (contains), ordering by created_at/name.
- Router: register at `/api/coverage-shapes/`.
- Migrations and admin registration included.

- Files:
  - main/models.py - Add CoverageShape model
  - main/serializers.py - Add CoverageShapeSerializer
  - main/api_views.py - Add CoverageShapeViewSet with FilterSet/ordering
  - main/api_urls.py - Register route
  - main/admin.py - Register model (read-only list display defaults OK)
  - main/tests/test_coverage_shapes_api.py - CRUD + validation + filters tests
- Success:
  - POST/GET/PATCH/DELETE on `/api/coverage-shapes/` work
  - Validation rejects mismatched geometry for area_type
  - Filters work (technician, area_type, priority_level)
- Research References:
  - #file:../research/20251015-unimplemented-features-implementation-research.md (Lines 37-78) - Geometry storage and API plan
  - #fetch:https://docs.djangoproject.com/en/stable/ref/models/fields/#jsonfield - JSONField reference
  - #fetch:https://datatracker.ietf.org/doc/html/rfc7946 - GeoJSON guidance (adapted)
- Dependencies:
  - django-filter (already present and used); no GeoDjango required

### Task 1.2: Extend TechnicianViewSet with certification/level/status filters

Add django-filters for:
- `certification` (exact id on TechnicianCertification)
- `tech_level_min`/`tech_level_max` (Certification.tech_level range)
- `certification_status` in ['active','expired'] using TechnicianCertification properties
- `coverage_presence` boolean (has any active CoverageArea or CoverageShape)

- Files:
  - main/api_views.py - Add FilterSet and integrate with TechnicianViewSet
  - main/tests/test_technician_filters.py - Tests for filters and edge cases
- Success:
  - /api/technicians/?certification=ID filters by certification link
  - /api/technicians/?tech_level_min=2 filters correctly
  - /api/technicians/?certification_status=expired returns only expired
  - /api/technicians/?coverage_presence=true filters to technicians with areas or shapes
- Research References:
  - #file:../research/20251015-unimplemented-features-implementation-research.md (Lines 80-100) - Filters plan
  - #fetch:https://django-filter.readthedocs.io/en/stable/guide/rest_framework.html - DRF integration
- Dependencies:
  - django-filter

### Task 1.3: Add DigitalSignature PDF export action

Expose `GET /api/digital-signatures/{id}/pdf/` that generates and streams a PDF.
- Use `pdf_service.get_pdf_service()` to generate a service report that embeds the signature image (signature.signature_data as base64 PNG) and includes integrity info (document_hash).
- Return `FileResponse` with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="signature-<id>.pdf"`.

- Files:
  - main/api_views.py - Add @action(detail=True, methods=['get'], url_path='pdf') in DigitalSignatureViewSet
  - main/tests/test_digital_signature_pdf.py - Unit test that asserts 200 + application/pdf
- Success:
  - Download works and file opens; log entry created via existing log_activity
- Research References:
  - #file:../research/20251015-unimplemented-features-implementation-research.md (Lines 102-147) - DRF action + PDF service
  - #fetch:https://www.django-rest-framework.org/api-guide/viewsets/#marking-extra-actions-for-routing - DRF @action
  - #fetch:https://doc.courtbouillon.org/weasyprint/stable/ - WeasyPrint
- Dependencies:
  - WeasyPrint is optional; if not installed, respond 503 with helpful message (test expects 200 only when available)

## Phase 2: Frontend — CoverageAreaMap enhancements

### Task 2.1: Persist shapes to new endpoint and add circle drawing toggle

- Add area type toggle (polygon/circle) in UI; for circle, capture center + radius (meters) and preview via <Circle />.
- Persist via new `/api/coverage-shapes/` endpoints; keep existing ZIP coverage UI unchanged.

- Files:
  - frontend/src/components/CoverageAreaMap.jsx - Add toggle + radius control; update save handlers to call create/update coverage shapes
  - frontend/src/api.js - Add get/create/update/delete for coverage-shapes
  - frontend/src/__tests__/components/CoverageAreaMap.test.jsx - Add tests for circle save and polygon save with shape payloads
- Success:
  - Shapes round-trip; UI displays saved circle/polygon correctly
- Research References:
  - #file:../research/20251015-unimplemented-features-implementation-research.md (Lines 10-36, 149-186) - Frontend expectations and circle plan
  - #fetch:https://react-leaflet.js.org/docs/start-introduction/ - React Leaflet

### Task 2.2: Context menu + keyboard fallback for Edit/Delete

- Bind Leaflet 'contextmenu' to shapes; open a contextual UI (menu or popup) with Edit/Delete.
- Provide a parallel button in the list/popup to ensure keyboard accessibility; manage focus and aria roles.

- Files:
  - frontend/src/components/CoverageAreaMap.jsx - Add eventHandlers for contextmenu and accessible fallback controls
  - frontend/src/__tests__/components/CoverageAreaMap.test.jsx - Tests: right-click shows menu; keyboard path activates same actions
- Success:
  - Both pointer and keyboard paths available; a11y checks pass (labels/roles)
- Research References:
  - #fetch:https://leafletjs.com/reference.html#interactive-layer-contextmenu - Leaflet contextmenu
  - #fetch:https://react-leaflet.js.org/docs/start-introduction/ - React Leaflet patterns

### Task 2.3: Analytics sidebar + filters (priority, service types)

- Compute and display totals and priority distribution. Add filter panel that narrows displayed shapes and the list; persist filters in URL query.

- Files:
  - frontend/src/components/CoverageAreaMap.jsx - Add analytics panel and filters; synchronize with URL
  - frontend/src/__tests__/components/CoverageAreaMap.test.jsx - Tests for aggregates and filter behavior
- Success:
  - Aggregates reflect current data; filters narrow the set; URL reflects state
- Research References:
  - #file:../research/20251015-unimplemented-features-implementation-research.md (Lines 149-186) - Analytics + filters recommendations

## Phase 3: Frontend — Clustering & performance

### Task 3.1: Add supercluster-based clustering for markers/centroids

- Integrate supercluster for technician markers and shape centroids.
- Provide a11y announcements when clusters expand; ensure keyboard navigation to cluster expansion controls.

- Files:
  - frontend/src/components/CoverageAreaMap.jsx - Integrate clustering layer
  - frontend/src/__tests__/components/CoverageAreaMap.test.jsx - Simulate large datasets and assert clustering behavior (smoke + unit), include accessibility tests
- Success:
  - Smooth pan/zoom with >1k items; clustering enabled; a11y announcements present
- Research References:
  - #fetch:https://github.com/mapbox/supercluster - supercluster

## Phase 4: Frontend — TechnicianList virtualization and filters

### Task 4.1: Virtualize TechnicianList with react-window

- Use FixedSizeList; preserve semantics (role="list"/"listitem" or table semantics). Maintain focus management and keyboard nav.

- Files:
  - frontend/src/components/TechnicianList.jsx - Wrap rows with FixedSizeList; refactor row renderer
  - frontend/src/__tests__/components/TechnicianList.test.jsx - Tests to ensure virtualization renders visible rows only and is keyboard accessible
- Success:
  - Large lists render with stable FPS; tests confirm visible rows only and keyboard access
- Research References:
  - #fetch:https://github.com/bvaughn/react-window - react-window

### Task 4.2: Add advanced filters mapped to backend params

- Add filters for certification, tech_level range, certification_status, and coverage presence; debounce requests and sync to URL.

- Files:
  - frontend/src/components/TechnicianList.jsx - Controls and API param wiring
  - frontend/src/api.js - Extend getTechnicians to accept params
  - frontend/src/__tests__/components/TechnicianList.test.jsx - Filter tests
- Success:
  - Filtered results match server responses; URL reflects active filters
- Research References:
  - #file:../research/20251015-unimplemented-features-implementation-research.md (Lines 80-100) - Filter plan

## Phase 5: Frontend — DigitalSignaturePad download integration

### Task 5.1: Wire PDF download to new endpoint

- Call GET `/api/digital-signatures/{id}/pdf/` with responseType 'blob'; createObjectURL and trigger download; ensure button has accessible name; tests mock blob and ObjectURL.

- Files:
  - frontend/src/components/DigitalSignaturePad.jsx - Add download integration
  - frontend/src/__tests__/components/DigitalSignaturePad.test.jsx - Assert API call and blob download
  - frontend/src/__tests__/utils/msw-handlers.js - Add handler for pdf route
- Success:
  - Clicking Download triggers API and saves .pdf; unit tests pass; a11y checks remain green
- Research References:
  - #file:../research/20251015-unimplemented-features-implementation-research.md (Lines 102-147) - PDF action
  - #fetch:https://www.django-rest-framework.org/api-guide/viewsets/#marking-extra-actions-for-routing - DRF action

## Dependencies

- Backend: django-filter (already used), WeasyPrint optional
- Frontend: supercluster, react-window

## Success Criteria

- Coverage shapes CRUD and validation working; map supports polygon+circle; context menu + keyboard fallback; analytics + filters functional and accessible; clustering smooth at scale
- TechnicianList virtualized and filtered per server-side params; URL sync
- DigitalSignaturePad downloads a PDF successfully; endpoint streams application/pdf
