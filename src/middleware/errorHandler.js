// backend/src/middleware/errorHandler.js
// Centralized error handling middleware

const logger = require('../utils/logger');

const errorHandler = (err, req, res, _next) => {
  logger.error(`${err.message}`, { stack: err.stack, path: req.path });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, error: 'Validation Error', details: messages });
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, error: 'File too large' });
  }

  // Custom operational errors
  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }

  // Unhandled → 500
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
