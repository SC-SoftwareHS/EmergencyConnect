/**
 * Authentication middleware for the emergency alert system
 */
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { users } = require('../shared/schema');
const { eq } = require('drizzle-orm');

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'emergency-alert-system-secret-key';

/**
 * Authenticate a user based on their JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticate = async (req, res, next) => {
  console.log('Running authentication middleware');
  
  // Get token from various sources (more flexible for mobile clients)
  // Check Authorization header (Bearer token)
  let token = req.header('Authorization')?.replace('Bearer ', '');
  
  // If not in Authorization header, check for token in request body
  if (!token && req.body?.token) {
    console.log('Found token in request body');
    token = req.body.token;
  }
  
  // Check query params
  if (!token && req.query?.token) {
    console.log('Found token in query parameters');
    token = req.query.token;
  }
  
  // If no token anywhere, return unauthorized
  if (!token) {
    console.log('No authentication token found in request');
    console.log('Headers:', JSON.stringify(req.headers));
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.'
    });
  }
  
  console.log('Processing authentication token');
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token verified successfully for user ID:', decoded.userId);
    
    // Find user directly from the database
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, decoded.userId));
    
    // If user not found, return unauthorized
    if (!user) {
      console.log('User not found for ID:', decoded.userId);
      return res.status(401).json({
        success: false,
        message: 'User not found. Please log in again.'
      });
    }
    
    console.log('Authentication successful for user:', user.username);
    
    // Add user to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Authorize a user based on their role
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
const authorize = (roles) => {
  return (req, res, next) => {
    // If no user or role not in allowed roles, return forbidden
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.'
      });
    }
    
    next();
  };
};

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: '7d' } // Extended token expiration to 7 days for better UX
  );
};

module.exports = {
  authenticate,
  authorize,
  generateToken
};
