const logger = require('../utils/logger');

// Basic input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Skip sanitization for OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Sanitize string inputs to prevent XSS
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };

  // Recursively sanitize object
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? sanitizeString(obj) : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized = {};
    for (const key in obj) {
      // Use Object.prototype.hasOwnProperty.call for safer property checking
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  };

  // Sanitize request body
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    try {
      req.body = sanitizeObject(req.body);
    } catch (error) {
      logger.warn('Error sanitizing request body:', error);
    }
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object' && !Array.isArray(req.query)) {
    try {
      req.query = sanitizeObject(req.query);
    } catch (error) {
      logger.warn('Error sanitizing query parameters:', error);
    }
  }

  // Sanitize params
  if (req.params && typeof req.params === 'object' && !Array.isArray(req.params)) {
    try {
      req.params = sanitizeObject(req.params);
    } catch (error) {
      logger.warn('Error sanitizing params:', error);
    }
  }

  next();
};

module.exports = sanitizeInput;

