const rateLimit = require('express-rate-limit');

/**
 * Standard API rate limiter for venue-related endpoints.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: 'RateLimitExceeded',
    message: 'Too many requests from this IP, please try again after 15 minutes.' 
  }
});

/**
 * Stricter limiter for administrative or sensitive operations.
 */
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { 
    error: 'StrictRateLimitExceeded',
    message: 'Administrative limit reached. Please try again in an hour.' 
  }
});

module.exports = { apiLimiter, strictLimiter };
