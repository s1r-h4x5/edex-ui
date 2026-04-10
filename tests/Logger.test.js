/**
 * Tests for Logger utility
 */

const Logger = require("../src/utils/Logger");

describe("Logger", () => {
  let logger;

  beforeEach(() => {
    logger = new Logger("test");
    jest.clearAllMocks();
  });

  test("should create logger with namespace", () => {
    expect(logger.namespace).toBe("test");
  });

  test("should format message correctly", () => {
    const msg = logger.formatMessage("info", "test message", { key: "value" });
    expect(msg).toContain("[test]");
    expect(msg).toContain("[INFO]");
    expect(msg).toContain("test message");
  });

  test("should respect log level filtering", () => {
    logger.logLevel = "error";
    expect(logger.shouldLog("error")).toBe(true);
    expect(logger.shouldLog("warn")).toBe(false);
    expect(logger.shouldLog("info")).toBe(false);
    expect(logger.shouldLog("debug")).toBe(false);
  });

  test("should create child loggers", () => {
    const child = logger.child("module");
    expect(child.namespace).toBe("test:module");
  });

  test("should log messages without crashing", () => {
    logger.error("error");
    logger.warn("warning");
    logger.info("info");
    logger.debug("debug");
  });

  test("time() should return a function", () => {
    const stop = logger.time("operation");
    expect(typeof stop).toBe("function");
  });
});
