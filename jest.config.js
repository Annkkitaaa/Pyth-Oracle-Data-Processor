module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    transform: {
      '^.+\\.ts$': 'ts-jest',
    },
    collectCoverageFrom: [
      'src/**/*.ts',
      '!src/**/*.d.ts',
      '!src/scripts/**', // Exclude scripts from coverage as they're integration tests
    ],
    coverageDirectory: 'coverage',
    coverageReporters: [
      'text',
      'lcov',
      'html'
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    testTimeout: 30000, // 30 seconds for API tests
    verbose: true,
    // Global test configuration
    globals: {
      'ts-jest': {
        tsconfig: 'tsconfig.json'
      }
    },
    // Environment variables for tests
    testEnvironmentOptions: {
      NODE_ENV: 'test'
    },
    // Mock external dependencies by default
    moduleNameMapping: {
      '^@/(.*)$': '<rootDir>/src/$1'
    }
  };