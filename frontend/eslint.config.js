import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import importPlugin from 'eslint-plugin-import'

export default [
  // Global ignores
  {
    ignores: ['dist/**', 'build/**', 'node_modules/**']
  },

  // Main source files
  {
    files: ['**/*.{js,jsx}'],
    ...js.configs.recommended,
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'import': importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],
      'import/no-unresolved': 'off', // Handle by TypeScript/Vite
      'import/no-extraneous-dependencies': ['error', {
        'devDependencies': [
          '**/*.test.{js,jsx}',
          '**/*.spec.{js,jsx}',
          'src/__tests__/**',
          'cypress/**',
          'src/setupTests.js',
          '*.config.{js,cjs,mjs}',
          'scripts/**'
        ]
      }],
    },
  },

  // Test files configuration (Jest)
  {
    files: [
      'src/**/*.{test,spec}.{js,jsx}',
      'src/__tests__/**/*.{js,jsx}',
      'src/setupTests.js',
      'src/__mocks__/**/*.js'
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },

  // Cypress E2E test files
  {
    files: [
      'cypress/**/*.{js,jsx}',
      'cypress.config.js'
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        cy: 'readonly',
        Cypress: 'readonly',
        expect: 'readonly',
        assert: 'readonly',
        chai: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },

  // Node.js configuration files
  {
    files: [
      '*.config.{js,cjs,mjs}',
      'scripts/**/*.js',
      'src/test-utils/**/*.js'
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
]
