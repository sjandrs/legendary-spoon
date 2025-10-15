# Copilot Tracking: Spec Incompleteness and Alignment Report

date: 2025-10-11
branch: Development
compiled_spec: spec/COMPILED_SPEC.md (generated at current timestamp)
owner: Spec Governance + Backend

## Summary
This report captures gaps where the canonical specification (spec/spec-design-master.md + compiled spec) is incomplete or out of sync with the current implementation and tests. It also links tracking issues and proposes concrete spec edits.

## Top Gaps (Incomplete or Out-of-Sync)

1) Accounting postings: durable idempotency not documented for Invoice
- Evidence (Code): main/models.py adds `Invoice.posted_journal` (FK) and `posted_at`; main/api_views.py persists these in InvoiceViewSet.post_invoice.
- Evidence (Spec): In “Invoices API (CRM) — Posting endpoints”, spec documents POST /api/invoices/{id}/post/ and idempotency but does not mention persisted fields or durable key semantics.
- Impact: Readers miss the authoritative data contract for posted state and idempotency guarantees.
- Action: Add “Invoice Posted State” subsection with fields, semantics, and migration note.

2) Payment posting endpoint not specified
- Evidence (Code): PaymentViewSet.allocate creates DR Cash (1000)/CR AR (1100), computes open_balance, enforces overpay 400, idempotency by description.
- Evidence (Spec): No explicit endpoint in master spec for payment allocation/posting; only mentions payments in summary/ER models.
- Impact: API consumers lack contract and error semantics; acceptance mapping lacks AC-GL-002 details.
- Action: Add “Payments API — Allocation” subsection: POST /api/payments/{id}/allocate/ with request/response and error modes; add AC-GL-002 mapping.

3) Work Order completion posting endpoint contract missing
- Evidence (Code): A completion endpoint posts DR COGS (5000)/CR Inventory (1200) with idempotency and conflict handling.
- Evidence (Spec): Field Service section notes that completion triggers consumption + GL posting, but does not define the endpoint contract and response fields.
- Impact: Ambiguity for clients and tests; no acceptance mapping link for AC-GL-003 status update.
- Action: Add “Work Orders — Completion” subsection: POST /api/work-orders/{id}/complete/ with response {journal_entry_id, amount} and 409/0-cost semantics; update AC-GL-003 mapping.

4) Contacts RBAC scoping not explicitly stated in the Contacts API section
- Evidence (Code): ContactViewSet.get_queryset restricts non-managers to owner; managers see all. New tests in main/tests/test_contacts_rbac.py validate this.
- Evidence (Spec): Generic RBAC rules exist, but Contacts API section does not state scoping explicitly.
- Impact: Confusion for client-side filtering and test authors.
- Action: Add a “RBAC” note under Contacts API stating manager vs owner scoping.

5) Availability-check endpoint lacks data-contract details
- Evidence (Code): check_technician_availability now accepts GET and POST; validates iso datetimes; checks conflicts + weekly availability; returns `is_available`, `technician_id`, `technician_name`, optional `conflicts` and `availability_note`.
- Evidence (Spec): Field Service Management API lists the GET endpoint but omits parameters and response schema.
- Impact: API consumers lack required/optional params and schema for conformance testing.
- Action: Add a table for params/response; add acceptance tests reference.

6) Acceptance Mapping not updated for new tests
- Evidence (Tests):
  - AC-GL-002 implemented in main/tests/test_posting_payment.py
  - AC-GL-003 tests added in main/tests/test_posting_inventory.py (beyond “planned”)
- Evidence (Spec): Acceptance Mapping section still shows AC-GL-001 implemented; AC-GL-003 “planned”.
- Impact: Traceability drift.
- Action: Update Acceptance Mapping to reflect implemented tests.

7) Payment & Work Order durable idempotency (future)
- Evidence (Issues): docs/issues/002-durable-idempotency-extensions.md created to extend durable markers to Payment and WorkOrder.
- Evidence (Spec): Idempotency keys are outlined conceptually, but model-level persisted markers are not specified for these entities.
- Impact: Pending implementation; preemptive spec addition can reduce future drift.
- Action: Add model fields (or posting log entity) to spec with migration notes once implemented.

## Suggested Spec Edits (Precise Deltas)

- In “Invoices API (CRM) — Posting endpoints”:
  - Add: Invoice Posted State
    - Fields: posted_journal: FK(JournalEntry|null), posted_at: DateTime|null
    - Semantics: first successful post sets fields; idempotency = posted_journal set (409 on re-post)
    - Back-compat: legacy description key checked during transition

- New section: Payments API — Allocation
  - POST /api/payments/{id}/allocate/
  - Response (201): { payment_id, journal_entry_id, allocated_amount, open_balance, status: partial|paid }
  - Error: 400 overpay; 409 already-posted
  - Notes: DR 1000 Cash, CR 1100 AR; idempotency to be made durable (see Issue 002)

- New section: Work Orders — Completion
  - POST /api/work-orders/{id}/complete/
  - Response (201): { journal_entry_id, amount }
  - Errors: 409 if already completed/posted; success with message when zero consumption
  - Notes: DR 5000 COGS, CR 1200 Inventory; idempotency to be made durable (see Issue 002)

- Contacts API (RBAC Note)
  - “Managers see all; non-managers only contacts with owner == request.user.”

- Field Service: Availability Check (Data Contract)
  - Methods: GET, POST
  - Params: technician_id (int, required), start_time (ISO datetime), end_time (ISO datetime)
  - Response: technician_id, technician_name, is_available, start_time, end_time, conflicts[]?, availability_note?

- Acceptance Mapping
  - Mark AC-GL-001: Implemented (tests listed)
  - Mark AC-GL-002: Implemented (tests listed)
  - Mark AC-GL-003: Implemented (tests listed)

## Cross-References
- Issues filed:
  - docs/issues/002-durable-idempotency-extensions.md
  - docs/issues/003-spec-updates-invoice-posted-availability-get-rbac.md
  - docs/issues/004-tests-api-contract-availability-check.md
- Docs delta: docs/API.md updated with endpoints and RBAC note
- Code anchors: main/api_views.py (InvoiceViewSet.post_invoice, PaymentViewSet.allocate, check_technician_availability, ContactViewSet.get_queryset)

## Next Actions
1) Update spec/spec-design-master.md with the above precise deltas (API sections + Acceptance Mapping).
2) Re-run spec compile to refresh COMPILED_SPEC.md.
3) Close Issue 003 once spec updated and compiled; keep Issue 002 open for Payment/WorkOrder durability changes.
4) Add AC tests for availability-check schema validation (ref Issue 004) if more coverage desired.

## Validation Checklist
- [ ] Spec sections updated with invoice posted state fields
- [ ] Payments API allocation endpoint documented
- [ ] Work order completion endpoint documented
- [ ] Contacts RBAC note added under Contacts API
- [ ] Availability-check params/response documented
- [ ] Acceptance Mapping updated for AC-GL-001/002/003
- [ ] COMPILED_SPEC.md regenerated
