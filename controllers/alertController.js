/**
 * Alert controller for the emergency alert system
 */
const { alertDB, userDB, subscriptionDB } = require('../services/databaseService');
const { validateAlertData } = require('../utils/validators');
const notificationService = require('../services/notificationService');
const templateService = require('../services/templateService');

/**
 * Create a new alert
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createAlert = async (req, res) => {
  const alertData = req.body;
  
  // Add creator ID
  alertData.createdBy = req.user.id;
  
  // Check if alert is from a template
  const fromTemplate = req.templateId ? true : false;
  
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
    // Add sentAt if sending immediately
    if (alertData.status === 'sent' || !alertData.status) {
      alertData.sentAt = new Date();
      alertData.status = 'sent';
    }
    
    // If using a template, add a reference to the template
    if (fromTemplate) {
      alertData.fromTemplate = {
        id: req.templateId,
        usedAt: new Date().toISOString()
      };
    }
    
    // Create alert
    const newAlert = await alertDB.create(alertData);
    
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
    
    // Update alert with delivery stats
    await alertDB.update(newAlert.id, { 
      deliveryStats: stats
    });
    
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
      message: fromTemplate ? 'Alert created from template and sent successfully.' : 'Alert created and sent successfully.',
      data: {
        alert: newAlert,
        stats,
        fromTemplate: fromTemplate ? { id: req.templateId } : undefined
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
const getAllAlerts = async (req, res) => {
  try {
    // Get query parameters
    const { status, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Get all alerts - filtering will be done in the database when possible
    let alerts;
    
    if (status) {
      alerts = await alertDB.getAllByStatus(status);
    } else {
      alerts = await alertDB.getAll();
    }
    
    // Sort alerts - database handles this, but we still process here for flexibility
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
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve alerts.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get an alert by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAlertById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find alert
    const alert = await alertDB.findById(parseInt(id));
    
    // If alert not found, return not found
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: `Alert with ID ${id} not found.`
      });
    }
    
    // Get acknowledgments for this alert
    const acknowledgments = await alertDB.getAcknowledgments(parseInt(id));
    
    // Return success with alert and acknowledgments
    res.json({
      success: true,
      data: {
        alert,
        acknowledgments
      }
    });
  } catch (error) {
    console.error('Error retrieving alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve alert.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update an alert
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Find alert
    const alert = await alertDB.findById(parseInt(id));
    
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
    const updatedAlert = await alertDB.update(parseInt(id), updates);
    
    // Return success with updated alert
    res.json({
      success: true,
      message: 'Alert updated successfully.',
      data: {
        alert: updatedAlert
      }
    });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update alert.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete an alert
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find alert
    const alert = await alertDB.findById(parseInt(id));
    
    // If alert not found, return not found
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: `Alert with ID ${id} not found.`
      });
    }
    
    // Delete alert
    const deleted = await alertDB.delete(parseInt(id));
    
    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete alert.'
      });
    }
    
    // Return success
    res.json({
      success: true,
      message: 'Alert deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete alert.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Cancel an alert
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const cancelAlert = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find alert
    const alert = await alertDB.findById(parseInt(id));
    
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
      
      if (new Date(alert.sentAt) < fiveMinutesAgo) {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel an alert that was sent more than 5 minutes ago.'
        });
      }
    }
    
    // Update alert status to cancelled
    const updatedAlert = await alertDB.update(parseInt(id), {
      status: 'cancelled',
      cancelledAt: new Date()
    });
    
    // Notify connected clients via Socket.io
    req.io.emit('alertCancelled', {
      alertId: alert.id
    });
    
    // Return success with updated alert
    res.json({
      success: true,
      message: 'Alert cancelled successfully.',
      data: {
        alert: updatedAlert
      }
    });
  } catch (error) {
    console.error('Error cancelling alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel alert.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get analytics for alerts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAlertAnalytics = async (req, res) => {
  try {
    // Get query parameters for possible filtering
    const { startDate, endDate } = req.query;
    
    // Get alerts, possibly filtered by date range
    const alerts = await alertDB.getAll();
    
    // Calculate overall statistics
    const totalAlerts = alerts.length;
    const sentAlerts = alerts.filter(alert => alert.status === 'sent').length;
    const cancelledAlerts = alerts.filter(alert => alert.status === 'cancelled').length;
    const failedAlerts = alerts.filter(alert => alert.status === 'failed').length;
    const pendingAlerts = alerts.filter(alert => alert.status === 'pending').length;
    
    // Calculate delivery statistics
    const deliveryStats = alerts.reduce(
      (stats, alert) => {
        if (alert.deliveryStats) {
          stats.totalRecipients += alert.deliveryStats.total || 0;
          stats.sentNotifications += alert.deliveryStats.sent || 0;
          stats.failedNotifications += alert.deliveryStats.failed || 0;
          stats.pendingNotifications += alert.deliveryStats.pending || 0;
        }
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
        if (alert.severity) {
          counts[alert.severity] = (counts[alert.severity] || 0) + 1;
        }
        return counts;
      },
      {}
    );
    
    // Group alerts by channel
    const channelCounts = {};
    alerts.forEach(alert => {
      if (alert.channels && Array.isArray(alert.channels)) {
        alert.channels.forEach(channel => {
          channelCounts[channel] = (channelCounts[channel] || 0) + 1;
        });
      }
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
  } catch (error) {
    console.error('Error retrieving alert analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve alert analytics.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Identify recipients based on targeting criteria
 * @param {Object} targeting - Targeting criteria
 * @returns {Array} Array of recipient users
 */
const identifyRecipients = async (targeting) => {
  const recipients = new Set();
  
  // Get all users
  const allUsers = await userDB.getAll();
  
  // If targeting specific users, add them to recipients
  if ((targeting.specific && Array.isArray(targeting.specific)) || 
      (targeting.userIds && Array.isArray(targeting.userIds))) {
    
    // Support both 'specific' and 'userIds' for backward compatibility
    const userIdList = targeting.userIds || targeting.specific;
    
    // Process user IDs in parallel
    const userPromises = userIdList.map(async (userId) => {
      const user = await userDB.findById(parseInt(userId));
      if (user) {
        recipients.add(user);
      }
    });
    
    await Promise.all(userPromises);
  }
  
  // If targeting roles, add users with those roles to recipients
  if (targeting.roles && Array.isArray(targeting.roles)) {
    // Process each role separately for efficiency
    for (const role of targeting.roles) {
      const roleUsers = await userDB.getAllByRole(role);
      roleUsers.forEach(user => recipients.add(user));
    }
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
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    // Get alert by ID
    const alert = await alertDB.findById(parseInt(id));
    
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
    
    // Check if already acknowledged
    const existingAck = await alertDB.hasUserAcknowledged(parseInt(id), userId);
    
    // If already acknowledged, return conflict
    if (existingAck) {
      return res.status(409).json({
        success: false,
        message: 'You have already acknowledged this alert.'
      });
    }
    
    // Add acknowledgment to the alert
    const acknowledgedAt = new Date();
    const notes = req.body.notes || 'Acknowledged via API';
    await alertDB.addAcknowledgment(parseInt(id), userId, notes);
    
    // Get updated acknowledgment stats
    const acknowledgments = await alertDB.getAcknowledgments(parseInt(id));
    
    // Notify connected clients via Socket.io
    req.io.emit('alertAcknowledged', {
      alertId: parseInt(id),
      userId: userId,
      timestamp: acknowledgedAt
    });
    
    // Return success with acknowledgment details
    res.json({
      success: true,
      message: 'Alert acknowledged successfully.',
      data: {
        alertId: parseInt(id),
        acknowledgedAt,
        acknowledgments
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
