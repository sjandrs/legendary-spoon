// Lightweight shim for tests that import `rest` from 'msw'.
// Some code imports `rest` like `import { rest } from 'msw'` while the
// installed msw build exposes the http helpers under its core http module.
// Re-export the `http` helpers as `rest` for compatibility in tests.
const httpModule = require('msw/lib/core/http.js');
const graphqlModule = require('msw/lib/core/graphql.js');
module.exports = {
  // rest.get/post/put/patch/delete etc.
  rest: httpModule.http,
  // graphql helper if any tests import it from 'msw'
  graphql: graphqlModule.graphql,
};
