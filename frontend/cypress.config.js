import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    // Performance optimizations
    defaultCommandTimeout: 8000, // Reduced from default 4000 for better balance
    requestTimeout: 10000,
    responseTimeout: 30000,
    pageLoadTimeout: 60000,
    // Disable unnecessary features in headless mode
    chromeWebSecurity: false, // Faster execution for testing
    // Optimize test isolation
    testIsolation: true,
    // Experimental optimizations
    experimentalRunAllSpecs: true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
      });
    },
    env: {
      apiUrl: 'http://127.0.0.1:8000/api',
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    supportFile: 'cypress/support/component.js',
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
  },
});
