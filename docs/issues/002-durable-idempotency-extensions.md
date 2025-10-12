# Issue 002: Extend Durable Idempotency to Payments and Work Order Completion

Priority: High
Status: Open
Owner: Backend
Labels: accounting, reliability, idempotency

## Summary
Invoice posting now uses a durable idempotency marker (`Invoice.posted_journal`, `posted_at`). Extend similar durable markers to:
- Payment posting (AC-GL-002)
- Work order consumption posting (AC-GL-003)

## Problem
Current idempotency for payments and work order completion relies on JournalEntry description lookups. This is brittle and can allow duplicates if descriptions diverge.

## Proposed Changes
- Payment: add `posted_journal` (FK) and `posted_at` on `Payment`. Set on first successful post in `PaymentViewSet.allocate`. Guard subsequent calls by these markers.
- WorkOrder: add `consumption_posted_journal` (FK) and `consumption_posted_at` on `WorkOrder` or a small `WorkOrderPosting` model keyed by `work_order_id` and `type="consumption"`.
- Migrations for new fields. Backfill not required.
- Maintain legacy description check for safety during rollout.

## Acceptance Criteria
- AC-1: First successful Payment allocation sets `Payment.posted_journal` and `posted_at`; second call returns 409 without creating a duplicate JournalEntry.
- AC-2: First successful WorkOrder completion sets durable posting markers and returns 201; re-call returns 409; no duplicate JournalEntry.
- AC-3: Unit tests cover happy path and idempotency for both Payment and WorkOrder.
- AC-4: Docs updated (docs/API.md) to reflect durable semantics.

## Affected Areas
- `main/models.py` (Payment, WorkOrder)
- `main/api_views.py` (PaymentViewSet.allocate, WorkOrderViewSet.complete_work_order)
- `main/migrations/*`
- `main/tests/test_posting_payment.py`, `main/tests/test_posting_inventory.py`

## Risks
- Migration implications; ensure nullable and back-compat.
