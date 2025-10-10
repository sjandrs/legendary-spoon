# Issue 15: Inventory Reservation Concurrency & Integrity Gaps

Severity: Medium
Type: Data Integrity
Status: Open

## Summary
`InventoryReservation` consume/release endpoints adjust quantities without explicit transactional locks or negative stock guards. Potential race conditions if multiple consumption events occur concurrently.

## Impact
- Inaccurate stock levels; inability to reconcile inventory.

## Acceptance Criteria
1. Consumption & release operations run inside DB transaction with `select_for_update` on related `WarehouseItem`.
2. Validation prevents over-consumption relative to reserved and physical stock.
3. Tests simulate concurrent requests (sequential approximation) ensuring integrity.

## Proposed Implementation
- Wrap logic in atomic block, lock `WarehouseItem` row.
- Add validation raising 400 on invalid consumption.

## Risks
Potential deadlocks if lock ordering inconsistent—keep ordering deterministic.

## Next Steps
- [ ] Implement transactional adjustments.
- [ ] Add integrity tests.
