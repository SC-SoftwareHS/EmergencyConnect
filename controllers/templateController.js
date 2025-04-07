/**
 * Template controller for the emergency alert system
 * Manages notification templates for various alert types
 */
const { db } = require('../db');
const { notificationTemplates, users } = require('../shared/schema');
const { eq, and, ilike, desc } = require('drizzle-orm');

/**
 * Create a new notification template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createTemplate = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get template data from request body
    const templateData = {
      ...req.body,
      createdBy: userId
    };
    
    // Insert the template into the database
    const [template] = await db.insert(notificationTemplates)
      .values(templateData)
      .returning();
    
    // Broadcast to admin and operator rooms that a new template was created
    if (req.io) {
      req.io.to('admin').to('operator').emit('templateCreated', {
        id: template.id,
        name: template.name,
        type: template.type,
        category: template.category
      });
    }
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ 
      message: 'Failed to create template', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all notification templates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllTemplates = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { 
      type, 
      category, 
      isActive, 
      search, 
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt',
      sortDir = 'desc'
    } = req.query;
    
    // Build the where clause
    let whereClause = {};
    
    if (type) {
      whereClause = and(whereClause, eq(notificationTemplates.type, type));
    }
    
    if (category) {
      whereClause = and(whereClause, eq(notificationTemplates.category, category));
    }
    
    if (isActive !== undefined) {
      const activeValue = isActive === 'true' || isActive === true;
      whereClause = and(whereClause, eq(notificationTemplates.isActive, activeValue));
    }
    
    if (search) {
      whereClause = and(
        whereClause, 
        ilike(notificationTemplates.name, `%${search}%`)
      );
    }
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Get templates with sorting and pagination
    const templates = await db.select({
      id: notificationTemplates.id,
      name: notificationTemplates.name,
      description: notificationTemplates.description,
      type: notificationTemplates.type,
      category: notificationTemplates.category,
      title: notificationTemplates.title,
      content: notificationTemplates.content,
      variables: notificationTemplates.variables,
      translations: notificationTemplates.translations,
      channels: notificationTemplates.channels,
      severity: notificationTemplates.severity,
      createdBy: notificationTemplates.createdBy,
      createdAt: notificationTemplates.createdAt,
      updatedAt: notificationTemplates.updatedAt,
      isActive: notificationTemplates.isActive,
      creatorName: users.username
    })
    .from(notificationTemplates)
    .leftJoin(users, eq(notificationTemplates.createdBy, users.id))
    .where(whereClause)
    .orderBy(sortDir === 'desc' ? desc(notificationTemplates[sortBy]) : notificationTemplates[sortBy])
    .limit(limit)
    .offset(offset);
    
    // Get total count for pagination
    const [{ count }] = await db.select({
      count: db.fn.count(notificationTemplates.id)
    })
    .from(notificationTemplates)
    .where(whereClause);
    
    res.status(200).json({
      templates,
      pagination: {
        total: Number(count),
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(Number(count) / limit)
      }
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve templates', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get a notification template by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [template] = await db.select({
      id: notificationTemplates.id,
      name: notificationTemplates.name,
      description: notificationTemplates.description,
      type: notificationTemplates.type,
      category: notificationTemplates.category,
      title: notificationTemplates.title,
      content: notificationTemplates.content,
      variables: notificationTemplates.variables,
      translations: notificationTemplates.translations,
      channels: notificationTemplates.channels,
      severity: notificationTemplates.severity,
      createdBy: notificationTemplates.createdBy,
      createdAt: notificationTemplates.createdAt,
      updatedAt: notificationTemplates.updatedAt,
      isActive: notificationTemplates.isActive,
      creatorName: users.username
    })
    .from(notificationTemplates)
    .leftJoin(users, eq(notificationTemplates.createdBy, users.id))
    .where(eq(notificationTemplates.id, id));
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.status(200).json(template);
  } catch (error) {
    console.error('Error getting template by ID:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve template', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update a notification template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Check if template exists
    const [existingTemplate] = await db.select()
      .from(notificationTemplates)
      .where(eq(notificationTemplates.id, id));
    
    if (!existingTemplate) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Update the template
    const [updatedTemplate] = await db.update(notificationTemplates)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(notificationTemplates.id, id))
      .returning();
    
    // Broadcast to admin and operator rooms that the template was updated
    if (req.io) {
      req.io.to('admin').to('operator').emit('templateUpdated', {
        id: updatedTemplate.id,
        name: updatedTemplate.name,
        type: updatedTemplate.type,
        category: updatedTemplate.category
      });
    }
    
    res.status(200).json(updatedTemplate);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ 
      message: 'Failed to update template', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete a notification template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if template exists
    const [existingTemplate] = await db.select()
      .from(notificationTemplates)
      .where(eq(notificationTemplates.id, id));
    
    if (!existingTemplate) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Delete the template
    await db.delete(notificationTemplates)
      .where(eq(notificationTemplates.id, id));
    
    // Broadcast to admin and operator rooms that the template was deleted
    if (req.io) {
      req.io.to('admin').to('operator').emit('templateDeleted', {
        id: existingTemplate.id,
        name: existingTemplate.name
      });
    }
    
    res.status(200).json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ 
      message: 'Failed to delete template', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Apply a template to create a new alert
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.applyTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { variables, targeting } = req.body;
    
    // Get the template
    const [template] = await db.select()
      .from(notificationTemplates)
      .where(eq(notificationTemplates.id, id));
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Replace variables in title and content
    let title = template.title;
    let message = template.content;
    
    if (variables) {
      // Replace each variable with its value
      for (const [key, value] of Object.entries(variables)) {
        const variablePattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        title = title.replace(variablePattern, value);
        message = message.replace(variablePattern, value);
      }
    }
    
    // Create alert data
    const alertData = {
      title,
      message,
      severity: template.severity,
      createdBy: req.user.id,
      channels: template.channels,
      status: 'draft',
      targeting: targeting || { all: true }
    };
    
    // Save a reference to the response object to pass to the alert controller
    const alertReq = { 
      ...req, 
      body: alertData,
      templateId: template.id
    };
    
    // Use the alert controller to create a new alert
    const alertController = require('./alertController');
    await alertController.createAlert(alertReq, res);
    
  } catch (error) {
    console.error('Error applying template:', error);
    res.status(500).json({ 
      message: 'Failed to apply template', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all unique template categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCategories = async (req, res) => {
  try {
    // Use DISTINCT to get unique categories
    const categories = await db.selectDistinct({ category: notificationTemplates.category })
      .from(notificationTemplates)
      .orderBy(notificationTemplates.category);
    
    // Extract category names from result
    const categoryNames = categories.map(item => item.category);
    
    res.status(200).json(categoryNames);
  } catch (error) {
    console.error('Error getting template categories:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve template categories', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all unique variables used across templates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAvailableVariables = async (req, res) => {
  try {
    // Get all templates with their variables
    const templates = await db.select({ variables: notificationTemplates.variables })
      .from(notificationTemplates);
    
    // Extract all unique variables
    const allVariables = new Set();
    templates.forEach(template => {
      if (Array.isArray(template.variables)) {
        template.variables.forEach(variable => allVariables.add(variable));
      }
    });
    
    res.status(200).json(Array.from(allVariables));
  } catch (error) {
    console.error('Error getting template variables:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve template variables', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};