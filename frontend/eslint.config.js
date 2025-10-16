import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import importPlugin from 'eslint-plugin-import'
import jsxA11y from 'eslint-plugin-jsx-a11y'

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
      'jsx-a11y': jsxA11y,
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
      // Accessibility rules (subset of jsx-a11y recommended + targeted rules)
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'warn',
      'jsx-a11y/label-has-associated-control': ['error', { depth: 3 }],
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/no-autofocus': ['warn', { ignoreNonDOM: true }],
      'jsx-a11y/media-has-caption': 'warn',
      'jsx-a11y/heading-has-content': 'warn',
      'jsx-a11y/no-redundant-roles': 'warn',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/lang': 'error',
      'jsx-a11y/mouse-events-have-key-events': 'warn',
      'jsx-a11y/interactive-supports-focus': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
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
    plugins: {
      'jsx-a11y': jsxA11y,
    },
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
      // Keep a11y rules active in tests to catch violations in component snapshots
      'jsx-a11y/label-has-associated-control': ['error', { depth: 3 }],
      'jsx-a11y/aria-props': 'error',
    },
  },

  // Cypress E2E test files
  {
    files: [
      'cypress/**/*.{js,jsx}',
      'cypress.config.js'
    ],
    plugins: {
      'jsx-a11y': jsxA11y,
    },
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
      // Keep key checks but relax noise for test helpers
      'jsx-a11y/label-has-associated-control': ['warn', { depth: 2 }],
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
