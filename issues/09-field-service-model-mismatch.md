# Issue 09: Field Service Model/Viewset Mismatches

Severity: High
Type: Bug / Data Integrity
Status: Open

## Summary
Field Service related viewsets reference fields not present on the corresponding models, causing potential runtime errors and silently broken filters.

## Affected Components
- `ScheduledEventViewSet.filterset_fields` references `priority` (not on `ScheduledEvent`).
- `DigitalSignatureViewSet` uses `is_valid`, `document_hash`, `work_order` filterset fields; underlying `DigitalSignature` model does not define these fields (generic FK instead of direct work_order field; no `is_valid`, `document_hash`).
- `InventoryReservationViewSet` references `item`, `reserved_at`, `quantity_used`, `released_at`—model defines `warehouse_item`, `created_at`, `updated_at`, `quantity_reserved`, `quantity_consumed`.
- `SchedulingAnalyticsViewSet.summary` method references fields (`completion_rate`, `technician_utilization`, `total_appointments`) not defined on `SchedulingAnalytics`.

## Impact
- Filter operations may raise `FieldError` at runtime.
- Verification endpoints (e.g., digital signature verification) set attributes that do not persist.
- Analytics summary endpoint will fail with `AttributeError`.

## Acceptance Criteria
1. All filterset fields map to real model fields.
2. Digital signature verification persists a boolean validity flag (`is_valid`) and any integrity hash if required.
3. Inventory reservation endpoint naming aligned (`warehouse_item`, `quantity_reserved`, `quantity_consumed`).
4. Scheduling analytics summary uses existing model fields OR model extended with needed metrics (document decision).
5. Tests added asserting filter introspection succeeds and summary endpoint returns 200.

## Proposed Remediation
- Add missing fields OR adjust viewsets to only expose existing ones (prefer minimal additive fields: `is_valid`, `document_hash`).
- Rename filterset fields to align (`item` -> `warehouse_item`).
- Update summary method to compute from existing fields or extend model.

## Risk
Leaving mismatches unresolved undermines reliability and hides defects in higher-level dashboards.

## Next Steps
- [ ] Design decision: extend models vs reduce viewset scope.
- [ ] Implement model migrations if adding fields.
- [ ] Update serializers & tests.
