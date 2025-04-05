/**
 * Socket service for the emergency alert system
 * Handles real-time communication with the server
 */
const socketService = (() => {
  let socket = null;
  
  /**
   * Connect to the WebSocket server
   * @param {number} userId - User ID for room subscription
   */
  const connect = (userId) => {
    if (socket) {
      // Already connected
      return;
    }
    
    // Connect to Socket.io server
    socket = io();
    
    socket.on('connect', () => {
      console.log('Connected to Socket.io server');
      
      // Join user's room for personal notifications
      if (userId) {
        socket.emit('joinRoom', userId);
      }
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
    emit,
    isConnected
  };
})();
