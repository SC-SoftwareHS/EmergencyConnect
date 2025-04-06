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
 * @route GET /api/debug/network-test
 * @desc Test network connectivity with various response types
 * @access Public (for testing)
 */
router.get('/network-test', (req, res) => {
  // Get query parameters
  const { size = 'small', delay = 0, type = 'json' } = req.query;
  
  // Apply artificial delay if requested (for testing slow connections)
  if (delay > 0 && delay <= 10000) {
    setTimeout(() => sendNetworkTestResponse(req, res, size, type), parseInt(delay));
  } else {
    sendNetworkTestResponse(req, res, size, type);
  }
});

// Helper function to send different response types and sizes
function sendNetworkTestResponse(req, res, size, type) {
  // Create a response payload based on requested size
  let payload = { success: true, timestamp: new Date().toISOString() };
  
  if (size === 'medium') {
    // Medium payload - around 10KB
    payload.data = Array(100).fill().map((_, i) => ({ 
      id: i, 
      value: `Test data item ${i}`,
      details: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
    }));
  } else if (size === 'large') {
    // Large payload - around 100KB
    payload.data = Array(1000).fill().map((_, i) => ({ 
      id: i, 
      value: `Test data item ${i}`,
      details: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' + 
               'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      extraData: Array(10).fill().map((_, j) => ({ subId: j, value: `Sub item ${j}` }))
    }));
  } else {
    // Small payload (default) - minimal
    payload.data = { message: 'Small test payload' };
  }
  
  // Send response in requested format
  if (type === 'xml') {
    res.set('Content-Type', 'application/xml');
    
    // Very simple XML conversion (only for testing, not a proper XML converter)
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<response>\n';
    xml += `  <success>${payload.success}</success>\n`;
    xml += `  <timestamp>${payload.timestamp}</timestamp>\n`;
    xml += '  <data>\n';
    
    if (Array.isArray(payload.data)) {
      payload.data.forEach((item, index) => {
        xml += `    <item id="${item.id}">\n`;
        xml += `      <value>${item.value}</value>\n`;
        xml += `      <details>${item.details}</details>\n`;
        xml += '    </item>\n';
      });
    } else {
      xml += `    <message>${payload.data.message}</message>\n`;
    }
    
    xml += '  </data>\n</response>';
    
    res.send(xml);
  } else if (type === 'text') {
    res.set('Content-Type', 'text/plain');
    res.send(`Success: ${payload.success}\nTimestamp: ${payload.timestamp}\nData: ${JSON.stringify(payload.data)}`);
  } else {
    // Default: JSON
    res.json(payload);
  }
}

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

/**
 * @route ALL /api/debug/cors-test
 * @desc Test CORS with different HTTP methods
 * @access Public (for testing)
 */
router.all('/cors-test', (req, res) => {
  // Explicitly set CORS headers for testing
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // For all other requests, return info about the request
  const response = {
    success: true,
    method: req.method,
    path: req.path,
    headers: req.headers,
    query: req.query,
    body: req.body,
    timestamp: new Date().toISOString()
  };
  
  res.json(response);
});

module.exports = router;