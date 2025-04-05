/**
 * Authentication controller for the emergency alert system
 */
const { userDB } = require('../services/databaseService');
const { generateToken } = require('../middleware/auth');
const { isValidEmail, isValidPassword, validateUserData } = require('../utils/validators');

/**
 * User login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }
    
    // Find user by email
    const user = await userDB.findByEmail(email);
    
    // If user not found, return unauthorized
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }
    
    // Validate password
    const isValidPass = await userDB.validatePassword(user, password);
    
    // If password is incorrect, return unauthorized
    if (!isValidPass) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Return success with token and user data (without password)
    const { password: _, ...safeUser } = user;
    
    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: safeUser
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login.'
    });
  }
};

/**
 * User registration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const register = async (req, res) => {
  try {
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
    const existingUser = await userDB.findByEmail(userData.email);
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use.'
      });
    }
    
    // Check if username already exists
    const existingUsername = await userDB.findByUsername(userData.username);
    
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already in use.'
      });
    }
    
    // By default, new users are subscribers
    userData.role = userData.role || 'subscriber';
    
    // Create new user
    const newUser = await userDB.create(userData);
    
    // Generate JWT token
    const token = generateToken(newUser);
    
    // Return success with token and user data (without password)
    const { password: _, ...safeUser } = newUser;
    
    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        token,
        user: safeUser
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration.'
    });
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProfile = (req, res) => {
  try {
    // User is already available in req.user from authenticate middleware
    // Return user data without password
    const { password: _, ...safeUser } = req.user;
    
    res.json({
      success: true,
      data: {
        user: safeUser
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving profile.'
    });
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProfile = async (req, res) => {
  try {
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
    const updatedUser = await userDB.update(req.user.id, updates);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }
    
    // Return success with updated user data (without password)
    const { password: _, ...safeUser } = updatedUser;
    
    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: safeUser
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating profile.'
    });
  }
};

module.exports = {
  login,
  register,
  getProfile,
  updateProfile
};
