// backend/src/middleware/requestLogger.js
// Logs every incoming request with timing and sanitizes sensitive fields

const logger = require('../utils/logger');

/**
 * Sanitize request body to remove sensitive fields
 */
const sanitizeBody = (body) => {
  if (!body) return body;

  const sanitized = { ...body };
  const sensitiveFields = [
    'password',
    'passwordConfirm',
    'resetPasswordToken',
    'resetPasswordExpires',
  ];

  sensitiveFields.forEach((field) => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
};

const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request with sanitized body
  const sanitizedBody = sanitizeBody(req.body);
  if (Object.keys(sanitizedBody).length > 0) {
    logger.debug(`${req.method} ${req.originalUrl} - Body: ${JSON.stringify(sanitizedBody)}`);
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
};

module.exports = requestLogger;
