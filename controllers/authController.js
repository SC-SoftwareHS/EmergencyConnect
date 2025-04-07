/**
 * Authentication controller for the emergency alert system
 */
const { db } = require('../db');
const { users } = require('../shared/schema');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');
const { isValidEmail, isValidPassword, validateUserData } = require('../utils/validators');

/**
 * User login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  console.log('Login request received:', JSON.stringify(req.body));
  
  try {
    const { email, username, password } = req.body;
    
    // Check if either email or username and password are provided
    if ((!email && !username) || !password) {
      console.log('Login validation failed: Missing email/username or password');
      return res.status(400).json({
        success: false,
        message: 'Email/username and password are required.'
      });
    }
    
    let user;
    
    // Find user by email or username directly from the database
    if (email) {
      console.log('Attempting to find user by email:', email);
      const [foundUser] = await db.select()
        .from(users)
        .where(eq(users.email, email));
      user = foundUser;
    } else if (username) {
      console.log('Attempting to find user by username:', username);
      const [foundUser] = await db.select()
        .from(users)
        .where(eq(users.username, username));
      user = foundUser;
    }
    
    // If user not found, return unauthorized
    if (!user) {
      console.log('Login failed: User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }
    
    console.log('User found, validating password');
    
    // Validate password with bcrypt
    const isValidPass = await bcrypt.compare(password, user.password);
    
    // If password is incorrect, return unauthorized
    if (!isValidPass) {
      console.log('Login failed: Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }
    
    console.log('Password valid, generating token');
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Return success with token and user data (without password)
    const { password: _, ...safeUser } = user;
    
    console.log('Login successful for user:', safeUser.username);
    
    // Ensure we're sending the response in the format the mobile app expects
    const responseObj = {
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: safeUser
      }
    };
    
    console.log('Sending login response:', JSON.stringify(responseObj));
    res.json(responseObj);
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
    const [existingUser] = await db.select()
      .from(users)
      .where(eq(users.email, userData.email));
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use.'
      });
    }
    
    // Check if username already exists
    const [existingUsername] = await db.select()
      .from(users)
      .where(eq(users.username, userData.username));
    
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already in use.'
      });
    }
    
    // By default, new users are subscribers
    userData.role = userData.role || 'subscriber';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Create new user
    const [newUser] = await db.insert(users)
      .values({
        ...userData,
        password: hashedPassword
      })
      .returning();
    
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
    
    // If password is being updated, hash it
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    
    // Update user
    const [updatedUser] = await db.update(users)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.id, req.user.id))
      .returning();
    
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
