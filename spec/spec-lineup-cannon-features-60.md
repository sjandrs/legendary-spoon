# Converge Canonical Spec Lineup Plan — 60% Feature Match

Date: 2025-10-11
Owner: Platform Engineering
Status: Proposed
Target: Achieve 60% alignment with the canonical specification through phased delivery with verifiable acceptance criteria and quality gates.

## Purpose
This plan defines the incremental work required to bring Converge into at least 60% functional parity with the canonical spec (see spec/spec-design-master.md and static/kb/user-stories.md). It prioritizes high-impact capabilities and sets measurable acceptance criteria by phase so progress can be tracked and audited.

## Scope & Measurement
- Scope: Backend APIs, models, permissions, workflows; Frontend UI/UX; Test automation; Docs.
- Measurement: Each canonical requirement (REQ) is mapped to deliverables and tests. Completion is verified when:
  - All acceptance criteria pass (API + UI + docs), and
  - Quality gates (lint/typecheck/tests/coverage thresholds) pass in CI.
- Goal: At least 60% of canonical REQs validated via automated tests and documented behavior. Phases below indicate estimated contribution to total match and include stop/go criteria.

## Baseline Snapshot (current understanding)
- Backend: Django/DRF; core CRM, accounting (Phase 1), workflow automation (Phase 2), and analytics (Phase 3) substantially implemented; custom token auth; RBAC patterns; activity logging.
- Frontend: React + Vite; many modules scaffolded and partially implemented; testing infra complete; coverage gap in components.
- Recent: Budget V2 + MonthlyDistribution complete with nested writes, validations, and UI; Warehouse GTIN support; signals and constraints; docs updated; Cypress tests in place.

## Phase Map Overview
- Phase 1: Canonical API Parity Baseline (Foundations) — ~15%
- Phase 2: Finance & Budget Operations Completion (V2) — ~10%
- Phase 3: Technician & User Management Frontend (Phase 4A) — ~12%
- Phase 4: Field Service Management Frontend Completion — ~10%
- Phase 5: Advanced Analytics Parity & Docs — ~8%
- Phase 6: Test Coverage Lift to 60% Spec Validation — ~5%

Estimated cumulative alignment after Phase 6: ~60% (±5%).

---

## Phase 1 — Canonical API Parity Baseline (Foundations) ~15%
Focus: Close gaps between existing endpoints and canonical spec; standardize auth, pagination, filtering, and error shapes; finalize role enforcement.

Deliverables
- API audit & reconciliation document: route-by-route comparison against canonical endpoints and payloads (success + error schemas).
- Permissions: Enforce canonical RBAC across finance, staff, and operations (e.g., Sales Manager/Admin). Confirm with automated tests.
- Consistent response shapes: Paginated list responses with count, next, previous, results; standardized error structure.
- JSON Schema: Ensure dev-only validator endpoint recognizes canonical alias mapping; schemas exist for all touched resources.

Acceptance Criteria
- For each reconciled endpoint: unit + API tests pass; OpenAPI (or docs/API.md) updated; example requests/responses added.
- Permissions tests: 401/403/200 cases covered for representative endpoints in each module.
- Quality gates: Lint PASS; Backend tests PASS; Coverage unchanged or improved.

Dependencies
- Current models and viewsets; existing permissions framework; docs pipeline.

Risks
- Hidden consumers of non-canonical fields; require deprecation notes and minor version bump in API docs.

---

## Phase 2 — Finance & Budget Operations Completion (V2) ~10%
Focus: Finish Budget V2 ergonomics and operations per canonical spec; finalize docs/cookbooks; add minor UX affordances.

Deliverables
- BudgetV2 nested writes finalized (complete): distributions array on create/update; atomic replace semantics; validation rules documented.
- UX enhancements (complete): lock toggles, normalize-to-100, copy-last-year; toasts and a11y states.
- Expense/Budget integration: Wire canonical cross-links (e.g., cost center drill-through, budget-to-expense summaries); add API filters (by year, cost center) with tests.

Acceptance Criteria
- API tests cover: create/update (valid/invalid), replace endpoint, filters, and permissions.
- UI tests (Cypress): happy path create/edit; visual validity; copy last year; a11y check.
- Docs/API.md: Request/response samples, invariants, and error payloads.

Dependencies
- CostCenter; MonthlyDistribution; FinancialDataPermission.

Risks
- Floating-point precision in totals; mitigated via fixed-point rounding and consistency tests.

---

## Phase 3 — Technician & User Management Frontend (Phase 4A) ~12%
Focus: Implement the Phase 4A frontend features per canonical spec—technician profiles, certifications, availability, and hierarchy visualization.

Deliverables
- UI Screens: Technician list/detail/edit, Certification dashboard, Coverage area map management, Availability calendar (drag-and-drop), User hierarchy visualization (tree/list/grid).
- API wiring: Use existing Phase 4 endpoints (/api/technicians/, /api/certifications/, /api/coverage-areas/, /api/technician-availability/, /api/enhanced-users/), with permission checks and loading/error states.
- Real-time: Polling or WebSocket stubs for status updates (config-driven).

Acceptance Criteria
- Component tests (Jest/RTL) for key screens; Cypress happy path for creation/edit and navigation.
- a11y checks included; keyboard nav on lists/forms.
- Docs: Frontend usage guide and API references updated.

Dependencies
- Technician & EnhancedUser APIs available and stable.

Risks
- Map/calendar integration complexity; timeboxing and progressive enhancement recommended.

---

## Phase 4 — Field Service Management Frontend Completion ~10%
Focus: Align frontend components to canonical Phase 5 deliverables: scheduling, paperwork templates, customer portal, approvals, notifications, and digital signatures.

Deliverables
- SchedulePage: FullCalendar integration with drag-and-drop; route optimization UI hook; ETA markers.
- PaperworkTemplateManager: Template creation with variable insertion and conditional logic.
- CustomerPortal: Time slot selection; appointment request; confirmation emails (mock in dev).
- AppointmentRequestQueue: Manager approval workflow UI.
- DigitalSignaturePad: Signature capture and persistence; print/export.

Acceptance Criteria
- End-to-end flows in Cypress for: creating events, approving appointment requests, capturing signatures.
- a11y checks on primary screens; basic performance budget verified (Lighthouse CI, if configured).
- Docs: User guides and API references.

Dependencies
- Existing backend endpoints under /api/scheduled-events/, /api/paperwork-templates/, /api/appointment-requests/, /api/digital-signatures/.

Risks
- Cross-browser quirks for canvas signatures; add smoke tests on Chromium + Firefox.

---

## Phase 5 — Advanced Analytics Parity & Docs ~8%
Focus: Confirm and surface Phase 3 analytics endpoints with usable UIs and docs.

Deliverables
- Verify endpoints: /api/analytics/predict/, /api/analytics/clv/, /api/analytics/forecast/, /api/analytics-snapshots/.
- Frontend screens: Predictions, CLV, Forecast, Snapshots; chart widgets; error/loading states.
- Reports: Ensure date-range filters and export affordances are documented.

Acceptance Criteria
- API tests for parameter validation and success paths; component tests for visualization containers (mock data).
- Cypress flows for navigating analytics screens; a11y checks.
- Docs: Clear examples, limits, and caveats.

Dependencies
- Reports and analytics models available; MSW handlers for realistic frontend tests.

Risks
- Model performance on large datasets; include pagination and date filters.

---

## Phase 6 — Test Coverage Lift to 60% Spec Validation ~5%
Focus: Raise effective spec validation to 60% by increasing component/E2E tests across revenue-critical modules.

Deliverables
- Test coverage expansion: Contacts, Deals, Invoicing, Work Orders, Warehouse, Accounting summary screens.
- a11y test passes (cypress-axe) on critical paths; regression tests for auth flows.
- CI coverage reports surfaced (Codecov integration, if available).

Acceptance Criteria
- 60%+ of canonical REQs validated through automated tests (unit/integration/E2E) and documentation references.
- Quality gates pass in CI; flaky tests quarantined with tracking issues.

Dependencies
- Existing Jest/Cypress/MSW setup; CI configuration.

Risks
- Legacy UI variance; mitigate by focusing on top-priority user stories first.

---

## Work Breakdown Summary
- Backend: API parity, validation, permissions, analytics verification.
- Frontend: Technician/User Mgmt UI, Field Service UI, Analytics UIs, Budget V2 polish.
- QA: Test coverage lift; a11y and performance checks; CI reporting.
- Docs: API.md and feature guides updated alongside code; JSON Schemas maintained.

## Cross-Phase Acceptance & Quality Gates
- Build & Lint: PASS on each MR; no new warnings.
- Tests: PASS; maintain thresholds (backend and frontend). Add missing tests by PR.
- Accessibility: cypress-axe checks on major screens.
- Documentation: Updated for each endpoint/component touched with request/response examples and error handling.

## Timeline (indicative)
- Phase 1: 1–1.5 weeks
- Phase 2: 0.5–1 week
- Phase 3: 2 weeks
- Phase 4: 1.5–2 weeks
- Phase 5: 1 week
- Phase 6: 1 week
Total: ~7–8.5 weeks (parallelization possible across squads).

## Risk Register (selected)
- API drift vs. existing clients — Mitigation: deprecation policy, feature flags, dual-write migrations where necessary.
- UI complexity for map/calendar/signature — Mitigation: progressive enhancement; stub network for E2E; fallback UIs.
- Test flakiness — Mitigation: quarantine flaky tests; deterministic seed data; MSW for frontend.

## Reporting & Governance
- Weekly checkpoint: % of REQs validated, failing tests, a11y issues, and docs updates.
- Phase exit requires: All acceptance criteria met, quality gates PASS, docs updated.

## Appendix — Canonical Spec Mapping (high level)
- Finance: REQ-101..105, REQ-102 Expenses, REQ-103 Work Orders/Invoices — aligned via Phase 1/2.
- Workflow: REQ-201..205 — verified in Phase 1 (audit) + Phase 4 (UI alignment for scheduling/notifications).
- Analytics: REQ-301..302 — Phase 5 validation and UI surfacing.
- Technician & Users: REQ-401..424 — Phase 3.
- Field Service: REQ-501..529 — Phase 4.
- Frontend Testing & QA: REQ-601..630 — Phase 6 uplift and verification.

> Note: Exact REQ mapping and percentage contribution will be finalized in the Phase 1 audit artifact and tracked in a living checklist tied to CI results.
