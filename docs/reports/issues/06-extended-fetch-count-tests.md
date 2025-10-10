# Extended Fetch-Count Regression Coverage

**Labels:** testing, performance, regression

## Summary
Expand single-fetch regression tests to additional high-traffic components.

## Target Components
`AccountList`, `Deals`, `TaskDashboard`, `WorkOrderList`, `AnalyticsDashboard`.

## Pattern
1. Spy on `api.get` (or relevant function).
2. Render component.
3. Await settled state.
4. Assert call count === expected (usually 1).
5. Interact with non-fetching UI elements; ensure no extra fetch.

## Acceptance Criteria
- 5 new tests added & stable.
- Documented expected fetch counts in test comments.
