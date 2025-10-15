# Phase 1 — Canonical API Parity Baseline (Foundations) — 12%

Milestone: Phase 1 - Canonical API Parity Baseline

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
- --
