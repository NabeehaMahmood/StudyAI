// backend/src/routes/adminRoutes.js
// Admin-only endpoints for user management (Rubric #9, #10, #12)

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  changeUserRole,
  toggleUserStatus,
  deleteUser,
  getAdminStats,
} = require('../controllers/adminController');

// Apply auth middleware and admin role check to all routes
router.use(protect, authorize('admin'));

// GET /api/admin/stats - Get dashboard statistics
router.get('/stats', getAdminStats);

// GET /api/admin/users - List all users
router.get('/users', getAllUsers);

// GET /api/admin/users/:id - Get single user
router.get('/users/:id', getUserById);

// PATCH /api/admin/users/:id/role - Change user role
router.patch('/users/:id/role', changeUserRole);

// PATCH /api/admin/users/:id/status - Toggle user active status
router.patch('/users/:id/status', toggleUserStatus);

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', deleteUser);

module.exports = router;
