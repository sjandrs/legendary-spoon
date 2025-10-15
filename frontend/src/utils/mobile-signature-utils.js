/**
 * Touch Utilities and Configuration for Mobile Field Service Components
 * Shared constants and utilities for mobile-optimized signature capture
 */

// Mobile signature configuration
export const MOBILE_SIGNATURE_CONFIG = {
  canvasProps: {
    width: Math.min(window.innerWidth - 40, 400),
    height: Math.min(window.innerHeight * 0.4, 200),
    className: 'signature-canvas mobile-optimized'
  },

  // Touch sensitivity settings for mobile
  touchSettings: {
    minWidth: 1.5,      // Minimum stroke width for light touches
    maxWidth: 4.0,      // Maximum stroke width for heavy touches
    throttle: 8,        // 120fps for smooth mobile drawing
    velocityFilterWeight: 0.1,
    smoothing: 0.8
  },

  // Mobile-specific drawing options
  mobileOptions: {
    dotSize: 2.0,
    penColor: '#000000',
    backgroundColor: '#ffffff',
    onBegin: null,
    onEnd: null
  }
};

// Touch event utilities for mobile signature capture
export const TouchUtils = {
  // Detect if device supports touch
  isTouchDevice: () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  // Get touch pressure if available
  getTouchPressure: (event) => {
    if (event.touches && event.touches[0] && 'force' in event.touches[0]) {
      return event.touches[0].force;
    }
    // Fallback for devices without pressure sensitivity
    return 0.5;
  },

  // Prevent scroll during signature capture
  preventScrolling: (element) => {
    const preventTouch = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    element.addEventListener('touchstart', preventTouch, { passive: false });
    element.addEventListener('touchmove', preventTouch, { passive: false });

    return () => {
      element.removeEventListener('touchstart', preventTouch);
      element.removeEventListener('touchmove', preventTouch);
    };
  },

  // Optimize canvas for mobile rendering
  optimizeCanvas: (canvas) => {
    const ctx = canvas.getContext('2d');

    // Enable hardware acceleration on mobile
    ctx.willReadFrequently = false;

    // Optimize for touch input
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.imageSmoothingEnabled = true;

    return ctx;
  }
};

// Mobile gesture detection utilities
export const MobileGestureUtils = {
  // Detect swipe gestures
  detectSwipe: (startTouch, endTouch, minDistance = 50) => {
    const deltaX = endTouch.clientX - startTouch.clientX;
    const deltaY = endTouch.clientY - startTouch.clientY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < minDistance) return null;

    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

    if (angle >= -45 && angle <= 45) return 'right';
    if (angle >= 45 && angle <= 135) return 'down';
    if (angle >= 135 || angle <= -135) return 'left';
    if (angle >= -135 && angle <= -45) return 'up';

    return null;
  },

  // Detect pinch zoom gestures
  detectPinch: (touch1, touch2, prevTouch1, prevTouch2) => {
    const currentDistance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    const previousDistance = Math.sqrt(
      Math.pow(prevTouch2.clientX - prevTouch1.clientX, 2) +
      Math.pow(prevTouch2.clientY - prevTouch1.clientY, 2)
    );

    return {
      scale: currentDistance / previousDistance,
      center: {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      }
    };
  },

  // Debounce touch events
  debounceTouchEvent: (func, delay = 16) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }
};

// Mobile viewport utilities
export const MobileViewportUtils = {
  // Get safe area dimensions
  getSafeAreaDimensions: () => {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      safeAreaTop: parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--sat') || '0', 10),
      safeAreaBottom: parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--sab') || '0', 10),
      safeAreaLeft: parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--sal') || '0', 10),
      safeAreaRight: parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--sar') || '0', 10)
    };
  },

  // Check if device is in landscape mode
  isLandscape: () => {
    return window.innerWidth > window.innerHeight;
  },

  // Get optimal signature canvas size for device
  getOptimalCanvasSize: () => {
    const { width, height } = MobileViewportUtils.getSafeAreaDimensions();
    const isLandscape = MobileViewportUtils.isLandscape();

    if (isLandscape) {
      return {
        width: Math.min(width * 0.6, 500),
        height: Math.min(height * 0.5, 250)
      };
    } else {
      return {
        width: Math.min(width - 40, 400),
        height: Math.min(height * 0.3, 200)
      };
    }
  }
};

// Mobile performance optimization utilities
export const MobilePerformanceUtils = {
  // Request animation frame with fallback
  requestAnimationFrame: (_callback) => {
    return window.requestAnimationFrame ||
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           ((cb) => setTimeout(cb, 1000 / 60));
  },

  // Optimize canvas rendering for mobile
  optimizeCanvasForMobile: (canvas) => {
    const ctx = canvas.getContext('2d');

    // Disable anti-aliasing for better performance on low-end devices
    ctx.imageSmoothingEnabled = false;

    // Use hardware acceleration
    if ('webkitBackingStorePixelRatio' in ctx) {
      ctx.webkitBackingStorePixelRatio = 1;
    }

    return ctx;
  },

  // Throttle high-frequency events
  throttleHighFrequency: (func, limit = 16) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};
