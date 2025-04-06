/**
 * Debug routes for the emergency alert system
 * These routes help with testing and debugging the mobile app
 * NOTE: These should be disabled in production
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { mockUsers, generateMockToken } = require('../middleware/mockAuth');

// Map mock users for testing UI
const testUsers = Object.entries(mockUsers).map(([key, user]) => ({
  username: user.username,
  role: user.role,
  loginData: {
    username: user.username,
    password: user.password
  }
}));

/**
 * @route GET /api/debug/status
 * @desc Get server status
 * @access Public
 */
router.get('/status', (req, res) => {
  // Get system status information
  const stats = {
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    node_version: process.version,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  
  res.json(stats);
});

/**
 * @route GET /api/debug/users
 * @desc Get a list of test users (only in development)
 * @access Public (for testing)
 */
router.get('/users', (req, res) => {
  // In production, this would return an error or be disabled
  res.json({
    success: true,
    message: 'Test users available for development',
    data: {
      users: testUsers
    }
  });
});

/**
 * @route POST /api/debug/direct-token
 * @desc Get a direct token for a test user (development only)
 * @access Public (for testing)
 */
router.post('/direct-token', async (req, res) => {
  const { username } = req.body;
  
  try {
    // Get the user from our mock users
    const user = mockUsers[username];
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Test user not found'
      });
    }
    
    // Use the mock user without the password
    const safeUser = { ...user };
    delete safeUser.password;
    
    // Generate a token with a long expiration for testing
    const token = generateMockToken(user);
    
    res.json({
      success: true,
      message: 'Debug token generated (for testing only)',
      data: {
        token,
        user: safeUser
      }
    });
  } catch (error) {
    console.error('Debug token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating debug token',
      error: error.message
    });
  }
});

module.exports = router;