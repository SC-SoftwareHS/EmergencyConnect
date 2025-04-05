import { io, Socket } from 'socket.io-client';
import { SOCKET_CONFIG } from '../config';
import { Alert } from '../types';
import { getAuthToken } from './api';

// Socket.io client instance
let socket: Socket | null = null;

// Event callback types
type AlertCallback = (alert: Alert) => void;
type ErrorCallback = (error: any) => void;
type ConnectCallback = () => void;
type DisconnectCallback = () => void;

// Socket event listeners
const listeners = {
  newAlert: [] as AlertCallback[],
  alertUpdate: [] as AlertCallback[],
  alertAcknowledged: [] as AlertCallback[],
  error: [] as ErrorCallback[],
  connect: [] as ConnectCallback[],
  disconnect: [] as DisconnectCallback[],
};

// Initialize and connect to the Socket.io server
export const initializeSocket = async (): Promise<Socket | null> => {
  try {
    // Get auth token using our shared function
    const token = await getAuthToken();
    
    if (!token) {
      console.error('Socket initialization failed: No auth token');
      return null;
    }
    
    // Initialize socket connection
    socket = io(SOCKET_CONFIG.url, {
      ...SOCKET_CONFIG.options,
      path: SOCKET_CONFIG.path,
      auth: {
        token,
      },
    });
    
    // Set up event listeners
    socket.on('connect', () => {
      console.log('Connected to Socket.io server');
      listeners.connect.forEach(callback => callback());
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.io server:', reason);
      listeners.disconnect.forEach(callback => callback());
    });
    
    socket.on('error', (error) => {
      console.error('Socket.io error:', error);
      listeners.error.forEach(callback => callback(error));
    });
    
    socket.on('newAlert', (alert: Alert) => {
      console.log('New alert received:', alert);
      listeners.newAlert.forEach(callback => callback(alert));
    });
    
    socket.on('alertUpdate', (alert: Alert) => {
      console.log('Alert update received:', alert);
      listeners.alertUpdate.forEach(callback => callback(alert));
    });
    
    socket.on('alertAcknowledged', (alert: Alert) => {
      console.log('Alert acknowledgment received:', alert);
      listeners.alertAcknowledged.forEach(callback => callback(alert));
    });
    
    // Connect to the server
    socket.connect();
    
    return socket;
  } catch (error) {
    console.error('Failed to initialize socket:', error);
    return null;
  }
};

// Disconnect from the Socket.io server
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Add event listeners
export const onNewAlert = (callback: AlertCallback): void => {
  listeners.newAlert.push(callback);
};

export const onAlertUpdate = (callback: AlertCallback): void => {
  listeners.alertUpdate.push(callback);
};

export const onAlertAcknowledged = (callback: AlertCallback): void => {
  listeners.alertAcknowledged.push(callback);
};

export const onSocketError = (callback: ErrorCallback): void => {
  listeners.error.push(callback);
};

export const onSocketConnect = (callback: ConnectCallback): void => {
  listeners.connect.push(callback);
};

export const onSocketDisconnect = (callback: DisconnectCallback): void => {
  listeners.disconnect.push(callback);
};

// Remove event listeners
export const offNewAlert = (callback: AlertCallback): void => {
  const index = listeners.newAlert.indexOf(callback);
  if (index !== -1) listeners.newAlert.splice(index, 1);
};

export const offAlertUpdate = (callback: AlertCallback): void => {
  const index = listeners.alertUpdate.indexOf(callback);
  if (index !== -1) listeners.alertUpdate.splice(index, 1);
};

export const offAlertAcknowledged = (callback: AlertCallback): void => {
  const index = listeners.alertAcknowledged.indexOf(callback);
  if (index !== -1) listeners.alertAcknowledged.splice(index, 1);
};

export const offSocketError = (callback: ErrorCallback): void => {
  const index = listeners.error.indexOf(callback);
  if (index !== -1) listeners.error.splice(index, 1);
};

export const offSocketConnect = (callback: ConnectCallback): void => {
  const index = listeners.connect.indexOf(callback);
  if (index !== -1) listeners.connect.splice(index, 1);
};

export const offSocketDisconnect = (callback: DisconnectCallback): void => {
  const index = listeners.disconnect.indexOf(callback);
  if (index !== -1) listeners.disconnect.splice(index, 1);
};

// Get the socket instance
export const getSocket = (): Socket | null => socket;