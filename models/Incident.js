/**
 * Incident model for the emergency alert system
 * Represents an incident report with various properties
 */
class Incident {
  constructor(id, title, description, location, severity, reportedBy, attachments = [], relatedAlertId = null) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.location = location;
    this.severity = severity; // 'low', 'medium', 'high', 'critical'
    this.reportedBy = reportedBy; // User ID who reported the incident
    this.reportedAt = new Date();
    this.updatedAt = new Date();
    this.status = 'reported'; // 'reported', 'investigating', 'resolved', 'closed'
    this.attachments = attachments; // URLs or data for any attachments
    this.relatedAlertId = relatedAlertId; // ID of related alert, if any
    this.responses = []; // Array of response actions taken
    this.timeline = [
      {
        action: 'reported',
        timestamp: new Date(),
        userId: reportedBy,
        notes: 'Incident initially reported'
      }
    ];
  }

  /**
   * Update the incident status
   * @param {string} status - New status value
   * @param {number} userId - User ID making the update
   * @param {string} notes - Optional notes about the status change
   */
  updateStatus(status, userId, notes = '') {
    this.status = status;
    this.updatedAt = new Date();
    
    this.timeline.push({
      action: `status_changed_to_${status}`,
      timestamp: new Date(),
      userId,
      notes
    });
  }

  /**
   * Add a response action to the incident
   * @param {string} action - Description of the action taken
   * @param {number} userId - User ID taking the action
   * @param {string} notes - Additional notes about the action
   */
  addResponse(action, userId, notes = '') {
    const response = {
      action,
      timestamp: new Date(),
      userId,
      notes
    };
    
    this.responses.push(response);
    this.timeline.push({
      ...response,
      action: `response_${action}`
    });
    
    this.updatedAt = new Date();
  }

  /**
   * Create an alert from this incident
   * @param {string} alertMessage - Message for the alert
   * @param {Array} channels - Notification channels to use
   * @param {Object} targeting - Alert targeting criteria
   * @returns {Object} Alert data object
   */
  createAlertData(alertMessage, channels, targeting) {
    return {
      title: `INCIDENT ALERT: ${this.title}`,
      message: alertMessage || this.description,
      severity: this.severity,
      channels,
      targeting,
      attachments: this.attachments,
      metadata: {
        incidentId: this.id,
        location: this.location
      }
    };
  }
}

module.exports = Incident;