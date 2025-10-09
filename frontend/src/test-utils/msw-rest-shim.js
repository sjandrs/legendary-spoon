// Lightweight test shim: expose `rest` and `graphql` names expected by tests
// by re-exporting msw's core helpers.
const core = require('../../node_modules/msw/lib/core/index.js');

module.exports = {
  rest: core.http,
  graphql: core.graphql,
  // Keep a fallback to the full core exports if a test needs other helpers
  ...core,
};
