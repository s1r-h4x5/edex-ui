/**
 * Jest setup file
 * Configures test environment and global test utilities
 */

// Mock electron for tests
jest.mock("electron", () => ({
  app: {
    getPath: jest.fn((type) => {
      const paths = {
        userData: "./test-user-data",
        desktop: "./test-desktop"
      };
      return paths[type] || "./test-tmp";
    })
  },
  ipcRenderer: {
    send: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    removeListener: jest.fn()
  },
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn()
  }
}));

// Set test environment variables
process.env.NODE_ENV = "test";

// Suppress console during tests (optional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
