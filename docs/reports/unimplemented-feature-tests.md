# Unimplemented Feature Tests — Audit and Build Tasks

This document captures tests that previously asserted behaviors not implemented in the current UI, and defines pragmatic build tasks to add those features later with clear acceptance criteria. The tests have been updated or removed to align with actual product scope and i18n/a11y standards.

## CoverageAreaMap

- Removed: Circle drawing mode (only polygon supported)
  - Build Task: Add circle coverage areas with radius control
  - Acceptance:
    - UI toggle between polygon and circle
    - Draw circle with center+radius; persist as { area_type: 'circle', center, radius }
    - Update color-by-priority and popup actions to support circle
- Removed: Right-click context menu editing
  - Build Task: Context menu for Edit/Delete on map shapes
  - Acceptance: Right-click polygon shows menu with Edit/Delete; keyboard fallback via focus + Enter
- Removed: Analytics widgets (coverage stats, distribution)
  - Build Task: Sidebar analytics (totals, priority distribution)
  - Acceptance: Totals rendered with live counts; a11y-compliant headings/ARIA
- Removed: Advanced search/filters (priority, service type)
  - Build Task: Filter panel (priority, service types)
  - Acceptance: Filters update map shapes and list; deep-linked via query params
- Removed: Performance budget assertions and clustering
  - Build Task: Marker/shape clustering for large datasets
  - Acceptance: Smooth pan/zoom with >1k shapes, clustering enabled; lighthouse budget documented

## SchedulePage

- Adjusted labels to match implementation
  - Build Task: None (parity achieved)
  - Note: Route optimization payload { date: YYYY-MM-DD, technician_id } is now asserted.

## Warehouse

- Adjusted currency assertions to be locale-aware
  - Build Task: None (i18n parity achieved)
  - Note: Use Intl-based formatting; tests assert normalized digits for totals.

## TechnicianList

- Removed: Virtualized list dependency and certification/skill filters
  - Build Task: Add react-window virtualization and advanced filters (skill level, certification)
  - Acceptance:
    - Virtualization renders only visible rows, keyboard accessible
    - Filters call API with skill_level and certification_status params; results update accordingly

## DigitalSignaturePad

- Current tests align with implemented features (signature capture, validation, save, IP fetch, PDF download stubs)
  - Build Task: Export signed PDF template integration
  - Acceptance: Download button triggers Blob from backend '/api/digital-signatures/{id}/pdf/'; a11y-compliant

## Notes

- All new features must include: i18n keys in non-English locales, a11y roles/labels, RTL support, and unit + E2E coverage.
- Reference: Phase 5 Field Service (REQ-501–516) and scheduling UI (REQ-517–529); Phase 6 testing infrastructure.
