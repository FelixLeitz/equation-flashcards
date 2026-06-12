import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default [
  // Ignore build artifacts and generated code
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      'client/src/components/ui/**'
    ]
  },

  // Base JS recommended rules for all files
  js.configs.recommended,

  // Shared + server: Node.js environment
  {
    files: ['server/**/*.js', 'shared/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off'
    }
  },

  // Server test files: add Mocha globals
  {
    files: ['server/test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.mocha
      }
    }
  },

  // Client: browser + React
  {
    files: ['client/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser
      },
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },
    settings: {
      react: { version: 'detect' }
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'react/prop-types': 'off'
    }
  },

  // Client test files: Vitest + Testing Library globals
  {
    files: ['client/**/*.test.{js,jsx}', 'client/src/test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.vitest
      }
    }
  },

  // Prettier MUST be last — disables conflicting style rules
  prettier
];
