/**
 * Incident routes for the emergency alert system
 */
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncident,
  updateIncidentStatus,
  addIncidentResponse,
  createAlertFromIncident,
  deleteIncident
} = require('../controllers/incidentController');

/**
 * @route POST /api/incidents
 * @desc Create a new incident
 * @access Private
 */
router.post('/', authenticate, createIncident);

/**
 * @route GET /api/incidents
 * @desc Get all incidents
 * @access Private (admin, operator)
 */
router.get('/', authenticate, authorize(['admin', 'operator']), getAllIncidents);

/**
 * @route GET /api/incidents/:id
 * @desc Get an incident by ID
 * @access Private (admin, operator, or reporter)
 */
router.get('/:id', authenticate, getIncidentById);

/**
 * @route PUT /api/incidents/:id
 * @desc Update an incident
 * @access Private (admin, operator)
 */
router.put('/:id', authenticate, authorize(['admin', 'operator']), updateIncident);

/**
 * @route PUT /api/incidents/:id/status
 * @desc Update incident status
 * @access Private (admin, operator)
 */
router.put('/:id/status', authenticate, authorize(['admin', 'operator']), updateIncidentStatus);

/**
 * @route POST /api/incidents/:id/responses
 * @desc Add a response to an incident
 * @access Private (admin, operator)
 */
router.post('/:id/responses', authenticate, authorize(['admin', 'operator']), addIncidentResponse);

/**
 * @route POST /api/incidents/:id/alert
 * @desc Create an alert from an incident
 * @access Private (admin, operator)
 */
router.post('/:id/alert', authenticate, authorize(['admin', 'operator']), createAlertFromIncident);

/**
 * @route DELETE /api/incidents/:id
 * @desc Delete an incident
 * @access Private (admin)
 */
router.delete('/:id', authenticate, authorize(['admin']), deleteIncident);

module.exports = router;