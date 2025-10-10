# MSW Error Path Assertions (Post-Reinstatement)

**Labels:** testing, follow-up

## Summary
After MSW is restored, add explicit error-path handler assertions across major modules.

## Scope
At least one test each for: CRM (Accounts/Deals), Scheduling, Warehouse.

## Acceptance Criteria
- Tests assert handler invocation & UI fallback messaging.
- No reliance on generic jest mock rejections.
- Linked to parent MSW reinstatement issue.
