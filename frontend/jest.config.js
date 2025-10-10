export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    '@fullcalendar/(.*)': '<rootDir>/node_modules/@fullcalendar/$1',
    // MSW mappings for Jest CJS resolution
  '^msw/node$': '<rootDir>/src/__tests__/__mocks__/msw-shim.js',
  '^msw$': '<rootDir>/src/__tests__/__mocks__/msw-shim.js',
    // MSW v2 Node interceptors sometimes fail to resolve on Windows; stub them in unit tests
    '^@mswjs/interceptors/(.*)$': '<rootDir>/src/__tests__/__mocks__/msw-interceptors.js',
    '^@mswjs/interceptors/fetch$': '<rootDir>/src/__tests__/__mocks__/msw-interceptors.js',
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
  maxWorkers: '50%',
  clearMocks: true,
  restoreMocks: true,
};
