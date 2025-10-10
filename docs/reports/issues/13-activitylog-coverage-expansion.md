# Issue 13: Incomplete ActivityLog Coverage for Key Domain Actions

Severity: Medium
Type: Observability / Auditability
Status: Open

## Summary
Not all critical state-changing operations generate `ActivityLog` entries (e.g., technician assignment, inventory reservation consume/release, route optimization, reminder notifications). Spec emphasizes comprehensive audit trail.

## Impact
- Reduced traceability; harder incident investigations.
- Compliance / audit requirements potentially unmet.

## Acceptance Criteria
1. All mutating endpoints produce standardized ActivityLog entries (who, what, resource, summarized delta).
2. Helper utility introduced to reduce duplication.
3. Tests assert log creation for representative actions.

## Proposed Implementation
- Create `activity_logger.py` with `log_action(user, action, obj, description)`.
- Wrap endpoints after successful state change.

## Risks
Log noise if verbosity uncontrolled—consider action taxonomy & retention strategy.

## Next Steps
- [ ] Enumerate missing actions.
- [ ] Implement helper & integrate.
- [ ] Add tests.
