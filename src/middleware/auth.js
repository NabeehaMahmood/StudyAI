// backend/src/middleware/auth.js
// JWT authentication and authorization middleware

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * Middleware to verify JWT token from cookie or Authorization header
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from cookies first, then from Authorization header
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Optional: fetch fresh user data from DB for each request
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return next(new AppError('User not found or account deactivated', 401));
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn(`Token expired for request: ${req.path}`);
      return next(new AppError('Token has expired', 401));
    }
    if (error.name === 'JsonWebTokenError') {
      logger.warn(`Invalid token for request: ${req.path}`);
      return next(new AppError('Invalid token', 401));
    }
    next(error);
  }
};

/**
 * Middleware to restrict access to specific roles
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt - User: ${req.user.id}, Role: ${req.user.role}, Path: ${req.path}`);
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
