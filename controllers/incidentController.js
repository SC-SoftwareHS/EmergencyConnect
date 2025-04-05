/**
 * Incident controller for the emergency alert system
 */
const { incidentDB, alertDB, userDB } = require('../utils/database');
const notificationService = require('../services/notificationService');

/**
 * Create a new incident
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createIncident = async (req, res) => {
  const incidentData = req.body;
  
  // Add reporter ID
  incidentData.reportedBy = req.user.id;
  
  // Basic validation
  if (!incidentData.title || !incidentData.description || !incidentData.severity) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields.',
      errors: {
        title: !incidentData.title ? 'Title is required.' : null,
        description: !incidentData.description ? 'Description is required.' : null,
        severity: !incidentData.severity ? 'Severity is required.' : null
      }
    });
  }
  
  try {
    // Create incident
    const newIncident = incidentDB.create(incidentData);
    
    // Notify admins and operators about the new incident via Socket.io
    req.io.to('admin').emit('newIncident', {
      incident: newIncident
    });
    
    req.io.to('operator').emit('newIncident', {
      incident: newIncident
    });
    
    // Return success with incident data
    res.status(201).json({
      success: true,
      message: 'Incident reported successfully.',
      data: {
        incident: newIncident
      }
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to report incident.',
      error: error.message
    });
  }
};

/**
 * Get all incidents
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllIncidents = (req, res) => {
  // Get query parameters
  const { status, limit = 10, sortBy = 'reportedAt', sortOrder = 'desc' } = req.query;
  
  // Get all incidents
  let incidents = incidentDB.getAll();
  
  // Filter by status if provided
  if (status) {
    incidents = incidents.filter(incident => incident.status === status);
  }
  
  // Sort incidents
  incidents.sort((a, b) => {
    if (sortOrder === 'asc') {
      return a[sortBy] > b[sortBy] ? 1 : -1;
    } else {
      return a[sortBy] < b[sortBy] ? 1 : -1;
    }
  });
  
  // Limit the number of results
  if (limit) {
    incidents = incidents.slice(0, parseInt(limit));
  }
  
  res.status(200).json({
    success: true,
    data: {
      incidents,
      total: incidents.length
    }
  });
};

/**
 * Get an incident by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getIncidentById = (req, res) => {
  const { id } = req.params;
  
  // Find incident by ID
  const incident = incidentDB.findById(parseInt(id));
  
  if (incident) {
    res.status(200).json({
      success: true,
      data: {
        incident
      }
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Incident not found.'
    });
  }
};

/**
 * Update an incident
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateIncident = (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Find incident by ID
  const incident = incidentDB.findById(parseInt(id));
  
  if (!incident) {
    return res.status(404).json({
      success: false,
      message: 'Incident not found.'
    });
  }
  
  try {
    // Update incident
    const updatedIncident = incidentDB.update(parseInt(id), updates);
    
    // Notify admins and operators about the updated incident via Socket.io
    req.io.to('admin').emit('incidentUpdated', {
      incident: updatedIncident
    });
    
    req.io.to('operator').emit('incidentUpdated', {
      incident: updatedIncident
    });
    
    res.status(200).json({
      success: true,
      message: 'Incident updated successfully.',
      data: {
        incident: updatedIncident
      }
    });
  } catch (error) {
    console.error('Error updating incident:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update incident.',
      error: error.message
    });
  }
};

/**
 * Update incident status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateIncidentStatus = (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  
  // Find incident by ID
  const incident = incidentDB.findById(parseInt(id));
  
  if (!incident) {
    return res.status(404).json({
      success: false,
      message: 'Incident not found.'
    });
  }
  
  try {
    // Update incident status
    const updatedIncident = incidentDB.updateStatus(
      parseInt(id),
      status,
      req.user.id,
      notes
    );
    
    // Notify admins and operators about the status change via Socket.io
    req.io.to('admin').emit('incidentStatusUpdated', {
      incident: updatedIncident,
      status,
      updatedBy: req.user.id
    });
    
    req.io.to('operator').emit('incidentStatusUpdated', {
      incident: updatedIncident,
      status,
      updatedBy: req.user.id
    });
    
    // Notify the original reporter
    if (incident.reportedBy !== req.user.id) {
      req.io.to(`user-${incident.reportedBy}`).emit('incidentStatusUpdated', {
        incident: updatedIncident,
        status,
        updatedBy: req.user.id
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Incident status updated to '${status}'.`,
      data: {
        incident: updatedIncident
      }
    });
  } catch (error) {
    console.error('Error updating incident status:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update incident status.',
      error: error.message
    });
  }
};

/**
 * Add a response to an incident
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addIncidentResponse = (req, res) => {
  const { id } = req.params;
  const { action, notes } = req.body;
  
  if (!action) {
    return res.status(400).json({
      success: false,
      message: 'Action is required.'
    });
  }
  
  // Find incident by ID
  const incident = incidentDB.findById(parseInt(id));
  
  if (!incident) {
    return res.status(404).json({
      success: false,
      message: 'Incident not found.'
    });
  }
  
  try {
    // Add response to incident
    const updatedIncident = incidentDB.addResponse(
      parseInt(id),
      action,
      req.user.id,
      notes
    );
    
    // Notify admins and operators about the new response via Socket.io
    req.io.to('admin').emit('incidentResponseAdded', {
      incident: updatedIncident,
      response: updatedIncident.responses[updatedIncident.responses.length - 1],
      addedBy: req.user.id
    });
    
    req.io.to('operator').emit('incidentResponseAdded', {
      incident: updatedIncident,
      response: updatedIncident.responses[updatedIncident.responses.length - 1],
      addedBy: req.user.id
    });
    
    // Notify the original reporter
    if (incident.reportedBy !== req.user.id) {
      req.io.to(`user-${incident.reportedBy}`).emit('incidentResponseAdded', {
        incident: updatedIncident,
        response: updatedIncident.responses[updatedIncident.responses.length - 1],
        addedBy: req.user.id
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Response added to incident.',
      data: {
        incident: updatedIncident
      }
    });
  } catch (error) {
    console.error('Error adding incident response:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to add response to incident.',
      error: error.message
    });
  }
};

/**
 * Create an alert from an incident
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createAlertFromIncident = async (req, res) => {
  const { id } = req.params;
  const { message, channels, targeting } = req.body;
  
  // Basic validation
  if (!channels || !Array.isArray(channels) || channels.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Notification channels are required.'
    });
  }
  
  if (!targeting) {
    return res.status(400).json({
      success: false,
      message: 'Targeting criteria is required.'
    });
  }
  
  // Find incident by ID
  const incident = incidentDB.findById(parseInt(id));
  
  if (!incident) {
    return res.status(404).json({
      success: false,
      message: 'Incident not found.'
    });
  }
  
  try {
    // Create alert data from incident
    const alertData = incident.createAlertData(message, channels, targeting);
    
    // Add creator ID
    alertData.createdBy = req.user.id;
    
    // Create alert
    const newAlert = alertDB.create(alertData);
    
    // Update incident with related alert ID
    incident.relatedAlertId = newAlert.id;
    incidentDB.update(parseInt(id), { relatedAlertId: newAlert.id });
    
    // Identify recipients based on targeting
    const recipients = await identifyRecipients(targeting);
    
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
      alert: newAlert,
      fromIncident: incident.id
    });
    
    // Send targeted notifications to specific users
    recipients.forEach(user => {
      req.io.to(`user-${user.id}`).emit('personalAlert', {
        alert: newAlert,
        fromIncident: incident.id
      });
    });
    
    res.status(201).json({
      success: true,
      message: 'Alert created from incident and sent successfully.',
      data: {
        alert: newAlert,
        incident,
        stats
      }
    });
  } catch (error) {
    console.error('Error creating alert from incident:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to create alert from incident.',
      error: error.message
    });
  }
};

/**
 * Delete an incident
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteIncident = (req, res) => {
  const { id } = req.params;
  
  // Find incident by ID
  const incident = incidentDB.findById(parseInt(id));
  
  if (!incident) {
    return res.status(404).json({
      success: false,
      message: 'Incident not found.'
    });
  }
  
  // Delete incident
  const deleted = incidentDB.delete(parseInt(id));
  
  if (deleted) {
    // Notify admins and operators about the deleted incident
    req.io.to('admin').emit('incidentDeleted', {
      incidentId: parseInt(id)
    });
    
    req.io.to('operator').emit('incidentDeleted', {
      incidentId: parseInt(id)
    });
    
    res.status(200).json({
      success: true,
      message: 'Incident deleted successfully.'
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to delete incident.'
    });
  }
};

/**
 * Identify recipients based on targeting criteria
 * @param {Object} targeting - Targeting criteria
 * @returns {Array} Array of recipient users
 */
const identifyRecipients = async (targeting) => {
  let recipients = [];
  
  // Target by roles
  if (targeting.roles && Array.isArray(targeting.roles) && targeting.roles.length > 0) {
    targeting.roles.forEach(role => {
      const users = userDB.getAllByRole(role);
      recipients = [...recipients, ...users];
    });
  }
  
  // Target specific users
  if (targeting.specific && Array.isArray(targeting.specific) && targeting.specific.length > 0) {
    targeting.specific.forEach(userId => {
      const user = userDB.findById(parseInt(userId));
      if (user && !recipients.find(r => r.id === user.id)) {
        recipients.push(user.getSafeUser());
      }
    });
  }
  
  // Remove duplicates
  recipients = recipients.filter((recipient, index, self) => 
    index === self.findIndex(r => r.id === recipient.id)
  );
  
  return recipients;
};

module.exports = {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncident,
  updateIncidentStatus,
  addIncidentResponse,
  createAlertFromIncident,
  deleteIncident
};