/**
 * Standardized Application Error Class.
 * Ensures all errors follow a consistent structure for the global handler.
 */
class AppError extends Error {
  /**
   * @param {string} message - Human readable error message.
   * @param {number} statusCode - HTTP status code.
   * @param {string} errorCode - Internal error code for client-side mapping.
   */
  constructor(message, statusCode, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
