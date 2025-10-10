# Issue 11: Dual User Models (CustomUser vs EnhancedUser) Causing Divergence Risk

Severity: Medium
Type: Architecture / Technical Debt
Status: Open

## Summary
Both `CustomUser` and `EnhancedUser` models exist. Many viewsets reference `CustomUser`, while Phase 4 features introduced `EnhancedUser` for hierarchical management. Without consolidation, features (permissions, hierarchy, technician linkage) may fragment.

## Impact
- Inconsistent permission enforcement.
- Increased complexity in authentication, serializer maintenance, and migrations.
- Potential data duplication if future features add fields to both.

## Acceptance Criteria
1. Clear decision documented: migrate fully to `EnhancedUser` or deprecate it.
2. Django `AUTH_USER_MODEL` aligned with chosen model.
3. Backward compatible data migration plan defined & migration scripts drafted.
4. Updated references in viewsets/serializers/tests.
5. Deprecation notice or removal plan for legacy model.

## Proposed Paths
Option A: Promote `EnhancedUser` to primary user model (requires swappable migration strategy if early enough).
Option B: Fold hierarchy fields into `CustomUser` and remove `EnhancedUser`.

## Risks
Altering user model post-migration is non-trivial; data migration must be carefully orchestrated. Token/auth flows could break if references mismatch.

## Next Steps
- [ ] Architectural decision record (ADR).
- [ ] Inventory of usages referencing each model.
- [ ] Migration feasibility assessment.
