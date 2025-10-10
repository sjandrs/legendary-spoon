// Shared test utilities for React Testing Library
// This file is intentionally left in __tests__ for historical reasons.
// It exports helpers but also includes a single skipped test so Jest
// doesn't fail the suite with "Your test suite must contain at least one test.".

const { render } = require('@testing-library/react');
const { act } = require('react-dom/test-utils');

async function renderAsync(ui, options) {
  let result;
  await act(async () => {
    result = render(ui, options);
    // allow microtask queue to flush
    await Promise.resolve();
  });
  return result;
}

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

module.exports = {
  renderAsync,
  flushPromises,
};

// Prevent this helper file from causing an empty-test-suite failure.
// Tests should import helpers from src/__tests__/helpers/ instead.
describe.skip('test-utils helper placeholder', () => {
  test.skip('placeholder - do not run', () => {});
});
