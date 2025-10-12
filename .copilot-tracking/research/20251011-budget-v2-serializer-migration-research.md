<!-- markdownlint-disable-file -->
# Task Research Notes: Budget v2 Serializer & Migration Guidance

## Research Executed

### File Analysis
- ./.copilot-tracking/research/20251011-budget-v2.schema.json
  - Draft-07 closed schema for dimensional budgets: budget_against (Cost Center/Project), dimension_id, year, monthly_distribution (ID ref), accounts[{ledger_account_id, budget_amount}].
- main/serializers.py (BudgetSerializer)
  - v1 serializer present with categories map; no v2 serializer yet.

### Code Search Results
- BudgetSerializer
  - actual_matches_found: main/serializers.py (v1 only)
- Budget (model)
  - files_discovered: main/models.py (v1 shape); v2 will need model changes; this note focuses on serializer contract and migration plan.

### External Research
- #githubRepo:"frappe/erpnext budget Monthly Distribution accumulated stop warn ignore"
  - actual_patterns_examples_found: Budget validation modes (Stop/Warn/Ignore), accumulated monthly vs annual checks, Monthly Distribution 12-month allocation totaling 100%, dimensions by Cost Center/Project, per-account rows.
- #fetch:https://json-schema.org/draft-07/json-schema-release-notes.html
  - key_information_gathered: Draft-07 meta-schema stability and broad validator support; aligns with our enforcement baseline.

### Project Conventions
- Standards referenced: Draft-07 closed schemas; DRF serializers aligned to API I/O; additionalProperties: false; readOnly/writeOnly annotations.
- Instructions followed: research-only edits; date-prefixed filename; authoritative source callouts with #githubRepo/#fetch.

## Key Discoveries

### Project Structure
Dimensional budgeting introduces dependencies on LedgerAccount, Cost Center/Project entities, and MonthlyDistribution. Serializer will sit in `main/serializers.py` alongside v1 for a transition period.

### Implementation Patterns
- DRF ModelSerializer or Serializer with nested ListField for accounts.
- Set created_by from request.user in perform_create/serializer.create.
- Validate relational IDs and amounts in serializer; enforce budget rules server-side.

### Complete Examples
```python
# Source: Proposed DRF serializer shape (research example)
class BudgetV2AccountSerializer(serializers.Serializer):
    ledger_account_id = serializers.IntegerField(min_value=1)
    budget_amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)

class BudgetV2Serializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(max_length=255)
    budget_against = serializers.ChoiceField(choices=["Cost Center", "Project"])
    dimension_id = serializers.IntegerField(min_value=1)
    year = serializers.IntegerField(min_value=1900, max_value=2100)
    monthly_distribution = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    accounts = BudgetV2AccountSerializer(many=True)
    created_by = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    def validate(self, attrs):
        if not attrs.get("accounts"):
            raise serializers.ValidationError({"accounts": "At least one account is required."})
        return attrs

    def create(self, validated_data):
        # Delegated to service/model layer; set created_by from context.user
        ...
```

### API and Schema Documentation
- Primary schema: 20251011-budget-v2.schema.json (draft-07, closed).
- Related: 20251011-monthlydistribution.schema.json.

### Configuration Examples
```json
{
  "budget_against": "Cost Center",
  "dimension_id": 10,
  "year": 2026,
  "monthly_distribution": 3,
  "accounts": [
    {"ledger_account_id": 5000, "budget_amount": 200000},
    {"ledger_account_id": 6100, "budget_amount": 120000}
  ]
}
```

### Technical Requirements
- Validate existence of dimension_id against selected budget_against model.
- Non-empty accounts; non-negative amounts; valid ledger accounts.
- Optional monthly_distribution entity (12-month, totals 100%) validated elsewhere.
- Mapping source: Use a DB table with admin UI (BudgetCategoryAccountMap) to translate v1 categories → LedgerAccount IDs; changes are auditable and versioned.
- Default dimension for ambiguous v1 budgets: Cost Center named "General Operations" (configurable ID), unless an explicit Project is clearly derivable.
- MonthlyDistribution default for v1 imports: create a standard 12-month distribution at 8.33% each (resolve rounding to ensure total = 100.00%).

## Recommended Approach
Introduce a new BudgetV2Serializer aligned to the draft-07 schema, with strict input validation and delegation of enforcement (Stop/Warn/Ignore) to the domain layer. Plan a structured v1→v2 migration using a category→ledger_account mapping table.

## Implementation Guidance
- Objectives: Define serializer I/O; ensure schema alignment; provide migration steps and example payloads.
- Key Tasks: Build serializer + nested accounts; context-aware created_by; validations; document errors.
- Dependencies: LedgerAccount; Cost Center/Project; MonthlyDistribution; mapping table for v1 categories.
- Success Criteria: Example payloads validate; migration can transform v1 records end-to-end; API docs updated.

### Migration Guidance (v1 → v2)
- Inventory v1 budgets and extract categories map per record.
- Establish category→ledger_account mapping table per COA and get business approval.
- For each v1 record, select budget_against and dimension_id (default to a configured Cost Center if ambiguous); translate categories→accounts[] and collapse duplicates; choose monthly_distribution (null for even split or create distribution if seasonality known).
- Create v2 records via API/service to ensure created_by and hooks; keep a dual-run window with v1 read-only and mark v2 successors; plan archival.

### Admin UI Checklist (Category → Ledger Account Mapping)
- Model: BudgetCategoryAccountMap with fields (category_name, ledger_account [FK], active, effective_from, effective_to, notes).
- Admin: list display (category_name, ledger_account, active, effective_from/to); search by category_name; filter by active.
- Constraints: unique (category_name, effective_from); validation ensuring no overlapping effective ranges.
- Audit: who/when changed (created_by/at, updated_by/at); history tracking if available.

### Migration Pseudo-steps
1) Export v1 categories and proposed mappings; get Accounting approval.
2) Populate BudgetCategoryAccountMap via admin/import.
3) Script:
  - For each v1 Budget: determine dimension (default General Operations), resolve accounts via mapping, collapse amounts, attach MonthlyDistribution (12x8.33%) if required, create v2 via API.
  - Record backreferences (v1_id → v2_id) for audit.
