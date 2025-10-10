import { render } from '@testing-library/react';
import { act } from 'react';

export function flushPromises() {
  // Use setTimeout(..., 0) instead of setImmediate for broader environment
  // compatibility (Jest/jsdom don't always provide setImmediate).
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function renderAsync(ui, options) {
  let result;
  await act(async () => {
    result = render(ui, options);
    // Wait a macrotask so effects scheduled during mount can run inside act
    await flushPromises();
  });
  return result;
}
