---
applyTo: '.copilot-tracking/changes/20251015-implement-unimplemented-features-phase7-changes.md'
---
<!-- markdownlint-disable-file -->
# Task Checklist: Implement Phase 7 Unimplemented Features

## Overview

Close feature gaps identified in the audit by implementing coverage map geometry (polygon + circle) with context menus, analytics and filters, clustering, technician list virtualization and advanced filters, and DigitalSignature PDF export.

## Objectives

- Persist coverage shapes (polygon and circle) and expose CRUD APIs
- Enhance CoverageAreaMap with circle mode, context menu, analytics, filters, and clustering
- Add TechnicianList virtualization and advanced server-side filters
- Provide DigitalSignature PDF export endpoint and frontend download

## Research Summary

### Project Files
- main/models.py - New CoverageShape model; DigitalSignature and Technician already present
- main/api_views.py - Add CoverageShapeViewSet, Technician filters, DigitalSignature.pdf action
- frontend/src/components/CoverageAreaMap.jsx - Circle drawing, context menu, analytics, filters, clustering
- frontend/src/components/TechnicianList.jsx - Virtualization and filter controls
- frontend/src/components/DigitalSignaturePad.jsx - Download integration

### External References
- #file:../research/20251015-unimplemented-features-implementation-research.md - Evidence-backed implementation approach for all features
- #fetch:https://www.django-rest-framework.org/api-guide/viewsets/ - DRF ViewSets & @action
- #fetch:https://react-leaflet.js.org/docs/start-introduction/ - React Leaflet patterns
- #fetch:https://github.com/mapbox/supercluster - Clustering
- #fetch:https://github.com/bvaughn/react-window - Virtualization

### Standards References
- #file:../../.github/copilot-instructions.md - API/ViewSet patterns, i18n/a11y/RTL requirements
- #file:../../docs/testing/test-strategy.md - Testing conventions for frontend/backend

## Implementation Checklist

### [x] Phase 1: Backend foundations

- [x] Task 1.1: Add CoverageShape model + serializer + viewset + routes
  - Details: .copilot-tracking/details/20251015-implement-unimplemented-features-phase7-details.md (Lines 7-36)

- [x] Task 1.2: Extend TechnicianViewSet with certification/level/status filters
  - Details: .copilot-tracking/details/20251015-implement-unimplemented-features-phase7-details.md (Lines 38-59)

- [x] Task 1.3: Add DigitalSignature PDF export action
  - Details: .copilot-tracking/details/20251015-implement-unimplemented-features-phase7-details.md (Lines 61-81)

### [x] Phase 2: CoverageAreaMap enhancements

- [x] Task 2.1: Persist shapes to new endpoint and add circle drawing toggle
  - Details: .copilot-tracking/details/20251015-implement-unimplemented-features-phase7-details.md (Lines 83-101)
- [x] Task 2.2: Context menu + keyboard fallback
  - Right-click context menu on polygons/circles and keyboard-accessible "More actions" button, with focus management and escape to close.
  - Details: .copilot-tracking/details/20251015-implement-unimplemented-features-phase7-details.md (Lines 103-118)

- [x] Task 2.3: Analytics sidebar + filters
  - Details: .copilot-tracking/details/20251015-implement-unimplemented-features-phase7-details.md (Lines 120-133)

### [x] Phase 3: Clustering & performance

- [x] Task 3.1: supercluster-based clustering for markers/centroids
  - Details: .copilot-tracking/details/20251015-implement-unimplemented-features-phase7-details.md (Lines 135-145)

### [x] Phase 4: TechnicianList virtualization & filters

- [x] Task 4.1: Virtualize list with react-window
  - Details: .copilot-tracking/details/20251015-implement-unimplemented-features-phase7-details.md (Lines 147-157)

- [x] Task 4.2: Add advanced filters mapped to backend
  - Details: .copilot-tracking/details/20251015-implement-unimplemented-features-phase7-details.md (Lines 159-172)

### [x] Phase 5: DigitalSignaturePad download integration

- [x] Task 5.1: Wire frontend PDF download
  - Details: .copilot-tracking/details/20251015-implement-unimplemented-features-phase7-details.md (Lines 174-188)

## Dependencies

- django-filter (backend)
- WeasyPrint (optional for PDF generation)
- supercluster (frontend)
- react-window (frontend)

## Success Criteria

- Coverage shapes persisted and round-tripped in UI; circle mode and editable context menu with a11y
- Analytics and filters functional; clustering smooth with >1k items
- TechnicianList virtualized and filters reflect server responses; URL syncing
- DigitalSignature PDF downloads successfully with correct headers and a11y labels
