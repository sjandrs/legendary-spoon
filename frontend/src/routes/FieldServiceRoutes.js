/**
 * Performance Optimized Field Service Routes with Code Splitting
 * Implements lazy loading and code splitting for all field service components
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';

// Lazy load field service components for better performance
const SchedulePage = lazy(() =>
  import('../components/SchedulePage').then(module => ({
    default: module.default
  })).catch(error => {
    console.error('Failed to load SchedulePage:', error);
    return { default: () => <div>Failed to load Schedule component</div> };
  })
);

const PaperworkTemplateManager = lazy(() =>
  import('../components/PaperworkTemplateManager').then(module => ({
    default: module.default
  })).catch(error => {
    console.error('Failed to load PaperworkTemplateManager:', error);
    return { default: () => <div>Failed to load Paperwork Template component</div> };
  })
);

const CustomerPortal = lazy(() =>
  import('../components/CustomerPortal').then(module => ({
    default: module.default
  })).catch(error => {
    console.error('Failed to load CustomerPortal:', error);
    return { default: () => <div>Failed to load Customer Portal component</div> };
  })
);

const AppointmentRequestQueue = lazy(() =>
  import('../components/AppointmentRequestQueue').then(module => ({
    default: module.default
  })).catch(error => {
    console.error('Failed to load AppointmentRequestQueue:', error);
    return { default: () => <div>Failed to load Appointment Queue component</div> };
  })
);

const DigitalSignaturePad = lazy(() =>
  import('../components/DigitalSignaturePad').then(module => ({
    default: module.default
  })).catch(error => {
    console.error('Failed to load DigitalSignaturePad:', error);
    return { default: () => <div>Failed to load Digital Signature component</div> };
  })
);

const SchedulingDashboard = lazy(() =>
  import('../components/SchedulingDashboard').then(module => ({
    default: module.default
  })).catch(error => {
    console.error('Failed to load SchedulingDashboard:', error);
    return { default: () => <div>Failed to load Scheduling Dashboard component</div> };
  })
);

// Performance-optimized loading spinner with minimal bundle size
const FieldServiceLoadingSpinner = React.memo(() => (
  <div className="field-service-loading" aria-label="Loading field service component">
    <div className="spinner-container">
      <div className="spinner" role="progressbar" aria-label="Loading..."></div>
      <p>Loading field service module...</p>
    </div>
    <style jsx>{`
      .field-service-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        padding: 2rem;
      }

      .spinner-container {
        text-align: center;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @media (prefers-reduced-motion: reduce) {
        .spinner {
          animation: none;
          opacity: 0.7;
        }
      }
    `}</style>
  </div>
));

// Error fallback component for field service modules
const FieldServiceErrorFallback = React.memo(({ error, componentName }) => (
  <div className="field-service-error" role="alert">
    <h2>Unable to Load {componentName}</h2>
    <p>There was a problem loading the {componentName} module.</p>
    <details>
      <summary>Technical Details</summary>
      <pre>{error?.message || 'Unknown error occurred'}</pre>
    </details>
    <button
      onClick={() => window.location.reload()}
      className="retry-button"
      aria-label={`Retry loading ${componentName}`}
    >
      Retry Loading
    </button>
    <style jsx>{`
      .field-service-error {
        padding: 2rem;
        text-align: center;
        border: 1px solid #dc3545;
        border-radius: 4px;
        background-color: #f8d7da;
        color: #721c24;
        margin: 1rem;
      }

      .retry-button {
        background: #007bff;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 1rem;
      }

      .retry-button:hover {
        background: #0056b3;
      }
    `}</style>
  </div>
));

// Route-level code splitting configuration
const fieldServiceRouteConfig = {
  preloadStrategies: {
    // Preload critical components on user interaction
    onHover: ['SchedulePage', 'SchedulingDashboard'],
    // Preload on viewport intersection
    onVisible: ['CustomerPortal'],
    // Preload based on user role
    onRole: {
      manager: ['AppointmentRequestQueue', 'PaperworkTemplateManager'],
      technician: ['DigitalSignaturePad', 'SchedulePage']
    }
  },

  // Bundle splitting configuration
  bundleSplitting: {
    vendor: ['@fullcalendar', 'chart.js', 'react-signature-canvas'],
    common: ['api', 'utils', 'hooks'],
    features: ['field-service', 'scheduling', 'paperwork', 'signatures']
  }
};

// Preloading utilities
const preloadComponent = (componentName) => {
  switch (componentName) {
    case 'SchedulePage':
      return import('../components/SchedulePage');
    case 'PaperworkTemplateManager':
      return import('../components/PaperworkTemplateManager');
    case 'CustomerPortal':
      return import('../components/CustomerPortal');
    case 'AppointmentRequestQueue':
      return import('../components/AppointmentRequestQueue');
    case 'DigitalSignaturePad':
      return import('../components/DigitalSignaturePad');
    case 'SchedulingDashboard':
      return import('../components/SchedulingDashboard');
    default:
      return Promise.resolve();
  }
};

// Intersection Observer for preloading on viewport visibility
const useIntersectionPreloader = (componentName) => {
  React.useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          preloadComponent(componentName);
          observer.disconnect();
        }
      });
    });

    const triggerElement = document.querySelector(`[data-preload="${componentName}"]`);
    if (triggerElement) {
      observer.observe(triggerElement);
    }

    return () => observer.disconnect();
  }, [componentName]);
};

// Mouse hover preloading
const useHoverPreloader = (componentNames) => {
  React.useEffect(() => {
    const preloadOnHover = (event) => {
      const target = event.target.closest('[data-hover-preload]');
      if (target) {
        const componentName = target.dataset.hoverPreload;
        if (componentNames.includes(componentName)) {
          preloadComponent(componentName);
        }
      }
    };

    document.addEventListener('mouseover', preloadOnHover);
    return () => document.removeEventListener('mouseover', preloadOnHover);
  }, [componentNames]);
};

// Main Field Service Routes component with performance optimizations
const FieldServiceRoutes = React.memo(() => {
  // Initialize preloading strategies
  useHoverPreloader(fieldServiceRouteConfig.preloadStrategies.onHover);

  // Performance monitoring
  React.useEffect(() => {
    // Monitor route loading performance
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          console.log(`Field Service Route Load Time: ${entry.loadEventEnd - entry.fetchStart}ms`);
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });
    return () => observer.disconnect();
  }, []);

  return (
    <ErrorBoundary
      fallback={(error) => (
        <FieldServiceErrorFallback error={error} componentName="Field Service Module" />
      )}
    >
      <Routes>
        <Route
          path="/schedule"
          element={
            <Suspense fallback={<FieldServiceLoadingSpinner />}>
              <ErrorBoundary
                fallback={(error) => (
                  <FieldServiceErrorFallback error={error} componentName="Schedule Page" />
                )}
              >
                <SchedulePage />
              </ErrorBoundary>
            </Suspense>
          }
        />

        <Route
          path="/paperwork-templates"
          element={
            <Suspense fallback={<FieldServiceLoadingSpinner />}>
              <ErrorBoundary
                fallback={(error) => (
                  <FieldServiceErrorFallback error={error} componentName="Paperwork Templates" />
                )}
              >
                <PaperworkTemplateManager />
              </ErrorBoundary>
            </Suspense>
          }
        />

        <Route
          path="/customer-portal"
          element={
            <Suspense fallback={<FieldServiceLoadingSpinner />}>
              <ErrorBoundary
                fallback={(error) => (
                  <FieldServiceErrorFallback error={error} componentName="Customer Portal" />
                )}
              >
                <CustomerPortal />
              </ErrorBoundary>
            </Suspense>
          }
        />

        <Route
          path="/appointment-requests"
          element={
            <Suspense fallback={<FieldServiceLoadingSpinner />}>
              <ErrorBoundary
                fallback={(error) => (
                  <FieldServiceErrorFallback error={error} componentName="Appointment Requests" />
                )}
              >
                <AppointmentRequestQueue />
              </ErrorBoundary>
            </Suspense>
          }
        />

        <Route
          path="/digital-signature"
          element={
            <Suspense fallback={<FieldServiceLoadingSpinner />}>
              <ErrorBoundary
                fallback={(error) => (
                  <FieldServiceErrorFallback error={error} componentName="Digital Signature" />
                )}
              >
                <DigitalSignaturePad />
              </ErrorBoundary>
            </Suspense>
          }
        />

        <Route
          path="/scheduling-dashboard"
          element={
            <Suspense fallback={<FieldServiceLoadingSpinner />}>
              <ErrorBoundary
                fallback={(error) => (
                  <FieldServiceErrorFallback error={error} componentName="Scheduling Dashboard" />
                )}
              >
                <SchedulingDashboard />
              </ErrorBoundary>
            </Suspense>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
});

// Export preloading utilities for use in other components
export {
  preloadComponent,
  useIntersectionPreloader,
  useHoverPreloader,
  fieldServiceRouteConfig
};

export default FieldServiceRoutes;
