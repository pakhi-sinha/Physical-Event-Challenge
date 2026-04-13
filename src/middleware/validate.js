const { validationResult } = require('express-validator');

/**
 * Middleware to handle express-validator result and return standard error response.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'ValidationError',
      details: errors.array() 
    });
  }
  next();
};

module.exports = validate;
