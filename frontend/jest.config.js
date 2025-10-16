export default {
  testEnvironment: 'jsdom',
  // Ensure polyfills exist before MSW imports
  setupFiles: ['<rootDir>/src/jest.polyfills.js', 'cross-fetch/polyfill'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    '@fullcalendar/(.*)': '<rootDir>/node_modules/@fullcalendar/$1',
    '^msw/node$': '<rootDir>/node_modules/msw/node',
    '^@mswjs/interceptors/(.*)$': '<rootDir>/node_modules/@mswjs/interceptors/$1',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@fullcalendar|@babel|@jest|@testing-library|msw|@mswjs|until-async|chalk|ansi-styles|supports-color|has-flag|preact)/)',
  ],
  extensionsToTreatAsEsm: ['.jsx'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(js|jsx|ts|tsx)',
    '<rootDir>/src/**/?(*.)(test|spec).(js|jsx|ts|tsx)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/src/__tests__/helpers/',
    '<rootDir>/src/__tests__/utils/',
    '<rootDir>/src/__tests__/__mocks__/',
    '/node_modules/',
  ],
  collectCoverageFrom: [
    'src/**/*.(js|jsx|ts|tsx)',
    '!src/main.jsx',
    '!src/vite-env.d.ts',
    '!src/setupTests.js',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
  maxWorkers: '75%', // Increased from 50% for better parallelization
  clearMocks: true,
  restoreMocks: true,
  // Performance optimizations
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  // Bail on first test failure in CI mode for faster feedback
  bail: process.env.CI ? 1 : false,
  // Optimize coverage collection
  coverageProvider: 'v8', // Faster than babel
  // Reduce test discovery overhead
  haste: {
    enableSymlinks: false,
  },
};
