import '@testing-library/jest-dom';

// Mock API module
jest.mock('./api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
}));

// Mock axios for API calls
import axios from 'axios';
jest.mock('axios');
axios.create = jest.fn(() => axios);

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
// TODO: Complete MSW v2 integration in next phase
// import { startMswServer } from './__tests__/utils/msw-server';
// startMswServer();

// Polyfills for jsdom
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill TransformStream required by @mswjs/interceptors for fetch interception
if (typeof global.TransformStream === 'undefined') {
  // Use web-streams-polyfill implementation
  // eslint-disable-next-line import/no-extraneous-dependencies
  const { TransformStream } = require('web-streams-polyfill/dist/ponyfill.js');
  global.TransformStream = TransformStream;
}

// Polyfill WebSocket (used indirectly by msw in some environments) if missing
if (typeof global.WebSocket === 'undefined') {
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const WebSocket = require('ws');
    global.WebSocket = WebSocket;
  } catch (e) {
    // Ignore if ws not available; tests that require it will fail loudly
  }
}

// MSW polyfills for Jest environment
import { fetch, Headers, Request, Response } from 'cross-fetch';
global.fetch = fetch;
global.Headers = Headers;
global.Request = Request;
global.Response = Response;

// Polyfill for BroadcastChannel (needed for MSW v2)
global.BroadcastChannel = class BroadcastChannel {
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
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) =>
      React.createElement('div', {
        'data-testid': 'fullcalendar-mock',
        ref,
        ...props
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

// Remove AuthContext global mock - we'll handle it in test-utils instead
// This allows test-utils to have full control over AuthContext behavior

// ProtectedRoute will be handled by individual test files as needed
