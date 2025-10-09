// Temporary mock to disable msw/node in failing tests until full interceptor polyfills are in place.
export const setupServer = () => ({ listen: () => {}, close: () => {}, resetHandlers: () => {} });
