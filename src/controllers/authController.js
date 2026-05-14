// backend/src/controllers/authController.js
// Authentication logic: registration, login, password reset, token refresh

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendPasswordResetEmail } = require('../services/emailService');

const logger = require('../utils/logger');

/**
 * Generate JWT token
 */
const generateToken = (id, role, expiresIn = '24h') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Send token as httpOnly cookie
 */
const sendTokenResponse = (user, statusCode, res, rememberMe = false) => {
  // Determine token expiry based on "remember me"
  const expiresIn = rememberMe ? '7d' : '24h';
  const token = generateToken(user._id, user.role, expiresIn);

  // Calculate cookie max age in milliseconds
  const maxAge = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  // Cookie options
  const cookieOptions = {
    httpOnly: true,
    secure: true, // ngrok uses HTTPS
    maxAge,
    sameSite: 'lax', // Allow cookies in cross-site requests
  };

  res.cookie('token', token, cookieOptions);

  // Return user without sensitive fields
  res.status(statusCode).json({
    success: true,
    token,
    user: user.toJSON(),
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, rememberMe } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use',
        errors: { email: 'Email already in use' },
      });
    }

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
    });

    logger.info(`User registered: ${email}`);
    sendTokenResponse(user, 201, res, rememberMe || false);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Find user and include password field (it's not selected by default)
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      logger.warn(`Failed login attempt for email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        errors: { credentials: 'Invalid email or password' },
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated',
        errors: { account: 'Your account has been deactivated' },
      });
    }

    logger.info(`User logged in: ${email}`);
    sendTokenResponse(user, 200, res, rememberMe || false);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Generate password reset token
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Please provide an email address', 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists (security best practice)
      return res.status(200).json({
        success: true,
        message: 'If that email address is in our system, we have sent password reset instructions',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save token and expiry to user document
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Build reset URL and send email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail(email, resetToken, resetUrl);
      logger.info(`Password reset email sent to ${email}`);
    } catch (emailErr) {
      // Roll back token so user can try again
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      logger.error(`Failed to send password reset email to ${email}:`, emailErr.message);
      return next(new AppError('Failed to send reset email. Please try again later.', 500));
    }

    res.status(200).json({
      success: true,
      message: 'Password reset email sent. Check your inbox.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/reset-password/:token
 * @desc    Reset password using token
 * @access  Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { password, passwordConfirm } = req.body;
    const { token } = req.params;

    if (!password || !passwordConfirm) {
      return next(new AppError('Please provide password and password confirmation', 400));
    }

    if (password !== passwordConfirm) {
      return next(new AppError('Passwords do not match', 400));
    }

    if (password.length < 8) {
      return next(new AppError('Password must be at least 8 characters', 400));
    }

    // Hash incoming token and search for user
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return next(new AppError('Password reset token is invalid or has expired', 400));
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    logger.info(`Password reset successful for user: ${user.email}`);
    sendTokenResponse(user, 200, res, false);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
exports.logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};
