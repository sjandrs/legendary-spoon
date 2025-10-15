<!-- markdownlint-disable-file -->
# Task Research Notes: Parts GTIN Integration (WarehouseItem)

## Research Executed

### File Analysis
- ./.copilot-tracking/research/20251011-warehouseitem.schema.json
  - Draft-07 closed schema aligns to model; lacks `gtin`.
- main/models.py → WarehouseItem
  - Fields: warehouse, name, description, item_type, sku, quantity, unit_cost, minimum_stock, serial_number, location_in_warehouse, created/updated.

### Code Search Results
- WarehouseItemSerializer
  - actual_matches_found: present in main/serializers.py; no GTIN logic.

### External Research
- #fetch:https://www.gs1.org/standards/id-keys/gtin
  - key_information_gathered: GTIN is a GS1 identifier; valid lengths 8/12/13/14; modulo-10 check digit; GTIN Management Standard and check digit calculator available.
- #fetch:https://en.wikipedia.org/wiki/Global_Trade_Item_Number
  - key_information_gathered: Structure components (company prefix, item reference, check digit); encoding formats; confirmation of valid lengths and modulo-10 check digit.

### Project Conventions
- Standards referenced: Draft-07 primary schemas; serializers aligned to API I/O; closed schemas; readOnly/writeOnly annotations.
- Instructions followed: research-only changes with date-prefixed filename and #fetch callouts.

## Key Discoveries

### Project Structure
Adding `gtin` is a non-breaking additive change to WarehouseItem. Validation should be centralized in the serializer with a simple utility for check digit.

### Implementation Patterns
- Normalize input by stripping non-digits; store digits-only.
- Validate length ∈ {8,12,13,14} and modulo-10 check digit.
- Schema uses a pattern to constrain length; server validates check digit.

### Complete Examples
```json
{
  "name": "1/2" PVC Elbow",
  "sku": "PVC-ELB-050",
  "gtin": "00012345600012",
  "warehouse": 1,
  "quantity": 250,
  "unit_cost": "0.45"
}
```

### API and Schema Documentation
- Primary schema to update: 20251011-warehouseitem.schema.json
- Proposed pattern: "^(?:\\d{8}|\\d{12}|\\d{13}|\\d{14})$"

### Configuration Examples
```json
{
  "gtin": "9501101530003"
}
```

### Technical Requirements
- Length and check digit validation per GS1 modulo-10.
- Backward compatibility: field optional, nullable/blank allowed.
 - Digits-only normalization and storage (no preservation of human-formatted inputs).

## Recommended Approach
Add optional digits-only `gtin` to WarehouseItem; validate length and check digit in serializer; update JSON Schema with pattern; provide a simple check-digit helper endpoint and client utility.

## Implementation Guidance
- Objectives: Introduce GTIN safely; ensure correctness via check digit; keep API backward-compatible.
- Key Tasks: Model field (optional); serializer normalization + validation; schema pattern; migration with null defaults; docs/examples; add a lightweight check-digit helper endpoint (input: digits-only base without check digit; output: computed check digit and full GTIN).
- Dependencies: None beyond GS1 rules; optional helper function for modulo-10.
- Success Criteria: Accepts valid GTIN-8/12/13/14; rejects invalid; no regressions in existing workflows.

### Minimal API Spec: GTIN Check-Digit Helper
- Method/URL: POST /api/utils/gtin/check-digit/
- Request (JSON): { "base": "string" }  // digits-only without check digit
- Responses:
  - 200 OK: { "base": "string", "check_digit": "string", "gtin": "string" }
  - 400 Bad Request: { "error": "Invalid length (must be 7,11,12,13)", "detail": { ... } }
- Rules:
  - Accept bases of length 7, 11, 12, or 13 (for GTIN-8/12/13/14 respectively)
  - Validate digits-only; compute modulo‑10 check digit; return full GTIN
