/**
 * Alert controller for the emergency alert system
 */
const { alertDB, userDB, subscriptionDB } = require('../utils/database');
const { validateAlertData } = require('../utils/validators');
const notificationService = require('../services/notificationService');

/**
 * Create a new alert
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createAlert = async (req, res) => {
  const alertData = req.body;
  
  // Add creator ID
  alertData.createdBy = req.user.id;
  
  // Validate alert data
  const validation = validateAlertData(alertData);
  
  // If validation fails, return bad request
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid alert data.',
      errors: validation.errors
    });
  }
  
  try {
    // Create alert
    const newAlert = alertDB.create(alertData);
    
    // Identify recipients based on targeting
    const recipients = await identifyRecipients(alertData.targeting);
    
    // Send notifications
    const notificationResults = await notificationService.sendAlertNotifications(
      newAlert,
      recipients
    );
    
    // Update alert with delivery statistics
    const stats = {
      total: recipients.length,
      sent: notificationResults.filter(r => r.success).length,
      failed: notificationResults.filter(r => !r.success).length,
      pending: 0
    };
    
    newAlert.updateDeliveryStats(stats);
    newAlert.updateStatus('sent');
    
    // Notify connected clients via Socket.io
    req.io.emit('newAlert', {
      alert: newAlert
    });
    
    // Send targeted notifications to specific users
    recipients.forEach(user => {
      req.io.to(`user-${user.id}`).emit('personalAlert', {
        alert: newAlert
      });
    });
    
    // Return success with alert data
    res.status(201).json({
      success: true,
      message: 'Alert created and sent successfully.',
      data: {
        alert: newAlert,
        stats
      }
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to create and send alert.',
      error: error.message
    });
  }
};

/**
 * Get all alerts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllAlerts = (req, res) => {
  // Get query parameters
  const { status, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  
  // Get all alerts
  let alerts = alertDB.getAll();
  
  // Filter by status if provided
  if (status) {
    alerts = alerts.filter(alert => alert.status === status);
  }
  
  // Sort alerts
  alerts.sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  // Limit results
  alerts = alerts.slice(0, parseInt(limit));
  
  // Return success with alerts
  res.json({
    success: true,
    data: {
      alerts,
      total: alerts.length
    }
  });
};

/**
 * Get an alert by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAlertById = (req, res) => {
  const { id } = req.params;
  
  // Find alert
  const alert = alertDB.findById(parseInt(id));
  
  // If alert not found, return not found
  if (!alert) {
    return res.status(404).json({
      success: false,
      message: `Alert with ID ${id} not found.`
    });
  }
  
  // Return success with alert
  res.json({
    success: true,
    data: {
      alert
    }
  });
};

/**
 * Update an alert
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateAlert = (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Find alert
  const alert = alertDB.findById(parseInt(id));
  
  // If alert not found, return not found
  if (!alert) {
    return res.status(404).json({
      success: false,
      message: `Alert with ID ${id} not found.`
    });
  }
  
  // If alert is already sent, prevent certain updates
  if (alert.status === 'sent' && (updates.title || updates.message || updates.severity || updates.channels)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot modify core details of an alert that has already been sent.'
    });
  }
  
  // Update alert
  const updatedAlert = alertDB.update(parseInt(id), updates);
  
  // Return success with updated alert
  res.json({
    success: true,
    message: 'Alert updated successfully.',
    data: {
      alert: updatedAlert
    }
  });
};

/**
 * Delete an alert
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteAlert = (req, res) => {
  const { id } = req.params;
  
  // Find alert
  const alert = alertDB.findById(parseInt(id));
  
  // If alert not found, return not found
  if (!alert) {
    return res.status(404).json({
      success: false,
      message: `Alert with ID ${id} not found.`
    });
  }
  
  // Delete alert
  alertDB.delete(parseInt(id));
  
  // Return success
  res.json({
    success: true,
    message: 'Alert deleted successfully.'
  });
};

/**
 * Cancel an alert
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const cancelAlert = (req, res) => {
  const { id } = req.params;
  
  // Find alert
  const alert = alertDB.findById(parseInt(id));
  
  // If alert not found, return not found
  if (!alert) {
    return res.status(404).json({
      success: false,
      message: `Alert with ID ${id} not found.`
    });
  }
  
  // If alert is already sent and it's been more than 5 minutes, prevent cancellation
  if (alert.status === 'sent' && alert.sentAt) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    if (alert.sentAt < fiveMinutesAgo) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an alert that was sent more than 5 minutes ago.'
      });
    }
  }
  
  // Update alert status to cancelled
  alert.updateStatus('cancelled');
  
  // Notify connected clients via Socket.io
  req.io.emit('alertCancelled', {
    alertId: alert.id
  });
  
  // Return success with updated alert
  res.json({
    success: true,
    message: 'Alert cancelled successfully.',
    data: {
      alert
    }
  });
};

/**
 * Get analytics for alerts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAlertAnalytics = (req, res) => {
  const alerts = alertDB.getAll();
  
  // Calculate overall statistics
  const totalAlerts = alerts.length;
  const sentAlerts = alerts.filter(alert => alert.status === 'sent').length;
  const cancelledAlerts = alerts.filter(alert => alert.status === 'cancelled').length;
  const failedAlerts = alerts.filter(alert => alert.status === 'failed').length;
  const pendingAlerts = alerts.filter(alert => alert.status === 'pending').length;
  
  // Calculate delivery statistics
  const deliveryStats = alerts.reduce(
    (stats, alert) => {
      stats.totalRecipients += alert.deliveryStats.total;
      stats.sentNotifications += alert.deliveryStats.sent;
      stats.failedNotifications += alert.deliveryStats.failed;
      stats.pendingNotifications += alert.deliveryStats.pending;
      return stats;
    },
    {
      totalRecipients: 0,
      sentNotifications: 0,
      failedNotifications: 0,
      pendingNotifications: 0
    }
  );
  
  // Calculate success rate
  const successRate = deliveryStats.totalRecipients > 0
    ? (deliveryStats.sentNotifications / deliveryStats.totalRecipients) * 100
    : 0;
  
  // Group alerts by severity
  const severityCounts = alerts.reduce(
    (counts, alert) => {
      counts[alert.severity] = (counts[alert.severity] || 0) + 1;
      return counts;
    },
    {}
  );
  
  // Group alerts by channel
  const channelCounts = {};
  alerts.forEach(alert => {
    alert.channels.forEach(channel => {
      channelCounts[channel] = (channelCounts[channel] || 0) + 1;
    });
  });
  
  // Return success with analytics
  res.json({
    success: true,
    data: {
      alertCounts: {
        total: totalAlerts,
        sent: sentAlerts,
        cancelled: cancelledAlerts,
        failed: failedAlerts,
        pending: pendingAlerts
      },
      deliveryStats: {
        ...deliveryStats,
        successRate: successRate.toFixed(2)
      },
      severityCounts,
      channelCounts
    }
  });
};

/**
 * Identify recipients based on targeting criteria
 * @param {Object} targeting - Targeting criteria
 * @returns {Array} Array of recipient users
 */
const identifyRecipients = async (targeting) => {
  const recipients = new Set();
  
  // Get all users
  const allUsers = userDB.getAll();
  
  // If targeting specific users, add them to recipients
  if (targeting.specific && Array.isArray(targeting.specific)) {
    targeting.specific.forEach(userId => {
      const user = userDB.findById(parseInt(userId));
      if (user) {
        recipients.add(user);
      }
    });
  }
  
  // If targeting roles, add users with those roles to recipients
  if (targeting.roles && Array.isArray(targeting.roles)) {
    allUsers.forEach(user => {
      if (targeting.roles.includes(user.role)) {
        recipients.add(user);
      }
    });
  }
  
  // Convert Set to Array
  return Array.from(recipients);
};

/**
 * Acknowledge an alert
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const acknowledgeAlert = async (req, res) => {
  const { alertId } = req.params;
  const userId = req.user.id;
  
  try {
    // Get alert by ID
    const alert = alertDB.findById(alertId);
    
    // If alert not found, return not found
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found.'
      });
    }
    
    // Check if the alert is in a state that can be acknowledged
    if (alert.status !== 'sent') {
      return res.status(400).json({
        success: false,
        message: `Alert cannot be acknowledged in '${alert.status}' status.`
      });
    }
    
    // Add acknowledgment to the alert
    const isAdded = alert.addAcknowledgment(userId);
    
    // If already acknowledged, return conflict
    if (!isAdded) {
      return res.status(409).json({
        success: false,
        message: 'You have already acknowledged this alert.'
      });
    }
    
    // Update alert in database
    alertDB.update(alert);
    
    // Notify connected clients via Socket.io
    req.io.emit('alertAcknowledged', {
      alertId: alert.id,
      userId: userId,
      timestamp: new Date()
    });
    
    // Return success with acknowledgment details
    res.json({
      success: true,
      message: 'Alert acknowledged successfully.',
      data: {
        alertId: alert.id,
        acknowledgedAt: new Date(),
        acknowledgmentStats: alert.getAcknowledgmentStats()
      }
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge alert.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createAlert,
  getAllAlerts,
  getAlertById,
  updateAlert,
  deleteAlert,
  cancelAlert,
  getAlertAnalytics,
  acknowledgeAlert
};
