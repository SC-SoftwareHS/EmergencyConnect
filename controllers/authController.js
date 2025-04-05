/**
 * Authentication controller for the emergency alert system
 */
const { userDB } = require('../utils/database');
const { generateToken } = require('../middleware/auth');
const { isValidEmail, isValidPassword, validateUserData } = require('../utils/validators');

/**
 * User login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = (req, res) => {
  const { email, password } = req.body;
  
  // Check if email and password are provided
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.'
    });
  }
  
  // Find user by email
  const user = userDB.findByEmail(email);
  
  // If user not found or password incorrect, return unauthorized
  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.'
    });
  }
  
  // Generate JWT token
  const token = generateToken(user);
  
  // Return success with token and user data
  res.json({
    success: true,
    message: 'Login successful.',
    data: {
      token,
      user: user.getSafeUser()
    }
  });
};

/**
 * User registration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const register = (req, res) => {
  const userData = req.body;
  
  // Validate user data
  const validation = validateUserData(userData);
  
  // If validation fails, return bad request
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user data.',
      errors: validation.errors
    });
  }
  
  // Check if email already exists
  const existingUser = userDB.findByEmail(userData.email);
  
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already in use.'
    });
  }
  
  // Check if username already exists
  const existingUsername = userDB.findByUsername(userData.username);
  
  if (existingUsername) {
    return res.status(400).json({
      success: false,
      message: 'Username already in use.'
    });
  }
  
  // By default, new users are subscribers
  userData.role = userData.role || 'subscriber';
  
  // Create new user
  const newUser = userDB.create(userData);
  
  // Generate JWT token
  const token = generateToken(newUser);
  
  // Return success with token and user data
  res.status(201).json({
    success: true,
    message: 'Registration successful.',
    data: {
      token,
      user: newUser.getSafeUser()
    }
  });
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProfile = (req, res) => {
  // User is already available in req.user from authenticate middleware
  res.json({
    success: true,
    data: {
      user: req.user.getSafeUser()
    }
  });
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProfile = (req, res) => {
  const updates = req.body;
  
  // Validate updates
  const validation = validateUserData({
    ...req.user,
    ...updates
  });
  
  // If validation fails, return bad request
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid update data.',
      errors: validation.errors
    });
  }
  
  // Prevent role updates through this endpoint
  if (updates.role) {
    delete updates.role;
  }
  
  // Update user
  const updatedUser = userDB.update(req.user.id, updates);
  
  // Return success with updated user data
  res.json({
    success: true,
    message: 'Profile updated successfully.',
    data: {
      user: updatedUser.getSafeUser()
    }
  });
};

module.exports = {
  login,
  register,
  getProfile,
  updateProfile
};
