# Codebase vs Canonical Spec Gaps — Accounting Postings, RBAC, and Contract Alignment

Labels: accounting, rbac, api-contract, high-priority, needs-tests

## Summary
Track gaps between current implementation and canonical spec (`spec/COMPILED_SPEC.md`) with a plan to reach parity. Prioritized by [impact] and [delta], with acceptance criteria and tests-first approach.

## Gaps and Plan

1) Payments posting and AR settlement (AC-GL-002) [Impact: HIGH, Delta: MEDIUM-HIGH]
- Implement JournalEntry DR Cash/Bank, CR AccountsReceivable on payment.
- Apply amounts to Invoice (and WorkOrderInvoice), support partials, reject overpay.
- Idempotency key for posting (initially scoped to per-payment posting; full external ref key as follow-up).
- Tests in `main/tests/test_posting_payment.py`.

2) Inventory consumption posting (AC-GL-003) [Impact: HIGH, Delta: MEDIUM-HIGH]
- Add WorkOrder completion action to consume inventory and post COGS/Inventory.
- Idempotency guard; prevent negative stock and return 409.
- Tests in `main/tests/test_posting_inventory.py`.

3) Invoice posting durability (AC-GL-001 hardening) [Impact: MEDIUM-HIGH, Delta: LOW-MEDIUM]
- Persist posted state (`posted_journal_id` or `posted_at`); switch idempotency to durable key.
- Optional: tax line support when configured.
- Extend tests to verify persisted idempotency.

4) Contact RBAC alignment [Impact: HIGH, Delta: LOW]
- Managers see all; reps see owned only; add tests.

5) Quote convert-to-deal [Impact: MEDIUM, Delta: MEDIUM]
- `POST /api/quotes/{id}/convert-to-deal/` gated by status=accepted; activity logged; add tests.

6) Scheduling availability-check GET support [Impact: LOW, Delta: LOW]
- Support GET (in addition to POST during transition); add tests.

7) Financial report export formats [Impact: LOW-MEDIUM, Delta: MEDIUM]
- Add `?format=pdf|csv` or `/export` endpoints; smoke tests.

8) Activity logging consistency [Impact: MEDIUM, Delta: LOW-MEDIUM]
- Add `log_activity` to significant create/update/post/complete actions.

## Acceptance Criteria (selected)
- AC-GL-002: Payment posting → JournalEntry DR Cash/Bank, CR AR; invoice balance reduced; proper status; idempotent; overpay rejected (400).
- AC-GL-003: WorkOrder completion consumes inventory once, posts COGS/Inventory once, prevents negative stock (409), logs activity.
- AC-GL-001 hardening: Reposting returns 409; invoice shows posted state and links to JournalEntry.

## Links
- Spec anchors: {#ac-gl}, {#api-index}, {#field-service-api}, {#tech-user-api}
- Code: `main/api_views.py`, `main/api_urls.py`, `main/models.py`, `main/tests/*`

---

This issue is ready to be created on GitHub with the title above and labels listed. Once created, we will work the plan in phases, starting with Phase A (AC-GL-002/003).
