# Issue 17: Performance Optimization Targets (Search, Matching, Analytics)

Severity: Low
Type: Performance / Scalability
Status: Open

## Summary
Potential N+1 and inefficient query patterns identified (technician matching certification loop, global search multi-model fan-out, analytics endpoints recomputing aggregates inline each request).

## Impact
- Response latency growth with data volume.
- Higher DB load under concurrent usage.

## Acceptance Criteria
1. Technician matching uses precomputed certification mapping or set intersections in a single query.
2. Global search paginated & possibly delegates to dedicated search index.
3. Analytics endpoints leverage cached snapshots/services.
4. Add basic performance tests or query count assertions for key endpoints.

## Proposed Improvements
- Pre-fetch related sets; use annotation + conditional aggregation.
- Introduce caching layer (Redis) for dashboard aggregates.

## Risks
Caching invalidation complexity; premature optimization—limit scope to clear hotspots.

## Next Steps
- [ ] Establish baseline metrics.
- [ ] Optimize top 2 hotspots.
