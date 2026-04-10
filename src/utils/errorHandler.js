/**
 * Error handling utilities for eDEX-UI
 * Provides consistent error handling across the application
 */

const Logger = require("./Logger");
const logger = new Logger("errorHandler");

/**
 * Custom application error class
 */
class AppError extends Error {
  constructor(message, code = "UNKNOWN_ERROR", context = {}) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Convert error to serializable object
   * @returns {object}
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * Wrap async function with error handling
 * @param {function} fn - Async function to wrap
 * @param {string} context - Error context label
 * @returns {function} Wrapped function
 */
function wrapAsync(fn, context = "async_operation") {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error(`Error in ${context}`, {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      throw new AppError(
        `Failed during ${context}: ${error.message}`,
        error.code || "ASYNC_ERROR",
        { originalError: error.message }
      );
    }
  };
}

/**
 * Wrap sync function with error handling
 * @param {function} fn - Sync function to wrap
 * @param {string} context - Error context label
 * @returns {function} Wrapped function
 */
function wrapSync(fn, context = "sync_operation") {
  return (...args) => {
    try {
      return fn(...args);
    } catch (error) {
      logger.error(`Error in ${context}`, {
        error: error.message,
        code: error.code
      });
      throw new AppError(
        `Failed during ${context}: ${error.message}`,
        error.code || "SYNC_ERROR",
        { originalError: error.message }
      );
    }
  };
}

/**
 * Create a safe default value resolver
 * @param {function} fn - Function that might error
 * @param {*} defaultValue - Default value if error occurs
 * @returns {*} Function result or default value
 */
function safeCall(fn, defaultValue = null) {
  try {
    return fn();
  } catch (error) {
    logger.warn(`Safe call failed, using default value`, {
      error: error.message
    });
    return defaultValue;
  }
}

/**
 * Retry logic for failing operations
 * @param {function} fn - Function to retry
 * @param {object} options - Retry options
 * @returns {Promise}
 */
async function retry(fn, options = {}) {
  const {
    maxRetries = 3,
    delay = 1000,
    backoffMultiplier = 2,
    context = "retry_operation"
  } = options;

  let lastError;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      logger.warn(`${context} failed (attempt ${attempt}/${maxRetries})`, {
        error: error.message,
        nextRetryIn: currentDelay
      });

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= backoffMultiplier;
      }
    }
  }

  throw new AppError(
    `${context} failed after ${maxRetries} retries: ${lastError.message}`,
    "MAX_RETRIES_EXCEEDED",
    { lastError: lastError.message, attempts: maxRetries }
  );
}

/**
 * Handle module initialization with graceful degradation
 * @param {string} moduleName - Module name
 * @param {function} initFn - Initialization function
 * @param {*} fallbackValue - Fallback value if initialization fails
 * @returns {*} Module instance or fallback
 */
function initWithFallback(moduleName, initFn, fallbackValue = null) {
  try {
    const result = initFn();
    logger.debug(`Module ${moduleName} initialized successfully`);
    return result;
  } catch (error) {
    logger.warn(`Failed to initialize module ${moduleName}, using fallback`, {
      error: error.message
    });
    return fallbackValue;
  }
}

/**
 * Convert error to user-friendly message
 * @param {Error} error - Error to convert
 * @returns {string} User-friendly message
 */
function getErrorMessage(error) {
  if (error instanceof AppError) {
    switch (error.code) {
      case "ASYNC_ERROR":
        return "An operation failed. Please try again.";
      case "SYNC_ERROR":
        return "An unexpected error occurred.";
      case "MAX_RETRIES_EXCEEDED":
        return "Operation failed after multiple attempts. Please check your connection.";
      default:
        return error.message;
    }
  }

  if (error instanceof TypeError) {
    return "An invalid operation was attempted.";
  }

  if (error instanceof ReferenceError) {
    return "A resource was not found.";
  }

  return error.message || "An unknown error occurred.";
}

module.exports = {
  AppError,
  wrapAsync,
  wrapSync,
  safeCall,
  retry,
  initWithFallback,
  getErrorMessage
};
