# Issue 12: Advanced Analytics Models Not Integrated Into API Responses

Severity: Medium
Type: Feature Incompletion / Gap
Status: Open

## Summary
Models for advanced analytics exist (`DealPrediction`, `RevenueForecast`, `CustomerLifetimeValue`), but endpoints return heuristic or placeholder data rather than persisted model instances. No scheduling mechanism updates predictions/forecasts.

## Impact
- Stakeholders receive non-persistent, potentially misleading analytics.
- Can't audit historical prediction accuracy or model evolution.

## Acceptance Criteria
1. Endpoints `/api/analytics/predict/<deal_id>/` and `/api/analytics/forecast/` leverage stored model records where available.
2. Background job (cron/Celery) periodically recalculates predictions & forecasts.
3. CLV endpoint either returns `CustomerLifetimeValue` model instance or re-computes & persists consistently.
4. Tests validating persistence and idempotent recalculation.

## Proposed Solution
- Introduce analytics service module encapsulating calculations.
- Add management command or scheduled task to regenerate metrics.
- Update endpoints to read-or-create from models.

## Risks
Model drift; recalculation performance; ensuring atomic updates.

## Next Steps
- [ ] Design analytics service abstraction.
- [ ] Implement persistence-first endpoint logic.
- [ ] Add recalculation scheduling.
