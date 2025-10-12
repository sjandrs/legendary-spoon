# Issue 003: Spec Updates – Invoice Posted State, Availability-Check GET, Contacts RBAC

Priority: Medium
Status: Open
Owner: Spec Governance
Labels: spec, docs, api

## Summary
Update canonical spec and compiled artifacts to reflect recent changes:
- Durable invoice posted state (`posted_journal`, `posted_at`)
- GET support for `/api/scheduling/availability-check/` and weekly availability logic
- Contacts RBAC scoping: managers see all, others only `owner == user`

## Tasks
- Update `spec/spec-design-master.md` (API + data models sections)
- Re-run spec compile to refresh `spec/COMPILED_SPEC.md`
- Cross-reference in `docs/API.md`

## Acceptance Criteria
- AC-1: Canonical spec includes Invoice fields and idempotency semantics.
- AC-2: Availability-check endpoint documents GET, parameters, and behavior.
- AC-3: Contacts RBAC section updated; examples included.
- AC-4: Spec compiler run produces updated `COMPILED_SPEC.md` with the above changes.

## Links
- Code: `main/api_views.py` (InvoiceViewSet.post_invoice, ContactViewSet, availability-check)
- Docs: `docs/API.md`
