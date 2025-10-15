/**
 * Component Performance Monitoring and Optimization Utilities
 * Provides comprehensive performance monitoring, profiling, and optimization tools
 */

import { memo, useCallback, useState, useEffect, useRef } from 'react';

/**
 * Performance monitoring utilities for field service components
 */
export class ComponentPerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.initialized = false;
  }

  /**
   * Initialize performance monitoring
   */
  init() {
    if (this.initialized) return;

    // Initialize Performance Observer for component render times
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'measure' && entry.name.includes('react-render')) {
            this.recordMetric('render', entry.duration, entry.name);
          }
        });
      });

      observer.observe({ entryTypes: ['measure'] });
      this.observers.push(observer);
    }

    // Memory usage tracking
    this.startMemoryMonitoring();

    // Component lifecycle tracking
    this.startLifecycleMonitoring();

    this.initialized = true;
  }

  /**
   * Record performance metric
   */
  recordMetric(type, value, componentName = 'unknown') {
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }

    this.metrics.get(type).push({
      value,
      componentName,
      timestamp: Date.now()
    });

    // Keep only last 100 entries per type
    if (this.metrics.get(type).length > 100) {
      this.metrics.get(type).shift();
    }
  }

  /**
   * Get performance summary
   */
  getSummary(type = null) {
    if (type) {
      const metrics = this.metrics.get(type) || [];
      return this.calculateStats(metrics);
    }

    const summary = {};
    this.metrics.forEach((values, key) => {
      summary[key] = this.calculateStats(values);
    });

    return summary;
  }

  /**
   * Calculate statistics for metrics
   */
  calculateStats(metrics) {
    if (metrics.length === 0) return null;

    const values = metrics.map(m => m.value);
    values.sort((a, b) => a - b);

    return {
      count: values.length,
      min: values[0],
      max: values[values.length - 1],
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      median: values[Math.floor(values.length / 2)],
      p95: values[Math.floor(values.length * 0.95)] || values[values.length - 1],
      p99: values[Math.floor(values.length * 0.99)] || values[values.length - 1]
    };
  }

  /**
   * Start memory monitoring
   */
  startMemoryMonitoring() {
    if (!('memory' in performance)) return;

    const checkMemory = () => {
      const memInfo = performance.memory;
      this.recordMetric('memory', memInfo.usedJSHeapSize / 1024 / 1024); // MB
    };

    setInterval(checkMemory, 5000); // Every 5 seconds
  }

  /**
   * Start component lifecycle monitoring
   */
  startLifecycleMonitoring() {
    // Monitor React DevTools performance if available
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

      // Track fiber creation and updates
      const originalOnCommitFiberRoot = hook.onCommitFiberRoot;
      hook.onCommitFiberRoot = (id, root, ...args) => {
        const startTime = performance.now();
        const result = originalOnCommitFiberRoot?.(id, root, ...args);
        const endTime = performance.now();

        this.recordMetric('commit', endTime - startTime, `fiber-${id}`);
        return result;
      };
    }
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const summary = this.getSummary();
    const report = {
      timestamp: new Date().toISOString(),
      summary,
      recommendations: this.generateRecommendations(summary)
    };

    return report;
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(summary) {
    const recommendations = [];

    // Render time recommendations
    if (summary.render && summary.render.avg > 16.67) { // 60fps threshold
      recommendations.push({
        type: 'render',
        severity: 'high',
        message: `Average render time (${summary.render.avg.toFixed(2)}ms) exceeds 60fps budget (16.67ms)`,
        suggestions: ['Use React.memo for pure components', 'Implement virtualization for large lists', 'Optimize expensive calculations with useMemo']
      });
    }

    // Memory recommendations
    if (summary.memory && summary.memory.avg > 100) { // 100MB threshold
      recommendations.push({
        type: 'memory',
        severity: 'medium',
        message: `High memory usage detected (${summary.memory.avg.toFixed(2)}MB)`,
        suggestions: ['Check for memory leaks', 'Implement component cleanup', 'Use lazy loading for heavy components']
      });
    }

    // Component lifecycle recommendations
    if (summary.commit && summary.commit.avg > 5) { // 5ms threshold
      recommendations.push({
        type: 'commit',
        severity: 'medium',
        message: `Slow commit phase detected (${summary.commit.avg.toFixed(2)}ms)`,
        suggestions: ['Reduce component tree depth', 'Optimize useEffect dependencies', 'Consider code splitting']
      });
    }

    return recommendations;
  }

  /**
   * Clean up monitoring
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
    this.initialized = false;
  }
}

/**
 * React performance optimization utilities
 */
export const ReactOptimizationUtils = {
  /**
   * Create memoized component with performance tracking
   */
  createMemoizedComponent: (Component, propsAreEqual = null) => {
    const MemoizedComponent = memo(Component, propsAreEqual);

    // Add performance tracking wrapper
    return function PerformanceTrackedComponent(props) {
      const renderStart = useRef(0);
      const componentName = Component.displayName || Component.name;

      useEffect(() => {
        renderStart.current = performance.now();

        return () => {
          const renderTime = performance.now() - renderStart.current;
          window.performanceMonitor?.recordMetric('render', renderTime, componentName);
        };
      });

      return <MemoizedComponent {...props} />;
    };
  },

  /**
   * Create optimized event handler factory
   */
  createOptimizedHandler: (handler, options = {}) => {
    const { throttle: throttleMs, debounce: debounceMs } = options;

    if (throttleMs) {
      return throttle(handler, throttleMs);
    } else if (debounceMs) {
      return debounce(handler, debounceMs);
    }

    return handler;
  },

  /**
   * Memoization helper
   */
  memoizeFunction: (fn, keySelector) => {
    const cache = new Map();
    return (...args) => {
      const key = keySelector ? keySelector(...args) : JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    };
  }
};

/**
 * Component virtualization utilities
 */
export const VirtualizationUtils = {
  /**
   * Calculate visible items for virtual scrolling
   */
  calculateVisibleItems: (scrollTop, itemHeight, containerHeight, totalItems) => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      totalItems
    );

    return {
      startIndex: Math.max(0, startIndex),
      endIndex,
      visibleItems: endIndex - startIndex
    };
  },

  /**
   * Create virtual scroll hook
   */
  useVirtualScroll: (items, itemHeight, containerHeight) => {
    const [scrollTop, setScrollTop] = useState(0);

    const { startIndex, endIndex } = VirtualizationUtils.calculateVisibleItems(
      scrollTop,
      itemHeight,
      containerHeight,
      items.length
    );

    const visibleItems = items.slice(startIndex, endIndex);
    const totalHeight = items.length * itemHeight;
    const offsetY = startIndex * itemHeight;

    const handleScroll = useCallback((e) => {
      setScrollTop(e.target.scrollTop);
    }, []);

    return {
      visibleItems,
      totalHeight,
      offsetY,
      handleScroll
    };
  }
};

/**
 * Bundle size optimization utilities
 */
export const BundleOptimizationUtils = {
  /**
   * Lazy load component with error boundary
   */
  lazyLoadComponent: (importFn, fallback = null) => {
    const LazyComponent = React.lazy(importFn);

    return function LazyComponentWrapper(props) {
      return (
        <React.Suspense fallback={fallback || <div>Loading...</div>}>
          <LazyComponent {...props} />
        </React.Suspense>
      );
    };
  },

  /**
   * Preload component
   */
  preloadComponent: (importFn) => {
    const componentImport = importFn();
    componentImport.catch(error => {
      console.error('Failed to preload component:', error);
    });
    return componentImport;
  },

  /**
   * Dynamic import with retry
   */
  dynamicImportWithRetry: async (importFn, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await importFn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
  }
};

/**
 * Performance testing utilities
 */
export const PerformanceTestUtils = {
  /**
   * Measure component render time
   */
  measureRenderTime: async (renderFn) => {
    const start = performance.now();
    await renderFn();
    const end = performance.now();
    return end - start;
  },

  /**
   * Measure memory usage
   */
  measureMemoryUsage: () => {
    if ('memory' in performance) {
      return {
        used: performance.memory.usedJSHeapSize / 1024 / 1024, // MB
        total: performance.memory.totalJSHeapSize / 1024 / 1024,
        limit: performance.memory.jsHeapSizeLimit / 1024 / 1024
      };
    }
    return null;
  },

  /**
   * Profile component performance
   */
  profileComponent: (Component, testProps = {}, iterations = 10) => {
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const renderTime = PerformanceTestUtils.measureRenderTime(() => {
        // Simulate component render
        const element = React.createElement(Component, testProps);
        return Promise.resolve(element);
      });

      results.push(renderTime);
    }

    return {
      avg: results.reduce((sum, time) => sum + time, 0) / results.length,
      min: Math.min(...results),
      max: Math.max(...results),
      results
    };
  }
};

// Initialize global performance monitor
if (typeof window !== 'undefined' && !window.performanceMonitor) {
  window.performanceMonitor = new ComponentPerformanceMonitor();
  window.performanceMonitor.init();
}

// Utility functions for throttle and debounce
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// All utilities are already exported as named exports above
