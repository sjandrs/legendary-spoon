// Lightweight axios mocking helpers for Jest tests (ESM)
// Assumes setupTests.js wraps axios methods with jest.fn for per-suite control

import axios from 'axios';

// Ensure axios is available
const ensureAxios = () => {
  if (!axios || typeof axios.get !== 'function') {
    throw new Error('axios is not available or not initialized in test environment');
  }
};

// Reset all axios method mocks
export const resetAxiosMocks = () => {
  ensureAxios();
  ['get', 'post', 'put', 'patch', 'delete', 'request'].forEach((m) => {
    const fn = axios[m];
    if (fn && typeof fn.mockReset === 'function') {
      fn.mockReset();
    }
  });
};

// Common success helpers
export const mockGet = (data, config) => {
  ensureAxios();
  if (typeof axios.get?.mockResolvedValue !== 'function') {
    throw new Error('axios.get is not a Jest mock; ensure setupTests wraps axios methods');
  }
  axios.get.mockResolvedValue({ data, status: 200, statusText: 'OK', headers: {}, config });
};

export const mockPost = (data, config) => {
  ensureAxios();
  if (typeof axios.post?.mockResolvedValue !== 'function') {
    throw new Error('axios.post is not a Jest mock; ensure setupTests wraps axios methods');
  }
  axios.post.mockResolvedValue({ data, status: 200, statusText: 'OK', headers: {}, config });
};

export const mockPut = (data, config) => {
  ensureAxios();
  if (typeof axios.put?.mockResolvedValue !== 'function') {
    throw new Error('axios.put is not a Jest mock; ensure setupTests wraps axios methods');
  }
  axios.put.mockResolvedValue({ data, status: 200, statusText: 'OK', headers: {}, config });
};

export const mockPatch = (data, config) => {
  ensureAxios();
  if (typeof axios.patch?.mockResolvedValue !== 'function') {
    throw new Error('axios.patch is not a Jest mock; ensure setupTests wraps axios methods');
  }
  axios.patch.mockResolvedValue({ data, status: 200, statusText: 'OK', headers: {}, config });
};

export const mockDelete = (data, config) => {
  ensureAxios();
  if (typeof axios.delete?.mockResolvedValue !== 'function') {
    throw new Error('axios.delete is not a Jest mock; ensure setupTests wraps axios methods');
  }
  axios.delete.mockResolvedValue({ data, status: 200, statusText: 'OK', headers: {}, config });
};

// Error helpers
export const mockGetError = (error) => {
  ensureAxios();
  if (typeof axios.get?.mockRejectedValue !== 'function') {
    throw new Error('axios.get is not a Jest mock; ensure setupTests wraps axios methods');
  }
  axios.get.mockRejectedValue(error instanceof Error ? error : new Error(String(error)));
};

export const mockPostError = (error) => {
  ensureAxios();
  if (typeof axios.post?.mockRejectedValue !== 'function') {
    throw new Error('axios.post is not a Jest mock; ensure setupTests wraps axios methods');
  }
  axios.post.mockRejectedValue(error instanceof Error ? error : new Error(String(error)));
};

export const mockPutError = (error) => {
  ensureAxios();
  if (typeof axios.put?.mockRejectedValue !== 'function') {
    throw new Error('axios.put is not a Jest mock; ensure setupTests wraps axios methods');
  }
  axios.put.mockRejectedValue(error instanceof Error ? error : new Error(String(error)));
};

export const mockPatchError = (error) => {
  ensureAxios();
  if (typeof axios.patch?.mockRejectedValue !== 'function') {
    throw new Error('axios.patch is not a Jest mock; ensure setupTests wraps axios methods');
  }
  axios.patch.mockRejectedValue(error instanceof Error ? error : new Error(String(error)));
};

export const mockDeleteError = (error) => {
  ensureAxios();
  if (typeof axios.delete?.mockRejectedValue !== 'function') {
    throw new Error('axios.delete is not a Jest mock; ensure setupTests wraps axios methods');
  }
  axios.delete.mockRejectedValue(error instanceof Error ? error : new Error(String(error)));
};

export const getAxios = () => axios;
