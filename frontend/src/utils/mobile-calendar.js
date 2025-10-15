/**
 * Mobile Calendar Utilities for Field Service Scheduling
 * Enhanced touch interaction and mobile-specific calendar operations
 */

// Mobile calendar event management
export const MobileCalendarUtils = {
  // Format events for mobile display
  formatEventsForMobile: (events) => {
    return events.map(event => ({
      ...event,
      title: MobileCalendarUtils.truncateEventTitle(event.title, 25),
      color: MobileCalendarUtils.getEventColor(event.status),
      textColor: MobileCalendarUtils.getTextColor(event.status),
      // Add mobile-specific properties
      isMobileOptimized: true,
      touchPriority: MobileCalendarUtils.getTouchPriority(event.priority),
      displayDuration: MobileCalendarUtils.calculateDisplayDuration(event.start, event.end)
    }));
  },

  // Truncate event titles for mobile display
  truncateEventTitle: (title, maxLength = 25) => {
    if (!title) return '';
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength - 3) + '...';
  },

  // Get event color based on status
  getEventColor: (status) => {
    const colors = {
      'scheduled': '#3498db',
      'in_progress': '#f39c12',
      'completed': '#27ae60',
      'cancelled': '#e74c3c',
      'rescheduled': '#9b59b6',
      'pending': '#95a5a6'
    };
    return colors[status] || colors['scheduled'];
  },

  // Get text color for readability
  getTextColor: (status) => {
    const lightStatuses = ['scheduled', 'completed', 'cancelled', 'rescheduled'];
    return lightStatuses.includes(status) ? '#ffffff' : '#2c3e50';
  },

  // Determine touch priority for mobile interactions
  getTouchPriority: (priority) => {
    const priorities = {
      'urgent': 10,
      'high': 8,
      'medium': 5,
      'low': 2
    };
    return priorities[priority] || 5;
  },

  // Calculate display duration for mobile labels
  calculateDisplayDuration: (start, end) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffMs = endTime - startTime;
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMins = Math.round(diffMs / (1000 * 60));
      return `${diffMins}min`;
    } else if (diffHours === 1) {
      return '1hr';
    } else {
      return `${diffHours}hrs`;
    }
  }
};

// Mobile touch interaction handlers
export const MobileTouchHandlers = {
  // Enhanced event selection for mobile
  handleMobileEventSelect: (event, callback) => {
    // Provide haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // Add visual feedback
    const element = event.el;
    if (element) {
      element.classList.add('mobile-event-selected');
      setTimeout(() => {
        element.classList.remove('mobile-event-selected');
      }, 200);
    }

    callback(event);
  },

  // Mobile-optimized drag start
  handleMobileDragStart: (event, callback) => {
    // Stronger haptic feedback for drag operations
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 25, 50]);
    }

    // Add drag state to body for global styling
    document.body.classList.add('mobile-dragging');

    callback(event);
  },

  // Mobile drag end with feedback
  handleMobileDragEnd: (event, callback) => {
    // Remove drag state
    document.body.classList.remove('mobile-dragging');

    // Success haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(75);
    }

    callback(event);
  },

  // Long press handler for mobile context menu
  handleLongPress: (element, callback, duration = 500) => {
    let timer;
    let startPos = { x: 0, y: 0 };
    let moved = false;

    const startHandler = (e) => {
      const touch = e.touches ? e.touches[0] : e;
      startPos = { x: touch.clientX, y: touch.clientY };
      moved = false;

      timer = setTimeout(() => {
        if (!moved) {
          // Haptic feedback for long press
          if ('vibrate' in navigator) {
            navigator.vibrate(100);
          }
          callback(e);
        }
      }, duration);
    };

    const moveHandler = (e) => {
      const touch = e.touches ? e.touches[0] : e;
      const deltaX = Math.abs(touch.clientX - startPos.x);
      const deltaY = Math.abs(touch.clientY - startPos.y);

      if (deltaX > 10 || deltaY > 10) {
        moved = true;
        clearTimeout(timer);
      }
    };

    const endHandler = () => {
      clearTimeout(timer);
    };

    element.addEventListener('touchstart', startHandler, { passive: false });
    element.addEventListener('mousedown', startHandler);
    element.addEventListener('touchmove', moveHandler, { passive: false });
    element.addEventListener('mousemove', moveHandler);
    element.addEventListener('touchend', endHandler);
    element.addEventListener('mouseup', endHandler);
    element.addEventListener('contextmenu', (e) => e.preventDefault());

    // Return cleanup function
    return () => {
      element.removeEventListener('touchstart', startHandler);
      element.removeEventListener('mousedown', startHandler);
      element.removeEventListener('touchmove', moveHandler);
      element.removeEventListener('mousemove', moveHandler);
      element.removeEventListener('touchend', endHandler);
      element.removeEventListener('mouseup', endHandler);
      clearTimeout(timer);
    };
  }
};

// Mobile calendar view optimization
export const MobileViewOptimizer = {
  // Get optimal view for mobile screen size
  getOptimalView: (screenWidth, screenHeight) => {
    const aspectRatio = screenWidth / screenHeight;

    if (screenWidth < 480) {
      return 'listWeek'; // Use list view for very small screens
    } else if (aspectRatio > 1.5) {
      return 'timeGridWeek'; // Landscape - use week view
    } else {
      return 'dayGridMonth'; // Portrait - use month view
    }
  },

  // Calculate optimal event height for touch targets
  getOptimalEventHeight: (screenSize) => {
    if (screenSize === 'small') {
      return 32; // Minimum touch target size
    } else if (screenSize === 'medium') {
      return 40;
    } else {
      return 48; // Comfortable touch target
    }
  },

  // Adjust calendar height for mobile keyboards
  adjustForKeyboard: (isKeyboardVisible) => {
    const calendar = document.querySelector('.fc');
    if (calendar) {
      if (isKeyboardVisible) {
        calendar.style.height = '50vh';
        calendar.style.maxHeight = '400px';
      } else {
        calendar.style.height = 'auto';
        calendar.style.maxHeight = 'none';
      }
    }
  },

  // Optimize scroll performance for mobile
  optimizeScrollPerformance: (element) => {
    element.style.willChange = 'transform';
    element.style.transform = 'translateZ(0)'; // Force hardware acceleration

    // Add momentum scrolling for iOS
    element.style.webkitOverflowScrolling = 'touch';

    return () => {
      element.style.willChange = 'auto';
      element.style.transform = 'none';
    };
  }
};

// Mobile calendar accessibility
export const MobileAccessibilityUtils = {
  // Enhance calendar accessibility for mobile screen readers
  enhanceCalendarAccessibility: (calendarElement) => {
    // Add mobile-specific ARIA labels
    const events = calendarElement.querySelectorAll('.fc-event');
    events.forEach(event => {
      const title = event.querySelector('.fc-event-title')?.textContent;
      const time = event.querySelector('.fc-event-time')?.textContent;

      if (title && time) {
        event.setAttribute('aria-label', `${title} at ${time}. Double-tap to view details.`);
      }
    });

    // Add swipe instructions for mobile users
    const toolbar = calendarElement.querySelector('.fc-toolbar');
    if (toolbar) {
      const instructions = document.createElement('div');
      instructions.className = 'mobile-calendar-instructions';
      instructions.setAttribute('aria-live', 'polite');
      instructions.textContent = 'Swipe left or right to navigate between time periods. Double-tap events to view details.';
      toolbar.appendChild(instructions);
    }
  },

  // Announce calendar navigation changes
  announceNavigation: (view, date) => {
    const announcement = `Calendar view changed to ${view} for ${date.toLocaleDateString()}`;
    const announcer = MobileAccessibilityUtils.getAnnouncer();
    announcer.textContent = announcement;
  },

  // Get or create screen reader announcer
  getAnnouncer: () => {
    let announcer = document.querySelector('#mobile-calendar-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'mobile-calendar-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
    }
    return announcer;
  },

  // Add touch instructions for complex interactions
  addTouchInstructions: (element, instruction) => {
    element.setAttribute('data-touch-instruction', instruction);
    element.addEventListener('focus', () => {
      const announcer = MobileAccessibilityUtils.getAnnouncer();
      announcer.textContent = instruction;
    });
  }
};

// Mobile calendar performance optimization
export const MobilePerformanceOptimizer = {
  // Virtualize large event lists for better mobile performance
  virtualizeEventList: (events, viewportHeight, itemHeight = 60) => {
    const visibleCount = Math.ceil(viewportHeight / itemHeight) + 2; // Buffer

    return {
      totalHeight: events.length * itemHeight,
      getVisibleEvents: (scrollTop) => {
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(startIndex + visibleCount, events.length);

        return events.slice(startIndex, endIndex).map((event, index) => ({
          ...event,
          virtualIndex: startIndex + index,
          virtualOffset: (startIndex + index) * itemHeight
        }));
      }
    };
  },

  // Throttle high-frequency mobile events
  throttleMobileEvents: (func, delay = 16) => {
    let timeoutId;
    let lastExecTime = 0;

    return function(...args) {
      const currentTime = Date.now();

      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  },

  // Optimize image loading for mobile calendar events
  lazyLoadEventImages: (container) => {
    const images = container.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px' // Load images 50px before they come into view
    });

    images.forEach(img => imageObserver.observe(img));

    return () => imageObserver.disconnect();
  },

  // Memory management for mobile devices
  cleanupCalendarMemory: () => {
    // Remove event listeners
    document.body.classList.remove('mobile-dragging');

    // Clear any stored references
    if (window.mobileCalendarCache) {
      window.mobileCalendarCache.clear();
    }

    // Force garbage collection hint
    if (window.gc && typeof window.gc === 'function') {
      window.gc();
    }
  }
};

// Mobile calendar integration helpers
export const MobileIntegrationHelpers = {
  // Initialize mobile calendar optimizations
  initializeMobileCalendar: (calendarRef, options = {}) => {
    const calendar = calendarRef.current;
    if (!calendar || !('ontouchstart' in window)) {
      return null; // Not a touch device
    }

    const cleanupFunctions = [];

    // Apply mobile optimizations
    const performanceCleanup = MobileViewOptimizer.optimizeScrollPerformance(calendar);
    cleanupFunctions.push(performanceCleanup);

    // Enhance accessibility
    MobileAccessibilityUtils.enhanceCalendarAccessibility(calendar);

    // Add touch instructions
    const events = calendar.querySelectorAll('.fc-event');
    events.forEach(event => {
      MobileAccessibilityUtils.addTouchInstructions(
        event,
        'Double-tap to open, long-press for options'
      );
    });

    // Setup lazy loading if enabled
    if (options.lazyLoading) {
      const lazyCleanup = MobilePerformanceOptimizer.lazyLoadEventImages(calendar);
      cleanupFunctions.push(lazyCleanup);
    }

    // Return combined cleanup function
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
      MobilePerformanceOptimizer.cleanupCalendarMemory();
    };
  },

  // Check if device needs mobile optimizations
  needsMobileOptimizations: () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  // Get mobile device capabilities
  getMobileCapabilities: () => {
    return {
      hasTouch: 'ontouchstart' in window,
      hasVibration: 'vibrate' in navigator,
      hasOrientationAPI: 'orientation' in window || 'onorientationchange' in window,
      hasIntersectionObserver: 'IntersectionObserver' in window,
      hasPerformanceObserver: 'PerformanceObserver' in window,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      deviceMemory: navigator.deviceMemory || 'unknown',
      connectionType: navigator.connection?.effectiveType || 'unknown'
    };
  }
};
