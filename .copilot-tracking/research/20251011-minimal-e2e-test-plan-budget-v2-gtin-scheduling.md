<!-- markdownlint-disable-file -->
# Task Research Notes: Minimal E2E Test Plan (Budget v2, Scheduling, GTIN)

## Research Executed

### File Analysis
- main/tests.py and test files
  - Existing DRF APITestCase usage; patterns for auth and CRUD tests.
- ./.copilot-tracking/research/*.schema.json
  - Contract expectations for Budget v2, WarehouseItem (gtin), and scheduling entities.

### Code Search Results
- APITestCase patterns; login/token helpers in tests.
- Serializer validations for similar numeric and FK fields.

### External Research
- #fetch:https://www.django-rest-framework.org/api-guide/testing/
  - key_information_gathered: APIClient usage, auth headers, response assertions.

### Project Conventions
- DRF APITestCase; role-based permissions; closed schemas with draft-07; server-enforced validations.

## Key Discoveries

### Project Structure
We can validate end-to-end via API for serializer behavior, and management commands for migrations.

### Implementation Patterns
- Use factory/seed data for users, ledger accounts, cost centers/projects.
- Use APIClient for CRUD; assert status codes and payload contract.

### Complete Examples
```python
from rest_framework.test import APITestCase

class BudgetV2ApiTests(APITestCase):
    def test_create_budget_v2_cost_center(self):
        # arrange: user, ledger accounts, cost center, monthly distribution
        # act: POST /api/budgets-v2/
        # assert: 201, created_by=current user, accounts persisted
        ...
```

### API and Schema Documentation
- Budget v2 and MonthlyDistribution schemas (draft-07);
- WarehouseItem schema with gtin;
- Scheduling schemas.

### Configuration Examples
```json
{ "budget_against": "Cost Center", "dimension_id": 10, "year": 2026, "accounts": [{"ledger_account_id": 5000, "budget_amount": 200000}] }
```

### Technical Requirements
- Validate success paths and 1-2 critical error modes per feature; assert invariants.

## Recommended Approach
Implement minimal but comprehensive tests: happy path + core validation errors + migration smoke test + helper endpoint behavior.

## Implementation Guidance
- Objectives: Verify core behaviors with minimal tests that catch regressions.
- Key Tasks:
  1) Budget v2 API
     - Happy path: POST create (Cost Center), verify created_by, accounts persisted, year in allowed range.
     - Error: missing accounts → 400; negative budget_amount → 400; invalid dimension → 400.
     - Optional: Project variant payload; monthly_distribution reference accepted.
  2) Budget v1→v2 Migration
     - Prepare mapping table entries and a sample v1 Budget with categories.
     - Run management command (or migration script) in test; assert v2 created with default Cost Center (General Operations), accounts mapped & summed, MonthlyDistribution auto-created (12x8.33%) when needed.
     - Assert backreference recorded (if implemented) or at least count increments by one.
  3) Scheduling Validations (server-side)
     - RRULE: invalid rule rejected with 400; valid rule accepted; ensure business constraints (e.g., start<end) enforced.
     - State machine: invalid transition (e.g., approved→pending) rejected; valid transition accepted and side effects mocked/logged.
  4) WarehouseItem GTIN
     - Happy path: POST with valid gtin (digits-only) → 201; stored normalized.
     - Error: POST with invalid length or bad check digit → 400.
     - Backward compat: POST without gtin still succeeds.
  5) GTIN Check-Digit Helper Endpoint
     - Happy path: POST base=13 digits → 200 with computed check_digit and full gtin.
     - Error: POST base invalid length → 400 with message.
- Dependencies: Seed data (users/groups, ledger accounts, cost center), helper methods for check digit, mapping table fixtures.
- Success Criteria: All tests pass; failures provide clear validation error messages; behaviors match research decisions.
