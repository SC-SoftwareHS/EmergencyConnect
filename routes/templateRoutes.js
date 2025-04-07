/**
 * Template routes for the emergency alert system
 */
const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route POST /api/templates
 * @desc Create a new notification template
 * @access Private (admin, operator)
 */
router.post('/', authenticate, authorize(['admin', 'operator']), templateController.createTemplate);

/**
 * @route GET /api/templates
 * @desc Get all notification templates
 * @access Private (admin, operator)
 */
router.get('/', authenticate, authorize(['admin', 'operator']), templateController.getAllTemplates);

/**
 * @route GET /api/templates/categories
 * @desc Get all unique template categories
 * @access Private (admin, operator)
 */
router.get('/categories', authenticate, authorize(['admin', 'operator']), templateController.getCategories);

/**
 * @route GET /api/templates/variables
 * @desc Get all available template variables
 * @access Private (admin, operator)
 */
router.get('/variables', authenticate, authorize(['admin', 'operator']), templateController.getAvailableVariables);

/**
 * @route GET /api/templates/:id
 * @desc Get a notification template by ID
 * @access Private (admin, operator)
 */
router.get('/:id', authenticate, authorize(['admin', 'operator']), templateController.getTemplateById);

/**
 * @route PUT /api/templates/:id
 * @desc Update a notification template
 * @access Private (admin, operator)
 */
router.put('/:id', authenticate, authorize(['admin', 'operator']), templateController.updateTemplate);

/**
 * @route DELETE /api/templates/:id
 * @desc Delete a notification template
 * @access Private (admin)
 */
router.delete('/:id', authenticate, authorize(['admin']), templateController.deleteTemplate);

/**
 * @route POST /api/templates/:id/apply
 * @desc Apply a template to create a new alert
 * @access Private (admin, operator)
 */
router.post('/:id/apply', authenticate, authorize(['admin', 'operator']), templateController.applyTemplate);

module.exports = router;