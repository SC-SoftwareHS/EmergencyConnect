/**
 * Mock authentication middleware for development and testing
 * This should NOT be used in production
 */
const jwt = require('jsonwebtoken');

// Mock user database for testing (in-memory, will reset on server restart)
const mockUsers = {
  admin: {
    id: 1,
    username: 'admin',
    password: 'admin123',
    email: 'admin@example.com',
    role: 'admin',
    phoneNumber: '+18582151880',
    channels: {
      sms: true,
      email: true,
      push: false
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  operator: {
    id: 2,
    username: 'operator',
    password: 'operator123',
    email: 'operator@example.com',
    role: 'operator',
    phoneNumber: '+18582151880',
    channels: {
      sms: true,
      email: true,
      push: false
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  subscriber: {
    id: 3,
    username: 'subscriber',
    password: 'subscriber123',
    email: 'subscriber@example.com',
    role: 'subscriber',
    phoneNumber: '+18582151880',
    channels: {
      sms: true,
      email: true, 
      push: false
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

/**
 * Generate a JWT token for a mock user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateMockToken = (user) => {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || 'emergency-alert-system-secret-key',
    { expiresIn: '7d' }
  );
};

/**
 * Mock authentication middleware
 * This middleware provides a more reliable authentication path for testing
 * that doesn't rely on the database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const mockAuthMiddleware = (req, res, next) => {
  // Get token from authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'emergency-alert-system-secret-key'
    );
    
    // Find mock user by ID
    const user = Object.values(mockUsers).find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }
    
    // Save user to request object
    req.user = { ...user };
    delete req.user.password;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error.message
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
const mockAuthorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Not authenticated.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Not authorized.'
      });
    }

    next();
  };
};

module.exports = {
  mockUsers,
  mockAuthMiddleware,
  mockAuthorize,
  generateMockToken
};