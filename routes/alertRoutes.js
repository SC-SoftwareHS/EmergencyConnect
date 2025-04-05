/**
 * Alert routes for the emergency alert system
 */
const express = require('express');
const {
  createAlert,
  getAllAlerts,
  getAlertById,
  updateAlert,
  deleteAlert,
  cancelAlert,
  getAlertAnalytics
} = require('../controllers/alertController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @route POST /api/alerts
 * @desc Create a new alert
 * @access Private (admin, operator)
 */
router.post(
  '/',
  authenticate,
  authorize(['admin', 'operator']),
  createAlert
);

/**
 * @route GET /api/alerts
 * @desc Get all alerts
 * @access Private
 */
router.get(
  '/',
  authenticate,
  getAllAlerts
);

/**
 * @route GET /api/alerts/analytics
 * @desc Get alert analytics
 * @access Private (admin)
 */
router.get(
  '/analytics',
  authenticate,
  authorize(['admin']),
  getAlertAnalytics
);

/**
 * @route GET /api/alerts/:id
 * @desc Get an alert by ID
 * @access Private
 */
router.get(
  '/:id',
  authenticate,
  getAlertById
);

/**
 * @route PUT /api/alerts/:id
 * @desc Update an alert
 * @access Private (admin, operator)
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'operator']),
  updateAlert
);

/**
 * @route DELETE /api/alerts/:id
 * @desc Delete an alert
 * @access Private (admin)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  deleteAlert
);

/**
 * @route POST /api/alerts/:id/cancel
 * @desc Cancel an alert
 * @access Private (admin, operator)
 */
router.post(
  '/:id/cancel',
  authenticate,
  authorize(['admin', 'operator']),
  cancelAlert
);

module.exports = router;
