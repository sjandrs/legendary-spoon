<!-- markdownlint-disable-file -->
# Task Research Notes: Frontend failing tests audit and rewrite

## Research Executed

### File Analysis
- frontend/src/components/TechnicianList.jsx
  - Implements loading state via custom LoadingSkeleton component; no data-testid="loading-skeleton" and no explicit heading labels used in tests. Filters supported: is_active, hire_date_from/to, min/max_hourly_rate. Summary text: "Showing N technician(s)". Search input labeled "Search" with placeholder "Search by name, ID, or phone...". Uses getTechnicians(params). Virtualization currently not using react-window; renders a scrollable div mapping over items.
- frontend/src/components/Warehouse.jsx
  - I18n-driven UI with t('warehouse:*'); loading string via t('status.loading'); errors via t('errors.*'). Tabs: Items and Warehouses with className 'tab-button active'. Summary cards values use useLocaleFormatting (currency/number). Item form fields IDs: item-name, item-sku, item-gtin (GtinInput), item-description, item-quantity, item-min-stock, item-unit-cost, warehouse-select. Confirm texts come from i18n: confirm.delete_warehouse/confirm.delete_item. Low stock uses quantity <= minimum_stock.
- frontend/src/components/CoverageAreaMap.jsx
  - React Leaflet MapContainer, TileLayer, Polygon, Marker, Popup. Center defaults to [39.8283, -98.5795] and zoom 4; can change based on technician current_location. Loading UI: role="status" text "Loading Coverage Areas..." and a div data-testid="map-skeleton". Priority color mapping to hex: 1=#EF4444, 2=#F59E0B, 3=#10B981. Drawing mode supports polygon only; circle mode not implemented. Edit/Delete via popup buttons (left-click) not context-menu/right-click. Confirmation string: "Are you sure you want to delete this coverage area?" (no extended warning). Search control uses an external fetch to Nominatim; filter menus not implemented as named buttons.
- frontend/src/components/SchedulePage.jsx
  - Uses FullCalendar with dayGrid/timeGrid/interaction plugins; mobile path uses MobileOptimizedCalendar if TouchUtils.isTouchDevice(). Header shows i18n text: schedule title t('scheduling.schedule','Schedule'), buttons "+ Schedule Appointment" and "Optimize Route" (disabled until selectedDate set by dateClick or mobile select). Form labels: Title, Description, Start Date/Time, End Date/Time, Technician, Work Order, Recurrence Rule. Event title composed "${title} - ${technician_name||'Unassigned'}". API: api.get('/api/scheduled-events/','/api/technicians/','/api/work-orders/'); api.post('/api/scheduling/optimize-route/') and '/api/scheduled-events/'. Post body technician/work_order null when not chosen.
- frontend/src/components/DigitalSignaturePad.jsx
  - Uses react-signature-canvas; header h3 "Digital Signature". Validation messages: "Please provide a signature before saving.", "Please enter the signer name.", success: "Signature saved successfully!" (not "✓ Signature Captured Successfully"). Buttons: Clear, Cancel, Save Signature. Download PDF via api get to `/api/digital-signatures/{id}/pdf/` then Blob and createObjectURL. On success calls onSignatureComplete if provided.

### Code Search Results
- TechnicianList test reliance on virtualization and data-testid hooks
  - Tests look for data-testid="virtualized-list" and 'loading-skeleton' and role/labels like 'searchbox', 'combobox Filter by skill', etc. The component uses plain inputs/selects without those ARIA names; no virtualization wrapper or testid. Actions 'Edit/Delete' buttons are present as plain text buttons; confirmation flows are not in this component (callbacks are props), so delete flow using deleteTechnician API does not match component responsibilities.
- Warehouse tests expect specific headings and raw currency '$' strings
  - Component uses i18n with useLocaleFormatting; test values like '$2499.75' are locale dependent and warehouse item row includes warehouse_name; summary headings use h3 text via t('summary.*') rather than "Inventory Value" literal in English. Confirm messages come from t('confirm.delete_*') not hardcoded English.
- CoverageAreaMap tests include circle mode, right-click context menu, layer switching
  - Component implements only polygon drawing; no circle mode, right-click menu or map layers button; confirmation string shorter. Loading text matches "Loading Coverage Areas..." and skeleton test id exists. Priority colors match expectations.
- SchedulePage tests assert English labels '+ New Appointment', 'Field Service Schedule'
  - Component displays '+ Schedule Appointment' and uses i18n keys; page title is 'Schedule' (from t('scheduling.schedule')). Optimize Route requires selectedDate via dateClick; tests emulate via a mocked FullCalendar; our component uses actual FullCalendar library (not mocked). API shapes align; after creation it reloads data.
- DigitalSignaturePad tests assert different success message and extra a11y structure
  - Component success message differs and heading level h3 is correct; saving posts to '/api/digital-signatures/' with ip from ipify; PDF download uses GET with responseType 'blob'.

### External Research
- #githubRepo:"testing-library/react-testing-library intro"
  - Verified guiding principles: prefer user-facing queries over testid; avoid implementation details; use roles/labels; accessibility-first testing.
- #fetch:https://react-leaflet.js.org/docs/start-introduction/
  - Confirmed React Leaflet renders non-DOM Leaflet layers; tests should mock Leaflet or assert around props exposed via wrapper elements; right-click/context-menu/UI layers require custom implementation.
- #fetch:https://fullcalendar.io/docs/react
  - Confirmed FullCalendar React integration and callback props; in-Jest usage often requires mocking; our tests should either mock FC or assert on our wrapper UI and state transitions.
- #fetch:https://github.com/nickcolley/jest-axe
  - jest-axe usage patterns and limitations; disable region rule for isolated components when needed; avoid fake timers for axe.
- #fetch:https://learn.microsoft.com/en-us/dynamics365/field-service/overview
  - Field Service domain patterns: schedule board, technician roles, coverage territories, route optimization; informs realistic test scenarios (e.g., unassigned events, territory assignment, real-time updates cadence) while avoiding features we haven’t implemented (e.g., full route board, circle areas unless specified).

### Project Conventions
- Standards referenced: `.github/copilot-instructions.md` i18n/RTL/a11y patterns; frontend testing stack with Jest/RTL/MSW/jest-axe; React components follow design system classes and use i18n keys; `useLocaleFormatting` for currency/number/date; avoid hardcoded English in tests; use accessibility queries; match API helpers in `frontend/src/api.js`.
- Instructions followed: Research-only task; verify with concrete code reads and authoritative docs; consolidate findings; recommend a single approach; remove outdated/inaccurate tests and replace with accurate ones grounded in component behavior and domain.

## Key Discoveries

### Project Structure
The failing suites target Field Service and Inventory UIs. Real components differ from tests in:
- i18n usage: text comes from translation keys with fallbacks; tests hardcode English strings that may diverge.
- Accessibility: components often have IDs and visible labels; tests look for specific ARIA roles/names not present.
- Implementation scope: several tests assert features not implemented (e.g., circle mode, right-click menus, virtualization markers, performance budgets).
- API responsibilities: some tests directly mock API helper methods on the component which doesn’t call them (e.g., TechnicianList delete), or expect params keys not implemented (skill_level, certification_status).

### Implementation Patterns
- Prefer RTL queries by role/label/placeholder; only use data-testid where component provides them (e.g., map-skeleton).
- Mock external heavy libs (FullCalendar, Leaflet) minimally to assert our integration points or assert around our wrapper DOM.
- Use MSW or mocked api.js consistent with our axios helper exports.
- Normalize locale-dependent assertions by injecting a test locale or by asserting semantic equivalents (e.g., toHaveTextContent matching digits) rather than raw currency symbols.

### Complete Examples
```jsx
// Example: SchedulePage new appointment (aligned with component)
renderWithProviders(<SchedulePage />);
// Simulate date selection by calling FullCalendar dateClick via a test helper or click on our button opening modal directly
await user.click(screen.getByRole('button', { name: /schedule appointment/i }));
await user.type(screen.getByLabelText(/title/i), 'Test');
await user.type(screen.getByLabelText(/start date\/time/i), '2025-01-20T10:00');
await user.click(screen.getByRole('button', { name: /save appointment/i }));
expect(api.post).toHaveBeenCalledWith('/api/scheduled-events/', expect.objectContaining({ title: 'Test' }));
```

### API and Schema Documentation
- Technicians list: getTechnicians(params) supports search and filters used by component (is_active, hire_date_from/to, min/max_hourly_rate). No delete call in this component.
- Warehouse endpoints: create/update/delete warehouses and items; confirm strings from i18n; number/currency formatting via Intl in useLocaleFormatting.
- Scheduling endpoints: /api/scheduled-events/, /api/technicians/, /api/work-orders/, /api/scheduling/optimize-route/.
- Digital signatures: POST /api/digital-signatures/; GET /api/digital-signatures/{id}/pdf/ as blob.

### Configuration Examples
```json
// jest-axe isolated component rule example
{
  "rules": { "region": { "enabled": false } }
}
```

### Technical Requirements
- Tests must mirror actual UI text via i18n fallbacks or use role/label selectors.
- Avoid asserting unimplemented features (circle draw, right-click menus, virtualization testids).
- For currency/number checks, avoid hardcoded symbols; use regex or numeric content checks.
- For a11y, use jest-axe with real timers; disable region rule for isolated components as needed.

## Recommended Approach
Adopt a “replace inaccurate with accurate” strategy:
- Identify and delete tests asserting non-existent features or mismatched labels/flows.
- Recreate tests that verify implemented behavior using RTL best practices and domain-accurate scenarios.
- Stabilize assertions with i18n-aware queries and formatting-tolerant checks; prefer semantics over implementation details.
- For heavy libs (FullCalendar/Leaflet), either mock minimally to expose the callbacks we use or assert on wrapper DOM and our state changes; do not build fake features (e.g., circle mode) in tests.

## Implementation Guidance
- Objectives: Restore test suite fidelity to current components; reduce false failures; keep a11y checks meaningful; cover Field Service core flows (schedule create/edit, route optimization trigger), CoverageArea polygon display and save, Warehouse item/warehouse CRUD, DigitalSignature validation and save.
- Key Tasks:
  - TechnicianList: Remove tests for virtualization/testids and API deletes; add tests for loading/error, search filter, onTechnicianSelect/Edit/Delete callbacks only.
  - Warehouse: Update assertions to use i18n labels; avoid hardcoded currency; check low-stock logic (<=); align confirm messages to t('confirm.*'); keep CRUD happy paths and error paths.
  - CoverageAreaMap: Remove circle-mode, right-click menu, map layers; keep polygon render, popup info, color mapping, delete confirm, add polygon flow with AreaFormModal; assert loading and skeleton.
  - SchedulePage: Align titles/buttons to i18n; open modal via UI; ensure selectedDate gating for Optimize Route; mock api.post for both optimize and save; assert event title format on display if feasible.
  - DigitalSignaturePad: Align success message to "Signature saved successfully!"; keep validation and callback assertions; keep PDF download shape without changing component state.
- Dependencies:
  - jest, @testing-library/react, user-event, jest-axe; existing test-utils; api.js mockability.
- Success Criteria:
  - All updated suites pass locally; a11y checks run with no violations (or documented exceptions); no tests assert features absent from components; tests resilient to i18n/formatting; coverage improved for core flows.
