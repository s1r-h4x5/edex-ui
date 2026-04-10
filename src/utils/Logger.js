#!/usr/bin/env node

/**
 * Logging utility for eDEX-UI
 * Provides structured logging with log levels and context
 */

class Logger {
  constructor(namespace = "edex-ui") {
    this.namespace = namespace;
    this.logLevel = process.env.LOG_LEVEL || "info";
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  /**
   * Format timestamp for logs
   * @returns {string} ISO timestamp
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Check if message should be logged based on level
   * @param {string} level - Log level
   * @returns {boolean}
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  /**
   * Format log message with context
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {object} context - Additional context
   * @returns {string} Formatted message
   */
  formatMessage(level, message, context = {}) {
    const timestamp = this.getTimestamp();
    const contextStr = Object.keys(context).length > 0
      ? ` ${JSON.stringify(context)}`
      : "";
    return `[${timestamp}] [${this.namespace}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {object} context - Additional context
   */
  error(message, context = {}) {
    if (this.shouldLog("error")) {
      const formatted = this.formatMessage("error", message, context);
      process.stderr.write(formatted + "\n");
    }
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {object} context - Additional context
   */
  warn(message, context = {}) {
    if (this.shouldLog("warn")) {
      const formatted = this.formatMessage("warn", message, context);
      console.warn(formatted);
    }
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {object} context - Additional context
   */
  info(message, context = {}) {
    if (this.shouldLog("info")) {
      const formatted = this.formatMessage("info", message, context);
      console.log(formatted);
    }
  }

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {object} context - Additional context
   */
  debug(message, context = {}) {
    if (this.shouldLog("debug")) {
      const formatted = this.formatMessage("debug", message, context);
      console.log(formatted);
    }
  }

  /**
   * Time an async operation
   * @param {string} label - Operation label
   * @returns {function} Stop timer function
   */
  time(label) {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(`${label} completed`, { durationMs: duration });
    };
  }

  /**
   * Create a child logger with additional namespace
   * @param {string} childNamespace - Child namespace
   * @returns {Logger} Child logger
   */
  child(childNamespace) {
    return new Logger(`${this.namespace}:${childNamespace}`);
  }
}

module.exports = Logger;
