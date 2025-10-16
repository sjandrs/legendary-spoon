// Small CJS wrapper to import msw/node in environments where ESM parsing causes editor warnings
// This is only used by Jest setup; runtime behavior remains identical.
const { setupServer } = require('msw/node');

module.exports = { setupServer };
