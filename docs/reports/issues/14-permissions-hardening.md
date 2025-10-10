# Issue 14: Insufficient Permission Scoping on Sensitive Endpoints

Severity: Medium
Type: Security / Access Control
Status: Open

## Summary
Several viewsets expose full querysets to any authenticated user (e.g., `CustomFieldValueViewSet`, `PaymentViewSet`, `JournalEntryViewSet`, `QuoteItemViewSet`). Business rules intend role-based or ownership scoping.

## Impact
- Possible data leakage of financial or custom field data.
- Violates principle of least privilege.

## Acceptance Criteria
1. Each sensitive viewset enforces role-based restrictions (e.g., managers vs owner vs read-only).
2. Object-level filtering applied in `get_queryset`.
3. Tests for unauthorized access attempts returning 403.

## Proposed Steps
- Define permission matrix doc.
- Implement custom DRF permissions (e.g., `IsSalesManagerOrOwner`).
- Apply to targeted viewsets.

## Risks
Breaking existing frontend assumptions; require adaptation.

## Next Steps
- [ ] Draft permission matrix.
- [ ] Implement custom permissions.
- [ ] Add tests.
