/**
 * Template functionality test for the emergency alert system
 * This script demonstrates how to create and use notification templates
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// import node-fetch dynamically
let fetch;
import('node-fetch').then(module => {
  fetch = module.default;
  // Run the test after fetch is available
  testTemplates();
});

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000';
let authToken;

// Test user credentials
const ADMIN_USER = {
  username: 'admin',
  password: 'admin123'
};

// Helper function to make authenticated API requests
async function apiRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const url = `${API_URL}${endpoint}`;
    console.log(`Making ${method} request to: ${url}`);
    const response = await fetch(url, options);
    
    // Check if the response is ok
    if (!response.ok) {
      console.error(`Error status: ${response.status} ${response.statusText}`);
      // Try to get error details from response 
      try {
        const errorText = await response.text();
        console.error(`Response body: ${errorText}`);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      } catch (textError) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
    }
    
    // Parse JSON response
    const textResponse = await response.text();
    console.log(`Response text: ${textResponse.substring(0, 200)}${textResponse.length > 200 ? '...' : ''}`);
    return JSON.parse(textResponse);
  } catch (error) {
    console.error(`API request error: ${error.message}`);
    throw error;
  }
}

// Main test function
async function testTemplates() {
  try {
    console.log('🔐 Logging in as admin user...');
    const loginResponse = await apiRequest('/api/auth/login', 'POST', ADMIN_USER);
    
    console.log('Login response:', JSON.stringify(loginResponse, null, 2));
    
    if (!loginResponse.success || !loginResponse.data || !loginResponse.data.token) {
      throw new Error('Login failed. Check your credentials.');
    }
    
    authToken = loginResponse.data.token;
    console.log('✅ Login successful!');
    
    // Create a template
    console.log('\n📝 Creating a new notification template...');
    const templateData = {
      name: 'Test Emergency Alert Template',
      description: 'A template for testing the emergency alert system',
      type: 'alert',
      category: 'emergency',
      title: 'EMERGENCY: {{alertType}} at {{location}}',
      content: 'This is a {{alertType}} alert for {{location}}. Please {{action}} immediately. Time: {{time}}.',
      variables: ['alertType', 'location', 'action', 'time'],
      channels: ['email', 'sms', 'push'],
      severity: 'high',
      isActive: true
    };
    
    const createResponse = await apiRequest('/api/templates', 'POST', templateData);
    console.log('✅ Template created:', createResponse.name);
    console.log('🆔 Template ID:', createResponse.id);
    
    const templateId = createResponse.id;
    
    // Get the template
    console.log('\n🔍 Getting template details...');
    const getResponse = await apiRequest(`/api/templates/${templateId}`);
    console.log('✅ Template fetched:', getResponse.name);
    
    // Apply the template to create an alert
    console.log('\n🚨 Creating alert from template...');
    const variables = {
      alertType: 'Fire',
      location: 'Building A',
      action: 'evacuate',
      time: new Date().toLocaleTimeString()
    };
    
    const targeting = {
      roles: ['subscriber']
    };
    
    const applyResponse = await apiRequest(`/api/templates/${templateId}/apply`, 'POST', {
      variables,
      targeting
    });
    
    console.log('✅ Alert created from template!');
    console.log('Alert ID:', applyResponse.data.alert.id);
    console.log('Alert Title:', applyResponse.data.alert.title);
    console.log('Alert Message:', applyResponse.data.alert.message);
    console.log('Recipients:', applyResponse.data.stats.total);
    
    console.log('\n✅ All template tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Error during template test:', error.message);
  }
}