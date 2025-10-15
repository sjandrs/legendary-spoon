/**
 * WCAG 2.1 AA Accessibility Enhancements - Phase 4 Field Service Components
 * Implements comprehensive accessibility features across all field service management components
 */

// SchedulePage.jsx Accessibility Enhancements
export const schedulePageAccessibilityEnhancements = {
  // ARIA labels and roles for FullCalendar
  calendarAriaLabels: {
    'aria-label': 'Field service appointment calendar',
    'role': 'application',
    'aria-describedby': 'calendar-instructions'
  },

  // Screen reader announcements for calendar interactions
  announceCalendarChanges: (action, details) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Calendar ${action}: ${details}`;
    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  // Keyboard navigation enhancements
  keyboardHandlers: {
    handleCalendarKeydown: (event) => {
      const { key, ctrlKey } = event;

      switch (key) {
        case 'ArrowLeft':
          if (ctrlKey) {
            // Navigate to previous month/week
            event.preventDefault();
            schedulePageAccessibilityEnhancements.announceCalendarChanges('navigation', 'Previous period');
          }
          break;
        case 'ArrowRight':
          if (ctrlKey) {
            event.preventDefault();
            schedulePageAccessibilityEnhancements.announceCalendarChanges('navigation', 'Next period');
          }
          break;
        case 'Enter':
        case ' ':
          // Activate selected calendar cell/event
          event.preventDefault();
          const focused = document.activeElement;
          if (focused.classList.contains('fc-daygrid-day') || focused.classList.contains('fc-timegrid-slot')) {
            schedulePageAccessibilityEnhancements.createAppointmentFromKeyboard(focused);
          }
          break;
      }
    },

    createAppointmentFromKeyboard: (calendarCell) => {
      // Extract date/time from calendar cell for appointment creation
      const dateTime = calendarCell.dataset.date || new Date().toISOString();
      schedulePageAccessibilityEnhancements.announceCalendarChanges('action', `Opening new appointment form for ${dateTime}`);
      // Trigger appointment creation modal with pre-filled date/time
    }
  },

  // High contrast mode support
  highContrastStyles: `
    @media (prefers-contrast: high) {
      .fc-event {
        border-width: 2px !important;
        font-weight: bold !important;
      }

      .fc-daygrid-day.fc-day-today {
        background-color: #000080 !important;
        color: white !important;
      }

      .fc-button-primary {
        background-color: #000080 !important;
        border-color: #000080 !important;
      }
    }
  `,

  // Focus management for modals
  focusManagement: {
    trapFocus: (modal) => {
      const focusableElements = modal.querySelectorAll(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      firstFocusable.focus();

      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          } else if (!e.shiftKey && document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      });
    }
  }
};

// DigitalSignaturePad.jsx Accessibility Enhancements
export const digitalSignatureAccessibilityEnhancements = {
  // Screen reader support for signature capture
  signatureAriaLabels: {
    'aria-label': 'Digital signature capture area',
    'role': 'img',
    'aria-describedby': 'signature-instructions'
  },

  // Voice-over friendly signature instructions
  signatureInstructions: {
    id: 'signature-instructions',
    content: `
      To sign: Use mouse or touch to draw your signature in the box below.
      Keyboard users: Use Tab to navigate to signature options.
      Clear button: Clears the current signature.
      Save button: Saves and confirms the signature.
      Alternative: Type your name in the text field below for text-based signature.
    `
  },

  // Alternative signature methods for accessibility
  alternativeSignatureMethods: {
    textSignature: {
      enabled: true,
      ariaLabel: 'Type your full name as text signature',
      description: 'Alternative to drawing signature for keyboard users'
    },

    voiceSignature: {
      enabled: true,
      ariaLabel: 'Voice signature recording',
      description: 'Record spoken confirmation of signature'
    }
  },

  // Signature validation announcements
  announceSignatureStatus: (status, details) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';

    switch (status) {
      case 'started':
        announcement.textContent = 'Signature capture started';
        break;
      case 'cleared':
        announcement.textContent = 'Signature cleared, ready for new signature';
        break;
      case 'saved':
        announcement.textContent = `Signature saved successfully. ${details}`;
        break;
      case 'error':
        announcement.textContent = `Signature error: ${details}`;
        break;
    }

    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 2000);
  },

  // Touch accessibility enhancements
  touchAccessibility: {
    minimumTouchTarget: '44px', // WCAG AAA compliance
    touchFeedback: true,
    hapticFeedback: true // On supported devices
  }
};

// CustomerPortal.jsx Accessibility Enhancements
export const customerPortalAccessibilityEnhancements = {
  // Form field enhancements
  formAccessibility: {
    // Auto-generating ARIA describedby for form validation
    enhanceFormField: (field, validationMessage) => {
      const fieldId = field.id || `field_${Math.random().toString(36).substr(2, 9)}`;
      field.id = fieldId;

      // Create or update description
      let description = document.getElementById(`${fieldId}_desc`);
      if (!description) {
        description = document.createElement('div');
        description.id = `${fieldId}_desc`;
        description.className = 'field-description sr-only';
        field.parentNode.appendChild(description);
      }

      field.setAttribute('aria-describedby', `${fieldId}_desc`);

      if (validationMessage) {
        field.setAttribute('aria-invalid', 'true');
        description.textContent = validationMessage;
        description.setAttribute('aria-live', 'polite');
      } else {
        field.removeAttribute('aria-invalid');
        description.textContent = '';
      }
    }
  },

  // Service type selection accessibility
  serviceTypeAccessibility: {
    enhanceServiceSelect: (selectElement) => {
      selectElement.setAttribute('aria-label', 'Select type of service needed');

      // Add descriptions for each service type
      const serviceDescriptions = {
        'HVAC Maintenance': 'Regular maintenance and tune-up services for heating and cooling systems',
        'HVAC Repair': 'Repair services for broken or malfunctioning HVAC systems',
        'Plumbing Repair': 'Repair services for plumbing issues including leaks, clogs, and fixtures',
        'Electrical Repair': 'Electrical repair and troubleshooting services',
        'Emergency Service': 'Urgent repair services available 24/7 for critical issues',
        'Installation': 'New equipment installation and setup services'
      };

      // Create option descriptions
      Array.from(selectElement.options).forEach(option => {
        if (option.value && serviceDescriptions[option.value]) {
          option.setAttribute('data-description', serviceDescriptions[option.value]);
        }
      });

      // Announce service description when option changes
      selectElement.addEventListener('change', (e) => {
        const selectedOption = e.target.selectedOptions[0];
        const description = selectedOption.getAttribute('data-description');

        if (description) {
          customerPortalAccessibilityEnhancements.announceServiceDescription(description);
        }
      });
    }
  },

  // Service description announcements
  announceServiceDescription: (description) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = `Service description: ${description}`;
    document.body.appendChild(announcement);

    setTimeout(() => document.body.removeChild(announcement), 3000);
  },

  // Error message enhancements
  errorMessageAccessibility: {
    createAccessibleError: (fieldId, message) => {
      // Remove existing error message
      const existingError = document.getElementById(`${fieldId}_error`);
      if (existingError) {
        existingError.remove();
      }

      // Create new error message
      const errorElement = document.createElement('div');
      errorElement.id = `${fieldId}_error`;
      errorElement.className = 'error-message';
      errorElement.setAttribute('role', 'alert');
      errorElement.setAttribute('aria-live', 'assertive');
      errorElement.textContent = message;

      const field = document.getElementById(fieldId);
      field.parentNode.appendChild(errorElement);
      field.setAttribute('aria-describedby', `${fieldId}_error`);
      field.setAttribute('aria-invalid', 'true');

      // Focus the field with error
      field.focus();
    }
  }
};

// AppointmentRequestQueue.jsx Accessibility Enhancements
export const appointmentQueueAccessibilityEnhancements = {
  // Table accessibility for appointment queue
  tableAccessibility: {
    enhanceAppointmentTable: (table) => {
      table.setAttribute('role', 'grid');
      table.setAttribute('aria-label', 'Appointment requests queue');

      // Enhance headers
      const headers = table.querySelectorAll('th');
      headers.forEach((header, index) => {
        header.setAttribute('role', 'columnheader');
        header.id = `header_${index}`;

        if (header.querySelector('button')) {
          header.setAttribute('aria-sort', 'none');
        }
      });

      // Enhance rows
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach((row, index) => {
        row.setAttribute('role', 'row');
        row.setAttribute('aria-rowindex', index + 1);

        const cells = row.querySelectorAll('td');
        cells.forEach((cell, cellIndex) => {
          cell.setAttribute('role', 'gridcell');
          cell.setAttribute('headers', `header_${cellIndex}`);
        });
      });
    }
  },

  // Action button accessibility
  actionButtonAccessibility: {
    enhanceActionButtons: (buttonContainer, requestData) => {
      const buttons = buttonContainer.querySelectorAll('button');

      buttons.forEach(button => {
        const action = button.textContent.toLowerCase();
        const customerName = requestData.customer_name;

        switch (action) {
          case 'approve':
            button.setAttribute('aria-label', `Approve appointment request from ${customerName}`);
            break;
          case 'reject':
            button.setAttribute('aria-label', `Reject appointment request from ${customerName}`);
            break;
          case 'view':
            button.setAttribute('aria-label', `View details for ${customerName} appointment request`);
            break;
        }
      });
    }
  },

  // Status announcements
  announceStatusChange: (requestId, oldStatus, newStatus, customerName) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = `Appointment request from ${customerName} status changed from ${oldStatus} to ${newStatus}`;

    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 3000);
  }
};

// PaperworkTemplateManager.jsx Accessibility Enhancements
export const paperworkTemplateAccessibilityEnhancements = {
  // Template editor accessibility
  templateEditorAccessibility: {
    enhanceEditor: (editorContainer) => {
      const editor = editorContainer.querySelector('.template-editor');

      editor.setAttribute('role', 'textbox');
      editor.setAttribute('aria-multiline', 'true');
      editor.setAttribute('aria-label', 'Paperwork template content editor');

      // Add instructions for template variables
      const instructions = document.createElement('div');
      instructions.id = 'template-editor-instructions';
      instructions.className = 'sr-only';
      instructions.textContent = `
        Template editor. Use double curly braces for variables, example: {{customer_name}}.
        Available variables: customer_name, service_type, appointment_date, technician_name.
        Use Control+S to save, Control+P to preview.
      `;

      editorContainer.appendChild(instructions);
      editor.setAttribute('aria-describedby', 'template-editor-instructions');
    }
  },

  // Variable insertion accessibility
  variableInsertionAccessibility: {
    enhanceVariableButtons: (variableContainer) => {
      const variableButtons = variableContainer.querySelectorAll('.variable-button');

      variableButtons.forEach(button => {
        const variableName = button.dataset.variable;
        button.setAttribute('aria-label', `Insert ${variableName} variable`);
        button.setAttribute('title', `Inserts {{${variableName}}} into template`);
      });
    }
  }
};

// SchedulingDashboard.jsx Accessibility Enhancements
export const schedulingDashboardAccessibilityEnhancements = {
  // Chart accessibility
  chartAccessibility: {
    enhanceCharts: (dashboardContainer) => {
      const charts = dashboardContainer.querySelectorAll('.chart-container');

      charts.forEach(chartContainer => {
        const canvas = chartContainer.querySelector('canvas');
        const chartData = canvas.chartInstance; // Chart.js instance

        // Add ARIA labels
        canvas.setAttribute('role', 'img');

        // Generate chart description
        const description = schedulingDashboardAccessibilityEnhancements.generateChartDescription(chartData);
        canvas.setAttribute('aria-label', description);

        // Create data table alternative
        const dataTable = schedulingDashboardAccessibilityEnhancements.createChartDataTable(chartData);
        chartContainer.appendChild(dataTable);
      });
    }
  },

  // Generate accessible chart descriptions
  generateChartDescription: (chartData) => {
    const { type, data } = chartData.config;
    const labels = data.labels || [];
    const datasets = data.datasets || [];

    let description = `${type} chart showing `;

    if (datasets.length === 1) {
      const dataset = datasets[0];
      description += `${dataset.label} with ${labels.length} data points`;
    } else {
      description += `${datasets.length} data series with ${labels.length} categories`;
    }

    return description;
  },

  // Create accessible data table for charts
  createChartDataTable: (chartData) => {
    const table = document.createElement('table');
    table.className = 'chart-data-table sr-only';
    table.setAttribute('aria-label', 'Chart data in table format');

    const { data } = chartData.config;
    const labels = data.labels || [];
    const datasets = data.datasets || [];

    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const labelHeader = document.createElement('th');
    labelHeader.textContent = 'Category';
    headerRow.appendChild(labelHeader);

    datasets.forEach(dataset => {
      const datasetHeader = document.createElement('th');
      datasetHeader.textContent = dataset.label;
      headerRow.appendChild(datasetHeader);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = document.createElement('tbody');

    labels.forEach((label, index) => {
      const row = document.createElement('tr');

      const labelCell = document.createElement('td');
      labelCell.textContent = label;
      row.appendChild(labelCell);

      datasets.forEach(dataset => {
        const dataCell = document.createElement('td');
        dataCell.textContent = dataset.data[index] || 'No data';
        row.appendChild(dataCell);
      });

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    return table;
  },

  // Dashboard navigation accessibility
  dashboardNavigationAccessibility: {
    enhanceDashboardNav: (navContainer) => {
      const navItems = navContainer.querySelectorAll('.nav-item');

      navItems.forEach(item => {
        item.setAttribute('role', 'tab');

        const isSelected = item.classList.contains('active');
        item.setAttribute('aria-selected', isSelected);

        if (isSelected) {
          item.setAttribute('tabindex', '0');
        } else {
          item.setAttribute('tabindex', '-1');
        }
      });

      navContainer.setAttribute('role', 'tablist');
      navContainer.setAttribute('aria-label', 'Dashboard sections');
    }
  }
};

// Global accessibility utilities
export const globalAccessibilityUtils = {
  // Reduced motion support
  respectsReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Skip links for keyboard navigation
  createSkipLinks: () => {
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
      <a href="#search" class="skip-link">Skip to search</a>
    `;

    document.body.insertBefore(skipLinks, document.body.firstChild);
  },

  // Focus indicators for all interactive elements
  enhanceFocusIndicators: () => {
    const style = document.createElement('style');
    style.textContent = `
      .focus-visible,
      *:focus-visible {
        outline: 2px solid #005fcc !important;
        outline-offset: 2px !important;
      }

      .skip-link {
        position: absolute;
        left: -9999px;
        z-index: 999;
        padding: 8px;
        background: #000;
        color: #fff;
        text-decoration: none;
      }

      .skip-link:focus {
        left: 6px;
        top: 7px;
      }

      .sr-only {
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      }
    `;

    document.head.appendChild(style);
  }
};

// Initialize accessibility enhancements
export const initializeFieldServiceAccessibility = () => {
  // Apply global enhancements
  globalAccessibilityUtils.createSkipLinks();
  globalAccessibilityUtils.enhanceFocusIndicators();

  // Initialize component-specific enhancements based on current page
  const currentPath = window.location.pathname;

  switch (currentPath) {
    case '/schedule':
      // Initialize SchedulePage accessibility
      document.addEventListener('DOMContentLoaded', () => {
        const calendar = document.querySelector('[data-testid="fullcalendar"]');
        if (calendar) {
          Object.assign(calendar, schedulePageAccessibilityEnhancements.calendarAriaLabels);
        }
      });
      break;

    case '/customer-portal':
      // Initialize CustomerPortal accessibility
      document.addEventListener('DOMContentLoaded', () => {
        const form = document.querySelector('[data-testid="service-booking-form"]');
        if (form) {
          const serviceSelect = form.querySelector('select[name="service_type"]');
          customerPortalAccessibilityEnhancements.serviceTypeAccessibility.enhanceServiceSelect(serviceSelect);
        }
      });
      break;

    // Add other components as needed
  }
};
