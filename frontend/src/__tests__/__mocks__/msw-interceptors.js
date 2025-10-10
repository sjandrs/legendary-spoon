// Lightweight stubs for @mswjs/interceptors submodules used by msw/node in Jest.
// These are not needed for request mocking in unit tests because msw's request handling is
// simulated at a higher level. E2E/integration tests use the real implementation in the browser.

export const ClientRequestInterceptor = class {
  constructor() {}
  apply() {}
  dispose() {}
};

export const XMLHttpRequestInterceptor = class {
  constructor() {}
  apply() {}
  dispose() {}
};

export const WebSocketInterceptor = class {
  constructor() {}
  apply() {}
  dispose() {}
};

export const FetchInterceptor = class {
  constructor() {}
  apply() {}
  dispose() {}
};

export default {};