/**
 * Test Performance Monitoring
 * Tracks test execution times and detects performance regressions
 */

class TestPerformanceMonitor {
  constructor(options = {}) {
    this.slowTestThreshold = options.slowTestThreshold || 5000; // 5 seconds
    this.performanceLog = [];
    this.startTimes = new Map();
    this.enabled = options.enabled !== false;
  }

  /**
   * Starts timing a test
   * @param {string} testName - Name of the test
   */
  startTest(testName) {
    if (!this.enabled) return;

    this.startTimes.set(testName, performance.now());
  }

  /**
   * Ends timing a test and logs performance
   * @param {string} testName - Name of the test
   * @param {boolean} passed - Whether the test passed
   */
  endTest(testName, passed = true) {
    if (!this.enabled) return;

    const startTime = this.startTimes.get(testName);
    if (!startTime) {
      console.warn(`No start time recorded for test: ${testName}`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    const testResult = {
      name: testName,
      duration: duration,
      passed: passed,
      timestamp: new Date().toISOString(),
      isSlow: duration > this.slowTestThreshold
    };

    this.performanceLog.push(testResult);
    this.startTimes.delete(testName);

    // Log slow tests immediately
    if (testResult.isSlow) {
      console.warn(
        `🐌 Slow test detected: ${testName} took ${duration.toFixed(2)}ms (threshold: ${this.slowTestThreshold}ms)`
      );
    }

    // Log performance for all tests in development
    if (process.env.NODE_ENV === 'development' || process.env.VERBOSE_TESTS) {
      console.log(
        `${passed ? '✅' : '❌'} ${testName}: ${duration.toFixed(2)}ms`
      );
    }
  }

  /**
   * Wraps a test function with performance monitoring
   * @param {string} testName - Name of the test
   * @param {Function} testFunction - Test function to wrap
   * @returns {Function} - Wrapped test function
   */
  wrapTest(testName, testFunction) {
    if (!this.enabled) return testFunction;

    return async (...args) => {
      this.startTest(testName);

      try {
        const result = await testFunction(...args);
        this.endTest(testName, true);
        return result;
      } catch (error) {
        this.endTest(testName, false);
        throw error;
      }
    };
  }

  /**
   * Gets performance statistics
   * @returns {Object} - Performance statistics
   */
  getStats() {
    if (this.performanceLog.length === 0) {
      return {
        totalTests: 0,
        averageDuration: 0,
        slowTests: [],
        totalDuration: 0
      };
    }

    const totalDuration = this.performanceLog.reduce((sum, test) => sum + test.duration, 0);
    const averageDuration = totalDuration / this.performanceLog.length;
    const slowTests = this.performanceLog.filter(test => test.isSlow);
    const passedTests = this.performanceLog.filter(test => test.passed);
    const failedTests = this.performanceLog.filter(test => !test.passed);

    return {
      totalTests: this.performanceLog.length,
      passedTests: passedTests.length,
      failedTests: failedTests.length,
      averageDuration: averageDuration,
      totalDuration: totalDuration,
      slowTests: slowTests.length,
      slowestTest: this.performanceLog.reduce((slowest, current) =>
        current.duration > slowest.duration ? current : slowest
      ),
      fastestTest: this.performanceLog.reduce((fastest, current) =>
        current.duration < fastest.duration ? current : fastest
      ),
      performanceLog: this.performanceLog
    };
  }

  /**
   * Prints performance report to console
   */
  printReport() {
    const stats = this.getStats();

    console.log('\n📊 Test Performance Report:');
    console.log(`Total Tests: ${stats.totalTests}`);
    console.log(`Passed: ${stats.passedTests}, Failed: ${stats.failedTests}`);
    console.log(`Average Duration: ${stats.averageDuration.toFixed(2)}ms`);
    console.log(`Total Duration: ${stats.totalDuration.toFixed(2)}ms`);
    console.log(`Slow Tests (>${this.slowTestThreshold}ms): ${stats.slowTests}`);

    if (stats.slowestTest) {
      console.log(`Slowest Test: ${stats.slowestTest.name} (${stats.slowestTest.duration.toFixed(2)}ms)`);
    }

    if (stats.fastestTest) {
      console.log(`Fastest Test: ${stats.fastestTest.name} (${stats.fastestTest.duration.toFixed(2)}ms)`);
    }

    if (stats.slowTests > 0) {
      console.log('\n🐌 Slow Tests:');
      stats.performanceLog
        .filter(test => test.isSlow)
        .sort((a, b) => b.duration - a.duration)
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.duration.toFixed(2)}ms`);
        });
    }
  }

  /**
   * Exports performance data for analysis
   * @returns {Object} - Exportable performance data
   */
  exportData() {
    return {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        testEnv: process.env.TEST_ENV,
        ci: !!process.env.CI
      },
      configuration: {
        slowTestThreshold: this.slowTestThreshold,
        enabled: this.enabled
      },
      stats: this.getStats()
    };
  }

  /**
   * Compares current performance with baseline
   * @param {Object} baseline - Baseline performance data
   * @returns {Object} - Performance comparison
   */
  compareWithBaseline(baseline) {
    const currentStats = this.getStats();

    if (!baseline || !baseline.stats) {
      return {
        hasBaseline: false,
        message: 'No baseline data available for comparison'
      };
    }

    const baselineStats = baseline.stats;
    const avgDurationChange = currentStats.averageDuration - baselineStats.averageDuration;
    const avgDurationChangePercent = (avgDurationChange / baselineStats.averageDuration) * 100;

    const totalDurationChange = currentStats.totalDuration - baselineStats.totalDuration;
    const totalDurationChangePercent = (totalDurationChange / baselineStats.totalDuration) * 100;

    const slowTestsChange = currentStats.slowTests - baselineStats.slowTests;

    return {
      hasBaseline: true,
      comparison: {
        averageDuration: {
          current: currentStats.averageDuration,
          baseline: baselineStats.averageDuration,
          change: avgDurationChange,
          changePercent: avgDurationChangePercent,
          isRegression: avgDurationChangePercent > 20 // 20% regression threshold
        },
        totalDuration: {
          current: currentStats.totalDuration,
          baseline: baselineStats.totalDuration,
          change: totalDurationChange,
          changePercent: totalDurationChangePercent,
          isRegression: totalDurationChangePercent > 20
        },
        slowTests: {
          current: currentStats.slowTests,
          baseline: baselineStats.slowTests,
          change: slowTestsChange,
          isRegression: slowTestsChange > 0
        }
      }
    };
  }

  /**
   * Resets performance data
   */
  reset() {
    this.performanceLog = [];
    this.startTimes.clear();
  }

  /**
   * Sets up automatic monitoring for Jest tests
   */
  setupJestIntegration() {
    if (!this.enabled) return;

    // Jest setup hooks
    beforeEach(() => {
      const testName = expect.getState().currentTestName || 'unknown-test';
      this.startTest(testName);
    });

    afterEach(() => {
      const testName = expect.getState().currentTestName || 'unknown-test';
      const testPassed = !expect.getState().testPath || true; // Simplified - real implementation would check test result
      this.endTest(testName, testPassed);
    });

    afterAll(() => {
      if (process.env.PRINT_PERFORMANCE_REPORT) {
        this.printReport();
      }
    });
  }
}

// Global instance
const performanceMonitor = new TestPerformanceMonitor({
  enabled: process.env.ENABLE_PERFORMANCE_MONITORING !== 'false',
  slowTestThreshold: parseInt(process.env.SLOW_TEST_THRESHOLD) || 5000
});

/**
 * Higher-order function to wrap tests with performance monitoring
 * @param {string} testName - Name of the test
 * @param {Function} testFunction - Test function
 * @returns {Function} - Wrapped test function
 */
export const withPerformanceMonitoring = (testName, testFunction) => {
  return performanceMonitor.wrapTest(testName, testFunction);
};

/**
 * Decorator for performance monitoring
 * @param {string} testName - Name of the test
 * @returns {Function} - Decorator function
 */
export const performanceTest = (testName) => (target, propertyName, descriptor) => {
  const originalMethod = descriptor.value;
  descriptor.value = performanceMonitor.wrapTest(testName, originalMethod);
  return descriptor;
};

/**
 * Gets the global performance monitor instance
 * @returns {TestPerformanceMonitor} - Performance monitor instance
 */
export const getPerformanceMonitor = () => performanceMonitor;

// Jest integration
if (typeof jest !== 'undefined') {
  performanceMonitor.setupJestIntegration();
}

export default TestPerformanceMonitor;
