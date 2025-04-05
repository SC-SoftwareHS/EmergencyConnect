/**
 * Alert model for the emergency alert system
 * Represents an emergency alert with various properties
 */
class Alert {
  constructor(id, title, message, severity, createdBy, channels = [], targeting = {}, attachments = []) {
    this.id = id;
    this.title = title;
    this.message = message;
    this.severity = severity; // 'low', 'medium', 'high', 'critical'
    this.createdBy = createdBy; // User ID who created the alert
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.channels = channels; // ['email', 'sms', 'push']
    this.status = 'pending'; // 'pending', 'sent', 'cancelled', 'failed'
    this.sentAt = null;
    this.targeting = targeting; // { roles: ['admin', 'operator'], specific: [userId1, userId2] }
    this.attachments = attachments; // URLs or data for any attachments
    this.deliveryStats = {
      total: 0,
      sent: 0,
      failed: 0,
      pending: 0
    };
  }

  /**
   * Update the alert status
   * @param {string} status - New status value
   */
  updateStatus(status) {
    const validStatuses = ['pending', 'sent', 'cancelled', 'failed'];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    this.status = status;
    
    if (status === 'sent' && !this.sentAt) {
      this.sentAt = new Date();
    }
    
    this.updatedAt = new Date();
  }

  /**
   * Update delivery statistics
   * @param {Object} stats - Statistics to update
   */
  updateDeliveryStats(stats) {
    this.deliveryStats = {
      ...this.deliveryStats,
      ...stats
    };
    this.updatedAt = new Date();
  }

  /**
   * Add a recipient to the targeting
   * @param {string} userId - User ID to add
   */
  addRecipient(userId) {
    if (!this.targeting.specific) {
      this.targeting.specific = [];
    }
    
    if (!this.targeting.specific.includes(userId)) {
      this.targeting.specific.push(userId);
      this.updatedAt = new Date();
    }
  }

  /**
   * Remove a recipient from the targeting
   * @param {string} userId - User ID to remove
   */
  removeRecipient(userId) {
    if (this.targeting.specific && this.targeting.specific.includes(userId)) {
      this.targeting.specific = this.targeting.specific.filter(id => id !== userId);
      this.updatedAt = new Date();
    }
  }
}

module.exports = Alert;
