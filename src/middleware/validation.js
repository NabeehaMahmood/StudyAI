// backend/src/middleware/validation.js
// Request validation middleware using express-validator

const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Validation rules for registration
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  
  body('email')
    .trim()
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/(?=.*[a-z])/).withMessage('Password must contain a lowercase letter')
    .matches(/(?=.*[A-Z])/).withMessage('Password must contain an uppercase letter')
    .matches(/(?=.*\d)/).withMessage('Password must contain a number'),
  
  body('passwordConfirm')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

/**
 * Validation rules for login
 */
const loginValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
];

/**
 * Validation rules for forgot password
 */
const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail(),
];

/**
 * Validation rules for reset password
 */
const resetPasswordValidation = [
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/(?=.*[a-z])/).withMessage('Password must contain a lowercase letter')
    .matches(/(?=.*[A-Z])/).withMessage('Password must contain an uppercase letter')
    .matches(/(?=.*\d)/).withMessage('Password must contain a number'),
  
  body('passwordConfirm')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

/**
 * Middleware to handle validation results
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format errors for client consumption
    const formattedErrors = {};
    errors.array().forEach(error => {
      formattedErrors[error.path] = error.msg;
    });
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  handleValidationErrors,
};
