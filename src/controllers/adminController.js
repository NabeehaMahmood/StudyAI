// backend/src/controllers/adminController.js
// Admin endpoints for user management (Rubric #9, #10)

const User = require('../models/User');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    // Fetch all users excluding passwords
    const users = await User.find().select('-password -resetPasswordToken -resetPasswordExpires');

    res.status(200).json({
      success: true,
      total: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get single user by ID (admin only)
 * @access  Private/Admin
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/admin/users/:id/role
 * @desc    Change user role (user <-> admin)
 * @access  Private/Admin
 */
exports.changeUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!['user', 'admin'].includes(role)) {
      return next(new AppError('Invalid role. Must be "user" or "admin"', 400));
    }

    // Don't allow changing own role
    if (req.user.id.toString() === id) {
      return next(new AppError('You cannot change your own role', 400));
    }

    const user = await User.findById(id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    logger.info(`Admin ${req.user.id} changed user ${id} role from ${oldRole} to ${role}`);

    res.status(200).json({
      success: true,
      message: `User role changed from ${oldRole} to ${role}`,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/admin/users/:id/status
 * @desc    Toggle user active status (activate/deactivate)
 * @access  Private/Admin
 */
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Don't allow deactivating own account
    if (req.user.id.toString() === id) {
      return next(new AppError('You cannot deactivate your own account', 400));
    }

    const user = await User.findById(id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const oldStatus = user.isActive;
    user.isActive = !user.isActive;
    await user.save();

    logger.info(
      `Admin ${req.user.id} ${user.isActive ? 'activated' : 'deactivated'} user ${id}`
    );

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete a user (admin only)
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Don't allow deleting own account
    if (req.user.id.toString() === id) {
      return next(new AppError('You cannot delete your own account', 400));
    }

    const user = await User.findById(id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    await User.findByIdAndDelete(id);

    logger.info(`Admin ${req.user.id} deleted user ${id}`);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/stats
 * @desc    Get admin dashboard statistics
 * @access  Private/Admin
 */
exports.getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const regularUsers = await User.countDocuments({ role: 'user' });
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        adminUsers,
        regularUsers,
        activeUsers,
        inactiveUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};
