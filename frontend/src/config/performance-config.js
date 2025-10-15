/**
 * Webpack Bundle Analysis and Performance Configuration
 * Optimizes bundle splitting and loading for field service components
 */

const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

// Field Service Performance Configuration
const fieldServiceWebpackConfig = {
  // Bundle splitting optimization
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor libraries bundle
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          enforce: true,
          chunks: 'all'
        },

        // FullCalendar specific bundle (large dependency)
        fullcalendar: {
          test: /[\\/]node_modules[\\/]@fullcalendar[\\/]/,
          name: 'fullcalendar',
          priority: 20,
          enforce: true,
          chunks: 'all'
        },

        // Chart.js bundle
        chartjs: {
          test: /[\\/]node_modules[\\/](chart\.js|chartjs-.*|react-chartjs-.*)[\\/]/,
          name: 'chartjs',
          priority: 20,
          enforce: true,
          chunks: 'all'
        },

        // React Signature Canvas bundle
        signature: {
          test: /[\\/]node_modules[\\/]react-signature-canvas[\\/]/,
          name: 'signature',
          priority: 20,
          enforce: true,
          chunks: 'all'
        },

        // Field Service common utilities
        fieldServiceCommon: {
          test: /[\\/]src[\\/](components|utils|hooks)[\\/](field-service|accessibility|performance)/,
          name: 'field-service-common',
          priority: 15,
          minChunks: 2,
          chunks: 'all'
        },

        // Common React utilities
        common: {
          test: /[\\/]src[\\/](utils|hooks|contexts)[\\/]/,
          name: 'common',
          priority: 5,
          minChunks: 2,
          chunks: 'all'
        }
      }
    },

    // Runtime chunk optimization
    runtimeChunk: {
      name: 'runtime'
    },

    // Minimize bundle size
    usedExports: true,
    sideEffects: false
  },

  // Performance budgets
  performance: {
    maxAssetSize: 250000, // 250KB
    maxEntrypointSize: 400000, // 400KB
    hints: 'warning',
    assetFilter: function(assetFilename) {
      // Only check JS and CSS files
      return /\.(js|css)$/.test(assetFilename);
    }
  },

  // Development tools for performance analysis
  plugins: [
    // Bundle analyzer (only in analysis mode)
    process.env.ANALYZE_BUNDLE && new BundleAnalyzerPlugin({
      analyzerMode: 'server',
      analyzerPort: 8888,
      openAnalyzer: true
    })
  ].filter(Boolean),

  // Module resolution optimization
  resolve: {
    alias: {
      // Reduce bundle size by aliasing commonly used paths
      '@components': path.resolve('src/components'),
      '@utils': path.resolve('src/utils'),
      '@hooks': path.resolve('src/hooks'),
      '@field-service': path.resolve('src/components/field-service'),
      '@accessibility': path.resolve('src/components/accessibility')
    },

    // Optimize module resolution
    modules: ['node_modules', 'src'],
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  }
};

// Performance monitoring configuration
const performanceMonitoring = {
  // Core Web Vitals tracking
  webVitals: {
    enabled: true,
    thresholds: {
      LCP: 2500, // Largest Contentful Paint (ms)
      FID: 100,  // First Input Delay (ms)
      CLS: 0.1   // Cumulative Layout Shift
    }
  },

  // Component-specific performance metrics
  componentMetrics: {
    SchedulePage: {
      loadTime: 1000, // Target load time in ms
      renderTime: 100,
      memoryUsage: 50 // MB
    },
    SchedulingDashboard: {
      loadTime: 1500,
      renderTime: 200,
      memoryUsage: 75
    },
    CustomerPortal: {
      loadTime: 800,
      renderTime: 50,
      memoryUsage: 30
    }
  },

  // Bundle size monitoring
  bundleMetrics: {
    'field-service-main': 150, // KB
    'fullcalendar': 200,
    'chartjs': 100,
    'signature': 50
  }
};

// Performance optimization utilities
const optimizationUtils = {
  // Preload critical resources
  preloadCriticalResources: () => {
    const criticalResources = [
      '/api/scheduled-events/',
      '/api/technicians/',
      '/api/appointment-requests/'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  },

  // Prefetch next likely resources based on current route
  prefetchByRoute: (currentRoute) => {
    const prefetchMap = {
      '/schedule': ['/scheduling-dashboard', '/appointment-requests'],
      '/customer-portal': ['/schedule'],
      '/appointment-requests': ['/schedule', '/paperwork-templates'],
      '/paperwork-templates': ['/digital-signature'],
      '/digital-signature': ['/schedule'],
      '/scheduling-dashboard': ['/schedule', '/appointment-requests']
    };

    const nextRoutes = prefetchMap[currentRoute] || [];
    nextRoutes.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });
  },

  // Monitor and report performance metrics
  reportPerformanceMetrics: () => {
    if ('PerformanceObserver' in window) {
      // Monitor LCP
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);

        if (lastEntry.startTime > performanceMonitoring.webVitals.thresholds.LCP) {
          console.warn('LCP threshold exceeded:', lastEntry.startTime);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Monitor FID
      const fidObserver = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry) => {
          console.log('FID:', entry.processingStart - entry.startTime);

          const fid = entry.processingStart - entry.startTime;
          if (fid > performanceMonitoring.webVitals.thresholds.FID) {
            console.warn('FID threshold exceeded:', fid);
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Monitor CLS
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }

        console.log('Current CLS:', clsValue);
        if (clsValue > performanceMonitoring.webVitals.thresholds.CLS) {
          console.warn('CLS threshold exceeded:', clsValue);
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  },

  // Memory usage monitoring
  monitorMemoryUsage: () => {
    if ('memory' in performance) {
      const memoryInfo = performance.memory;
      const usedMB = memoryInfo.usedJSHeapSize / 1024 / 1024;
      const totalMB = memoryInfo.totalJSHeapSize / 1024 / 1024;

      console.log(`Memory Usage: ${usedMB.toFixed(2)}MB / ${totalMB.toFixed(2)}MB`);

      if (usedMB > 100) { // 100MB threshold
        console.warn('High memory usage detected:', usedMB);
      }
    }
  }
};

// Development performance tools
const developmentTools = {
  // Component render profiling
  profileComponentRender: (componentName, renderFn) => {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();

    console.log(`${componentName} render time: ${endTime - startTime}ms`);
    return result;
  },

  // Bundle size analysis scripts
  analyzeBundleSize: () => {
    console.log('Bundle Analysis Commands:');
    console.log('npm run analyze - Generate bundle analyzer report');
    console.log('npm run bundle-size - Check current bundle sizes');
    console.log('npm run perf-audit - Run Lighthouse performance audit');
  },

  // Performance regression detection
  detectRegressions: (currentMetrics, baselineMetrics) => {
    const regressions = [];

    Object.keys(currentMetrics).forEach(metric => {
      const current = currentMetrics[metric];
      const baseline = baselineMetrics[metric];

      if (baseline && current > baseline * 1.1) { // 10% regression threshold
        regressions.push({
          metric,
          current,
          baseline,
          regression: ((current - baseline) / baseline * 100).toFixed(2) + '%'
        });
      }
    });

    if (regressions.length > 0) {
      console.warn('Performance regressions detected:', regressions);
    }

    return regressions;
  }
};

// Export configuration and utilities
module.exports = {
  fieldServiceWebpackConfig,
  performanceMonitoring,
  optimizationUtils,
  developmentTools
};

// If running in browser environment, initialize performance monitoring
if (typeof window !== 'undefined') {
  // Initialize performance monitoring on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      optimizationUtils.reportPerformanceMetrics();
      setInterval(optimizationUtils.monitorMemoryUsage, 30000); // Every 30 seconds
    });
  } else {
    optimizationUtils.reportPerformanceMetrics();
    setInterval(optimizationUtils.monitorMemoryUsage, 30000);
  }

  // Preload critical resources
  optimizationUtils.preloadCriticalResources();
}

// NPM Scripts for performance optimization
const performanceScripts = {
  "analyze": "ANALYZE_BUNDLE=true npm run build",
  "bundle-size": "npx bundlesize",
  "perf-audit": "lighthouse http://localhost:3000 --only-categories=performance --chrome-flags='--headless'",
  "perf-ci": "lighthouse-ci autorun",
  "size-limit": "npx size-limit",
  "webpack-analyzer": "npx webpack-bundle-analyzer build/static/js/*.js"
};

console.log('Performance optimization configuration loaded');
console.log('Available scripts:', Object.keys(performanceScripts));
