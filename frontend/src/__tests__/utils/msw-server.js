// MSW server setup for Jest testing environment
import { setupServer } from 'msw/node';
import { handlers } from './msw-handlers.js';

// Setup MSW server with our handlers
const server = setupServer(...handlers);

// Server lifecycle management
const startMswServer = () => {
  beforeAll(() => {
    server.listen({
      onUnhandledRequest: 'warn',
    });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });
};

// Helper to add additional handlers during tests
const addMswHandlers = (...additionalHandlers) => {
  server.use(...additionalHandlers);
};

// Helper to reset to original handlers
const resetMswHandlers = () => {
  server.resetHandlers(...handlers);
};

export {
  server,
  startMswServer,
  addMswHandlers,
  resetMswHandlers,
};
