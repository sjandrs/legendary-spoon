# Issue 004: API Contract Conformance Tests – Availability-Check

Priority: Medium
Status: Open
Owner: QA
Labels: testing, api, field-service

## Summary
Add back-end tests to assert the contract for `/api/scheduling/availability-check/`:
- Accepts both GET and POST
- Required params: `technician_id`, `start_time`, `end_time`
- Response fields: `technician_id`, `technician_name`, `is_available`, `start_time`, `end_time`, optional `conflicts`, optional `availability_note`
- Weekly availability logic and conflict detection

## Acceptance Criteria
- AC-1: Tests exist validating GET and POST parity and 400 for missing parameters.
- AC-2: Tests validate expected response schema and types.
- AC-3: Tests validate availability behavior for within-window vs out-of-window scenarios.
- AC-4: Tests run in CI and pass.

## References
- Implementation: `main/api_views.py::check_technician_availability`
- Existing tests: `main/tests/test_availability_check.py`
