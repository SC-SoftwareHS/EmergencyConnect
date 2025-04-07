/**
 * Template service for the emergency alert system
 * Handles template rendering and variable replacement
 */
const { db } = require('../db');
const { notificationTemplates } = require('../shared/schema');
const { eq, and } = require('drizzle-orm');

/**
 * Render a template with the given variables
 * @param {Object} template - The template object
 * @param {Object} variables - Variables to replace in the template
 * @param {string} language - Optional language code for translations
 * @returns {Object} Rendered template with variables replaced
 */
function renderTemplate(template, variables = {}, language = 'en') {
  // Get the base title and content, potentially from a translation
  let title = template.title;
  let content = template.content;
  
  // Check if we need a translation
  if (language !== 'en' && template.translations && template.translations[language]) {
    title = template.translations[language].title || title;
    content = template.translations[language].content || content;
  }
  
  // Replace variables in title and content
  Object.entries(variables).forEach(([key, value]) => {
    // Create a regex that matches the variable with optional whitespace
    const variablePattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    
    // Replace all occurrences in both title and content
    title = title.replace(variablePattern, value);
    content = content.replace(variablePattern, value);
  });
  
  return {
    title,
    content
  };
}

/**
 * Get a template by ID and render it with variables
 * @param {number} templateId - The ID of the template to render
 * @param {Object} variables - Variables to replace in the template
 * @param {string} language - Optional language code for translations
 * @returns {Promise<Object>} Promise resolving to the rendered template
 */
async function renderTemplateById(templateId, variables = {}, language = 'en') {
  // Get the template from the database
  const [template] = await db.select()
    .from(notificationTemplates)
    .where(eq(notificationTemplates.id, templateId));
  
  if (!template) {
    throw new Error(`Template with ID ${templateId} not found`);
  }
  
  // Render the template with the provided variables
  const rendered = renderTemplate(template, variables, language);
  
  return {
    ...template,
    title: rendered.title,
    content: rendered.content,
    renderedAt: new Date(),
    originalTemplate: {
      id: template.id,
      name: template.name
    }
  };
}

/**
 * Extract variables from a template string
 * @param {string} content - The template content
 * @returns {Array} Array of variable names found in the template
 */
function extractVariables(content) {
  const variablePattern = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
  const variables = new Set();
  let match;
  
  while ((match = variablePattern.exec(content)) !== null) {
    variables.add(match[1]);
  }
  
  return Array.from(variables);
}

/**
 * Validate a template for required variables
 * @param {Object} template - The template object
 * @param {Object} variables - The variables provided
 * @returns {Object} Validation result with missing variables
 */
function validateTemplate(template, variables = {}) {
  // Extract all variables from the template content
  const contentVariables = extractVariables(template.content);
  const titleVariables = extractVariables(template.title);
  
  // Combine all variables
  const allVariables = [...new Set([...contentVariables, ...titleVariables])];
  
  // Check which variables are missing
  const missingVariables = allVariables.filter(variable => 
    !variables.hasOwnProperty(variable)
  );
  
  return {
    isValid: missingVariables.length === 0,
    missingVariables,
    requiredVariables: allVariables
  };
}

/**
 * Find the default template for a specific type and category
 * @param {string} type - The template type (alert, incident, etc.)
 * @param {string} category - The template category
 * @returns {Promise<Object|null>} Promise resolving to the template or null
 */
async function findDefaultTemplate(type, category) {
  // Find an active template for the given type and category
  const [template] = await db.select()
    .from(notificationTemplates)
    .where(
      and(
        eq(notificationTemplates.type, type),
        eq(notificationTemplates.category, category),
        eq(notificationTemplates.isActive, true)
      )
    )
    .limit(1);
  
  return template || null;
}

module.exports = {
  renderTemplate,
  renderTemplateById,
  extractVariables,
  validateTemplate,
  findDefaultTemplate
};