<!-- markdownlint-disable-file -->
# Task Research Notes: Convert Accounting Expansion Spec to CSV and JSON Schema

## Research Executed

### File Analysis
- spec/spec-design-accounting-expansion.md
  - Parsed sections: Requirements (Phase 1/2), Interfaces & Data Contracts (API table + Expense example), Acceptance Criteria, Dependencies. Extracted tabular items for CSV and generated a JSON Schema for the Expense data contract (only concrete payload example present).

### Code Search Results
- spec-design-accounting-expansion.md
  - Found sections with anchors for Requirements, Interfaces, Acceptance Criteria, Dependencies
- `Expense` JSON example
  - Located under "Data Contract Example: Expense"; used to derive JSON Schema

### External Research
- #fetch:https://www.rfc-editor.org/rfc/rfc4180
  - CSV best practices and quoting (RFC 4180): use double quotes to enclose fields containing commas; header row optional; CRLF line endings (tolerant tooling OK).
- #fetch:https://json-schema.org/draft-07/json-schema-release-notes.html
  - Draft-07 guidance: `$comment`, `examples`, `readOnly`/`writeOnly` available; formats include `date`; annotations are non-assertive.
- #fetch:https://json-schema.org/understanding-json-schema/reference/object.html
  - Object schema best practices: properties, required, additionalProperties, examples of non-boolean additionalProperties and unevaluatedProperties (newer drafts).
- #fetch:https://datatracker.ietf.org/doc/html/rfc3986
  - RFC 3986 URI syntax: use `format: uri` (absolute) or `uri-reference` (relative allowed) for URL-like strings.

### Project Conventions
- Standards referenced: Repository documentation structure under `spec/` and docs pattern in attachments
- Instructions followed: Research-only changes confined to `./.copilot-tracking/research/`; no source code/config edits

## Key Discoveries

### Project Structure
Spec organizes accounting expansion into: Requirements (Phase 1/2 with IDs), API endpoints table, one concrete Data Contract example (Expense), Acceptance Criteria with IDs, and Dependencies categorized (External Systems, Third-Party, Infrastructure, Data, Platform, Compliance).

### Implementation Patterns
- Requirements and acceptance criteria follow ID: description format (e.g., REQ-101, AC-101)
- API table has path, method, description columns
- Only one explicit JSON example suitable for schema derivation: Expense

### Complete Examples
```json
{
  "id": 123,
  "date": "2025-09-29",
  "amount": 250.00,
  "category": "Travel",
  "description": "Flight to client site",
  "receipt_url": "/media/receipts/123.pdf"
}
```

Source: spec/spec-design-accounting-expansion.md

### API and Schema Documentation
Items extracted to CSV:
- Requirements (Phase 1 & Phase 2, plus security/guideline/pattern items)
- Interfaces & Data Contracts → API Endpoints table
- Acceptance Criteria list
- Dependencies lists with their categories

Derived JSON Schema:
- Expense data contract (only example provided in spec)

### Configuration Examples
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://converge.local/schemas/expense.schema.json",
  "title": "Expense",
  "$comment": "Derived from spec Expense example; annotations only.",
  "description": "Expense record as used in Converge Accounting expansion spec.",
  "type": "object",
  "properties": {
    "id": { "type": "integer" },
    "date": { "type": "string", "format": "date" },
    "amount": { "type": "number" },
    "category": { "type": "string" },
    "description": { "type": "string" },
    "receipt_url": { "type": "string", "format": "uri-reference" }
  },
  "examples": [
    {
      "id": 123,
      "date": "2025-09-29",
      "amount": 250.0,
      "category": "Travel",
      "description": "Flight to client site",
      "receipt_url": "/media/receipts/123.pdf"
    }
  ]
}
```

### Technical Requirements
- CSVs should reflect the exact content from the spec without adding assumptions
- JSON Schema confined to the provided Expense example (no inferred required fields). Using draft-07 for broader validator compatibility in this workspace. Adopted non-breaking annotations (`$comment`, `description`, `examples`) and `format: uri-reference` for receipt_url per RFC 3986 since example uses a relative path.

## Recommended Approach
Produce four CSV extracts (requirements, API endpoints, acceptance criteria, dependencies) and one JSON Schema for the Expense data contract. Place all artifacts under `./.copilot-tracking/research/` with date-prefixed filenames. Avoid introducing constraints not present in the spec. Provide schema variants for draft-07 (preferred locally), 2019‑09, and 2020‑12 — noting local validator limitations with 2019‑09 `$recursiveRef` and 2020‑12 `$dynamicRef`.

## Implementation Guidance
- Objectives: Provide machine-usable CSV representations and a valid JSON Schema for downstream tooling and validation
- Key Tasks: Parse spec content; transcribe to CSV; convert Expense example to JSON Schema (draft‑07 primary); also add 2019‑09 and 2020‑12 variants for portability; save artifacts; keep research note with sources
- Dependencies: spec/spec-design-accounting-expansion.md; JSON Schema spec for reference
- Success Criteria: CSVs accurately mirror spec content; JSON Schema validates example; no changes outside research folder

### Draft selection and validator considerations
- Local validator supports draft‑07 reliably. Draft 2019‑09 and 2020‑12 may report unsupported features (`$recursiveRef`, `$dynamicRef`). For local pipelines, prefer draft‑07; for OpenAPI 3.1+/modern tooling, 2020‑12 is recommended.

### Future data contracts inventory (from spec)
- Expense (provided, implemented)
- Budget (spec mentions budgeting; example not provided) → placeholder: 20251011-budget.schema.json
- WorkOrder (workflow/inventory integration; example not provided) → placeholder: 20251011-workorder.schema.json
- JournalEntry (ledger; example not provided) → placeholder: 20251011-journalentry.schema.json

When examples/specs are available, follow the same approach: start permissive (no inferred required), add formats (date, uri/uri-reference), and use annotations (`description`, `$comment`, `examples`). If you need closed schemas, use `additionalProperties: false` (draft‑07) or `unevaluatedProperties: false` (2019‑09+/2020‑12) with care.

---

<!-- markdownlint-disable-file -->
# Task Research Notes: Budget JSON Schema and Data Contract

## Research Executed

### File Analysis
- main/models.py
  - Budget model fields confirmed: name (string), budget_type (enum monthly|quarterly|annual), year (int), month (int, optional), quarter (int, optional), categories (JSON mapping: category -> amount), created_by (FK), created_at (auto).
- main/serializers.py
  - BudgetSerializer exposes id, name, budget_type, year, month, quarter, categories, created_by, created_by_name, created_at; created_by is set from request user.
- .copilot-tracking/research/20251011-budget.schema.json
  - Updated from placeholder to concrete draft-07 schema with conditional requirements and examples.
- spec/spec-design-master.md
  - References CRUD /api/budgets/; overview line mentions Budget with category/period but actual model uses year + optional month/quarter.

### Code Search Results
- Budget|budget_against|monthly_distribution|action_if_annual_budget_exceeded
  - Local code implements simplified Budget; no ERP-style dimensions.
- class Budget|Budget\(|/api/budgets/
  - Definitions in main/models.py, main/serializers.py; endpoints live via DRF ViewSet.

### External Research
- #githubRepo:"frappe/erpnext doctype budget"
  - ERPNext Budget DocType uses budget_against (Cost Center/Project), fiscal_year, company, monthly_distribution, and child Budget Account rows. Stricter policy actions exist; this differs from Converge v1 approach.
- #githubRepo:"frappe/erpnext accounts/doctype/budget_account/budget_account.py"
  - Confirms per-account budget line pattern in ERPNext.

### Project Conventions
- Standards referenced: JSON Schema draft-07 (primary); RESTful endpoints; conservative schema with examples; defer strict property closures.
- Instructions followed: Research-only updates confined to ./.copilot-tracking/research/.

## Key Discoveries

### Project Structure
Converge’s Budget is category-based with period defined by year and budget_type; optional month/quarter based on type. CRUD endpoint /api/budgets/ aligns with serializer shapes.

### Implementation Patterns
- categories object maps string keys to non-negative numbers.
- created_by and created_at are read-only server fields.
- Conditional requirements: month when budget_type=monthly; quarter when budget_type=quarterly.

### Complete Examples
```json
{
  "name": "Operating Budget",
  "budget_type": "monthly",
  "year": 2025,
  "month": 10,
  "categories": {
    "marketing": 5000,
    "software": 1200,
    "rent": 3000
  }
}
```

### API and Schema Documentation
- Endpoint: /api/budgets/ (list/create), /api/budgets/{id}/ (retrieve/update/delete)
- Fields: id, name, budget_type, year, month, quarter, categories, created_by, created_by_name, created_at

### Configuration Examples
```yaml
allOf:
  - if:
      properties:
        budget_type: { const: monthly }
    then:
      required: [month]
  - if:
      properties:
        budget_type: { const: quarterly }
    then:
      required: [quarter]
```

### Technical Requirements
- Use draft-07; require name, budget_type, year, categories; values >= 0; include examples; keep additionalProperties true pending contract hardening.

## Recommended Approach
Publish the Budget schema matching Converge’s current model (category-based) as v1, with draft-07 and examples. Consider ERPNext-like dimensional budgets for a future v2 after domain alignment.

## Implementation Guidance
- Objectives: Replace placeholder schema; ensure validator compatibility; document examples.
- Key Tasks: Define properties/required; add conditionals; add examples; annotate read-only fields with $comment/readOnly.
- Dependencies: BudgetSerializer; DRF routes; CI validator behavior (draft-07).
- Success Criteria: Real payloads validate; examples for monthly/quarterly/annual; CI PASS.

### WorkOrderInvoice JSON Schema (reference)
See: `./.copilot-tracking/research/20251011-workorderinvoice-payment-schemas-research.md` for the authoritative draft-07, closed schema aligned to our serializer.
