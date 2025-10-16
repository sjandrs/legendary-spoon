import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
// jest-axe exports a matcher map; pass it directly to expect.extend
expect.extend(toHaveNoViolations);
// ESM-first MSW imports per project convention
// Use a tiny CJS wrapper to avoid IDE parse errors while keeping Jest resolution intact
import { setupServer } from './testing/mswServer.cjs';
import { handlers as defaultHandlers } from './__tests__/utils/msw-handlers.js';
import { http } from 'msw';
// Response-compatible HttpResponse shim: returns WHATWG Response objects with clone()
const HttpResponse = {
  json: (data, options = {}) => {
    try {
      if (typeof Response !== 'undefined') {
        const headers = new Headers({ 'content-type': 'application/json', ...(options.headers || {}) });
        return new Response(JSON.stringify(data), { status: options.status ?? 200, headers });
      }
    } catch (_) { /* fall through to object shim */ }
    // Fallback simple object with clone to satisfy MSW internals in constrained environments
    return {
      status: options.status ?? 200,
      headers: { 'content-type': 'application/json', ...(options.headers || {}) },
      body: JSON.stringify(data),
      json: async () => data,
      text: async () => JSON.stringify(data),
      clone() { return this; },
    };
  },
  text: (text, options = {}) => {
    try {
      if (typeof Response !== 'undefined') {
        const headers = new Headers({ 'content-type': 'text/plain', ...(options.headers || {}) });
        return new Response(text, { status: options.status ?? 200, headers });
      }
    } catch (_) { /* fall through to object shim */ }
    return {
      status: options.status ?? 200,
      headers: { 'content-type': 'text/plain', ...(options.headers || {}) },
      body: text,
      json: async () => ({ message: text }),
      text: async () => text,
      clone() { return this; },
    };
  },
};

// Fetch and related web APIs are polyfilled via Jest setupFiles (jest.polyfills.js, cross-fetch/polyfill)

// Remove CommonJS fallback branch and warnings; allow real MSW server

// Do not globally mock axios; allow real HTTP client for MSW interception

// Mock react-markdown
jest.mock('react-markdown', () => {
  return {
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
  };
});

// Mock remark-gfm
jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => ({}),
}));

// IMPORTANT: i18next in components must remain intact.
// Tests get stable English strings via this Jest mock so expectations are deterministic.
// Do NOT remove i18next calls from components – adjust mappings below if tests need new keys.
jest.mock('react-i18next', () => {
  const React = require('react');
  const translations = {
    'auth.login': 'Login',
    'auth.username': 'Username',
    'auth.password': 'Password',
    'validation.invalid_credentials': 'Invalid credentials. Please try again.',

    // Common namespace essentials
    'common:actions.cancel': 'Cancel',
    'common:actions.edit': 'Edit',
    'common:actions.delete': 'Delete',
    'common:common.name': 'Name',
    'common:common.description': 'Description',
    'common:common.quantity': 'Quantity',
    'common:common.status': 'Status',

    // Warehouse namespace essentials to stabilize tests
    'warehouse:title': 'Warehouse Management',
    'warehouse:status.loading': 'Loading...',
    'warehouse:summary.total_warehouses': 'Total Warehouses',
    'warehouse:summary.total_items': 'Total Items',
    'warehouse:summary.low_stock_items': 'Low Stock Items',
    'warehouse:summary.inventory_value': 'Inventory Value',
    'warehouse:tabs.items': 'Items',
    'warehouse:tabs.warehouses': 'Warehouses',
    'warehouse:sections.items': 'Items',
    'warehouse:sections.warehouses': 'Warehouses',
    'warehouse:actions.add_item': 'Add item',
    'warehouse:actions.update_item': 'Update item',
    'warehouse:actions.add_warehouse': 'Add Warehouse',
    'warehouse:actions.update_warehouse': 'Update Warehouse',
    'warehouse:forms.edit_item': 'Edit Item',
    'warehouse:forms.add_item': 'Add Item',
    'warehouse:forms.edit_warehouse': 'Edit Warehouse',
    'warehouse:forms.add_warehouse': 'Add Warehouse',
    'warehouse:fields.sku': 'SKU',
    'warehouse:fields.gtin': 'GTIN',
    'warehouse:fields.minimum_stock': 'Minimum Stock',
    'warehouse:fields.unit_cost': 'Unit Cost',
    'warehouse:fields.total_value': 'Total Value',
    'warehouse:fields.warehouse': 'Warehouse',
    'warehouse:fields.location': 'Location',
    'warehouse:fields.item_count': 'Item Count',
    'warehouse:columns.actions': 'Actions',
    'warehouse:status.in_stock': 'In Stock',
    'warehouse:status.low_stock': 'Low Stock',
    'warehouse:messages.no_items': 'No items found',
    'warehouse:messages.no_warehouses': 'No warehouses found',

    // Forms namespace essentials
    'forms:status.loading_form': 'Loading form...',
    'forms:status.saving': 'Saving...',
    'forms:labels.first_name': 'First Name',
    'forms:labels.last_name': 'Last Name',
    'forms:labels.email_address': 'Email',
    'forms:labels.phone_number': 'Phone Number',
    'forms:labels.job_title': 'Title',
    'forms:help_text.email_format': 'name@example.com',
    'forms:help_text.phone_hint': 'Include country code if outside your region.',
    'forms:buttons.cancel': 'Cancel',
    'forms:placeholders.none': 'None',

    // CRM namespace essentials
    'crm:contacts.create_new': 'Create New Contact',
    'crm:contacts.edit_contact': 'Edit Contact',
    'crm:contacts.save_contact': 'Save Contact',
    'crm:accounts.title': 'Account',

    // Error messages used by components/tests
    'errors:api.contacts.load_failed': 'Failed to load contacts.',
  };

  const interpolate = (str, opts) =>
    str.replace(/{{(.*?)}}/g, (_, k) => (opts && typeof opts === 'object' ? (opts[k.trim()] ?? '') : ''));

  const humanizeKey = (key) => {
    if (typeof key !== 'string') return '';
    // Drop namespace (common:, financial:, etc.) and nested paths
    const noNs = key.split(':').pop();
    const lastSegment = noNs.split('.').pop();
    // Replace underscores with spaces
    const withSpaces = lastSegment.replace(/_/g, ' ');
    return withSpaces;
  };

  const t = (key, opts) => {
    // Namespace-aware lookup when opts.ns is provided
    if (opts && typeof opts === 'object' && typeof opts.ns === 'string') {
      const nsKey = `${opts.ns}:${key}`;
      if (translations[nsKey]) return translations[nsKey];
    }
    // Exact match from minimal dictionary
    if (typeof key === 'string' && translations[key]) return translations[key];

    // If a defaultValue string or second-arg string provided, use it
    if (typeof opts === 'string' && opts) return opts;
    if (opts && typeof opts === 'object' && typeof opts.defaultValue === 'string' && opts.defaultValue) {
      return interpolate(opts.defaultValue, opts);
    }

    // Otherwise, return a humanized form of the key for readability in tests
    const fallback = humanizeKey(key);
    return interpolate(fallback, opts);
  };

  return {
    __esModule: true,
    // Hook
    useTranslation: (ns) => {
      const boundT = (key, opts) => {
        // Prefer default namespace when provided
        if (ns && typeof key === 'string') {
          const nsKey = `${ns}:${key}`;
          if (translations[nsKey]) return translations[nsKey];
        }
        return t(key, opts);
      };
      return {
        t: boundT,
        i18n: {
          language: 'en',
          changeLanguage: jest.fn(),
          exists: (k) => !!translations[k] || (!!ns && !!translations[`${ns}:${k}`]),
        },
      };
    },
    // HOC
    withTranslation: () => (Component) => (props) => React.createElement(Component, { t, ...props }),
    // Provider
    I18nextProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    // Components
    Trans: ({ children }) => React.createElement(React.Fragment, null, children),
    // Init plugin stub
    initReactI18next: { type: '3rdParty', init: jest.fn() },
  };
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Ensure global.fetch exists but do not mock it globally; MSW intercepts real fetch
try {
  if (typeof global.fetch !== 'function') {
    // Polyfill fetch if absent
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fetchPolyfill = require('cross-fetch');
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchPolyfill,
    });
  }
} catch (_e) {
  // Best-effort; tests may still replace fetch explicitly
}

// Mock localStorage with actual storage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Global test timeout
jest.setTimeout(10000);

// Test performance monitoring setup
try {
  const { setupJestPerformanceMonitoring } = require('./__tests__/helpers/performanceMonitoring');
  setupJestPerformanceMonitoring();
} catch (error) {
  // Performance monitoring is optional
  console.info('Performance monitoring not available:', error.message);
}

// Suppress console.error for known React warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Set up MSW server with default handlers and expose globals immediately
const server = setupServer(...defaultHandlers);

// Expose MSW globals immediately (before any tests run)
globalThis.msw = { server, http, HttpResponse };
// Backwards compatibility for any legacy references
globalThis.server = server;
globalThis.http = http;
globalThis.HttpResponse = HttpResponse;
globalThis.rest = http;

// Minimal compatibility fallback guard (should not trigger in normal environments)
if (!globalThis.msw || !globalThis.msw.server) {
  const noop = () => {};
  const noopServer = {
    listen: noop,
    resetHandlers: noop,
    close: noop,
    use: noop,
  };
  globalThis.msw = {
    server: globalThis.msw?.server || noopServer,
    http: globalThis.msw?.http || http || {},
    HttpResponse: globalThis.msw?.HttpResponse || HttpResponse || {},
  };
}

// MSW server lifecycle
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });

  // Wrap axios methods with jest.fn so tests can mockResolvedValue/mockRejectedValue on them when desired
  try {
    const axios = require('axios');
    if (typeof jest !== 'undefined' && axios) {
      const wrap = (fn) => {
        if (!fn) return jest.fn();
        if (jest.isMockFunction(fn)) return fn;
        const w = jest.fn((...args) => fn(...args));
        return w;
      };
      axios.get = wrap(axios.get);
      axios.post = wrap(axios.post);
      axios.put = wrap(axios.put);
      axios.patch = wrap(axios.patch);
      axios.delete = wrap(axios.delete);
      axios.request = wrap(axios.request);
    }
  } catch (_err) {}
});

afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// BroadcastChannel is polyfilled via jest.polyfills.js

// Mock FullCalendar components that cause Jest ES6 module issues
jest.mock('@fullcalendar/react', () => {
  const React = require('react');
  const passthrough = new Set([
    'className','style','id','role','tabIndex','title','children','onClick','onChange','onMouseDown','onMouseUp',
  ]);
  const isDomSafeProp = (key) => key.startsWith('data-') || key.startsWith('aria-') || passthrough.has(key);
  const filterProps = (props) => Object.keys(props || {}).reduce((acc, k) => {
    if (isDomSafeProp(k)) acc[k] = props[k];
    return acc;
  }, {});
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) =>
      React.createElement('div', {
        'data-testid': 'fullcalendar-mock',
        ref,
        ...filterProps(props)
      }, 'FullCalendar Mock')
    ),
  };
});

jest.mock('@fullcalendar/daygrid', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('@fullcalendar/timegrid', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('@fullcalendar/interaction', () => ({
  __esModule: true,
  default: {},
}));

// Mock react-chartjs-2 charts to avoid Chart.js DOM measurements in jsdom
jest.mock('react-chartjs-2', () => {
  const React = require('react');
  const Mock = ({ 'data-testid': testId = 'chartjs-mock', ...props }) =>
    React.createElement('div', { 'data-testid': testId, ...props });
  return {
    __esModule: true,
    Line: Mock,
    Bar: Mock,
    Doughnut: Mock,
    Pie: Mock,
    Radar: Mock,
    PolarArea: Mock,
    Bubble: Mock,
    Scatter: Mock,
  };
});

// Remove AuthContext global mock - we'll handle it in test-utils instead
// This allows test-utils to have full control over AuthContext behavior

// ProtectedRoute will be handled by individual test files as needed
