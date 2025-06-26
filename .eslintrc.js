module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
      'eslint:recommended',
      '@typescript-eslint/recommended',
    ],
    plugins: ['@typescript-eslint'],
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      project: './tsconfig.json'
    },
    env: {
      node: true,
      es6: true,
      jest: true
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-const': 'error',
      
      // General rules
      'no-console': 'off', // We use console extensively for logging
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-spacing': 'error',
      'no-multiple-empty-lines': ['error', { max: 2 }],
      'comma-dangle': ['error', 'never'],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { allowTemplateLiterals: true }],
      'indent': ['error', 2],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',
      
      // Import/export rules
      'no-duplicate-imports': 'error',
      
      // Error handling
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
      
      // Performance
      'no-await-in-loop': 'warn',
      
      // Best practices
      'eqeqeq': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-return-assign': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unused-expressions': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'prefer-regex-literals': 'error',
      'yoda': 'error'
    },
    overrides: [
      {
        // Test files can be more lenient
        files: ['**/*.test.ts', '**/*.spec.ts', 'tests/**/*.ts'],
        rules: {
          '@typescript-eslint/no-explicit-any': 'off',
          '@typescript-eslint/no-non-null-assertion': 'off',
          'no-unused-expressions': 'off' // Jest matchers can trigger this
        }
      },
      {
        // Configuration files
        files: ['*.config.js', '.eslintrc.js', 'jest.config.js'],
        env: {
          node: true
        },
        rules: {
          '@typescript-eslint/no-var-requires': 'off'
        }
      }
    ],
    ignorePatterns: [
      'dist/',
      'coverage/',
      'node_modules/',
      '*.js' // Ignore JS files in root (config files are handled by overrides)
    ]
  };