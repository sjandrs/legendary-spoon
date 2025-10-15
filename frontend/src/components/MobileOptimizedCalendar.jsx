/**
 * Mobile Calendar Optimization for Field Service Scheduling
 * Enhanced touch interface with gesture support and responsive design
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import {
  MobileGestureUtils,
  MobileViewportUtils,
  MobilePerformanceUtils,
  TouchUtils
} from '../utils/mobile-signature-utils';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './mobile-calendar.css';

const localizer = momentLocalizer(moment);

// Mobile-specific calendar configuration
const MOBILE_CALENDAR_CONFIG = {
  // Touch-friendly event sizing
  eventPropGetter: (event) => ({
    style: {
      backgroundColor: event.color || '#3498db',
      borderRadius: '6px',
      border: 'none',
      color: 'white',
      fontSize: TouchUtils.isTouchDevice() ? '14px' : '12px',
      padding: TouchUtils.isTouchDevice() ? '4px 8px' : '2px 4px',
      minHeight: TouchUtils.isTouchDevice() ? '32px' : '24px'
    }
  }),

  // Mobile-optimized step and time slots
  step: 30,
  timeslots: 2,

  // Touch-friendly minimum event duration
  defaultDate: new Date(),

  // Mobile view configurations
  views: {
    month: true,
    week: true,
    day: true,
    agenda: true
  }
};

// Mobile calendar gesture handlers
const MobileCalendarGestures = {
  // Swipe to navigate between dates
  handleSwipeNavigation: (direction, onNavigate, currentDate, currentView) => {
    const navigate = (action) => {
      const newDate = moment(currentDate);

      switch (currentView) {
        case 'month':
          newDate.add(action === 'NEXT' ? 1 : -1, 'month');
          break;
        case 'week':
          newDate.add(action === 'NEXT' ? 1 : -1, 'week');
          break;
        case 'day':
          newDate.add(action === 'NEXT' ? 1 : -1, 'day');
          break;
        default:
          newDate.add(action === 'NEXT' ? 1 : -1, 'week');
      }

      onNavigate('DATE', newDate.toDate());
    };

    switch (direction) {
      case 'left':
        navigate('NEXT');
        break;
      case 'right':
        navigate('PREV');
        break;
    }
  },

  // Pinch to zoom between views
  handlePinchZoom: (scale, onView) => {
    if (scale > 1.2) {
      // Zoom in - go to more detailed view
      onView('day');
    } else if (scale < 0.8) {
      // Zoom out - go to less detailed view
      onView('month');
    }
  }
};

// Mobile-optimized calendar component
const MobileOptimizedCalendar = memo(({
  events = [],
  onSelectEvent,
  onSelectSlot,
  onEventDrop,
  onEventResize,
  onNavigate,
  onView,
  currentDate = new Date(),
  currentView = 'month'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [calendarHeight, setCalendarHeight] = useState(600);

  // Calculate optimal calendar height for mobile
  useEffect(() => {
    const calculateHeight = () => {
      const viewport = MobileViewportUtils.getSafeAreaDimensions();
      const headerHeight = 60;
      const navigationHeight = 50;
      const margin = 40;

      const availableHeight = viewport.height - viewport.safeAreaTop - viewport.safeAreaBottom - headerHeight - navigationHeight - margin;

      setCalendarHeight(Math.max(400, Math.min(800, availableHeight)));
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    window.addEventListener('orientationchange', calculateHeight);

    return () => {
      window.removeEventListener('resize', calculateHeight);
      window.removeEventListener('orientationchange', calculateHeight);
    };
  }, []);

  // Touch gesture handling
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      setTouchStart({
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
        timeStamp: e.timeStamp
      });
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 1 && touchStart) {
      setTouchEnd({
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
        timeStamp: e.timeStamp
      });
    }
  }, [touchStart]);

  const handleTouchEnd = useCallback((e) => {
    if (!touchStart || !touchEnd) return;

    const swipeDirection = MobileGestureUtils.detectSwipe(touchStart, touchEnd, 50);

    if (swipeDirection && (swipeDirection === 'left' || swipeDirection === 'right')) {
      e.preventDefault();
      MobileCalendarGestures.handleSwipeNavigation(swipeDirection, onNavigate, currentDate, currentView);

      // Haptic feedback for navigation
      if ('vibrate' in navigator) {
        navigator.vibrate(25);
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, onNavigate, currentDate, currentView]);

  // Optimized event selection for touch
  const handleSelectEvent = useCallback((event, syntheticEvent) => {
    // Prevent double-tap zoom on mobile
    if (syntheticEvent) {
      syntheticEvent.preventDefault();
    }

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    onSelectEvent(event, syntheticEvent);
  }, [onSelectEvent]);

  // Optimized slot selection for touch
  const handleSelectSlot = useCallback((slotInfo) => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }

    onSelectSlot(slotInfo);
  }, [onSelectSlot]);

  // Memoized calendar components for performance
  const calendarComponents = useMemo(() => ({
    toolbar: ({ date, view, onNavigate: toolbarNavigate, onView: toolbarView, views }) => (
      <div className="mobile-calendar-toolbar">
        <div className="toolbar-navigation">
          <button
            className="nav-button mobile-nav-button"
            onClick={() => toolbarNavigate('PREV')}
            aria-label={`Previous ${view}`}
          >
            ← Prev
          </button>

          <div className="current-date-display">
            <h3>{moment(date).format(view === 'month' ? 'MMMM YYYY' : 'MMM D, YYYY')}</h3>
          </div>

          <button
            className="nav-button mobile-nav-button"
            onClick={() => toolbarNavigate('NEXT')}
            aria-label={`Next ${view}`}
          >
            Next →
          </button>
        </div>

        <div className="toolbar-views">
          {Object.keys(views).map(viewName => (
            <button
              key={viewName}
              className={`view-button mobile-view-button ${view === viewName ? 'active' : ''}`}
              onClick={() => toolbarView(viewName)}
              aria-pressed={view === viewName}
            >
              {viewName.charAt(0).toUpperCase() + viewName.slice(1)}
            </button>
          ))}
        </div>
      </div>
    ),

    event: ({ event }) => (
      <div className="mobile-calendar-event" title={event.title}>
        <div className="event-title">{event.title}</div>
        {TouchUtils.isTouchDevice() && event.customer && (
          <div className="event-customer">{event.customer}</div>
        )}
      </div>
    )
  }), []);

  // Performance optimization: throttled resize handler
  const throttledEventResize = useMemo(
    () => MobilePerformanceUtils.throttleHighFrequency(onEventResize, 100),
    [onEventResize]
  );

  // Loading state management
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, [events, currentView, currentDate]);

  return (
    <div
      className={`mobile-calendar-container ${TouchUtils.isTouchDevice() ? 'touch-device' : 'mouse-device'}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="calendar-loading-overlay">
          <div className="loading-spinner">Loading...</div>
        </div>
      )}

      {/* Mobile calendar instructions */}
      {TouchUtils.isTouchDevice() && (
        <div className="mobile-calendar-instructions">
          <p>💡 Swipe left/right to navigate • Tap events to view details</p>
        </div>
      )}

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: calendarHeight }}
        date={currentDate}
        view={currentView}
        onNavigate={onNavigate}
        onView={onView}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        onEventDrop={onEventDrop}
        onEventResize={throttledEventResize}
        selectable
        resizable
        components={calendarComponents}
        {...MOBILE_CALENDAR_CONFIG}
      />

      {/* Mobile-specific controls */}
      {TouchUtils.isTouchDevice() && (
        <div className="mobile-calendar-controls">
          <button
            className="mobile-control-button today-button"
            onClick={() => onNavigate('TODAY')}
            aria-label="Go to today"
          >
            📅 Today
          </button>

          <button
            className="mobile-control-button refresh-button"
            onClick={() => window.location.reload()}
            aria-label="Refresh calendar"
          >
            🔄 Refresh
          </button>
        </div>
      )}

      {/* Accessibility announcements */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {isLoading ? 'Calendar is loading' : `Calendar showing ${currentView} view for ${moment(currentDate).format('MMMM YYYY')}`}
      </div>
    </div>
  );
});

MobileOptimizedCalendar.displayName = 'MobileOptimizedCalendar';

export default MobileOptimizedCalendar;
