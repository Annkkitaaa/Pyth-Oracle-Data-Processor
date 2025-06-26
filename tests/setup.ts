// Jest setup file for global test configuration

// Set longer timeout for integration tests
jest.setTimeout(30000);

// Mock console methods in tests to reduce noise
const originalConsole = global.console;

beforeEach(() => {
  // Restore console for each test
  global.console = originalConsole;
});

// Helper to suppress console output in tests
export function suppressConsole() {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}

// Helper to restore console output
export function restoreConsole() {
  global.console = originalConsole;
}

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidHexString(): R;
      toBeValidPriceFeedId(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidHexString(received: string) {
    const pass = typeof received === 'string' && /^0x[a-fA-F0-9]+$/.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid hex string`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid hex string (0x followed by hex characters)`,
        pass: false,
      };
    }
  },
  
  toBeValidPriceFeedId(received: string) {
    const pass = typeof received === 'string' && /^0x[a-fA-F0-9]{64}$/.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid Pyth price feed ID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid Pyth price feed ID (0x followed by 64 hex characters)`,
        pass: false,
      };
    }
  },
});

// Environment setup for tests
process.env.NODE_ENV = 'test';

// Prevent tests from creating actual files
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockRejectedValue(new Error('File not found in test environment')),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

// Default to not running integration tests unless explicitly requested
if (!process.env.RUN_INTEGRATION_TESTS) {
  process.env.RUN_INTEGRATION_TESTS = 'false';
}