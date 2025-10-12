
# API Endpoints Summary (Delta Update)

This document captures recent additions and behavioral changes relevant to accounting and field service APIs.

## Conventions

- Authentication: Token or session auth as configured in DRF settings.
- Pagination: Paginated list endpoints return an object with `count`, `next`, `previous`, and `results`.
  - Example:
    ```json
    {
      "count": 123,
      "next": "https://example/api/accounts/?page=3",
      "previous": "https://example/api/accounts/?page=1",
      "results": [{"id": 1, "name": "Acme"}]
    }
    ```
- Error payloads:
  - Validation errors include a top-level `detail` and optional `errors` list with `{path, message}` items (for batch validations):
    ```json
    {
      "detail": "Invalid distributions",
      "errors": [
        {"path": "distributions[0].month", "message": "month 0 out of range (1..12)"},
        {"path": "<root>", "message": "Total percent must be 100.00 (got 96.00)"}
      ]
    }
    ```
  - Simple errors use `{ "detail": "..." }`.
- RBAC: Endpoints enforce role-based access. Tests should exercise 401 (unauthenticated), 403 (authenticated but unauthorized), and success (200/201) for authorized roles.
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

## Accounts {#accounts}

- List/Create: GET/POST /api/accounts/
- Retrieve/Update: GET/PUT/PATCH /api/accounts/{id}/
- Notes: RBAC (owner vs manager), pagination shape.
 - Query params:
   - ordering: supports fields like `name`, `-name`
   - pagination: `page` (integer)
 - Examples:
   - GET /api/accounts/?ordering=-name
   - GET /api/accounts/?page=2

## Contacts {#contacts}

- List/Create: GET/POST /api/contacts/
- Retrieve/Update: GET/PUT/PATCH /api/contacts/{id}/
- Notes: RBAC matrix as described above.
 - Query params:
   - owner: filter by owner user id (e.g., `?owner=7`)
   - search: searches common fields (name/email)
   - ordering: supports fields like `last_name`, `-last_name`
 - Examples:
   - GET /api/contacts/?owner=7
   - GET /api/contacts/?ordering=last_name
   - GET /api/contacts/?search=alice@example.com

## Deals {#deals}

- List/Create: GET/POST /api/deals/
- Retrieve/Update: GET/PUT/PATCH /api/deals/{id}/
- Query: search, filtering, ordering.
 - Common filters:
   - status: e.g., `?status=in_progress|won|lost`
 - Ordering:
   - `-value` for high-value first
   - Default is `-close_date` (most recent first)
 - Examples:
   - GET /api/deals/?status=in_progress
   - GET /api/deals/?ordering=-value

## Budget V2 (nested writes for distributions) {#budget-v2}

- Resources:
  - List/Create: `GET/POST /api/budgets-v2/`
  - Retrieve/Update: `GET/PUT/PATCH /api/budgets-v2/{id}/`
  - Seed defaults: `POST /api/budgets-v2/{id}/seed-default/`
  - Explicit distributions replace: `PUT/PATCH /api/budgets-v2/{id}/distributions/` (existing action)

- Query Parameters (for List endpoint):
  - `year` - Filter budgets by year (exact match)
  - `cost_center` - Filter budgets by cost center ID (exact match)
  - Examples:
    - `GET /api/budgets-v2/?year=2026` - All budgets for year 2026
    - `GET /api/budgets-v2/?cost_center=5` - All budgets for cost center ID 5
    - `GET /api/budgets-v2/?year=2026&cost_center=5` - Budgets for 2026 AND cost center 5

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
{ "detail": "Exactly 12 months required (got 10)" }
{ "detail": "Row 1 must include numeric month and percent" }
{ "detail": "Invalid distributions", "errors": ["Duplicate month 11", "Row 5: month 0 out of range (1..12)", "Total percent must be 100.00 (got 96.00)"] }
```

Notes:
- If no distributions are provided on create, the server seeds 12 months at ~8.33% with a final adjustment to reach exactly 100.00%.
- A DB-level CheckConstraint enforces basic bounds; cross-row 100% invariant is enforced by model validation and a safety post-save signal.

See also: Budget V2 nested writes (this section) for canonical request/response shapes.

## Payments {#payments}

- List/Create: GET/POST /api/payments/
- Retrieve/Update/Delete: GET/PUT/PATCH/DELETE /api/payments/{id}/
- Action: POST /api/payments/{id}/allocate/
- RBAC: FinancialDataPermission — Managers can manage; non-managers are restricted. See tests in main/tests/test_permissions_*.py.

Allocate example (happy path):
```
POST /api/payments/123/allocate/
200 OK
{
  "payment_id": 123,
  "journal_entry_id": 456,
  "allocated_amount": 100.0,
  "allocation_status": "posted",
  "open_balance": 0.0,
  "status": "paid"
}
```

Idempotency and errors:
- 409 on re-post of the same payment allocation
- 400 when payment exceeds open balance
Example (400):
```json
{
  "error": "Payment exceeds open balance",
  "total_due": 100.0,
  "previously_paid": 60.0,
  "attempted_payment": 50.0
}
```

Notes:
- Default accounts used when missing: Cash 1000 (asset), AR 1100 (asset)
- Generic relation supports Invoice and WorkOrderInvoice

## Invoices {#invoices}

- List/Create: GET/POST /api/invoices/
- Retrieve/Update/Delete: GET/PUT/PATCH/DELETE /api/invoices/{id}/
- Action: POST /api/invoices/{id}/post/

Posting example:
```
POST /api/invoices/42/post/
201 Created
{
  "journal_entry_id": 789,
  "amount": "100.0"
}
```

Idempotency and errors:
- 409 if the invoice has already been posted
- 200/201 on first successful post

Notes:
- Creates JournalEntry: DR 1100 Accounts Receivable, CR 4000 Revenue for the invoice total
- Persists posted_journal and posted_at on the Invoice when available

## Journal Entries {#journal-entries}

- List/Create: GET/POST /api/journal-entries/
- Retrieve/Update/Delete: GET/PUT/PATCH/DELETE /api/journal-entries/{id}/
- RBAC: FinancialDataPermission applies; non-managers forbidden for write operations; see tests.

Create example:
```json
POST /api/journal-entries/
{
  "date": "2025-10-11",
  "description": "Service revenue recognition",
  "debit_account_id": 1000,
  "credit_account_id": 4000,
  "amount": "2500.00"
}
```

## Ledger Accounts {#ledger-accounts}

- List/Create: GET/POST /api/ledger-accounts/
- Retrieve/Update/Delete: GET/PUT/PATCH/DELETE /api/ledger-accounts/{id}/
- RBAC: Managers only (IsManager); see tests.
- Extra: GET /api/ledger-accounts/hierarchy/

Hierarchy example response:
```json
{
  "asset": [
    {"id": 1, "code": "1000", "name": "Cash"},
    {"id": 2, "code": "1100", "name": "Accounts Receivable"}
  ],
  "revenue": [
    {"id": 3, "code": "4000", "name": "Revenue"}
  ]
}
```

## Work Orders {#work-orders}

- List/Create: GET/POST /api/work-orders/
- Retrieve/Update/Delete: GET/PUT/PATCH/DELETE /api/work-orders/{id}/
- Actions:
  - POST /api/work-orders/{id}/generate-invoice/
  - POST /api/work-orders/{id}/complete/

Generate invoice example:
```
POST /api/work-orders/55/generate-invoice/
201 Created
{
  "invoice_id": 1001,
  "amount": 250.0
}
```

Complete example and outcomes:
- Success with consumption posting:
```
POST /api/work-orders/55/complete/
201 Created
{
  "message": "Work order completed",
  "journal_entry_id": 222,
  "amount": "150.0"
}
```
- Already completed: 409 with `{ "detail": "Work order already completed/posting recorded" }`
- Insufficient stock: 409 with `{ "error": "<message>" }`

Notes:
- Inventory is reduced according to linked WarehouseItem quantities; COGS and Inventory accounts are posted (DR 5000 COGS, CR 1200 Inventory)
