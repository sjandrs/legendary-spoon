<!-- markdownlint-disable-file -->
# Task Research Notes: GTIN Utility and Budget v2 Integration

## Research Executed

### File Analysis
- main/api_views.py
  - WarehouseItemViewSet exists. No GTIN utility endpoint implemented. Dev-only JSON Schema validator `dev_validate_json` present with Draft7Validator.
- main/api_urls.py
  - Router-registers many resources; includes `dev/validate-json/`. No `utils/gtin/check-digit/` route yet.
- main/models.py
  - `WarehouseItem` model present without `gtin` field.
- main/serializers.py
  - `WarehouseItemSerializer` defined without `gtin` handling.
- docs/API.md
  - Updated to include Utilities — GTIN Check Digit and WarehouseItem.gtin rules; stubs for Budget v2 endpoints.
- spec/spec-design-master.md and spec/COMPILED_SPEC.md
  - Document `/api/utils/gtin/check-digit/` behavior and WarehouseItem with optional `gtin?`; JSON Schema Catalog mentions BudgetV2 and MonthlyDistribution.

### Code Search Results
- gtin|GTIN
  - actual_matches_found: Present in specs/docs; absent in runtime code (models/serializers/views/urls).
- utils/gtin|gtin/check-digit|check-digit
  - files_discovered: Only in specs and research notes; no API implementation presently.

### External Research
- #githubRepo:"json-schema-org/website draft-07 release notes"
  - actual_patterns_examples_found: Draft-07 notes confirm `$comment`, `if/then/else`, `readOnly/writeOnly`, and stability for validation keywords.
- #fetch:https://www.gs1.org/standards/id-keys/gtin
  - key_information_gathered: GTIN exists in 8/12/13/14-digit formats; GS1 provides general specs and a check digit calculator.
- #fetch:https://www.gs1.org/services/how-calculate-check-digit-manually
  - key_information_gathered: GS1 modulo-10 algorithm with alternating weights 3 and 1 (from right), subtract from next highest multiple of 10 to get check digit; example for GTIN-13.
- #fetch:https://json-schema.org/draft-07/json-schema-release-notes.html
  - key_information_gathered: Draft-07 validation stable; `$comment` available; formats include date/time; guidance for linking instances and schemas.

### Project Conventions
- Standards referenced: DRF ViewSets and function views in `main/api_views.py`, routes in `main/api_urls.py`, JSON Schema draft-07 baseline per spec, docs updates in `docs/API.md`.
- Instructions followed: Canonical spec alignment, dev-only JSON Schema validator usage, additive model changes with migrations.

## Key Discoveries

### Project Structure
Backend provides DRF ViewSets and function-based helpers; specs and docs already define the GTIN utility endpoint and WarehouseItem.gtin rules, but runtime code lacks `gtin` field and the utility endpoint.

### Implementation Patterns
- Utility endpoints are exposed as simple function views or APIViews and wired in `main/api_urls.py` (e.g., `dev_validate_json`).
- Model fields added with nullable defaults to ensure safe migrations; serializers perform validation and normalization.

### Complete Examples
```python
# GTIN check digit per GS1 (weights 3/1 from right); compute for base without check digit
def compute_gtin_check_digit(base: str) -> int:
    total = 0
    # weight 3 on even positions from right (excluding check digit), 1 on odd
    # Iterate from rightmost digit of base (position 1)
    for i, ch in enumerate(reversed(base), start=1):
        d = ord(ch) - 48  # faster int(ch)
        weight = 3 if (i % 2 == 1) else 1
        total += d * weight
    mod = total % 10
    return 0 if mod == 0 else 10 - mod
```

### API and Schema Documentation
GTIN Utility endpoint documented in `docs/API.md` and `spec/spec-design-master.md`. JSON Schema Catalog lists BudgetV2 and MonthlyDistribution; WarehouseItem schema notes optional `gtin` with digits-only validation.

### Configuration Examples
```json
{
  "type": "object",
  "properties": {
    "gtin": { "type": "string", "pattern": "^\\d{7,14}$" }
  }
}
```

### Technical Requirements
- GTIN normalization policy: digits-only input and storage; lengths allowed 7–14 with validation semantics: if 14 digits provided, check digit must be valid; otherwise accept base and offer computed normalized 14-digit in utility response.
- Budget v2: MonthlyDistribution of 12 entries summing to 100%; draft-07 authoritative schemas; Cost Center required; default seeding for "General Operations" and 12×8.33% distribution.

## Recommended Approach
Implement a lightweight utility endpoint `/api/utils/gtin/check-digit/` supporting GET (gtin_base query) and POST (gtin or gtin_base) that computes a GS1 check digit for base lengths 7/11/12/13 and validates 14-digit inputs. Add optional `gtin` CharField(max_length=14, null=True, blank=True) to `WarehouseItem` with serializer-level digits-only normalization and check-digit validation when length is 14. Keep Budget v2 work tracked via schemas and doc updates in this milestone; defer model implementation to a subsequent slice while ensuring schemas are linked in the catalog.

## Implementation Guidance
- Objectives: Deliver GTIN utility endpoint; add `WarehouseItem.gtin` with validation; update docs; ensure schemas are referenced in catalog and dev validator.
- Key Tasks: Add API view and URL; write serializer `validate_gtin`; create migration; update admin/list serializers to include `gtin`; backend tests for valid/invalid paths; docs already updated; link schemas in catalog.
- Dependencies: DRF, existing WarehouseItem model, spec and docs alignment; deploy-safe migrations.
- Success Criteria: Endpoint returns correct check digits per GS1 references; WarehouseItem CRUD enforces digits-only and check-digit validity for 14-digit inputs; tests pass; docs reflect behavior.
