/**
 * Validation utility functions for the emergency alert system
 */

/**
 * Validate an email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate a phone number
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} True if phone number is valid
 */
const isValidPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return false;
  // Basic phone validation - in production, use a more robust solution
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
};

/**
 * Validate a password
 * @param {string} password - Password to validate
 * @returns {boolean} True if password is valid
 */
const isValidPassword = (password) => {
  // At least 8 characters
  return password && password.length >= 8;
};

/**
 * Validate a username
 * @param {string} username - Username to validate
 * @returns {boolean} True if username is valid
 */
const isValidUsername = (username) => {
  // At least 3 characters, alphanumeric and underscores
  const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
  return usernameRegex.test(username);
};

/**
 * Validate alert data
 * @param {Object} alertData - Alert data to validate
 * @returns {Object} Validation result with success flag and error messages
 */
const validateAlertData = (alertData) => {
  const errors = {};
  
  if (!alertData.title || alertData.title.trim() === '') {
    errors.title = 'Title is required';
  } else if (alertData.title.length > 100) {
    errors.title = 'Title must be less than 100 characters';
  }
  
  if (!alertData.message || alertData.message.trim() === '') {
    errors.message = 'Message is required';
  }
  
  const validSeverities = ['low', 'medium', 'high', 'critical'];
  if (!alertData.severity || !validSeverities.includes(alertData.severity)) {
    errors.severity = `Severity must be one of: ${validSeverities.join(', ')}`;
  }
  
  if (!alertData.channels || !Array.isArray(alertData.channels) || alertData.channels.length === 0) {
    errors.channels = 'At least one notification channel is required';
  } else {
    const validChannels = ['email', 'sms', 'push'];
    const invalidChannels = alertData.channels.filter(channel => !validChannels.includes(channel));
    
    if (invalidChannels.length > 0) {
      errors.channels = `Invalid channels: ${invalidChannels.join(', ')}. Must be one of: ${validChannels.join(', ')}`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate user data
 * @param {Object} userData - User data to validate
 * @returns {Object} Validation result with success flag and error messages
 */
const validateUserData = (userData) => {
  const errors = {};
  
  if (!userData.username || !isValidUsername(userData.username)) {
    errors.username = 'Username must be at least 3 characters and contain only letters, numbers, and underscores';
  }
  
  if (!userData.email || !isValidEmail(userData.email)) {
    errors.email = 'Valid email address is required';
  }
  
  if (userData.password && !isValidPassword(userData.password)) {
    errors.password = 'Password must be at least 8 characters';
  }
  
  if (userData.phoneNumber && !isValidPhoneNumber(userData.phoneNumber)) {
    errors.phoneNumber = 'Please enter a valid phone number';
  }
  
  const validRoles = ['admin', 'operator', 'subscriber'];
  if (userData.role && !validRoles.includes(userData.role)) {
    errors.role = `Role must be one of: ${validRoles.join(', ')}`;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  isValidEmail,
  isValidPhoneNumber,
  isValidPassword,
  isValidUsername,
  validateAlertData,
  validateUserData
};
