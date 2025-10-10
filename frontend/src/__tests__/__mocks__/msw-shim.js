// Lightweight MSW shim for Jest unit tests.
// Provides a "rest" facade and a minimal "setupServer" that patches axios methods
// to return mocked responses defined by the tests.

const axios = require('axios');

function pathToRegex(pathPattern) {
  const escaped = pathPattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:\w+/g, '([^/]+)');
  return new RegExp(`^${escaped}$`);
}

function matchHandler(handlers, method, url) {
  const u = new URL(url, 'http://localhost');
  const path = u.pathname;
  // Prefer most recently added handler (MSW behavior)
  for (let i = handlers.length - 1; i >= 0; i--) {
    const h = handlers[i];
    if (h.method === method && (h.regex ? h.regex.test(path) : h.path === path)) {
      return h;
    }
  }
  return undefined;
}

const ctx = {
  json: (data) => (state) => { state.data = data; },
  status: (code) => (state) => { state.status = code; },
  delay: (ms) => (state) => { state.delay = ms; },
};

function resFn(...effects) {
  const state = { status: 200, data: undefined, delay: 0 };
  for (const fx of effects) {
    if (typeof fx === 'function') fx(state);
  }
  return state;
}
// Support res.networkError(message) used in some tests
resFn.networkError = (message = 'Network Error') => {
  const err = new Error(message);
  // mimic Axios network error shape (no response)
  err.config = {};
  throw err;
};
const res = resFn;

const rest = {};
['get','post','put','patch','delete','options','head'].forEach((method) => {
  rest[method] = (path, resolver) => {
    let normalizedPath = path;
    try {
      if (typeof path === 'string' && path.startsWith('http')) {
        normalizedPath = new URL(path).pathname;
      }
    } catch (_err) {}
    return { method: method.toUpperCase(), path: normalizedPath, regex: normalizedPath.includes(':') ? pathToRegex(normalizedPath) : null, resolver };
  };
});

function setupServer(...handlers) {
  const initialHandlers = handlers.slice();
  const store = handlers.slice();
  const original = {
    get: axios.get,
    post: axios.post,
    put: axios.put,
    patch: axios.patch,
    delete: axios.delete,
    request: axios.request,
    AxiosProtoRequest: axios.Axios && axios.Axios.prototype ? axios.Axios.prototype.request : null,
  };

  async function handle(method, url, data, config = {}) {
    const handler = matchHandler(store, method, url);
    if (!handler) {
      const err = new Error(`MSW shim: no handler for ${method} ${url}`);
      // mimic Axios network error (no response)
      err.config = { method, url };
      throw err;
    }
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (_err) {
      urlObj = new URL(url, 'http://localhost');
    }
    const req = {
      url: urlObj, // expose URL object with searchParams like MSW
      method,
      body: data,
      params: config.params || Object.fromEntries(urlObj.searchParams.entries()),
      headers: config.headers || {},
    };
    let outcome;
    try {
      outcome = handler.resolver(req, res, ctx);
    } catch (_err) {
      // Resolver threw (_err.g., network error) -> propagate as axios rejection
      throw _err;
    }
    const result = outcome && typeof outcome.then === 'function' ? await outcome : outcome;
    const { status = 200, data: respData, delay: wait = 0 } = result || {};
    if (wait) await new Promise(r => setTimeout(r, wait));
    if (status >= 400) {
      const error = new Error(`Request failed with status code ${status}`);
      error.response = { status, data: respData };
      throw error;
    }
    return { data: respData, status };
  }

  function patchAxios() {
    axios.get = (url, config) => handle('GET', url, undefined, config);
    axios.post = (url, data, config) => handle('POST', url, data, config);
    axios.put = (url, data, config) => handle('PUT', url, data, config);
    axios.patch = (url, data, config) => handle('PATCH', url, data, config);
    axios.delete = (url, config) => handle('DELETE', url, undefined, config);

    axios.request = (config = {}) => {
      const method = (config.method || 'GET').toUpperCase();
      const base = config.baseURL;
      let fullUrl = config.url || '';
      try {
        if (base) fullUrl = new URL(config.url, base).toString();
      } catch (_err) {}
      return handle(method, fullUrl, config.data, config);
    };

    if (axios.Axios && axios.Axios.prototype) {
      axios.Axios.prototype.request = function(config = {}) {
        const method = (config.method || 'GET').toUpperCase();
        const base = config.baseURL || (this.defaults ? this.defaults.baseURL : undefined);
        let fullUrl = config.url || '';
        try {
          if (base) fullUrl = new URL(config.url, base).toString();
        } catch (_err) {}
        return handle(method, fullUrl, config.data, config);
      };
    }
  }

  return {
    listen() { patchAxios(); },
    close() {
      axios.get = original.get;
      axios.post = original.post;
      axios.put = original.put;
      axios.patch = original.patch;
      axios.delete = original.delete;
      axios.request = original.request;
      if (original.AxiosProtoRequest && axios.Axios && axios.Axios.prototype) {
        axios.Axios.prototype.request = original.AxiosProtoRequest;
      }
    },
    resetHandlers(...next) {
      // Reset to the initially provided handlers, then apply any overrides
      store.length = 0;
      store.push(...initialHandlers);
      if (next.length) store.push(...next);
    },
    use(...next) { store.push(...next); },
  };
}

module.exports = { rest, setupServer, ctx, res };
