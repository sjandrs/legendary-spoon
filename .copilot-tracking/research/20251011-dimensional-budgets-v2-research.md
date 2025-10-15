<!-- markdownlint-disable-file -->
# Task Research Notes: Dimensional Budgets v2 (ERPNext-style)

## Research Executed

### File Analysis
- ./.copilot-tracking/research/20251011-budget.schema.json
  - Draft-07 closed schema for Budget v1 (name, budget_type monthly/quarterly/annual, period fields, categories map). No dimensions or per-account rows.
- main/serializers.py (BudgetSerializer)
  - Budget matches v1 schema; no dimension support in serializer fields.

### Code Search Results
- class Budget
  - actual matches found in main/models.py, main/serializers.py, main/api_views.py
- BudgetValidation patterns
  - files discovered: ERPNext controllers and tests via #githubRepo search below

### External Research
- #githubRepo:"doctype budget test_budget get_accumulated_monthly_budget BudgetValidation" "frappe/erpnext"
  - actual_patterns_examples_found: Enforcement modes Stop/Warn/Ignore; accumulated monthly vs annual checks; applicability toggles (PO/MR/Actuals); cumulative over-limit handling; per-account rows; Monthly Distribution with 12 months totalling 100%; dimensions include Cost Center and Project by default with extensible Accounting Dimensions. Key files: erpnext/accounts/doctype/budget/test_budget.py, erpnext/controllers/budget_controller.py, erpnext/accounts/doctype/monthly_distribution/*.py
- #fetch:https://docs.erpnext.com/docs/user/manual/en/accounts/budget
  - key_information_gathered: Page not found (docs moved). Confirmed approach by referencing repository source and tests instead.
- #fetch:https://docs.erpnext.com/docs/user/manual/en/accounts/monthly-distribution
  - key_information_gathered: Page not found (docs moved). Verified Monthly Distribution semantics from source and tests.

### Project Conventions
- Standards referenced: JSON Schema draft-07 closed primary schemas; DRF alignment; readOnly/writeOnly; additionalProperties: false.
- Instructions followed: research-only edits; date-prefixed names; consolidation without duplication.

## Key Discoveries

### Project Structure
Budget v1 is category-based and periodized but not dimensional. ERPNext uses dimensional budgets keyed by (dimension_type, dimension, GL account) with Monthly Distribution computing accumulated thresholds.

### Implementation Patterns
- Enforcement modes: Stop, Warn, Ignore.
- Applicability flags: Material Request, Purchase Order, Actual Expenses, Cumulative Expense.
- Checks: Annual vs accumulated actuals; Accumulated Monthly via Monthly Distribution; Cumulative over-limit evaluation.
- Dimensions: Cost Center and Project base axes; extensible accounting dimensions supported.
- Monthly Distribution: 12 month table summing to 100%; even split default when unspecified.

### Complete Examples
```python
# Source: frappe/erpnext/accounts/doctype/budget/test_budget.py
accumulated_limit = get_accumulated_monthly_budget(
    budget.monthly_distribution, nowdate(), budget.fiscal_year, budget.accounts[0].budget_amount
)
self.assertRaises(BudgetError, po.submit)
```

### API and Schema Documentation
Dimensional Budget v2 schema should introduce:
- budget_against: "Cost Center" | "Project"
- dimension_id: integer (FK to chosen dimension)
- accounts: array of { ledger_account_id: int, budget_amount: number }
- monthly_distribution: id or inline percentages
- actions: { annual: Stop|Warn|Ignore, monthly: Stop|Warn|Ignore, applicable: { purchase_order, material_request, actual_expenses, cumulative_expense } }

### Configuration Examples
```json
{
  "name": "FY2026 Marketing Budget",
  "company": 1,
  "fiscal_year": "2026",
  "budget_against": "Cost Center",
  "dimension_id": 10,
  "monthly_distribution": 3,
  "actions": {
    "annual": "Stop",
    "monthly": "Warn",
    "applicable": {"purchase_order": true, "material_request": false, "actual_expenses": true, "cumulative_expense": true}
  },
  "accounts": [
    {"ledger_account_id": 5000, "budget_amount": 200000},
    {"ledger_account_id": 6100, "budget_amount": 120000}
  ]
}
```

### Technical Requirements
- Keep draft-07 as primary closed schema; add 2019-09 and 2020-12 informational variants.
- Define migration mapping from v1 categories to v2 accounts.
- Document enforcement semantics; server-side validation can follow in a later phase.

## Recommended Approach
Adopt ERPNext-style dimensional budgets as Budget v2 with per-account rows keyed to a selected dimension and governed by Monthly Distribution. Provide draft-07 closed schema and informational variants, grounded in serializer alignment and external evidence.

## Implementation Guidance
- Objectives: Publish Budget v2 schema and variants with examples and migration notes.
- Key Tasks: Author 20251011-budget-v2.schema.json (draft-07, closed) + variants; write migration guidance; include tested examples; plan serializer changes (separate implementation task).
- Dependencies: LedgerAccount model; potential MonthlyDistribution entity; DRF serializers.
- Success Criteria: Valid draft-07 schema; clear dimension and accounts structure; example payloads; evidence-backed documentation.
