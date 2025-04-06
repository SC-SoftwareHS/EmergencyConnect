/**
 * Mobile debug routes for the emergency alert system
 * These routes help with testing and debugging in the mobile app
 * NOTE: These should be disabled in production
 */
const express = require('express');
const router = express.Router();
const path = require('path');

/**
 * @route GET /mobile-debug
 * @desc Get mobile app debugging page
 * @access Public (for development)
 */
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'debug.html'));
});

/**
 * @route GET /mobile-debug/config
 * @desc Get mobile app configuration values
 * @access Public (for development)
 */
router.get('/config', (req, res) => {
  // Return system URLs and other configuration data
  // This helps mobile developers see how to connect to the server
  const host = req.headers.host || 'localhost:5000';
  const protocol = req.protocol || 'http';
  
  res.json({
    success: true,
    data: {
      baseUrl: `${protocol}://${host}`,
      apiBaseUrl: `${protocol}://${host}/api`,
      wsUrl: `${protocol === 'https' ? 'wss' : 'ws'}://${host}`,
      auth: {
        loginEndpoint: '/api/auth/login',
        registerEndpoint: '/api/auth/register',
        profileEndpoint: '/api/auth/profile'
      },
      debug: {
        statusEndpoint: '/api/debug/status',
        directTokenEndpoint: '/api/debug/direct-token'
      },
      testUsers: [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'operator', password: 'operator123', role: 'operator' },
        { username: 'subscriber', password: 'subscriber123', role: 'subscriber' }
      ],
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

module.exports = router;