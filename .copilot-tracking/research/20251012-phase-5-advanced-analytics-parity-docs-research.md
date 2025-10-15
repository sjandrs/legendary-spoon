<!-- markdownlint-disable-file -->
# Task Research Notes: Phase 5 — Advanced Analytics Parity & Docs

## Research Executed

### File Analysis
- main/api_views.py
  - Analytics endpoints fully implemented: predict_deal_outcome, calculate_clv, generate_revenue_forecast, analytics_dashboard
  - All Phase 3 analytics endpoints exist with basic implementations using heuristic calculations
  - Missing integration with persistent analytics models (DealPrediction, CustomerLifetimeValue, RevenueForecast)

### Code Search Results
- analytics|predict|clv|forecast|snapshots endpoints
  - /api/analytics/predict/<deal_id>/ - Implemented with simple heuristic prediction
  - /api/analytics/clv/<contact_id>/ - Implemented with basic deal value summation
  - /api/analytics/forecast/ - Implemented with static forecast values
  - /api/analytics-snapshots/ - Full ViewSet implementation with AnalyticsSnapshotSerializer

- Frontend components discovered
  - DealPredictions.jsx - Complete 342-line component with Chart.js integration
  - CustomerLifetimeValue.jsx - Complete 418-line component with Chart.js visualization
  - RevenueForecast.jsx - Complete 425-line component with Chart.js forecasting
  - AnalyticsSnapshots.jsx - Complete 451-line component with time series visualization

### External Research
- #githubRepo:"chartjs/Chart.js React integration patterns best practices"
  - Chart.js v4 with React components requires registration of individual chart elements
  - react-chartjs-2 library provides React wrapper components for Chart.js integration
  - Tree-shaking support allows selective import of chart components for bundle optimization
  - Time scale support requires date adapters and proper configuration for time series data

- #fetch:https://react-chartjs-2.js.org/
  - React Chart.js integration using react-chartjs-2 wrapper library
  - Components: Chart, Line, Bar, Pie, Doughnut with individual element registration
  - Tree-shaking pattern: import individual elements, register with ChartJS.register()
  - Dynamic dataset support with responsive charts and TypeScript compatibility

### Project Conventions
- Standards referenced: frontend/src/setupTests.js Jest configuration, frontend/src/__tests__/ testing patterns
- Instructions followed: Phase 5 canonical spec requirements for analytics endpoint verification and frontend implementation
- Chart.js already integrated in existing components with proper component registration patterns

## Key Discoveries

### Project Structure
- Complete analytics backend infrastructure exists with all required Phase 3 endpoints implemented
- Comprehensive frontend components already built for all four major analytics areas
- Navigation integration complete in App.jsx with proper lazy loading and routing
- Test infrastructure exists with MSW mocking and component test patterns

### Implementation Patterns
- API endpoints use simple heuristic calculations rather than persistent model data
- Frontend components follow established patterns with Chart.js integration
- Error handling, loading states, and responsive design implemented consistently
- Date-range filtering implemented in AnalyticsSnapshots component

### Complete Examples
```javascript
// Chart.js integration pattern used in existing components
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// API integration pattern
const response = await api.get(`/api/analytics/clv/${contactId}/`);
const response = await api.get('/api/analytics/forecast/', { params });
```

### API and Schema Documentation
- Analytics endpoints fully documented in main/api_urls.py with proper URL patterns
- Serializers exist for AnalyticsSnapshot with complete field definitions
- Missing documentation in docs/API.md for analytics endpoints
- JSON Schema validation exists for core models but not analytics-specific schemas

### Configuration Examples
```python
# Existing API endpoints in main/api_urls.py
path("analytics/clv/<int:contact_id>/", api_views.calculate_clv, name="calculate-clv"),
path("analytics/predict/<int:deal_id>/", api_views.predict_deal_outcome, name="predict-deal-outcome"),
path("analytics/forecast/", api_views.generate_revenue_forecast, name="generate-revenue-forecast"),

# AnalyticsSnapshot ViewSet registration
router.register(r"analytics-snapshots", api_views.AnalyticsSnapshotViewSet, basename="analyticssnapshot")
```

### Technical Requirements
- Phase 3 analytics models exist (DealPrediction, CustomerLifetimeValue, RevenueForecast, AnalyticsSnapshot)
- Gap: API endpoints return heuristic data instead of using persistent model instances
- Management command exists for populating analytics data (populate_analytics.py)
- Background job scheduling needed for automated prediction/forecast recalculation

## Recommended Approach

**Status Assessment**: Phase 5 implementation is approximately 85% complete with all major components existing but requiring integration refinement and documentation completion.

**Primary Gap**: Analytics endpoints use placeholder/heuristic calculations instead of leveraging persistent analytics models. This creates a disconnect between stored predictions and API responses.

**Implementation Strategy**:
1. Enhance existing analytics endpoints to read from persistent models where available
2. Implement background job scheduling for automated analytics recalculation
3. Complete documentation gaps in docs/API.md with analytics endpoint examples
4. Add comprehensive parameter validation and error handling to analytics endpoints
5. Implement export functionality for analytics data with proper date-range filtering

## Implementation Guidance
- **Objectives**: Complete Phase 5 analytics parity by integrating persistent models with API responses and finishing documentation
- **Key Tasks**:
  - Update analytics endpoints to use stored model data with fallback to calculations
  - Add background job for periodic analytics refresh via management commands
  - Document all analytics endpoints in docs/API.md with request/response examples
  - Implement data export functionality with CSV/JSON format options
  - Add comprehensive parameter validation and pagination for large datasets
- **Dependencies**: Existing analytics models (DealPrediction, CustomerLifetimeValue, RevenueForecast), Chart.js integration, MSW test handlers
- **Success Criteria**:
  - All analytics endpoints return persistent model data when available
  - Complete API documentation with examples and error scenarios
  - Background analytics refresh working with scheduled execution
  - Export functionality implemented with proper format support
  - Test coverage includes both heuristic fallbacks and model-based responses
