import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import prettierConfig from 'eslint-config-prettier'

export default [
  // Global ignores
  {
    ignores: ['out/**', 'release/**', 'dist/**', 'node_modules/**', '*.config.js', '*.config.ts'],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript files (main + shared + renderer)
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // TypeScript handles variable scoping and type checking — disable JS-only rules
      // that produce false positives on TS globals (Buffer, process, HTMLElement, etc.)
      'no-undef': 'off',
      // Allow unused vars prefixed with _
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Allow explicit any sparingly (warn instead of error for existing code)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Disable base rule in favor of TS version
      'no-unused-vars': 'off',
    },
  },

  // React-specific rules for renderer files
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: { version: '18' },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Not needed with React 17+ JSX transform
      'react/react-in-jsx-scope': 'off',
      // Allow unescaped entities (heavily used in this project for apostrophes etc.)
      'react/no-unescaped-entities': 'warn',
    },
  },

  // Test files — relax some rules
  {
    files: ['**/__tests__/**', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'e2e/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Prettier compat — must be last to override formatting rules
  prettierConfig,
]
