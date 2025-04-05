/**
 * API service for the emergency alert system
 * Handles all API requests to the backend
 */
const api = (() => {
  const API_BASE_URL = '/api';
  
  /**
   * Send a request to the API
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response data
   */
  const sendRequest = async (endpoint, options = {}) => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Set default headers
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Send request
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });
      
      // Parse response
      const data = await response.json();
      
      // Handle error responses
      if (!response.ok) {
        return {
          success: false,
          message: data.message || `Error: ${response.status} ${response.statusText}`,
          errors: data.errors
        };
      }
      
      return data;
    } catch (error) {
      console.error(`API request failed: ${error.message}`);
      throw error;
    }
  };
  
  /**
   * Login a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Response with user data and token
   */
  const login = (email, password) => {
    return sendRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  };
  
  /**
   * Register a new user
   * @param {Object} userData - User data for registration
   * @returns {Promise<Object>} Response with user data and token
   */
  const register = (userData) => {
    return sendRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  };
  
  /**
   * Get current user profile
   * @returns {Promise<Object>} Response with user data
   */
  const getProfile = () => {
    return sendRequest('/auth/profile');
  };
  
  /**
   * Update user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Response with updated user data
   */
  const updateProfile = (userData) => {
    return sendRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  };
  
  /**
   * Get all alerts
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Response with alerts data
   */
  const getAlerts = (params = {}) => {
    // Build query string
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    return sendRequest(`/alerts${queryString}`);
  };
  
  /**
   * Get a specific alert by ID
   * @param {number} id - Alert ID
   * @returns {Promise<Object>} Response with alert data
   */
  const getAlert = (id) => {
    return sendRequest(`/alerts/${id}`);
  };
  
  /**
   * Create a new alert
   * @param {Object} alertData - Alert data
   * @returns {Promise<Object>} Response with created alert data
   */
  const createAlert = (alertData) => {
    return sendRequest('/alerts', {
      method: 'POST',
      body: JSON.stringify(alertData)
    });
  };
  
  /**
   * Update an alert
   * @param {number} id - Alert ID
   * @param {Object} alertData - Updated alert data
   * @returns {Promise<Object>} Response with updated alert data
   */
  const updateAlert = (id, alertData) => {
    return sendRequest(`/alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(alertData)
    });
  };
  
  /**
   * Cancel an alert
   * @param {number} id - Alert ID
   * @returns {Promise<Object>} Response with cancelled alert data
   */
  const cancelAlert = (id) => {
    return sendRequest(`/alerts/${id}/cancel`, {
      method: 'POST'
    });
  };
  
  /**
   * Delete an alert
   * @param {number} id - Alert ID
   * @returns {Promise<Object>} Response with success message
   */
  const deleteAlert = (id) => {
    return sendRequest(`/alerts/${id}`, {
      method: 'DELETE'
    });
  };
  
  /**
   * Get alert analytics
   * @returns {Promise<Object>} Response with analytics data
   */
  const getAlertAnalytics = () => {
    return sendRequest('/alerts/analytics');
  };
  
  /**
   * Get all users
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Response with users data
   */
  const getUsers = (params = {}) => {
    // Build query string
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    return sendRequest(`/users${queryString}`);
  };
  
  /**
   * Get a specific user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object>} Response with user data
   */
  const getUser = (id) => {
    return sendRequest(`/users/${id}`);
  };
  
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Response with created user data
   */
  const createUser = (userData) => {
    return sendRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  };
  
  /**
   * Update a user
   * @param {number} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Response with updated user data
   */
  const updateUser = (id, userData) => {
    return sendRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  };
  
  /**
   * Delete a user
   * @param {number} id - User ID
   * @returns {Promise<Object>} Response with success message
   */
  const deleteUser = (id) => {
    return sendRequest(`/users/${id}`, {
      method: 'DELETE'
    });
  };
  
  /**
   * Update user notification preferences
   * @param {number} id - User ID
   * @param {Object} channels - Notification channel preferences
   * @returns {Promise<Object>} Response with updated user data
   */
  const updateNotificationPreferences = (id, channels) => {
    return sendRequest(`/users/${id}/notifications`, {
      method: 'PUT',
      body: JSON.stringify({ channels })
    });
  };
  
  /**
   * Get user subscription
   * @param {number} id - User ID
   * @returns {Promise<Object>} Response with subscription data
   */
  const getUserSubscription = (id) => {
    return sendRequest(`/users/${id}/subscription`);
  };
  
  /**
   * Update user subscription
   * @param {number} id - User ID
   * @param {Object} subscriptionData - Subscription data to update
   * @returns {Promise<Object>} Response with updated subscription data
   */
  const updateUserSubscription = (id, subscriptionData) => {
    return sendRequest(`/users/${id}/subscription`, {
      method: 'PUT',
      body: JSON.stringify(subscriptionData)
    });
  };
  
  // Return public methods
  return {
    login,
    register,
    getProfile,
    updateProfile,
    getAlerts,
    getAlert,
    createAlert,
    updateAlert,
    cancelAlert,
    deleteAlert,
    getAlertAnalytics,
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    updateNotificationPreferences,
    getUserSubscription,
    updateUserSubscription
  };
})();
