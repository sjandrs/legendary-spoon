<!-- markdownlint-disable-file -->
# Task Research Notes: Implementation Handoff — GTIN Utility and WarehouseItem.gtin (Budget v2 Schemas-Only Slice)

## Research Executed

### File Analysis
- main/models.py
  - `WarehouseItem` model exists; no `gtin` field yet.
- main/serializers.py
  - `WarehouseItemSerializer` present; no `gtin` normalization/validation logic.
- main/api_views.py
  - Many DRF ViewSets and helper views; no GTIN utility endpoint. `dev_validate_json` exists (Draft7).
- main/api_urls.py
  - Router with resource registrations; extra paths for reports, KB, auth, and dev validator; no `utils/gtin` route.
- docs/API.md, spec/spec-design-master.md, spec/COMPILED_SPEC.md
  - GTIN utility endpoint and optional `gtin` field are documented in spec. BudgetV2 and MonthlyDistribution included in JSON Schema Catalog. API.md updates will be needed during implementation.

### Code Search Results
- "gtin|GTIN"
  - actual_matches_found: Present in specs/docs only; runtime code lacks `gtin` usage.
- "utils/gtin|gtin/check-digit|check-digit"
  - files_discovered: No implementation in views/urls; documented in specs and research notes only.

### External Research
- #fetch:https://www.gs1.org/standards/id-keys/gtin
  - key_information_gathered: GTIN identifiers exist in lengths 8/12/13/14; GS1 provides official references and a check digit calculator.
- #fetch:https://www.gs1.org/services/how-calculate-check-digit-manually
  - key_information_gathered: GS1 modulo-10 algorithm; from rightmost base digit, apply weights 3,1,3,1,... sum; check digit = (10 - (sum % 10)) % 10.
- #fetch:https://json-schema.org/draft-07/json-schema-release-notes.html
  - key_information_gathered: Draft-07 stable; `$comment`, `if/then/else` available; suitable for authoritative validation baseline.

### Project Conventions
- Standards referenced: DRF ModelViewSet + function/APIView helpers; paths added in `main/api_urls.py` via `path()`; JSON Schema draft-07 baseline; token auth.
- Instructions followed: This is research-only; implementation to follow in code by devs. Selected options are reflected below.

## Key Discoveries
- Spec decisions confirmed by user:
  - Endpoint shape: Option A — `/api/utils/gtin/check-digit/` with both GET and POST.
  - WarehouseItem.gtin: Option A — accept 7–14 digits; enforce check digit only when length is 14; digits-only normalization.
  - Budget v2 scope for this slice: Option A — schemas + docs only (no backend models in this milestone).

### Complete Examples
```python
# GS1 check digit for base (no check digit)
def compute_gtin_check_digit(base: str) -> int:
    total = 0
    for i, ch in enumerate(reversed(base), start=1):
        d = ord(ch) - 48  # digits only assumed
        total += d * (3 if i % 2 == 1 else 1)
    mod = total % 10
    return 0 if mod == 0 else 10 - mod

# Serializer field validation pattern (outline)
def validate_gtin(value: str) -> str:
    if value in (None, ""):
        return value
    digits = "".join(ch for ch in value if ch.isdigit())
    if len(digits) < 7 or len(digits) > 14:
        raise serializers.ValidationError("GTIN must be 7–14 digits.")
    if len(digits) == 14:
        cd = compute_gtin_check_digit(digits[:-1])
        if cd != (ord(digits[-1]) - 48):
            raise serializers.ValidationError("Invalid GTIN check digit.")
    return digits
```

### API and Schema Documentation
Contract for `/api/utils/gtin/check-digit/` (both methods share behavior):
- Inputs
  - GET: `?gtin_base=<digits>` where length ∈ {7, 11, 12, 13, 14}
  - POST: JSON body with `{ "gtin" | "gtin_base": "<digits>" }`
- Behavior
  - If length ∈ {7, 11, 12, 13}: compute check digit; return normalized 14-digit value (zero-padded on left as needed).
  - If length == 14: validate check digit; include `is_valid` in response; return 400 if invalid.
- Response 200
  - `{ "normalized": "<14-digit>", "length": <int>, "check_digit": <int>, "is_valid": true, "message": "ok" }`
- Errors 400
  - Non-digits, unsupported lengths, or invalid 14-digit check digit.

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
- Normalize GTIN to digits-only for storage.
- Accept 7–14 digits; validate GS1 check digit only when 14 digits supplied.
- Endpoint permission: match default API auth (IsAuthenticated) unless utilities are intentionally public (confirm policy at review).
- Add nullable DB field (`null=True, blank=True`) to avoid downtime risk.
- Tests must cover positive and negative cases including boundary lengths.

## Recommended Approach
Implement the GTIN utility endpoint as a small APIView or function-based view with explicit GET/POST handling and strict input validation. Add an optional `gtin` field to `WarehouseItem` with serializer-level normalization and 14-digit check-digit enforcement. Limit Budget v2 to schema/catalog/doc updates in this slice.

## Implementation Guidance
- Objectives
  - Ship `/api/utils/gtin/check-digit/` (GET and POST) per contract above.
  - Extend WarehouseItem with optional `gtin` and enforce validation in API.
  - Update docs/API.md (GTIN utility, WarehouseItem.gtin rules) and ensure schemas (BudgetV2, MonthlyDistribution, updated WarehouseItem) are linked in the catalog.

- Key Tasks
  1) Backend: Utility Endpoint
     - Edit `main/api_views.py`:
       - Add `compute_gtin_check_digit(base: str) -> int` helper (module-level or inside view).
       - Create `GTINCheckDigitView(APIView)` or function view supporting GET and POST.
       - Parse input (`gtin` or `gtin_base`), enforce digits-only, and route behavior by length.
     - Edit `main/api_urls.py`:
       - Add `path("utils/gtin/check-digit/", GTINCheckDigitView.as_view(), name="gtin-check-digit")`.

  2) Backend: WarehouseItem.gtin
     - Edit `main/models.py`:
       - Add `gtin = models.CharField(max_length=14, null=True, blank=True, help_text="Digits-only GTIN (7–14; validate when 14)")` to `WarehouseItem`.
     - Create migration:
       - New auto migration adding nullable `gtin` field to `WarehouseItem`.
     - Edit `main/serializers.py`:
       - Add `gtin` to `WarehouseItemSerializer` fields.
       - Implement `validate_gtin` per rules (digits-only, 7–14, 14-digit check-digit enforcement).
     - Edit `main/admin.py` (optional quality of life):
       - Include `gtin` in `list_display`/`search_fields` if appropriate.

  3) Docs & Schemas
     - Edit `docs/API.md`:
       - Document `/api/utils/gtin/check-digit/` GET/POST with examples and error semantics.
       - Document `WarehouseItem.gtin` acceptance and server-side validation rules.
     - Ensure `spec/spec-design-master.md` JSON Schema Catalog:
       - Lists BudgetV2 and MonthlyDistribution (already present) and notes `WarehouseItem` optional `gtin` with pattern `^\d{7,14}$`.

  4) Tests (Backend)
     - New test module: `main/tests/test_gtin_utils.py` (or fold into an existing suite):
       - Happy paths: 7/11/12/13-digit bases compute correct check digits (include known GS1 sample).
       - 14-digit valid returns is_valid true; invalid returns 400.
       - Non-digit and unsupported length return 400.
       - Both GET and POST variants.
     - WarehouseItem serializer tests (e.g., `main/tests/test_warehouseitem_gtin.py`):
       - Create with 14-digit valid GTIN succeeds and stores digits-only.
       - Create with 14-digit invalid GTIN fails with field error.
       - Create with 7–13 digits allowed (stored digits-only) and returns as provided.

- Dependencies
  - DRF (APIView), Django migrations, existing WarehouseItem endpoints.
  - Authentication/permission baseline (likely IsAuthenticated) for endpoint.

- Success Criteria
  - Endpoint returns correct check digit and normalized 14-digit GTIN for bases; validates 14-digit inputs.
  - WarehouseItem CRUD enforces digits-only and 14-digit check-digit correctness; shorter values accepted.
  - All new tests pass (`Tasks: run-tests-backend`), and linters are clean.
  - Docs updated to match behavior.

## Edge Cases and Error Modes
- Empty or null `gtin` field: allowed, stored as null/blank.
- Non-digit characters in input: reject (400 for endpoint; serializer field error).
- Lengths < 7 or > 14: reject.
- 14 digits but bad check digit: endpoint 400; serializer field error with message.
- Very large numeric strings: bounded by 14; safe.

## Minimal Test Data
- Known GTIN-13 sample: base 629104150021 → check digit 3 (GS1 example).
- Include GTIN-8, -12, -14 constructions for base tests.

## Try It (after implementation)
- Backend tests
  - VS Code Task: run-tests-backend
  - Or full suite: run-tests-all
- Lint
  - VS Code Task: run-lint-backend

## Notes
- Budget v2 remains schema/catalog/doc-only this slice; defer models/endpoints/migrations to later work.
