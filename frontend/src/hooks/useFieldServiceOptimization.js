/**
 * Field Service Performance Optimization Hooks
 * Custom React hooks for optimizing field service component performance
 */

import {
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
  memo,
  startTransition,
  useDeferredValue
} from 'react';

// Utility functions to replace lodash-es
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

/**
 * Performance-optimized hook for managing field service data with virtualization
 */
export const useFieldServiceOptimization = (data, options = {}) => {
  const {
    itemsPerPage = 50,
    enableVirtualization = true,
    debounceMs = 300,
    throttleMs = 100
  } = options;

  // Virtualized data state
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: itemsPerPage });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Performance tracking
  const renderStartTime = useRef(0);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 0,
    filterTime: 0,
    sortTime: 0,
    memoryUsage: 0
  });

  // Deferred values for performance optimization
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredSortConfig = useDeferredValue(sortConfig);

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    const filterStart = performance.now();

    let filtered = data;

    // Apply search filter
    if (deferredSearchQuery) {
      filtered = data.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(deferredSearchQuery.toLowerCase())
        )
      );
    }

    const filterEnd = performance.now();

    // Apply sorting
    const sortStart = performance.now();
    if (deferredSortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[deferredSortConfig.key];
        const bVal = b[deferredSortConfig.key];

        if (deferredSortConfig.direction === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
      });
    }
    const sortEnd = performance.now();

    // Update performance metrics
    setPerformanceMetrics(prev => ({
      ...prev,
      filterTime: filterEnd - filterStart,
      sortTime: sortEnd - sortStart
    }));

    return filtered;
  }, [data, deferredSearchQuery, deferredSortConfig]);

  // Virtualized visible data
  const visibleData = useMemo(() => {
    if (!enableVirtualization) return processedData;

    return processedData.slice(visibleRange.start, visibleRange.end);
  }, [processedData, visibleRange, enableVirtualization]);

  // Debounced search handler
  const debouncedSetSearch = useCallback((query) => {
    const debouncedFn = debounce(() => {
      startTransition(() => {
        setSearchQuery(query);
      });
    }, debounceMs);
    debouncedFn();
  }, [debounceMs]);

  // Throttled scroll handler for virtualization
  const throttledScrollHandler = useCallback((scrollTop, itemHeight, containerHeight) => {
    const throttledFn = throttle(() => {
      if (!enableVirtualization) return;

      const startIndex = Math.floor(scrollTop / itemHeight);
      const visibleCount = Math.ceil(containerHeight / itemHeight);
      const endIndex = Math.min(startIndex + visibleCount + 5, processedData.length); // 5 item buffer

      setVisibleRange({ start: startIndex, end: endIndex });
    }, throttleMs);
    throttledFn();
  }, [processedData.length, enableVirtualization, throttleMs]);

  // Sort handler
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Performance monitoring
  useEffect(() => {
    renderStartTime.current = performance.now();

    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      setPerformanceMetrics(prev => ({
        ...prev,
        renderTime
      }));
    };
  });

  // Memory usage monitoring
  useEffect(() => {
    if ('memory' in performance) {
      const updateMemoryUsage = () => {
        setPerformanceMetrics(prev => ({
          ...prev,
          memoryUsage: performance.memory.usedJSHeapSize / 1024 / 1024 // MB
        }));
      };

      const interval = setInterval(updateMemoryUsage, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  return {
    visibleData,
    totalCount: processedData.length,
    visibleRange,
    searchQuery,
    sortConfig,
    performanceMetrics,
    handlers: {
      search: debouncedSetSearch,
      scroll: throttledScrollHandler,
      sort: handleSort,
      setVisibleRange
    }
  };
};

/**
 * Hook for optimizing calendar component performance
 */
export const useCalendarOptimization = (events, options = {}) => {
  const {
    maxVisibleEvents = 1000,
    chunkSize = 100
  } = options;

  const [visibleDateRange, setVisibleDateRange] = useState(null);
  const [eventChunks, setEventChunks] = useState([]);
  const [loadedChunks, setLoadedChunks] = useState(new Set());

  // Memoized filtered events based on visible date range
  const visibleEvents = useMemo(() => {
    if (!visibleDateRange) return events.slice(0, maxVisibleEvents);

    const { start, end } = visibleDateRange;
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end || event.start);

      return (eventStart >= start && eventStart <= end) ||
             (eventEnd >= start && eventEnd <= end) ||
             (eventStart <= start && eventEnd >= end);
    }).slice(0, maxVisibleEvents);
  }, [events, visibleDateRange, maxVisibleEvents]);

  // Event chunking for progressive loading
  useEffect(() => {
    const chunks = [];
    for (let i = 0; i < events.length; i += chunkSize) {
      chunks.push(events.slice(i, i + chunkSize));
    }
    setEventChunks(chunks);
    setLoadedChunks(new Set([0])); // Load first chunk by default
  }, [events, chunkSize]);

  // Progressive chunk loading
  const loadChunk = useCallback((chunkIndex) => {
    setLoadedChunks(prev => new Set([...prev, chunkIndex]));
  }, []);

  // Calendar navigation handler with performance optimization
  const handleDateRangeChange = useCallback((start, end) => {
    startTransition(() => {
      setVisibleDateRange({ start, end });
    });
  }, []);

  return {
    visibleEvents,
    eventChunks,
    loadedChunks,
    handlers: {
      loadChunk,
      setDateRange: handleDateRangeChange
    }
  };
};

/**
 * Hook for optimizing chart rendering performance
 */
export const useChartOptimization = (data, chartType, options = {}) => {
  const {
    maxDataPoints = 100,
    enableDataSampling = true,
    animationDuration = 0 // Disable animations for performance
  } = options;

  const canvasRef = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  // Intersection observer for lazy chart rendering
  useEffect(() => {
    if (!canvasRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);

  // Optimized data processing
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return data;

    let processed = data;

    // Data sampling for performance
    if (enableDataSampling && data.length > maxDataPoints) {
      const step = Math.ceil(data.length / maxDataPoints);
      processed = data.filter((_, index) => index % step === 0);
    }

    return processed;
  }, [data, maxDataPoints, enableDataSampling]);

  // Chart configuration optimized for performance
  const chartConfig = useMemo(() => ({
    type: chartType,
    data: processedData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: animationDuration
      },
      elements: {
        point: {
          radius: 0 // Remove points for better performance
        }
      },
      scales: {
        x: {
          display: true,
          ticks: {
            maxTicksLimit: 10 // Limit tick count
          }
        },
        y: {
          display: true,
          ticks: {
            maxTicksLimit: 8
          }
        }
      },
      plugins: {
        legend: {
          display: processedData.datasets?.length > 1
        },
        tooltip: {
          enabled: processedData.length < 1000 // Disable tooltips for large datasets
        }
      }
    }
  }), [chartType, processedData, animationDuration]);

  return {
    canvasRef,
    chartConfig,
    shouldRender: isIntersecting,
    dataPointCount: processedData?.length || 0
  };
};

/**
 * Hook for optimizing signature pad performance
 */
export const useSignatureOptimization = (options = {}) => {
  const {
    throttleMs = 16, // 60fps
    enablePressureSensitivity = true
  } = options;

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeData, setStrokeData] = useState([]);

  // Throttled drawing handler for performance
  const throttledDraw = useCallback((point) => {
    const throttledFn = throttle(() => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Optimize drawing performance
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'source-over';

      if (enablePressureSensitivity && point.pressure) {
        ctx.lineWidth = point.pressure * 3;
      } else {
        ctx.lineWidth = 2;
      }

      ctx.lineTo(point.x, point.y);
      ctx.stroke();

      // Store stroke data for undo/redo
      setStrokeData(prev => [...prev, point]);
    }, throttleMs);
    throttledFn();
  }, [throttleMs, enablePressureSensitivity]);

  // Optimized clear function
  const clearSignature = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokeData([]);
  }, []);

  // Convert to data URL with compression
  const getSignatureData = useCallback((quality = 0.8) => {
    if (!canvasRef.current) return null;

    return canvasRef.current.toDataURL('image/jpeg', quality);
  }, []);

  return {
    canvasRef,
    isDrawing,
    strokeData,
    handlers: {
      draw: throttledDraw,
      clear: clearSignature,
      getData: getSignatureData,
      setDrawing: setIsDrawing
    }
  };
};

/**
 * Hook for form performance optimization
 */
export const useFormOptimization = (initialValues, validationSchema) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Debounced validation
  const debouncedValidation = useCallback(async (fieldValues) => {
    const debouncedFn = debounce(async () => {
      try {
        await validationSchema.validate(fieldValues, { abortEarly: false });
        setErrors({});
      } catch (validationError) {
        const newErrors = {};
        validationError.inner.forEach(error => {
          newErrors[error.path] = error.message;
        });
        setErrors(newErrors);
      }
    }, 300);
    debouncedFn();
  }, [validationSchema]);

  // Optimized field change handler
  const handleFieldChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));

    // Only validate if field has been touched
    if (touched[name]) {
      debouncedValidation({ ...values, [name]: value });
    }
  }, [values, touched, debouncedValidation]);

  // Optimized blur handler
  const handleFieldBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    debouncedValidation(values);
  }, [values, debouncedValidation]);

  return {
    values,
    errors,
    touched,
    handlers: {
      change: handleFieldChange,
      blur: handleFieldBlur
    }
  };
};

/**
 * High-order component for performance optimization
 */
export const withPerformanceOptimization = (WrappedComponent, options = {}) => {
  const {
    enableProfiling = false,
    memoryThreshold = 100 // MB
  } = options;

  return memo((props) => {
    const startTime = useRef(0);
    const [renderCount, setRenderCount] = useState(0);

    useEffect(() => {
      setRenderCount(prev => prev + 1);

      if (enableProfiling) {
        startTime.current = performance.now();

        return () => {
          const renderTime = performance.now() - startTime.current;
          console.log(`${WrappedComponent.name} render #${renderCount}: ${renderTime.toFixed(2)}ms`);
        };
      }
    }, [renderCount]);

    // Memory usage monitoring
    useEffect(() => {
      if ('memory' in performance) {
        const checkMemory = () => {
          const usedMB = performance.memory.usedJSHeapSize / 1024 / 1024;
          if (usedMB > memoryThreshold) {
            console.warn(`${WrappedComponent.name} high memory usage: ${usedMB.toFixed(2)}MB`);
          }
        };

        const interval = setInterval(checkMemory, 10000);
        return () => clearInterval(interval);
      }
    }, []);

    return <WrappedComponent {...props} />;
  });
};

export default {
  useFieldServiceOptimization,
  useCalendarOptimization,
  useChartOptimization,
  useSignatureOptimization,
  useFormOptimization,
  withPerformanceOptimization
};
