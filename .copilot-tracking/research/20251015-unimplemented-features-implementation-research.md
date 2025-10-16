<!-- markdownlint-disable-file -->
# Task Research Notes: Phase 7 Unimplemented Feature Implementation

## Research Executed

### File Analysis
- main/models.py
  - CoverageArea currently models technician ZIP coverage (zip_code, travel_time_minutes, is_primary). No polygon/circle geometry fields. Technician, TechnicianAvailability, TechnicianCertification, DigitalSignature present with expected fields; JSONField usage exists elsewhere for precedent.
- main/serializers.py
  - CoverageAreaSerializer exposes zip_code-centric shape; no geometry. Technician serializers expose certifications/availability for filter opportunities.
- main/api_views.py
  - CoverageAreaViewSet, TechnicianViewSet, TechnicianAvailabilityViewSet implemented with vanilla filters; no geometry/analytics; DigitalSignatureViewSet lacks a PDF action but supports verify action. Scheduling utility endpoints present.
- frontend/src/components/CoverageAreaMap.jsx
  - Frontend expects area_data with fields name, description, technician, color, coordinates, area_type ('polygon'); saves via createCoverageArea/updateCoverageArea; provides UI for polygons only; delete confirmation exists; no contextmenu; no clustering; sidebar listing and priority color coding present in UI.
- frontend/src/components/TechnicianList.jsx
  - Commented import of react-window suggests planned virtualization. Current filters limited (status/search); no certification/skill filters.
- main/pdf_service.py
  - WeasyPrint-backed PDF service exists with helpers for work order PDFs and service report PDFs; provides a get_pdf_service() accessor; not yet wired to DigitalSignature.
- main/api_urls.py
  - DigitalSignature routes registered via router at r"digital-signatures" → DigitalSignatureViewSet; no extra pdf route.

### Code Search Results
- CoverageArea shape capabilities
  - class CoverageArea(models.Model): found; zip_code-based, no geometry
- CoverageAreaMap integration
  - CoverageAreaMap.jsx references createCoverageArea/updateCoverageArea/deleteCoverageArea and manipulates polygon state; coordinates/area_type present in form.
- DigitalSignature export
  - DigitalSignatureViewSet exists; no pdf action. pdf_service.py supports generation via WeasyPrint and could embed signature.
- Virtualization intent
  - TechnicianList.jsx contains a commented import of react-window FixedSizeList indicating intent to add virtualization.
- Scheduling and route optimize
  - Scheduling endpoints exist; route optimizer utility function present; not directly relevant to this research scope beyond analytics sidebar context.

### External Research
- #githubRepo:"contextmenu events" react-leaflet/react-leaflet
  - Leaflet supports 'contextmenu' events on layers; in React Leaflet, useMapEvents({ contextmenu: (e) => { ... } }) or bind 'contextmenu' on Polygon/Marker components via eventHandlers prop.
- #fetch:https://leafletjs.com/reference.html#interactive-layer-contextmenu
  - Leaflet core: 'contextmenu' fired on right click. Accessible fallback should be provided (keyboard-activated menus) since contextmenu is pointer-specific.
- #fetch:https://react-leaflet.js.org/docs/start-introduction/
  - React Leaflet patterns: useMapEvents, layer event handlers and integrating third-party plugins.
- #fetch:https://github.com/bvaughn/react-window
  - react-window supports windowing large lists with FixedSizeList and VariableSizeList; fixed height yields best perf and simpler a11y.
- #fetch:https://www.django-rest-framework.org/api-guide/viewsets/#marking-extra-actions-for-routing
  - DRF @action(detail=True/False) adds custom routes like GET /api/digital-signatures/{id}/pdf/ for binary responses.
- #fetch:https://doc.courtbouillon.org/weasyprint/stable/
  - WeasyPrint usage guidance; server-side PDF generation from HTML/CSS; supports embedding images (e.g., base64 signature data).
- #fetch:https://datatracker.ietf.org/doc/html/rfc7946
  - GeoJSON spec for representing Polygon and Circle-like (approximated) geometries; circles are typically represented as Point+radius metadata (non-standard) or approximated polygons.
- #fetch:https://github.com/mapbox/supercluster
  - supercluster provides client-side clustering; works well with Leaflet via clustering of points (markers). For polygons, cluster representative centroids.
- #fetch:https://docs.djangoproject.com/en/stable/ref/models/fields/#jsonfield
  - Django JSONField is portable across SQLite/Postgres; supports indexing (Postgres) and storing arbitrary JSON (suitable for GeoJSON-like shapes without full GeoDjango stack).

### Project Conventions
- Standards referenced: .github/copilot-instructions.md (API/ViewSet patterns, i18n/RTL/a11y mandates), Phase 5/6 testing infrastructure, REST endpoints structure, DRF ViewSets with @action for custom routes.
- Instructions followed: Spec-driven workflow, Phase 5 FSM models (Technician, CoverageArea, DigitalSignature), and REST patterns from "API Endpoint Patterns" section.

## Key Discoveries

### Project Structure
- Backend CoverageArea is zip_code–based; frontend CoverageAreaMap expects polygonal shape persistence. There is a mismatch to resolve.
- DigitalSignature PDF generation is feasible with existing pdf_service; only a small ViewSet action + template needed for a fully functional download endpoint.
- Technician filters can be enriched server-side leveraging TechnicianCertification and Certification.tech_level; DjangoFilter Backends are already wired and can be extended.

### Implementation Patterns
- Geometry storage without GeoDjango: Store shape metadata in a JSONField as GeoJSON-like structure and support area_type 'polygon' and 'circle' (circle represented as { center: [lng, lat], radius_m: number }). This avoids heavy DB changes and works on SQLite.
- Context menu and accessibility: Use Leaflet 'contextmenu' events but provide a keyboard-accessible menu trigger (button in popup/list with role="menu") and mirror actions in sidebar list for full a11y.
- Clustering: Use supercluster on client to cluster technician markers and potentially centroids of shapes; communicate cluster expansion UX with accessible labels/ARIA.
- Virtualization: Add react-window FixedSizeList for TechnicianList; ensure row items remain semantically listitems with role="listitem" inside role="list" or table semantics preserved. Keep focus/keyboard navigation stable.
- DigitalSignature PDF: Implement DRF @action(detail=True, methods=['get'], url_path='pdf') that invokes PDFService, embedding the saved signature image in the document; stream as application/pdf with appropriate Content-Disposition.

### Complete Examples
```python
# DRF custom action for PDF (source: DRF docs on @action usage)
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import FileResponse

class DigitalSignatureViewSet(viewsets.ModelViewSet):
    ...
    @action(detail=True, methods=['get'], url_path='pdf')
    def pdf(self, request, pk=None):
        signature = self.get_object()
        # call pdf_service to generate a temporary PDF file path
        # return FileResponse(open(path, 'rb'), content_type='application/pdf')
```
```

### API and Schema Documentation
- Proposed CoverageShape JSON schema (stored in JSONField on a new model or attached to CoverageArea):
  - area_type: 'polygon' | 'circle'
  - properties:
    - polygon: coordinates: number[][] (lng,lat)
    - circle: center: [lng,lat], radius_m: number
  - metadata: color: string (hex), priority_level: 1|2|3, service_types: string[]

### Configuration Examples
```json
{
  "area_type": "circle",
  "geometry": { "center": [ -122.3321, 47.6062 ], "radius_m": 1200 },
  "properties": { "color": "#3b82f6", "priority_level": 1, "service_types": ["electrical"] }
}
```

### Technical Requirements
- Backward compatibility: Keep existing CoverageArea ZIP model intact for current APIs; introduce a new CoverageShape (or CoverageAreaGeometry) resource to persist shapes used by CoverageAreaMap.jsx. Tie to Technician via FK and optionally to CoverageArea via nullable FK for mapping ZIP-to-shape later.
- Accessibility: Context menus must have keyboard fallback; analytics sidebar must have headings/landmarks; i18n keys across locales; RTL layout verified.
- Performance: Clustering for >1k shapes; virtualization for TechnicianList to keep render cost small; memoization on filter changes.
- Testing: Unit tests for new endpoints/serializers; Jest RTL tests for context menu/fallback; E2E for clustering toggle interactions; a11y checks.

## Recommended Approach
1) Coverage Shapes and Circle Support
   - Add a new model CoverageShape with fields: technician(FK), name, description, area_type (choices polygon/circle), geometry JSONField, color, priority_level (1..3), is_active, created_at.
   - Create CoverageShapeSerializer + ViewSet with CRUD at /api/coverage-shapes/.
   - Update frontend CoverageAreaMap.jsx to persist via this new endpoint; keep existing /api/coverage-areas/ for ZIP coverage unaffected.
   - Circle drawing: Represent circles as center+radius in geometry; draw via Leaflet Circle; store in JSON.
   - Filters: Implement query params priority_level, service_type (against JSON properties) and technician.

2) Context Menu Editing
   - Use Leaflet 'contextmenu' events on Polygon/Circle layers to open a contextual UI. Provide an accessible button within the popup/sidebar for Edit/Delete so keyboard users can access the same actions. Ensure focus management and aria-controls/role="menu".

3) Analytics Sidebar
   - Compute client-side aggregates (totals by priority, by technician) from the loaded shapes for simplicity. Optionally expose a server endpoint /api/coverage-shapes/summary/ to pre-aggregate when datasets grow.

4) Marker/Shape Clustering
   - Use supercluster in the frontend for technician location markers and shape centroids. Integrate with React Leaflet via custom layer that renders ClusterMarkers. Provide announce-on-expand via live region for a11y.

5) TechnicianList Virtualization and Advanced Filters
   - Introduce react-window FixedSizeList around the TechnicianList rows. Maintain existing keyboard navigation and semantics.
   - Extend TechnicianViewSet with django_filters to support: certification (id), tech_level (min/max), certification_status (active/expired), and coverage_presence. Expose these via query params.
   - Frontend: Add filter controls mapped to these params; debounce and reflect active filters in URL query for shareability.

6) DigitalSignature PDF Export
   - Add GET /api/digital-signatures/{id}/pdf/ via @action in DigitalSignatureViewSet. Use pdf_service to generate a short, signed report that embeds the signature image (signature.signature_data assumed base64 PNG) along with basic metadata and integrity hash.
   - Frontend: Wire Download button to call this endpoint with responseType 'blob', then trigger a download via URL.createObjectURL; keep i18n and a11y.

## Implementation Guidance
- Objectives: Close the feature gaps from the audit with minimal disruption: persist map shapes (polygon+circle), provide context menu with a11y fallback, add analytics sidebar and filters, enable clustering, virtualize technician list with richer filters, and provide signed PDF export for DigitalSignature.
- Key Tasks:
  - Backend:
    - Create CoverageShape model/serializer/viewset; add filters and optional summary action.
    - Extend TechnicianViewSet with certification/level/status filters via django-filters FilterSet.
    - Add DigitalSignatureViewSet.pdf action that streams a generated PDF; embed base64 signature image.
  - Frontend:
    - Update CoverageAreaMap.jsx to support circle draw (radius control), contextmenu, clustering (supercluster), filter panel, analytics sidebar.
    - Apply react-window to TechnicianList; add filter controls and API param wiring.
    - Add DigitalSignaturePad download integration using GET /api/digital-signatures/{id}/pdf/ (blob).
  - Testing:
    - Jest: unit tests for new UI flows (circle save, context menu, filter interactions, virtualization rendering). MSW handlers for new endpoints.
    - Backend: tests for new endpoints, filters, and PDF action (status 200, content-type application/pdf).
    - E2E: Cypress scenarios for large dataset clustering and a11y checks on menus.
- Dependencies:
  - Frontend: supercluster (or clustering plugin), react-window; ensure types and test mocks added. No backend dep change beyond Django built-ins (JSONField).
  - Optional: Shapely for server-side geometry validation (could be deferred).
- Success Criteria:
  - Coverage shapes (polygon+circle) persist and round-trip; UI allows edit/delete via context menu and buttons; analytics visible and a11y-compliant; filters functional; clustering behaves with >1k shapes.
  - TechnicianList renders smoothly with 1k+ rows; filters hit backend and return expected subsets.
  - DigitalSignature PDF downloads successfully and opens with embedded signature; endpoint returns 200 with application/pdf and content-disposition; a11y and i18n intact.
