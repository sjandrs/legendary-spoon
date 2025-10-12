
# API Endpoints Summary (Delta Update)

This document captures recent additions and behavioral changes relevant to accounting and field service APIs.
## Schema usage (JSON Schema)

Authoritative data contracts are specified as JSON Schema draft-07. See the JSON Schema Catalog in `spec/spec-design-master.md` for the complete list of schemas and their locations.

- Baseline: Validate request payloads against draft-07 schemas. Server behavior is aligned with these contracts.
- Variants: 2019-09 and 2020-12 schema files are informational only and may contain annotations; do not enforce them client-side.
- Flexible fields: Some domains (e.g., scheduling RRULEs) intentionally avoid over-constraining enums in the schema; the server performs additional validation on transitions and RRULEs.
- Recommended validators: Ajv (JavaScript) or `jsonschema` (Python). For other platforms, use a standards-compliant draft-07 validator.

Example (Python):
```python
from jsonschema import validate
import json

schema = json.load(open('spec/schemas/journalentry.schema.json', 'r'))
payload = {"date":"2025-10-11","description":"Post invoice 1001","debit_account_id":2,"credit_account_id":5,"amount":1200.0}
validate(instance=payload, schema=schema)
```

Tip: For quick, non-production checks in development, you can POST to `/api/dev/validate-json/` with `{ "schema": "journalentry", "payload": { ... } }` to receive structured validation results.

Dev-only validator endpoint
- URL: `POST /api/dev/validate-json/` (available only when `DEBUG=True`; returns 404 otherwise)
- Auth: Requires a valid token (same as other APIs)
- Request body:
  - `schema`: one of `journalentry`, `payment`, `expense`, `monthlydistribution`, `scheduled-event`, `notificationlog`, `technician`, `warehouseitem`, `workorder`, `workorderinvoice` (aliases like `scheduled_event`, `work_order`, etc. are accepted)
  - `payload`: the JSON object to validate
- Success response (200):
  - `{ "schema": "journalentry", "schema_path": ".copilot-tracking/research/20251011-journalentry.schema.json", "valid": true|false, "errors": [{"path": "line_items[0].quantity", "message": "..."}] }`
- Error responses:
  - 400: missing `schema` or `payload`
  - 404: schema not found or endpoint disabled when not in DEBUG
  - 501: `jsonschema` library not installed (message includes `pip install jsonschema`)
  - 500: schema file read errors

Example (curl)
```bash
curl -s -X POST \
  -H "Authorization: Token <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
        "schema": "journalentry",
        "payload": {
          "date": "2025-10-11",
          "description": "Post invoice 1001",
          "debit_account_id": 1100,
          "credit_account_id": 4000,
          "amount": 1200.00
        }
      }' \
  http://localhost:8000/api/dev/validate-json/
```

Example (JavaScript with Ajv)
```js
import Ajv from 'ajv';
import schema from './schemas/journalentry.schema.json';

const ajv = new Ajv({ strict: false }); // draft-07 compatible
const validate = ajv.compile(schema);
const data = {
  date: '2025-10-11',
  description: 'Post invoice 1001',
  debit_account_id: 1100,
  credit_account_id: 4000,
  amount: 1200.0,
};
const valid = validate(data);
if (!valid) console.log(validate.errors);
```

## Accounting Posting Endpoints

- POST /api/invoices/{id}/post/
  - Creates a JournalEntry with description "Invoice {id} posting" (DR 1100 AR, CR 4000 Revenue) for invoice total.
  - Idempotent. Behavior:
    - 201 on first successful post. Response: { journal_entry_id, amount }
    - 409 if invoice already posted (durable via Invoice.posted_journal or legacy description match).
  - Persistence: Invoice.posted_journal (FK) and posted_at are set on success.

- POST /api/payments/{id}/allocate/
  - Creates a JournalEntry with description "Payment {id} posting" (DR 1000 Cash, CR 1100 AR).
  - Applies amount to Invoice or WorkOrderInvoice via generic relation; rejects overpay (400).
  - Response includes open_balance and status: partial|paid. Idempotent by description.

- POST /api/work-orders/{id}/complete/
  - Adjusts inventory and creates JournalEntry "WorkOrder {id} consumption posting" (DR 5000 COGS, CR 1200 Inventory) for consumed cost.
  - 201 on first post; 409 on re-post; 409 on insufficient stock. No GL entry if total_cost is 0.

## Field Service Availability

- GET or POST /api/scheduling/availability-check/
  - Params: technician_id, start_time (ISO), end_time (ISO)
  - Returns is_available factoring scheduled event conflicts and weekly availability (weekday + time window).
  - GET support added; previous POST-only behavior maintained.

## Contacts RBAC

- /api/contacts/ respects role-based access:
  - Sales Manager: full access to all contacts.
  - Other users: only contacts where owner == current user.

Notes:
- Default accounts used when missing: AR 1100, Revenue 4000, Cash 1000, Inventory 1200, COGS 5000.
- Idempotency keys: durable FK markers (Invoice.posted_journal) and canonical descriptions for legacy safety.

## Utilities

- GET/POST /api/utils/gtin/check-digit/
  - Purpose: Compute GTIN check digit and return normalized GTIN-14
  - Query/body params:
    - gtin_base: 7–14 digit base value (digits only). If 14, treated as full GTIN.
    - gtin: Alias to accept digits-only input when sending JSON body.
  - Behavior:
    - Accepts 7–14 digits. If 14 digits, validates GS1 check digit and sets is_valid accordingly.
    - Returns: { normalized: string (14 digits), length: int, check_digit: int, is_valid: bool, message?: string }
    - Errors: 400 on non-digits or invalid length; includes JSON "detail".

## Inventory

- WarehouseItem.gtin field
  - Type: CharField(max_length=14), nullable/blank allowed.
  - Rules:
    - Digits-only. Accepts 7–14 digits; when 14 digits are provided, GS1 check digit is validated.
    - Serializer normalizes to digits-only and enforces the 14-digit check digit rule.
  - Rationale: Aligns with GS1 GTIN family (GTIN-8/12/13/14) while storing a canonical 14-digit normalized representation when possible.

## Budget V2 (nested writes for distributions)

- Resources:
  - List/Create: `GET/POST /api/budgets-v2/`
  - Retrieve/Update: `GET/PUT/PATCH /api/budgets-v2/{id}/`
  - Seed defaults: `POST /api/budgets-v2/{id}/seed-default/`
  - Explicit distributions replace: `PUT/PATCH /api/budgets-v2/{id}/distributions/` (existing action)

- Nested write behavior (recommended):
  - On create or update, you can include a `distributions` array to atomically replace all 12 months.
  - Validation rules:
    - Exactly 12 rows are required
    - Months must be unique and in 1..12
    - Percent must be between 0 and 100 inclusive
    - Total percent must equal 100.00 (rounded to 2 decimals)
  - Persistence is transactional; either all rows are replaced or none.

- Create with distributions (example):
```json
POST /api/budgets-v2/
{
  "name": "Ops 2035",
  "year": 2035,
  "cost_center": 1,
  "distributions": [
    {"month": 1, "percent": 8.33},
    {"month": 2, "percent": 8.33},
    {"month": 3, "percent": 8.33},
    {"month": 4, "percent": 8.33},
    {"month": 5, "percent": 8.33},
    {"month": 6, "percent": 8.33},
    {"month": 7, "percent": 8.33},
    {"month": 8, "percent": 8.33},
    {"month": 9, "percent": 8.33},
    {"month": 10, "percent": 8.33},
    {"month": 11, "percent": 8.33},
    {"month": 12, "percent": 8.37}
  ]
}
```

- Success response (201):
```json
{
  "id": 42,
  "name": "Ops 2035",
  "year": 2035,
  "cost_center": 1,
  "cost_center_name": "General Operations",
  "project": null,
  "created_by": 7,
  "created_by_name": "Manager User",
  "created_at": "2025-10-11T18:01:23Z",
  "distributions": [
    {"id": 101, "month": 1, "percent": "8.33"},
    ...,
    {"id": 112, "month": 12, "percent": "8.37"}
  ]
}
```

- Update with distributions (example):
```json
PATCH /api/budgets-v2/42/
{
  "distributions": [
    {"month": 1, "percent": 10.00},
    {"month": 2, "percent": 10.00},
    {"month": 3, "percent": 10.00},
    {"month": 4, "percent": 5.00},
    {"month": 5, "percent": 5.00},
    {"month": 6, "percent": 5.00},
    {"month": 7, "percent": 10.00},
    {"month": 8, "percent": 10.00},
    {"month": 9, "percent": 10.00},
    {"month": 10, "percent": 10.00},
    {"month": 11, "percent": 10.00},
    {"month": 12, "percent": 5.00}
  ]
}
```

- Error response (400) examples:
```json
{ "distributions": ["Exactly 12 months required (got 10)"] }
{ "distributions": ["Duplicate month 11"] }
{ "distributions": ["Row 1: month 0 out of range (1..12)"] }
{ "distributions": ["Total percent must be 100.00 (got 96.00)"] }
```

Notes:
- If no distributions are provided on create, the server seeds 12 months at ~8.33% with a final adjustment to reach exactly 100.00%.
- A DB-level CheckConstraint enforces basic bounds; cross-row 100% invariant is enforced by model validation and a safety post-save signal.
