<!-- markdownlint-disable-file -->
# Task Research Notes: WorkOrderInvoice and Payment JSON Schemas

## Research Executed

### File Analysis
- main/models.py
  - WorkOrderInvoice: fields include work_order (FK), issued_date, due_date, payment_terms (enum: net_15|net_30|net_60|due_on_receipt), total_amount (Decimal), is_paid (bool), paid_date (nullable), created_at (auto_now_add). Methods is_overdue() and days_overdue().
  - Payment: amount (Decimal), payment_date (Date), method (Char), received_by (FK to CustomUser, nullable), created_at, GenericForeignKey via content_type + object_id to support multiple invoice types.
- main/serializers.py
  - WorkOrderInvoiceSerializer: exposes work_order, work_order_description (ro), issued_date, due_date, payment_terms, total_amount, is_paid, paid_date, is_overdue (ro via method), days_overdue (ro via method), created_at. total_amount is read-only in serializer.
  - PaymentSerializer: fields id, content_type (PK of ContentType, write_only), object_id (int, write_only), related_object (ro string), amount, payment_date, method, received_by, created_at. Implements create() assigning generic relation.

### Code Search Results
- WorkOrderInvoice|Payment in models
  - Found model declarations and methods at lines ~720, ~880 in models.py with full field sets confirmed.
- Serializer fields
  - Confirmed exact field lists and read-only/write-only semantics in serializers.py.

### External Research
- #githubRepo:"encode/django-rest-framework GenericForeignKey serializer patterns"
  - Located DRF tests and docs showing generic relationships require explicit fields (content_type, object_id) and custom representation; supports our PaymentSerializer design using PrimaryKeyRelatedField for ContentType and IntegerField for object_id.
- #fetch:https://docs.djangoproject.com/en/5.0/ref/contrib/contenttypes/
  - Validates ContentType and GenericForeignKey patterns; recommends indexing and notes serialization considerations and natural keys.
- #fetch:https://www.django-rest-framework.org/api-guide/relations/#generic-relationships
  - Confirms that generic relations are not auto-serialized; read/write needs explicit fields; our approach aligns with recommended patterns.
- #fetch:https://json-schema.org/draft-07/json-schema-release-notes.html
  - Confirms draft-07 availability of readOnly/writeOnly and $comment; suitable for our closed schemas and annotations.

### Project Conventions
- Standards referenced: JSON Schema draft-07 primary; additionalProperties false (closed schemas); examples included; align with DRF serializers not just models.
- Instructions followed: Research-only changes under ./.copilot-tracking/research; consolidate verified findings; remove ambiguity; cite authoritative sources using #fetch/#githubRepo callouts.

## Key Discoveries

### Project Structure
Backend: Django + DRF models/serializers define WorkOrderInvoice and Payment. Generic payments span Invoice types via ContentType/object_id. Serializer exposes read-only helpers for WorkOrderInvoice; Payment hides generic relation inputs as write-only and exposes a string summary.

### Implementation Patterns
- WorkOrderInvoice payment_terms is a closed enum with four values; due_date computed in WorkOrder.generate_invoice() based on terms; total_amount is computed from line_items in model save() if missing; serializer marks total_amount read-only.
- Payment uses GenericForeignKey; DRF serializer accepts content_type (PK) and object_id; returns related_object as string.

### Complete Examples
```json
{
  "work_order": 42,
  "issued_date": "2025-10-11",
  "due_date": "2025-11-10",
  "payment_terms": "net_30",
  "total_amount": 1234.5,
  "is_paid": false
}
```

Source: Derived from WorkOrderInvoiceSerializer fields and model business logic.

```json
{
  "content_type": 27,
  "object_id": 105,
  "amount": 123.45,
  "payment_date": "2025-10-11",
  "method": "credit_card",
  "received_by": 3
}
```

Source: PaymentSerializer fields; ContentType id example; aligns with DRF generic relation patterns.

### API and Schema Documentation
WorkOrderInvoice fields per serializers.py; Payment fields per serializers.py; Generic relation semantics per Django contenttypes docs and DRF relation docs.

### Configuration Examples
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "additionalProperties": false
}
```

Used as base for closed schemas across research artifacts.

### Technical Requirements
- Use draft-07; include readOnly/writeOnly annotations; close schemas with additionalProperties:false; enums for payment_terms; numeric minimums for monetary values; proper formats for date/date-time; reflect serializer read/write behavior (e.g., total_amount readOnly; content_type/object_id writeOnly).

## Recommended Approach
Define two draft-07 JSON Schemas aligned to DRF serializers (source of truth for API IO), not raw models. Close schemas, apply readOnly/writeOnly, and include examples. Validate with representative payloads against schemas in CI when introduced.

## Implementation Guidance
- Objectives: Provide precise, closed JSON Schemas for WorkOrderInvoice and Payment matching current API contracts; include examples; annotate readOnly/writeOnly as per serializer; ensure enums and formats are correct.
- Key Tasks: Create workorderinvoice.schema.json and payment.schema.json in research with draft-07; add to research notes; cross-reference sources; optionally add 2019-09/2020-12 variants later.
- Dependencies: DRF serializer fields; Django contenttypes for Payment generic relation; draft-07 validators.
- Success Criteria: Sample payloads validate; no extraneous properties allowed; readOnly/writeOnly flags present; fields match serializers exactly.

```
"WorkOrderInvoice" JSON Schema (draft-07)
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://converge.local/schemas/workorderinvoice.schema.json",
  "title": "WorkOrderInvoice",
  "description": "Invoice generated from a WorkOrder.",
  "type": "object",
  "$comment": "Aligned with WorkOrderInvoiceSerializer.",
  "properties": {
    "id": { "type": "integer", "readOnly": true },
    "work_order": { "type": "integer" },
    "work_order_description": { "type": "string", "readOnly": true },
    "issued_date": { "type": "string", "format": "date" },
    "due_date": { "type": "string", "format": "date" },
    "payment_terms": { "type": "string", "enum": ["net_15", "net_30", "net_60", "due_on_receipt"] },
    "total_amount": { "type": "number", "minimum": 0, "readOnly": true },
    "is_paid": { "type": "boolean" },
    "paid_date": { "type": "string", "format": "date" },
    "is_overdue": { "type": "boolean", "readOnly": true },
    "days_overdue": { "type": "integer", "minimum": 0, "readOnly": true },
    "created_at": { "type": "string", "format": "date-time", "readOnly": true }
  },
  "required": ["work_order", "issued_date", "due_date", "payment_terms"],
  "additionalProperties": false,
  "examples": [
    {
      "work_order": 42,
      "issued_date": "2025-10-11",
      "due_date": "2025-11-10",
      "payment_terms": "net_30",
      "is_paid": false
    }
  ]
}

"Payment" JSON Schema (draft-07)
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://converge.local/schemas/payment.schema.json",
  "title": "Payment",
  "description": "Payment against invoice-like objects via GenericForeignKey.",
  "type": "object",
  "$comment": "Aligned with PaymentSerializer (content_type/object_id writeOnly).",
  "properties": {
    "id": { "type": "integer", "readOnly": true },
    "content_type": { "type": "integer", "writeOnly": true, "minimum": 1 },
    "object_id": { "type": "integer", "writeOnly": true, "minimum": 1 },
    "related_object": { "type": "string", "readOnly": true },
    "amount": { "type": "number", "minimum": 0 },
    "payment_date": { "type": "string", "format": "date" },
    "method": { "type": "string", "minLength": 1 },
    "received_by": { "type": "integer" },
    "created_at": { "type": "string", "format": "date-time", "readOnly": true }
  },
  "required": ["content_type", "object_id", "amount", "payment_date", "method"],
  "additionalProperties": false,
  "examples": [
    {
      "content_type": 27,
      "object_id": 105,
      "amount": 123.45,
      "payment_date": "2025-10-11",
      "method": "credit_card",
      "received_by": 3
    }
  ]
}
```
