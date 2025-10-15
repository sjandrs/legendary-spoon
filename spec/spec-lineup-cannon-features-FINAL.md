# Converge Canonical Spec Lineup Plan - 100% Feature Match (FINAL)

Date: 2025-10-12
Owner: Platform Engineering
Status: Finalized Execution Plan
Target: Achieve 100% alignment with the canonical specification through phased delivery with verifiable acceptance criteria and CI-enforced quality gates.

## Purpose
This plan breaks down the complete scope required to bring Converge to a full (100%) functional match with the canonical spec (see `spec/spec-design-master.md` and `static/kb/user-stories.md`). Each phase has measurable acceptance criteria, explicit dependencies, and quality gates to enable objective progress tracking and auditability.

## Scope & Measurement
- Scope: Backend APIs/models/workflows, Frontend UI/UX, Test automation, Docs, Security/Compliance, Performance/Scalability, Observability, DevOps.
- Measurement: Each canonical requirement (REQ) mapped to deliverables and tests. Completion is verified when:
  - All acceptance criteria pass (API + UI + docs), and
  - Quality gates (lint/typecheck/tests/coverage thresholds) pass in CI, and
  - Accessibility/performance/security gates are green for the affected scope.
- Artifacts: Issues/milestones are generated from this plan and tied to CI results. API and UI examples are updated in `docs/API.md` and component docs.

## Baseline Snapshot (current)
- Backend: Django/DRF with custom token auth; core CRM, accounting (Phase 1), workflow automation (Phase 2), analytics (Phase 3), technician & user management (Phase 4), field service (Phase 5) substantially implemented; activity logging; dev-only JSON Schema validator.
- Frontend: React + Vite; extensive components with testing infrastructure (Jest/RTL/MSW, Cypress + a11y). Gap: broad component test coverage still pending.
- Recent: Budget V2 + MonthlyDistribution complete with nested writes/validations/UI; Warehouse GTIN support; signals/constraints; docs updated; Cypress tests in place.

## Phase Map Overview (to 100%) ("plan Phase N implementation" in task-planner mode)
- Phase 1: Canonical API Parity Baseline (Foundations) — 12% (11:39, 10/12/25, complete)
- Phase 2: Finance & Budget Operations Completion (V2) — 8% (12:25, complete)
- Phase 3: Technician & User Management Frontend (Phase 4A) (2:30pm, 10/12/25, complete) — 10%
- Phase 4: Field Service Management Frontend Completion — 10% (5:58pm 10/12/25, complete)
- Phase 5: Advanced Analytics Parity & Docs — 8% (6:00pm 10/12/25, incomplete)
- Phase 6: Test Coverage Lift (Spec Validation ≥60%) — 12%
- Phase 7: Internationalization & Localization — 6%
- Phase 8: Security, Compliance & Privacy — 8%
- Phase 9: Performance & Scalability — 6%
- Phase 10: Observability & SRE Readiness — 5%
- Phase 11: Integrations & Data Migration — 7%
- Phase 12: Documentation, UAT & Release Hardening — 8%

Estimated cumulative alignment after Phase 12: 100% (±2%).

---

## Phase 1 — Canonical API Parity Baseline (Foundations) — 12%
Focus: Close gaps between existing endpoints and the canonical spec; standardize auth, pagination, filtering, error shapes; finalize RBAC.

Deliverables
- Route-by-route API parity audit with examples (success + error schemas) and identified diffs resolved.
- Permissions: Enforce canonical RBAC across finance, staff, operations (e.g., Sales Manager/Admin).
- Response shapes: Paginated lists {count,next,previous,results}; standardized error payloads.
- JSON Schema: Dev-only validator recognizes canonical aliases; schemas exist for all touched resources.

Acceptance Criteria
- Reconciled endpoints have unit + API tests; docs/API.md samples updated; links to tests.
- Permissions tests include 401/403/2xx across representative endpoints per module.
- Lint PASS; backend tests PASS; coverage maintained or improved.

Dependencies: Current models/viewsets; existing permissions; docs pipeline.

Risks: Hidden consumers of non-canonical fields; mitigated by deprecation notes and versioned docs.

---

## Phase 2 — Finance & Budget Operations Completion (V2) — 8%
Focus: Finish Budget V2 ergonomics and operations; finalize docs/cookbooks; minor UX affordances.

Deliverables
- BudgetV2 nested writes finalized: distributions array on create/update; atomic replace semantics; validation rules documented.
- UX: lock toggles, normalize-to-100, copy-last-year; toasts and a11y states.
- Expense/Budget integration: canonical cross-links (cost center drill-through, budget-to-expense summaries); API filters (year, cost center) with tests.

Acceptance Criteria
- API tests: create/update (valid/invalid), replace endpoint, filters, permissions.
- Cypress: happy path create/edit; visual validity; copy last year; a11y check.
- Docs/API.md: request/response samples, invariants, error payloads.

Dependencies: CostCenter; MonthlyDistribution; FinancialDataPermission.

Risks: Floating-point precision; mitigated via fixed-point rounding + consistency tests.

---

## Phase 3 — Technician & User Management Frontend (Phase 4A) — 10%
Focus: Implement Phase 4A frontend per canonical spec—technician profiles, certifications, availability, and hierarchy visualization.

Deliverables
- UI: Technician list/detail/edit; Certification dashboard; Coverage area map mgmt; Availability calendar (drag-and-drop); Org chart (tree/list/grid).
- API wiring: /api/technicians/, /api/certifications/, /api/coverage-areas/, /api/technician-availability/, /api/enhanced-users/; permission checks and robust loading/error states.
- Real-time: Polling/WebSocket stubs for status updates (config-driven).

Acceptance Criteria
- Jest/RTL for key screens; Cypress happy paths (create/edit; navigation).
- a11y checks; keyboard navigation on lists/forms.
- Docs: Frontend usage guide + API references.

Dependencies: Stable Technician & EnhancedUser APIs.

Risks: Map/calendar complexity; mitigated via progressive enhancement.

---

## Phase 4 — Field Service Management Frontend Completion — 10%
Focus: Align frontend with canonical scheduling, paperwork templates, customer portal, approvals, notifications, and digital signatures.

Deliverables
- SchedulePage: FullCalendar with drag-and-drop; route optimization hook; ETA markers.
- PaperworkTemplateManager: Template creation with variables and conditional logic.
- CustomerPortal: Time slot selection; appointment request; confirmation emails (mock in dev).
- AppointmentRequestQueue: Manager approval workflow.
- DigitalSignaturePad: Signature capture/persistence; print/export.

Acceptance Criteria
- Cypress E2E: creating events, approving appointment requests, capturing signatures.
- a11y checks; basic performance budget (Lighthouse) within threshold.
- Docs: User guides + API references.

Dependencies: /api/scheduled-events/, /api/paperwork-templates/, /api/appointment-requests/, /api/digital-signatures/.

Risks: Canvas signature cross-browser quirks; smoke tests on Chromium + Firefox.

---

## Phase 5 — Advanced Analytics Parity & Docs — 8%
Focus: Confirm Phase 3 analytics endpoints and surface UIs and docs.

Deliverables
- Verify endpoints: /api/analytics/predict/, /api/analytics/clv/, /api/analytics/forecast/, /api/analytics-snapshots/.
- Frontend: Predictions, CLV, Forecast, Snapshots; charts; error/loading states.
- Reports: Date-range filters and export affordances documented.

Acceptance Criteria
- API tests: parameter validation + success paths; component tests for visualization containers (mocked data).
- Cypress: navigation flows across analytics screens; a11y checks.
- Docs: examples, limits, caveats.

Dependencies: Reports + analytics models; MSW handlers for frontend tests.

Risks: Large dataset performance; include pagination + date filters.

---

## Phase 6 — Test Coverage Lift (Spec Validation ≥60%) — 12%
Focus: Raise effective spec validation to ≥60% by increasing component/E2E tests across revenue-critical modules.

Deliverables
- Coverage expansion: Contacts, Deals, Invoicing, Work Orders, Warehouse, Accounting summary.
- a11y tests (cypress-axe) for critical paths; regression tests for auth flows.
- CI coverage surfaced (Codecov) with thresholds enforced.

Acceptance Criteria
- ≥60% of canonical REQs validated by automated tests and referenced in docs.
- CI quality gates pass; flaky tests quarantined with tracking issues.

Dependencies: Jest/Cypress/MSW setup; CI configuration.

Risks: Legacy UI variance; prioritize top user stories.

---

## Phase 7 — Internationalization & Localization — 6%
Focus: Provide full i18n/l10n parity as per canonical UX/Accessibility guidance.

Deliverables
- Backend/Frontend i18n framework wiring; extraction of user-visible strings; locale switching.
- Date/number/currency localization; timezone awareness in backend and UI; CSV/exports localized.
- Language packs (at least 2 canonical locales) with translation completeness metric.

Acceptance Criteria
- i18n smoke tests for core flows; snapshot tests for localized strings.
- a11y tests with RTL languages (if required by spec) and screen readers.
- Docs: i18n developer guide and localization process.

Dependencies: Existing UI screens; formatting libraries; date/time handling.

Risks: Timezone edge cases; mitigate with end-to-end tests and canonical examples.

---

## Phase 8 — Security, Compliance & Privacy — 8%
Focus: Align to canonical security and privacy requirements (OWASP, least privilege, data minimization).

Deliverables
- Threat model and STRIDE review across modules; secure defaults; CSRF/CORS checks.
- Secrets management; audit logging for sensitive actions; PII classification and masking.
- Vulnerability scanning in CI (SAST/Dependency); role/permission audits and tests; optional SSO readiness.

Acceptance Criteria
- Security test suite PASS; no high/critical vulns in CI; permission matrix tests cover sensitive endpoints.
- Docs: Security practices, data classification, incident response playbook.

Dependencies: Existing RBAC; CI; logging infrastructure.

Risks: Third-party library CVEs; lockfile hygiene and scheduled updates.

---

## Phase 9 — Performance & Scalability — 6%
Focus: Meet canonical performance budgets and scalability targets.

Deliverables
- Backend: N+1 query audits; DB indices; caching strategies (per endpoint where beneficial); pagination defaults.
- Frontend: Bundle analysis; code splitting; lazy loading; memoization; virtualization for large lists.
- Load/perf tests (API + UI) with target SLAs; Lighthouse CI integration for key pages.

Acceptance Criteria
- Performance SLAs met (P95 latency, throughput) under defined load; Lighthouse scores within targets.
- Perf regressions prevented with CI gates.

Dependencies: Test data seeding; profiling tools; CI runners.

Risks: Cache invalidation complexity; careful scoping and unit tests.

---

## Phase 10 — Observability & SRE Readiness — 5%
Focus: End-to-end visibility and operability.

Deliverables
- Structured logging, metrics, and tracing for core flows; correlation IDs across services.
- Dashboards and alerts for error rates, latency, inventory low-stock, overdue invoices, and SLA breaches.
- Runbooks and SLOs for critical services.

Acceptance Criteria
- Synthetic checks and alert routing validated; error budgets tracked.
- Docs: On-call playbooks and troubleshooting guides.

Dependencies: Logging handler; metrics backend (configurable); health endpoints.

Risks: Noise in alerts; iterative tuning with recorded incidents.

---

## Phase 11 — Integrations & Data Migration — 7%
Focus: Canonical external integrations and seamless migration to final schemas.

Deliverables
- Email/SMS providers; optional payment gateway; map/route provider configuration.
- Data migrations for deprecations and canonicalization; dual-write/read compatibility windows; backfills.
- Import/export utilities with schema validation; idempotency and resumability.

Acceptance Criteria
- Integration tests with sandboxes; retries/backoff patterns validated.
- Migration dry-runs pass; roll-forward/roll-back plans documented.
- Docs: Integration setup guides; migration playbooks.

Dependencies: Provider accounts (sandbox); migration framework.

Risks: Provider rate limits; migration downtime; mitigate with chunking and throttling.

---

## Phase 12 — Documentation, UAT & Release Hardening — 8%
Focus: Final polish, user acceptance, and release readiness.

Deliverables
- Complete API and UI documentation; story-driven examples; JSON Schemas published (dev-only validator remains gated by DEBUG).
- UAT cycles with representative users; bug triage and fixes.
- Release notes; deprecation notices; feature flags cleanup and defaults finalized.

Acceptance Criteria
- 100% of canonical REQs validated with passing automated tests and docs references.
- All quality gates PASS in CI; UAT sign-off received; zero high/critical known issues.

Dependencies: All prior phases; stakeholders for UAT.

Risks: Last-minute regressions; lock change window and enforce code freeze before GA.

---

## Work Breakdown Summary
- Backend: API parity, validation, permissions, analytics verification, performance tuning, observability hooks, security hardening, migrations.
- Frontend: Technician/User Mgmt, Field Service, Analytics, Budget V2 UX, i18n, a11y, performance.
- QA: Coverage uplift to 100% REQ validation; a11y/perf/security checks; CI quality gates.
- Docs: API and feature guides updated continuously; JSON Schemas maintained; runbooks and playbooks authored.
- DevOps: CI/CD guards (tests/coverage/a11y/perf/security), environment parity, secrets, monitoring, alerting.

## Cross-Phase Acceptance & Quality Gates
- Build & Lint: PASS per MR; no new warnings.
- Tests: PASS (backend + frontend); coverage thresholds enforced (≥70% rising to ≥80% by Phase 12 for changed areas).
- Accessibility: cypress-axe AA checks on major screens.
- Performance: Lighthouse CI and API perf tests within budgets.
- Security: No high/critical CVEs; permission matrix tests PASS.
- Documentation: Updated for each endpoint/component with examples and error handling.

## Timeline (indicative)
- Phases 1–6: ~7–8.5 weeks (from existing plan to ≥60%).
- Phases 7–12: ~6–8 weeks (parallelizable by squads).
- Total: ~13–16.5 weeks (subject to team size and parallelization).

## Risk Register (selected)
- API drift vs. existing clients — Mitigation: deprecation policy, feature flags, migration windows.
- UI complexity (maps/calendar/signature/i18n) — Mitigation: progressive enhancement; MSW/Cypress stubs.
- Test flakiness — Mitigation: quarantine, deterministic seeds, focused retries where appropriate.
- Security regressions — Mitigation: CI security gates, dependency monitoring, periodic audits.
- Performance regressions — Mitigation: perf CI gates and budget enforcement.

## Reporting & Governance
- Weekly checkpoint: % REQs validated, failing tests by phase, a11y/perf/security status, docs delta.
- Phase exit requires: All acceptance criteria met, quality gates PASS, docs updated, and stakeholder sign-off where applicable.

## Appendix — Canonical Spec Mapping (high level)
- Finance: REQ-101..105, REQ-102 Expenses, REQ-103 Work Orders/Invoices — Phases 1–2, 11
- Workflow: REQ-201..205 — Phases 1, 4
- Analytics: REQ-301..302 — Phase 5
- Technician & Users: REQ-401..424 — Phase 3
- Field Service: REQ-501..529 — Phase 4
- Frontend Testing & QA: REQ-601..630 — Phases 6, 12
- i18n/Security/Perf/Observability/DevOps — Phases 7–10 (mapped to cross-cutting REQs/standards where defined)

> All REQ-to-issue mappings and progress will be maintained via automatically generated GitHub issues and milestones (see `docs/automation`), with links back to tests and docs.
