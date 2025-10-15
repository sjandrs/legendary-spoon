# Spec Lineup — 25% Canonical Feature Alignment Plan (Milestone M2)

Date: 2025-10-11
Status: Proposed → In Progress upon approval
Owner: Platform Engineering (Backend/Frontend/QA)
Target: Raise canonical spec alignment to ~25%

## Objective
Deliver the first production-grade slices for Inventory GTIN utilities and Accounting Budget v2, turning prior research and dev tooling into shippable features with tests, docs, and safe migrations.

This milestone implements:
- Utilities: GTIN check-digit helper API (server) and client usage path
- Inventory: WarehouseItem.gtin field + validation (digits-only, check-digit)
- Accounting: Budget v2 + MonthlyDistribution minimal viable models, CRUD APIs, and seed data
- Documentation updates and JSON Schema publication for the above
- Automated tests (backend + frontend smoke), quality gates, and migration safety

Out of scope (deferred to later milestones): durable posting hardening expansions, full scheduling optimizations, payroll, and advanced analytics.

## Success Criteria (Acceptance)
1. Utilities API
   - GET /api/utils/gtin/check-digit/?gtin_base= returns computed check digit and normalized 14-digit GTIN (digits only).
   - Input validation returns 400 with structured error on non-digit input or invalid length.
   - API documented in docs/API.md; example requests and responses included.

2. Inventory — WarehouseItem.gtin
   - Model includes nullable `gtin` CharField(max_length=14) with digits-only constraint.
   - Serializer validates digits-only and, when length is 14, validates check digit; if <14, accepts but normalizes/stores as digits-only string; no formatting characters stored.
   - Create/Update endpoints reject invalid data with specific errors; admin and list/detail serializers include `gtin`.
   - MSW handler and frontend form accept/display `gtin` (optional field) with basic client-side digits-only restriction.

3. Accounting — Budget v2 + MonthlyDistribution
   - New models and CRUD APIs exist: BudgetV2 and MonthlyDistribution (1:12 mapping per budget; values sum to 100%).
   - BudgetV2 requires Cost Center (FK), optional Project (FK). Defaults during migration: Cost Center = “General Operations” (created if missing); MonthlyDistribution seeded to 12 × 8.33% (last month adjusts rounding to reach 100%).
   - List/create/update/delete endpoints wired via DRF Router; permissions aligned to existing RBAC patterns.
   - JSON Schemas published (draft-07) and linked from master spec; dev validator can validate example payloads.

4. Tests & Quality Gates
   - Backend: New tests for Utilities API, WarehouseItem serializer, BudgetV2 and MonthlyDistribution models/serializers/views. Minimum +12 tests added, all green locally and in CI.
   - Frontend: Jest test(s) cover rendering of GTIN field and basic digits-only client behavior; MSW handlers added. Cypress E2E optional smoke for creating a BudgetV2 with default distribution.
   - Quality gates: Lint PASS, Tests PASS, Coverage unchanged or improved; pre-commit hooks clean.

5. Documentation & Spec
   - spec/spec-design-master.md references the new endpoints and fields; JSON Schema Catalog lists BudgetV2 and MonthlyDistribution schemas, plus WarehouseItem with optional `gtin`.
   - docs/API.md includes: Utilities GTIN endpoint, WarehouseItem.gtin rules, Budget v2 endpoints with examples, and “Schema usage” cross-links.

## Scope of Work

### Backend (Django/DRF)
- Utilities
  - Add GET /api/utils/gtin/check-digit/ in `main/api_views.py` and route in `main/api_urls.py`.
  - Logic: validate digits-only input; accept 7–13 digit base; compute 14th check digit per GS1; return normalized 14-digit GTIN.
- Inventory
  - Add `gtin` CharField(max_length=14, null=True, blank=True) to `WarehouseItem` in `main/models.py` with migration.
  - Extend `WarehouseItem` serializer validation: digits-only; if len==14, verify check digit; otherwise allow shorter digits (stored as-is) with normalization to digits-only.
  - Update `admin.py` to include `gtin` in list_display/search_fields where applicable.
- Accounting
  - Add models: `BudgetV2` and `MonthlyDistribution` with constraints (12 rows per budget; total 100%).
  - Serializers and `ModelViewSet` endpoints; DRF router wiring; permissions per existing patterns.
  - Data migration to create default Cost Center “General Operations” if absent; backfill distribution 12 × 8.33% with rounding fix.
- JSON Schemas
  - Author and publish draft-07 schemas: `BudgetV2`, `MonthlyDistribution`; update `WarehouseItem` schema to include optional `gtin` with pattern ^\d{7,14}$ and example.
  - Ensure dev validator endpoint recognizes these schema keys.

### Frontend (React/Vite)
- API client: add Utilities call for GTIN check-digit; expose a helper function.
- Warehouse UI: surface an optional GTIN input on Warehouse item forms (digits-only input mask/validation message; no heavy UX required this milestone).
- Minimal Budget V2 screens not required; optionally add a basic read-only list page wired to new endpoint for smoke testing, if capacity allows.
- Tests: Jest component test(s) for GTIN input and api helper; MSW handler for Utilities endpoint; update coverage thresholds if needed.

### Documentation & Spec
- Update `spec/spec-design-master.md` with canonical links and brief descriptions for:
  - Utilities GTIN endpoint
  - WarehouseItem.gtin field
  - BudgetV2 and MonthlyDistribution with distribution rule
- Update `docs/API.md` with:
  - Endpoint details and examples (request/response) for Utilities and Budget v2
  - WarehouseItem.gtin validation notes and examples
  - Links to JSON Schema catalog and dev validator instructions

### CI/CD & DevEx
- Ensure tests run in existing workflows.
- No new secrets or external services required.
- Add lightweight factory or fixture data for tests and optional seed command augmentation.

## Detailed Tasks Checklist

- Utilities (GTIN)
  - [ ] View + URL: /api/utils/gtin/check-digit/
  - [ ] Input validation and GS1 check-digit computation
  - [ ] Unit tests (valid, invalid length, non-digit, boundary cases)
  - [ ] API docs update with examples
  - [ ] Frontend helper and MSW handler + test

- Inventory (WarehouseItem.gtin)
  - [ ] Model field + migration
  - [ ] Serializer validation + tests (create/update)
  - [ ] Admin/list serializers include field
  - [ ] API docs update and schema update
  - [ ] Frontend optional input wiring + test

- Accounting (Budget v2 + MonthlyDistribution)
  - [ ] Models + migrations with constraints
  - [ ] Serializers, ViewSets, Router wiring
  - [ ] Default Cost Center data migration and distribution seeding
  - [ ] Backend tests (models, serializers, API CRUD)
  - [ ] API docs and JSON Schemas

- Documentation & Spec
  - [ ] Master spec updates + JSON Schema Catalog entries
  - [ ] API.md updates
  - [ ] Dev validator schema keys registered

- Quality Gates
  - [ ] Flake8/isort/Black clean
  - [ ] Jest/Cypress (optional smoke) passing
  - [ ] Coverage stable or improved

## Contracts and Rules (Quick Reference)
- GTIN digits-only normalization; provide 14-digit normalized output when check digit computed.
- WarehouseItem.gtin accepts 7–14 digits; if 14 digits, check digit must be valid; storage is digits-only.
- BudgetV2 requires Cost Center; Project optional; MonthlyDistribution totals 100% across 12 months.
- JSON Schema baseline: draft-07; variants remain informational.

## Testing Strategy
- Backend
  - Utilities: parameterized tests for GTIN bases (7–13 digits) producing correct check digits; negative tests for non-digit and length.<14 with non-digit.
  - WarehouseItem: serializer create/update tests; round-trip GET includes `gtin`.
  - BudgetV2/MonthlyDistribution: model constraint tests (12 rows), sum-to-100 validation, CRUD API tests, data migration test ensuring default cost center and seeded distribution.
- Frontend
  - Unit: digits-only GTIN input behavior; API helper happy/invalid paths with MSW.
  - E2E (optional): create BudgetV2 via UI or API-backed fixture and verify distribution total.

## Risks and Mitigations
- Data Integrity: Enforce digits-only and check-digit rules server-side; add DB-level constraints where safe.
- Rounding Drift: Final month adjusts to hit 100%; include explicit test.
- Backwards Compatibility: `gtin` is nullable; serializers remain compatible.
- Scope Creep: Defer advanced scheduling and posting hardening; keep UI minimal.

## Rollout and Backout
- Rollout: Standard migration sequence; deploy backend first; frontend change is additive.
- Backout: Safe due to additive changes; if needed, revert migrations and hide GTIN field in UI.
- Feature Flags: Not required; endpoints are additive and guarded by validation.

## Timeline and Effort (Indicative)
- Backend (GTIN + Inventory): 1.5–2.0 days including tests
- Backend (Budget v2): 2.0–3.0 days including models, migrations, tests
- Frontend: 0.5–1.0 day (helper, MSW, input, tests)
- Docs & Spec: 0.5 day
- Buffer/Review: 0.5 day
Total: ~5 days elapsed (single engineer); parallelization reduces calendar time.

## Definition of Done
- All acceptance criteria satisfied.
- Tests PASS locally and in CI; lint PASS; coverage stable or improved.
- docs/API.md and spec/spec-design-master.md updated; JSON Schemas published.
- Endpoint live and discoverable; minimal UI present for GTIN input.
- Alignment reported at ~25% with traceable mapping to canonical spec sections.

## Traceability (Canonical Spec ↔ Implementation)
- Utilities (GTIN): spec-design-master.md → Utilities API; new endpoint /api/utils/gtin/check-digit/
- Inventory: WarehouseItem.gtin field — spec master “Warehouse Management” + JSON Schema Catalog
- Accounting: Budget v2 + MonthlyDistribution — spec-design-accounting-expansion.md
- JSON Schemas: Catalog entries for BudgetV2, MonthlyDistribution, WarehouseItem (with gtin?)

## References
- Backend files: `main/models.py`, `main/serializers.py`, `main/api_views.py`, `main/api_urls.py`, `main/admin.py`, `main/tests.py`
- Frontend files: `frontend/src/api.js`, `frontend/src/components/Warehouse.jsx` (or relevant form), `frontend/src/__tests__/...`
- Docs: `docs/API.md`, `spec/spec-design-master.md`
- Testing: Jest config, MSW handlers, Django tests in `main/tests.py`
