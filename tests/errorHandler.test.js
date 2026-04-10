/**
 * Tests for errorHandler utility
 */

const {
  AppError,
  wrapAsync,
  wrapSync,
  safeCall,
  retry,
  getErrorMessage
} = require("../src/utils/errorHandler");

describe("Error Handling Utilities", () => {
  describe("AppError", () => {
    test("should create error with code and context", () => {
      const error = new AppError("Test error", "TEST_CODE", { key: "value" });
      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_CODE");
      expect(error.context.key).toBe("value");
    });

    test("should serialize to JSON", () => {
      const error = new AppError("Test", "CODE");
      const json = error.toJSON();
      expect(json.message).toBe("Test");
      expect(json.code).toBe("CODE");
      expect(json.stack).toBeDefined();
    });
  });

  describe("wrapSync", () => {
    test("should execute function normally", () => {
      const fn = wrapSync(() => 42, "test");
      expect(fn()).toBe(42);
    });

    test("should catch and rethrow errors", () => {
      const fn = wrapSync(() => {
        throw new Error("Original error");
      }, "test");

      expect(() => fn()).toThrow(AppError);
    });
  });

  describe("wrapAsync", () => {
    test("should execute async function", async () => {
      const fn = wrapAsync(async () => 42, "test");
      const result = await fn();
      expect(result).toBe(42);
    });

    test("should catch async errors", async () => {
      const fn = wrapAsync(async () => {
        throw new Error("Async error");
      }, "test");

      await expect(fn()).rejects.toThrow(AppError);
    });
  });

  describe("safeCall", () => {
    test("should return function result", () => {
      const result = safeCall(() => "success");
      expect(result).toBe("success");
    });

    test("should return default on error", () => {
      const result = safeCall(() => {
        throw new Error();
      }, "default");
      expect(result).toBe("default");
    });
  });

  describe("retry", () => {
    test("should succeed on first attempt", async () => {
      const fn = jest.fn().mockResolvedValueOnce("success");
      const result = await retry(fn, { maxRetries: 3 });
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test("should retry on failure", async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error("Fail 1"))
        .mockRejectedValueOnce(new Error("Fail 2"))
        .mockResolvedValueOnce("success");

      const result = await retry(fn, { maxRetries: 3, delay: 0 });
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    test("should fail after max retries", async () => {
      const fn = jest.fn().mockRejectedValue(new Error("Always fails"));
      await expect(
        retry(fn, { maxRetries: 2, delay: 0 })
      ).rejects.toThrow("MAX_RETRIES_EXCEEDED");
    });
  });

  describe("getErrorMessage", () => {
    test("should convert AppError", () => {
      const error = new AppError("Test", "ASYNC_ERROR");
      const msg = getErrorMessage(error);
      expect(msg).toContain("operation failed");
    });

    test("should handle TypeError", () => {
      const error = new TypeError("Cannot read property");
      const msg = getErrorMessage(error);
      expect(msg).toContain("invalid operation");
    });
  });
});
