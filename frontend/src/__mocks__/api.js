// Manual mock for ./api used in tests.
// Implements an axios-like subset (get/post/put/delete/patch) using global.fetch
// so that MSW handlers intercept requests during tests.

const buildQuery = (params = {}) => {
  const esc = encodeURIComponent;
  const query = Object.keys(params)
    .filter((k) => params[k] !== undefined)
    .map((k) => `${esc(k)}=${esc(params[k])}`)
    .join('&');
  return query ? `?${query}` : '';
};

const toAxiosLike = async (response) => {
  const result = {};
  result.status = response.status;
  result.statusText = response.statusText;
  try {
    result.data = await response.json();
  } catch (e) {
    // If parsing fails (204 No Content, or non-JSON), fall back to null and
    // avoid setting undefined which causes component state issues.
    // Log to aid debugging in test runs.
  // console.debug intentionally left for troubleshooting; keep but no lint disable needed
  console.debug('[mock api] response.json() failed:', e && e.message);
    result.data = null;
  }
  result.headers = {};
  response.headers.forEach((value, key) => {
    result.headers[key] = value;
  });
  return result;
};

module.exports = {
  get: jest.fn(async (url, config = {}) => {
    const params = (config && config.params) || {};
    const base = 'http://localhost';
    const path = `${url}${buildQuery(params)}`;
    const full = path.startsWith('http') ? path : `${base}${path}`;
    const res = await fetch(full, { method: 'GET' });
    const out = await toAxiosLike(res);
    // Debugging: force a visible log in Jest output to confirm mock invocation
  console.error('[mock api] GET', full, '=>', 'status', out.status, 'dataType', Array.isArray(out.data) ? `array(${out.data.length})` : typeof out.data, 'sample', out.data && out.data[0]);
    return out;
  }),
  post: jest.fn(async (url, data) => {
    const base = 'http://localhost';
    const full = url.startsWith('http') ? url : `${base}${url}`;
    const res = await fetch(full, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
    return toAxiosLike(res);
  }),
  put: jest.fn(async (url, data) => {
    const base = 'http://localhost';
    const full = url.startsWith('http') ? url : `${base}${url}`;
    const res = await fetch(full, { method: 'PUT', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
    return toAxiosLike(res);
  }),
  delete: jest.fn(async (url) => {
    const base = 'http://localhost';
    const full = url.startsWith('http') ? url : `${base}${url}`;
    const res = await fetch(full, { method: 'DELETE' });
    return toAxiosLike(res);
  }),
  patch: jest.fn(async (url, data) => {
    const base = 'http://localhost';
    const full = url.startsWith('http') ? url : `${base}${url}`;
    const res = await fetch(full, { method: 'PATCH', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
    return toAxiosLike(res);
  }),
};

// Provide a default export for ES module consumers (import api from '../api')
module.exports.default = module.exports;
