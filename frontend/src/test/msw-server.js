// Central MSW test server setup (v2)
// Ensures interceptors load before other test utilities.
// Force-load interceptor before importing msw/node
// eslint-disable-next-line import/no-extraneous-dependencies
import '@mswjs/interceptors/ClientRequest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Default no-op handlers; individual test files can call server.use(...)
export const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Force-load interceptors that were failing resolution in mixed ESM/CJS
// eslint-disable-next-line import/no-extraneous-dependencies
try { require('@mswjs/interceptors/ClientRequest'); } catch (_err) { /* ignore */ }
