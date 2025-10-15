---
title: Converge Spec Line‑Up Plan — 5% Milestone
version: 0.1
date_created: 2025-10-11
last_updated: 2025-10-11
owner: Converge Product Team
tags: [plan, alignment, milestone, specs]
---

# Objective

Bring the running Converge codebase into alignment with the canonical master specification to a minimum of 5% functional/spec coverage, focusing on low‑risk, high‑signal updates that improve developer velocity and QA confidence.

Success at this milestone is measured by delivering the specific spec‑driven features below and passing the listed acceptance checks. This plan deliberately limits scope to stay under the 5% threshold and lay a strong foundation for subsequent 25%/50%/95% milestones.

## Alignment measurement (for this milestone)

Scope of “match” for 5% milestone is defined by these deliverables tied to the canonical spec:
- JSON Schema Catalog surfaced in master spec and discoverable to developers (ref: spec‑design‑master {#json-schema-catalog}).
- API consumer guidance for schema validation in docs (docs/API.md “Schema usage”).
- A dev‑only JSON Schema validation endpoint to quickly validate payloads against draft‑07 schemas (ref: API utilities, non‑production).

Collectively, these items constitute approximately 5% of the canonical spec surfaces (documentation + dev utilities) with minimal operational risk.

## Phase overview

- Phase 0 — Baseline and instrumentation (est. 0.5% contribution)
- Phase 1 — JSON Schema Catalog visibility (est. 2.0%)
- Phase 2 — API consumer guidance (docs/API.md) (est. 1.5%)
- Phase 3 — Dev JSON Schema validator endpoint (est. 1.0%)

Total estimated alignment: ~5.0%

Notes: Percentages are qualitative to illustrate scope; exact global match will be tracked more precisely at higher milestones by feature checklist and endpoint inventory.

---

## Phase 0 — Baseline and instrumentation (0.5%)

Goal: Ensure the codebase can reliably surface the canonical spec and pass structural checks so subsequent phases are traceable.

- Actions
  - Validate specs: run `tools/spec_validate.py` and resolve blocking errors if any.
  - Compile spec: run `tools/spec_compile.py` to refresh `spec/COMPILED_SPEC.md`.
  - Capture a short summary in the PR description (“Spec validation PASS; compiled N sources”).

- Deliverables
  - Passing validator output in CI logs.
  - Updated `spec/COMPILED_SPEC.md` artifact.

- Acceptance criteria
  - “Result: PASS” from validator.
  - Compiled spec exists and includes the master + module specs.

- Quality gates
  - Build/Lint/Test unchanged: PASS baseline required.

---

## Phase 1 — JSON Schema Catalog visibility (2.0%)

Goal: Make the canonical schemas easy to discover and reference directly from the master spec.

- Canonical references
  - Master spec → “JSON Schema Catalog” {#json-schema-catalog}
  - Draft‑07 as enforcement baseline; 2019‑09/2020‑12 as informational variants.

- Actions
  - Ensure `spec/spec-design-master.md` includes a JSON Schema Catalog listing links under `.copilot-tracking/research/` for:
    - Accounting: JournalEntry, Payment, Expense, MonthlyDistribution
    - FSM: ScheduledEvent, NotificationLog
    - Staff: Technician
    - Inventory & WOs: WarehouseItem, WorkOrder, WorkOrderInvoice

- Deliverables
  - Catalog section with file paths and brief alignment notes per schema.

- Acceptance criteria
  - Section present with draft‑07 links and notes; variants listed as informational.
  - Spec validator PASS; compiled spec contains the section.

- Quality gates
  - Docs lint (markdown) PASS; no CI regressions.

---

## Phase 2 — API consumer guidance in docs (1.5%)

Goal: Clarify how client teams should validate requests against draft‑07 and when to rely on server‑side validation.

- Canonical references
  - Master spec: API and Schema docs; JSON Schema posture (draft‑07 baseline).

- Actions
  - Update `docs/API.md` with a “Schema usage (JSON Schema)” section:
    - State draft‑07 as the baseline; variants are informational only.
    - Mention flexible fields (e.g., RRULE) validated server‑side.
    - Recommend Ajv (JS) and `jsonschema` (Python) with a tiny example.
    - Mention the dev validator endpoint for quick checks.

- Deliverables
  - Concise guidance section with one code example.

- Acceptance criteria
  - Docs PR includes the new section; linked to master spec catalog.
  - CI docs check PASS (if applicable).

- Quality gates
  - No code changes; lint/test unaffected.

---

## Phase 3 — Dev JSON Schema validator endpoint (1.0%)

Goal: Provide a fast, non‑production API for QA/devs to validate payloads against canonical schemas.

- Canonical references
  - Master spec: Utilities/Schema usage notes; dev tooling context.

- API contract (dev‑only)
  - POST `/api/dev/validate-json/`
  - Body: `{ "schema": "journalentry" | "scheduled-event" | ..., "payload": { ... } }`
  - Response: `{ schema, schema_path, valid: bool, errors: [{ path, message }] }`
  - Availability: Only when `DEBUG=True`; 404 otherwise.

- Actions
  - Implement view in `main/api_views.py` guarded by `settings.DEBUG`.
  - Wire URL in `main/api_urls.py` under `dev/validate-json/`.
  - Add `jsonschema` to `requirements.txt` for local dev.
  - Document the endpoint usage in `docs/API.md` (pointer already in Phase 2).

- Deliverables
  - Working endpoint in dev.
  - Example cURL in PR description; optional unit test (non‑blocking for 5%).

- Acceptance criteria
  - Valid payload returns `valid: true, errors: []`.
  - Invalid payload returns `valid: false` with readable JSON paths.
  - Endpoint is unreachable (404) when `DEBUG=False`.

- Quality gates
  - Backend tests PASS; lint PASS; no production surface exposed.

---

## Out of scope for 5% (queued for next milestones)

- GTIN utility: `/api/utils/gtin/check-digit/` and model‑level `WarehouseItem.gtin` validation.
- Budget v2 + MonthlyDistribution API and migrations.
- Posting rules hardening and GL line breakdowns.
- Technician assignment optimizer improvements and FSM UI wiring.

These items are planned for the 25% milestone to grow alignment in coherent vertical slices (Inventory + Accounting, FSM + Notifications).

---

## Risks and mitigations

- Risk: Schema drift between serializers and JSON Schemas.
  - Mitigation: Treat draft‑07 as authoritative; variants are annotations; use the dev validator for quick checks.
- Risk: Dev endpoint used outside of development.
  - Mitigation: Strict `DEBUG` guard; exclude from prod deployments.

---

## Handover checklist (per PR)

- Spec validator PASS; compiled spec updated.
- JSON Schema Catalog present in master spec.
- docs/API.md includes “Schema usage” with example.
- Dev validator endpoint callable and returns expected shapes.
- No production behavior changes; CI green.

---

## References

- Master Spec: `spec/spec-design-master.md` → API and Schema Documentation; JSON Schema Catalog {#json-schema-catalog}
- Research Schemas: `.copilot-tracking/research/*.schema.json`
- Tools: `tools/spec_validate.py`, `tools/spec_compile.py`
