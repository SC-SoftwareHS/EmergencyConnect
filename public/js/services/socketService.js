/**
 * Socket service for the emergency alert system
 * Handles real-time communication with the server
 */
const socketService = (() => {
  let socket = null;
  
  /**
   * Connect to the WebSocket server
   * @param {Object|number} userData - User data object or user ID for room subscription
   */
  const connect = (userData) => {
    if (socket) {
      // Already connected
      return;
    }
    
    // Connect to Socket.io server
    socket = io();
    
    socket.on('connect', () => {
      console.log('Connected to Socket.io server');
      
      // Join user's room for personal notifications
      if (userData) {
        socket.emit('joinRoom', userData);
      }
    });
    
    socket.on('roomJoined', (data) => {
      console.log(`Joined rooms for user ${data.userId} with role ${data.role}`);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.io server:', reason);
    });
  };
  
  /**
   * Disconnect from the WebSocket server
   */
  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      console.log('Disconnected from Socket.io server');
    }
  };
  
  /**
   * Register event handler for new alerts
   * @param {Function} callback - Event handler function
   */
  const onNewAlert = (callback) => {
    if (socket) {
      socket.on('newAlert', callback);
    }
  };
  
  /**
   * Remove event handler for new alerts
   */
  const offNewAlert = () => {
    if (socket) {
      socket.off('newAlert');
    }
  };
  
  /**
   * Register event handler for personal alerts
   * @param {Function} callback - Event handler function
   */
  const onPersonalAlert = (callback) => {
    if (socket) {
      socket.on('personalAlert', callback);
    }
  };
  
  /**
   * Remove event handler for personal alerts
   */
  const offPersonalAlert = () => {
    if (socket) {
      socket.off('personalAlert');
    }
  };
  
  /**
   * Register event handler for cancelled alerts
   * @param {Function} callback - Event handler function
   */
  const onAlertCancelled = (callback) => {
    if (socket) {
      socket.on('alertCancelled', callback);
    }
  };
  
  /**
   * Remove event handler for cancelled alerts
   */
  const offAlertCancelled = () => {
    if (socket) {
      socket.off('alertCancelled');
    }
  };
  
  /**
   * Send a message to the server
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  const emit = (event, data) => {
    if (socket) {
      socket.emit(event, data);
    } else {
      console.error('Cannot emit event, socket not connected');
    }
  };
  
  /**
   * Check if socket is connected
   * @returns {boolean} True if connected
   */
  const isConnected = () => {
    return socket && socket.connected;
  };
  
  /**
   * Acknowledge reception of an alert
   * @param {number} alertId - ID of the alert to acknowledge
   * @param {number} userId - ID of the user acknowledging the alert
   */
  const acknowledgeAlert = (alertId, userId) => {
    if (socket) {
      socket.emit('acknowledgeAlert', { alertId, userId });
    } else {
      console.error('Cannot acknowledge alert, socket not connected');
    }
  };
  
  /**
   * Register event handler for new incidents
   * @param {Function} callback - Event handler function
   */
  const onNewIncident = (callback) => {
    if (socket) {
      socket.on('newIncident', callback);
    }
  };
  
  /**
   * Remove event handler for new incidents
   */
  const offNewIncident = () => {
    if (socket) {
      socket.off('newIncident');
    }
  };
  
  /**
   * Register event handler for incident status updates
   * @param {Function} callback - Event handler function
   */
  const onIncidentStatusUpdated = (callback) => {
    if (socket) {
      socket.on('incidentStatusUpdated', callback);
    }
  };
  
  /**
   * Remove event handler for incident status updates
   */
  const offIncidentStatusUpdated = () => {
    if (socket) {
      socket.off('incidentStatusUpdated');
    }
  };
  
  /**
   * Register event handler for incident responses
   * @param {Function} callback - Event handler function
   */
  const onIncidentResponseAdded = (callback) => {
    if (socket) {
      socket.on('incidentResponseAdded', callback);
    }
  };
  
  /**
   * Remove event handler for incident responses
   */
  const offIncidentResponseAdded = () => {
    if (socket) {
      socket.off('incidentResponseAdded');
    }
  };
  
  /**
   * Register event handler for alert acknowledgments
   * @param {Function} callback - Event handler function
   */
  const onAlertAcknowledged = (callback) => {
    if (socket) {
      socket.on('alertAcknowledged', callback);
    }
  };
  
  /**
   * Remove event handler for alert acknowledgments
   */
  const offAlertAcknowledged = () => {
    if (socket) {
      socket.off('alertAcknowledged');
    }
  };
  
  // Return public methods
  return {
    connect,
    disconnect,
    onNewAlert,
    offNewAlert,
    onPersonalAlert,
    offPersonalAlert,
    onAlertCancelled,
    offAlertCancelled,
    acknowledgeAlert,
    onAlertAcknowledged,
    offAlertAcknowledged,
    onNewIncident,
    offNewIncident,
    onIncidentStatusUpdated,
    offIncidentStatusUpdated,
    onIncidentResponseAdded,
    offIncidentResponseAdded,
    emit,
    isConnected
  };
})();
