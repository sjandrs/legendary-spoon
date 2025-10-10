---
title: Cross-Browser Performance Testing
version: 1.0
date_created: 2025-10-04
last_updated: 2025-10-04
owner: Performance Engineering Team
tags: [cross-browser, performance, lighthouse, core-web-vitals, benchmarking]
---

# Cross-Browser Performance Testing

## 1. Purpose & Scope

This specification defines performance testing methodology, metrics, and acceptance criteria for cross-browser performance validation.

**Purpose:**
- Establish performance benchmarks for all supported browsers
- Define Core Web Vitals targets and measurement procedures
- Configure automated performance testing in CI/CD
- Ensure consistent user experience across browsers

**Scope:**
- Desktop and mobile browser performance
- Core Web Vitals (LCP, FID, CLS, TTFB, FCP, TTI)
- Bundle size optimization and monitoring
- Performance regression detection
- Lighthouse CI integration

## 2. Definitions

**Core Web Vitals:** Google's essential metrics for user experience (LCP, FID, CLS).

**LCP (Largest Contentful Paint):** Time to render largest content element.

**FID (First Input Delay):** Time from first interaction to browser response.

**CLS (Cumulative Layout Shift):** Visual stability metric measuring unexpected layout shifts.

**TTFB (Time to First Byte):** Time from request to first byte of response.

**FCP (First Contentful Paint):** Time to render first content element.

**TTI (Time to Interactive):** Time until page is fully interactive.

**TBT (Total Blocking Time):** Total time page is blocked from responding to user input.

**Bundle Size:** Size of JavaScript/CSS files loaded by browser.

**Performance Budget:** Maximum acceptable values for performance metrics.

## 3. Requirements, Constraints & Guidelines

### Performance Targets

**REQ-501:** Desktop browsers MUST achieve TTI <3.0s on standard hardware.

**REQ-502:** Mobile browsers MUST achieve TTI <5.0s on mid-tier devices.

**REQ-503:** All browsers MUST achieve LCP <2.5s (desktop), <4.0s (mobile).

**REQ-504:** All browsers MUST achieve CLS <0.1.

**REQ-505:** All browsers MUST achieve FCP <1.5s (desktop), <3.0s (mobile).

**REQ-506:** Bundle size MUST remain <600KB gzipped (15% margin from baseline).

### Core Web Vitals Targets

**REQ-507:** LCP (Largest Contentful Paint):
- **Good:** <2.5s
- **Needs Improvement:** 2.5s - 4.0s
- **Poor:** >4.0s

**REQ-508:** FID (First Input Delay):
- **Good:** <100ms
- **Needs Improvement:** 100ms - 300ms
- **Poor:** >300ms

**REQ-509:** CLS (Cumulative Layout Shift):
- **Good:** <0.1
- **Needs Improvement:** 0.1 - 0.25
- **Poor:** >0.25

### Testing Requirements

**REQ-510:** Performance tests MUST run in CI/CD on every pull request.

**REQ-511:** Performance regression MUST be detected and reported automatically.

**REQ-512:** Lighthouse audits MUST be executed for Chrome (representative).

**REQ-513:** WebPageTest MUST validate performance across all browsers.

**REQ-514:** Performance budgets MUST be enforced with automated failures.

### Constraints

**CON-501:** Performance tests assume standard network conditions (no throttling by default).

**CON-502:** Mobile testing requires throttling (3G) for realistic results.

**CON-503:** Performance varies by hardware; use standardized CI environments.

**CON-504:** Real User Monitoring (RUM) required for production performance tracking.

### Guidelines

**GUD-501:** Test performance on clean browser profiles (no extensions).

**GUD-502:** Use headless mode in CI for consistent performance results.

**GUD-503:** Run multiple iterations (3-5) and use median values.

**GUD-504:** Document hardware specs for reproducible benchmarks.

**GUD-505:** Monitor bundle size trends over time, not just absolute values.

## 4. Interfaces & Data Contracts

### Performance Metrics Schema

\\\	ypescript
interface PerformanceMetrics {
  browser: {
    name: string;
    version: string;
    platform: string;
  };
  timestamp: string;
  testEnvironment: {
    cpu: string;
    memory: string;
    network: 'WiFi' | '3G' | '4G' | 'Cable';
  };
  coreWebVitals: {
    lcp: {
      value: number;
      rating: 'good' | 'needs-improvement' | 'poor';
    };
    fid: {
      value: number;
      rating: 'good' | 'needs-improvement' | 'poor';
    };
    cls: {
      value: number;
      rating: 'good' | 'needs-improvement' | 'poor';
    };
  };
  loadingMetrics: {
    ttfb: number;
    fcp: number;
    lcp: number;
    tti: number;
    tbt: number;
  };
  bundleSize: {
    javascript: number;
    css: number;
    total: number;
    gzipped: number;
  };
  lighthouseScore: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
}
\\\

### Performance Budget

\\\	ypescript
interface PerformanceBudget {
  metrics: {
    tti: {
      desktop: number; // 3000ms
      mobile: number; // 5000ms
    };
    lcp: {
      desktop: number; // 2500ms
      mobile: number; // 4000ms
    };
    fcp: {
      desktop: number; // 1500ms
      mobile: number; // 3000ms
    };
    cls: number; // 0.1
    tbt: number; // 200ms
  };
  bundleSize: {
    maxGzipped: number; // 600KB
    maxUncompressed: number; // 2MB
  };
  lighthouseScores: {
    performance: number; // 90
    accessibility: number; // 95
  };
}
\\\

## 5. Acceptance Criteria

**AC-501:** Given performance tests, When executed, Then all browsers MUST meet Core Web Vitals targets.

**AC-502:** Given bundle size, When measured, Then it MUST be <600KB gzipped.

**AC-503:** Given Lighthouse audit, When run, Then performance score MUST be 90.

**AC-504:** Given performance regression, When detected, Then CI/CD MUST fail with detailed report.

**AC-505:** Given browser comparison, When analyzed, Then variance MUST be <20% across browsers.

## 6. Test Automation Strategy

### Lighthouse CI Configuration

\\\javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:5173/'],
      numberOfRuns: 5,
      settings: {
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'interactive': ['error', { maxNumericValue: 3000 }],
        'speed-index': ['error', { maxNumericValue: 2000 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
\\\

### WebPageTest Configuration

\\\javascript
// wpt-config.json
{
  "url": "https://staging.convergecrm.com",
  "location": "Dulles:Chrome",
  "runs": 3,
  "firstViewOnly": false,
  "video": true,
  "connectivity": "Cable",
  "browsers": ["Chrome", "Firefox", "Safari", "Edge"],
  "metrics": [
    "TTFB",
    "firstContentfulPaint",
    "largestContentfulPaint",
    "timeToInteractive",
    "totalBlockingTime",
    "cumulativeLayoutShift"
  ],
  "budgets": {
    "tti": 3000,
    "lcp": 2500,
    "cls": 0.1
  }
}
\\\

### Bundle Size Monitoring

\\\json
{
  "scripts": {
    "analyze": "vite-bundle-visualizer",
    "size-check": "bundlesize",
    "size-limit": "size-limit"
  },
  "bundlesize": [
    {
      "path": "./dist/assets/*.js",
      "maxSize": "500 KB",
      "compression": "gzip"
    },
    {
      "path": "./dist/assets/*.css",
      "maxSize": "100 KB",
      "compression": "gzip"
    }
  ]
}
\\\

## 7. Rationale & Context

### Why Performance Matters

**User Experience:** Users expect fast, responsive applications. Studies show 53% of mobile users abandon sites taking >3s to load.

**SEO Impact:** Google uses Core Web Vitals as ranking factors. Better performance = better search visibility.

**Conversion Rates:** Amazon found 100ms delay = 1% revenue loss. Performance directly impacts business metrics.

**Cross-Browser Consistency:** Different browsers have different performance characteristics. Testing ensures consistent UX.

### Performance Budget Philosophy

**Preventive Approach:** Performance budgets prevent regressions before deployment.

**Gradual Improvement:** Track trends over time, set incremental improvement goals.

**Realistic Targets:** Budgets based on user research and industry benchmarks.

## 8. Dependencies & External Integrations

### External Systems

**EXT-501:** Lighthouse CI Server - Performance trend tracking and reporting.

**EXT-502:** WebPageTest API - Cross-browser performance validation.

### Third-Party Services

**SVC-501:** Lighthouse CI - Automated performance auditing.

**SVC-502:** WebPageTest - Real browser performance testing.

**SVC-503:** Bundle Analyzer - Webpack/Vite bundle analysis.

**SVC-504:** SpeedCurve/Calibre - Real User Monitoring (optional).

### Infrastructure Dependencies

**INF-501:** GitHub Actions runners with consistent hardware specs.

**INF-502:** Staging environment accessible for performance testing.

**INF-503:** CDN configuration for production performance.

### Technology Platform Dependencies

**PLT-501:** Vite build system with production optimizations.

**PLT-502:** Chrome 90+ for Lighthouse audits.

**PLT-503:** Node.js 18+ for performance testing tools.

## 9. Examples & Edge Cases

### Example: Performance Test Results - Desktop

\\\markdown
**Test Date:** 2025-10-04
**Environment:** Desktop (1920x1080, Cable connection)
**Page:** Dashboard (/dashboard)

| Metric | Chrome 131 | Firefox 122 | Safari 17 | Edge 131 | Target | Status |
|--------|-----------|-------------|-----------|----------|--------|--------|
| TTFB | 245ms | 268ms | 302ms | 248ms | <500ms |  Pass |
| FCP | 0.8s | 0.9s | 1.0s | 0.8s | <1.5s |  Pass |
| LCP | 1.6s | 1.8s | 1.9s | 1.6s | <2.5s |  Pass |
| TTI | 2.1s | 2.3s | 2.5s | 2.1s | <3.0s |  Pass |
| TBT | 45ms | 52ms | 68ms | 46ms | <200ms |  Pass |
| CLS | 0.02 | 0.03 | 0.04 | 0.02 | <0.1 |  Pass |
| Lighthouse | 94 | N/A | N/A | 94 | 90 |  Pass |

**Overall Status:**  ALL PASS
\\\

### Example: Performance Test Results - Mobile

\\\markdown
**Test Date:** 2025-10-04
**Environment:** Mobile (375x667, 3G Slow throttling)
**Page:** Dashboard (/dashboard)

| Metric | Chrome Mobile | Safari iOS | Target | Status |
|--------|--------------|------------|--------|--------|
| TTFB | 890ms | 1020ms | <1000ms |  Safari Border |
| FCP | 2.1s | 2.6s | <3.0s |  Pass |
| LCP | 3.2s | 3.8s | <4.0s |  Pass |
| TTI | 4.1s | 4.6s | <5.0s |  Pass |
| TBT | 180ms | 220ms | <300ms |  Pass |
| CLS | 0.05 | 0.07 | <0.1 |  Pass |
| Lighthouse | 82 | N/A | 80 |  Pass |

**Overall Status:**  PASS (Safari TTFB borderline, monitoring)
\\\

### Example: Bundle Size Analysis

\\\markdown
**Build:** Production build
**Date:** 2025-10-04
**Bundler:** Vite 5.x

| Asset Type | Uncompressed | Gzipped | Target | Status |
|-----------|--------------|---------|--------|--------|
| JavaScript | 1,456 KB | 487 KB | <500 KB |  Pass |
| CSS | 234 KB | 78 KB | <100 KB |  Pass |
| Images | 892 KB | N/A | <1 MB |  Pass |
| **Total** | **2,582 KB** | **565 KB** | **<600 KB** |  Pass |

**Increase from Baseline:** +12% (acceptable, <15% limit)

**Largest Bundles:**
1. vendor.js - 312 KB gzipped (React, React Router, Chart.js)
2. main.js - 175 KB gzipped (Application code)
3. styles.css - 78 KB gzipped (Tailwind CSS)

**Recommendations:**
- Consider code splitting for Chart.js (only used in analytics pages)
- Evaluate tree-shaking opportunities in vendor bundle
\\\

### Edge Case: Performance Regression Detection

\\\markdown
**Scenario:** New feature increases bundle size significantly

**Detection:**
- CI/CD performance check fails
- Bundle size: 720 KB gzipped (>20% increase)
- TTI regresses from 2.1s to 3.5s

**Alert:**
`
 Performance Budget Exceeded

Bundle Size: 720 KB gzipped (Target: <600 KB)
Increase: +35% from baseline

Time to Interactive: 3.5s (Target: <3.0s)
Regression: +1.4s from baseline

Lighthouse Score: 78 (Target: 90)

Action Required: Optimize bundle or update budget
`

**Resolution Steps:**
1. Analyze bundle with vite-bundle-visualizer
2. Identify large dependencies
3. Implement code splitting
4. Use dynamic imports for heavy features
5. Re-run performance tests
6. Update performance budget if optimization not feasible
\\\

## 10. Validation Criteria

**VAL-501:** Performance tests execute successfully in CI/CD pipeline.

**VAL-502:** All browsers meet Core Web Vitals targets.

**VAL-503:** Bundle size remains within performance budget.

**VAL-504:** Lighthouse performance score 90 for desktop.

**VAL-505:** Performance regression detection alerts trigger correctly.

**VAL-506:** Performance reports generated and accessible after each test run.

**VAL-507:** Trends tracked over time with historical data retention.

## 11. Related Specifications / Further Reading

- [spec-tool-cross-browser-testing-strategy.md](./spec-tool-cross-browser-testing-strategy.md)
- [spec-tool-browser-compatibility-matrix.md](./spec-tool-browser-compatibility-matrix.md)
- [CROSS_BROWSER_TESTING_PLAN.md](../../CROSS_BROWSER_TESTING_PLAN.md)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest Documentation](https://docs.webpagetest.org/)
