/**
 * User routes for the emergency alert system
 */
const express = require('express');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateNotificationPreferences,
  getUserSubscription,
  updateUserSubscription,
  registerPushToken
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/users
 * @desc Get all users
 * @access Private (admin)
 */
router.get(
  '/',
  authenticate,
  authorize(['admin']),
  getAllUsers
);

/**
 * @route GET /api/users/:id
 * @desc Get a user by ID
 * @access Private (admin or self)
 */
router.get(
  '/:id',
  authenticate,
  (req, res, next) => {
    const userId = parseInt(req.params.id);
    // Allow access if user is admin or requesting their own data
    if (req.user.isAdmin() || req.user.id === userId) {
      return next();
    }
    res.status(403).json({
      success: false,
      message: 'You can only access your own user data unless you are an admin.'
    });
  },
  getUserById
);

/**
 * @route POST /api/users
 * @desc Create a new user
 * @access Private (admin)
 */
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  createUser
);

/**
 * @route PUT /api/users/:id
 * @desc Update a user
 * @access Private (admin or self)
 */
router.put(
  '/:id',
  authenticate,
  (req, res, next) => {
    const userId = parseInt(req.params.id);
    // Allow access if user is admin or updating their own data
    if (req.user.isAdmin() || req.user.id === userId) {
      return next();
    }
    res.status(403).json({
      success: false,
      message: 'You can only update your own user data unless you are an admin.'
    });
  },
  updateUser
);

/**
 * @route DELETE /api/users/:id
 * @desc Delete a user
 * @access Private (admin)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  deleteUser
);

/**
 * @route PUT /api/users/:id/notifications
 * @desc Update user notification preferences
 * @access Private (admin or self)
 */
router.put(
  '/:id/notifications',
  authenticate,
  (req, res, next) => {
    const userId = parseInt(req.params.id);
    // Allow access if user is admin or updating their own data
    if (req.user.isAdmin() || req.user.id === userId) {
      return next();
    }
    res.status(403).json({
      success: false,
      message: 'You can only update your own notification preferences unless you are an admin.'
    });
  },
  updateNotificationPreferences
);

/**
 * @route GET /api/users/:id/subscription
 * @desc Get user subscription
 * @access Private (admin or self)
 */
router.get(
  '/:id/subscription',
  authenticate,
  (req, res, next) => {
    const userId = parseInt(req.params.id);
    // Allow access if user is admin or requesting their own data
    if (req.user.isAdmin() || req.user.id === userId) {
      return next();
    }
    res.status(403).json({
      success: false,
      message: 'You can only access your own subscription data unless you are an admin.'
    });
  },
  getUserSubscription
);

/**
 * @route PUT /api/users/:id/subscription
 * @desc Update user subscription
 * @access Private (admin or self)
 */
router.put(
  '/:id/subscription',
  authenticate,
  (req, res, next) => {
    const userId = parseInt(req.params.id);
    // Allow access if user is admin or updating their own data
    if (req.user.isAdmin() || req.user.id === userId) {
      return next();
    }
    res.status(403).json({
      success: false,
      message: 'You can only update your own subscription data unless you are an admin.'
    });
  },
  updateUserSubscription
);

/**
 * @route POST /api/users/:id/push-token
 * @desc Register a push notification token for a user
 * @access Private (admin or self)
 */
router.post(
  '/:id/push-token',
  authenticate,
  (req, res, next) => {
    const userId = parseInt(req.params.id);
    // Allow access if user is admin or updating their own data
    if (req.user.isAdmin() || req.user.id === userId) {
      return next();
    }
    res.status(403).json({
      success: false,
      message: 'You can only register a push token for your own account unless you are an admin.'
    });
  },
  registerPushToken
);

module.exports = router;
