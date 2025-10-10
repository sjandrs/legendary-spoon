# Issue 18: Test Suite Gaps for Critical Domain Paths

Severity: Medium
Type: Testing / Quality
Status: Open

## Summary
High-risk workflows (technician assignment edge cases, inventory adjustment concurrency, overdue invoice reminders, route optimization failure modes) lack explicitly referenced tests. Future regressions likely.

## Impact
- Undetected logic regressions.
- Lower confidence in refactors / scaling work.

## Acceptance Criteria
1. Add tests for: technician assignment (expired cert, missing coverage, unavailable schedule), inventory adjustment preventing negative stock, overdue reminder partial failure handling, analytics snapshot idempotency, global search happy path & invalid field regression.
2. Minimum coverage delta +N critical path lines.
3. CI gate includes new tests passing.

## Proposed Steps
- Create focused test modules (`test_field_service.py`, `test_inventory.py`, etc.).
- Use factory helpers for concise setup.

## Risks
None significant; need to avoid brittle date/time assertions.

## Next Steps
- [ ] Draft test plan file.
- [ ] Implement tests incrementally.
