import '@testing-library/jest-dom';
import * as mswNode from 'msw/node';
import * as msw from 'msw';

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

// MSW setup for API mocking in tests (temporarily disabled for immediate component fixes)
// Provide a lightweight global MSW server for tests that reference `server` and `rest` globals
const server = mswNode.setupServer();
beforeAll(() => {
  server.listen();
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
// Expose for tests that expect globals
globalThis.server = server;
globalThis.rest = msw.rest;

// Polyfills for jsdom
import { TextEncoder, TextDecoder } from 'util';
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

// Polyfill TransformStream required by @mswjs/interceptors for fetch interception
if (typeof globalThis.TransformStream === 'undefined') {
  // Use web-streams-polyfill implementation
  import('web-streams-polyfill/dist/ponyfill.js').then(mod => {
    globalThis.TransformStream = mod.TransformStream;
  }).catch(() => {});
}

// Polyfill WebSocket (used indirectly by msw in some environments) if missing
if (typeof globalThis.WebSocket === 'undefined') {
  import('ws').then(mod => {
    globalThis.WebSocket = mod.default || mod;
  }).catch(() => {});
}

// MSW polyfills for Jest environment (only if missing)
if (typeof globalThis.fetch === 'undefined') {
  import('cross-fetch').then(mod => {
    // Wrap in jest.fn so tests can mockResolvedValue/mockRejectedValue
    const fn = (...args) => mod.fetch(...args);
    globalThis.fetch = typeof jest !== 'undefined' ? jest.fn(fn) : fn;
    globalThis.Headers = mod.Headers;
    globalThis.Request = mod.Request;
    globalThis.Response = mod.Response;
  }).catch(() => {
    if (typeof jest !== 'undefined') {
      globalThis.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({}) }));
    }
  });
}

// Polyfill for BroadcastChannel (needed for MSW v2)
globalThis.BroadcastChannel = class BroadcastChannel {
  constructor(name) {
    this.name = name;
  }
  postMessage() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
};

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
