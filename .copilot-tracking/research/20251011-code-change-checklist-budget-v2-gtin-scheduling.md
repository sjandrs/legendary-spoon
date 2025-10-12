<!-- markdownlint-disable-file -->
# Task Research Notes: Code-Change Checklist (Budget v2, Scheduling, GTIN)

## Research Executed

### File Analysis
- main/models.py
  - Ground-truth for Budget (v1), WarehouseItem, ScheduledEvent, NotificationLog, AppointmentRequest, DigitalSignature.
- main/serializers.py
  - Existing serializers; add BudgetV2Serializer and gtin normalization.
- main/api_views.py, main/api_urls.py
  - Patterns for registering DRF routes; add GTIN helper endpoint.
- ./.copilot-tracking/research/*
  - Draft-07 schemas (Budget v2, MonthlyDistribution, WarehouseItem with gtin, Scheduling entities) and decisions.

### Code Search Results
- "BudgetSerializer|BudgetV2Serializer"
  - actual_matches_found: Budget v1 serializer present; v2 to be added alongside.
- "WarehouseItemSerializer" and "gtin"
  - files_discovered: WarehouseItemSerializer exists; no gtin handling yet.

### External Research
- #fetch:https://www.django-rest-framework.org/api-guide/serializers/
  - key_information_gathered: Nested serializers, validation patterns, context usage for request.user.
- #fetch:https://www.gs1.org/standards/id-keys/gtin
  - key_information_gathered: GTIN lengths 8/12/13/14 and modulo-10 check digit.

### Project Conventions
- Standards referenced: Draft-07 closed schemas as enforcement baseline; DRF ViewSet patterns; role-based permissions.
- Instructions followed: research-only; template-compliant; decisions documented.

## Key Discoveries

### Project Structure
- Budget v2 introduces a new serializer and a mapping table; migration needs a service/command.
- Scheduling schemas stay permissive; validations live in services/serializers.
- GTIN is an additive field with normalization and a utility endpoint.

### Implementation Patterns
- Model changes via migrations; admin with search, list, filters; serializers validate and normalize; small utility endpoints added in api_views and routed in api_urls.

### Complete Examples
```python
# Example shapes (for reference)
class BudgetCategoryAccountMap(models.Model):
    category_name = models.CharField(max_length=128)
    ledger_account = models.ForeignKey('LedgerAccount', on_delete=models.PROTECT)
    active = models.BooleanField(default=True)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

class BudgetV2AccountSerializer(serializers.Serializer):
    ledger_account_id = serializers.IntegerField(min_value=1)
    budget_amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)

class BudgetV2Serializer(serializers.Serializer):
    # see detailed spec in budget-v2 research note
    ...

class WarehouseItemSerializer(serializers.ModelSerializer):
    gtin = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    def validate_gtin(self, value):
        # strip non-digits and validate length/check digit
        ...
```

### API and Schema Documentation
- Budget v2 schema + MonthlyDistribution; WarehouseItem schema (gtin); scheduling schemas.

### Configuration Examples
```json
{ "gtin": "00012345600012" }
```

### Technical Requirements
- Auditable mapping table; created_by handling in serializer; safe migrations; schema alignment.

## Recommended Approach
Implement changes in small, auditable increments aligned to selected options: models + admin, serializers + views, migrations, then tests.

## Implementation Guidance
- Objectives: Introduce Budget v2 (schemas + docs only in this slice), keep scheduling flexible with server validation, add GTIN with helper endpoint.
- Key Tasks:
  - Models
    - Add BudgetCategoryAccountMap model (category_name, ledger_account FK, active, effective_from/to, notes; audit fields if available).
    - Add optional gtin CharField(max_length=14, blank=True) to WarehouseItem.
    - Ensure MonthlyDistribution model/constraints exist (sum to 100%).
  - Admin
    - Register BudgetCategoryAccountMap with list, search (category_name), filters (active), and effective date range display; add validation for overlapping ranges.
  - Serializers
    - Defer BudgetV2 backend serializer implementation; focus on schema alignment and docs.
    - Update WarehouseItemSerializer: normalize gtin to digits-only; accept 7–14 digits; validate GS1 modulo-10 only when length is 14; allow null/blank.
  - Views/API
    - Add GTIN check-digit helper endpoint (GET and POST) at /api/utils/gtin/check-digit/.
      - Accept 7/11/12/13-digit base (digits-only) and compute normalized 14-digit with check_digit.
      - If 14 digits provided, validate check digit and return is_valid.
      - Response: { normalized, length, check_digit, is_valid, message }.
  - URLs
    - Wire helper endpoint in api_urls.py.
  - Migrations
    - Add field migration for WarehouseItem.gtin (nullable). Defer Budget v2 model and data migrations to a later slice.
  - Permissions
    - Restrict mapping admin and migration command to staff; restrict helper endpoint as needed.
  - Docs/Schema
    - Ensure API docs reference the new endpoint; update WarehouseItem schema with optional gtin (pattern ^\d{7,14}$); ensure BudgetV2 + MonthlyDistribution schemas are linked in the catalog.
- Dependencies: LedgerAccount, Cost Center/Project, MonthlyDistribution.
- Success Criteria: All migrations apply; endpoints operational; serializer and model validations work; tests green.
