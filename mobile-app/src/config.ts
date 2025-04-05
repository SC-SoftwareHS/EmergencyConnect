import Constants from 'expo-constants';

// Default API URL - replace with your server URL when testing
// For Expo Go, you can use your computer's local network IP address
// For example: 'http://192.168.1.100:5000'
// For production, use your deployed server URL
// If you've deployed on Replit, use your Replit URL:
// https://your-repl-name.replit.app
const DEFAULT_API_URL = 'https://workspace.replit.app';

// Function to get the API URL from environment variables or use default
export const getApiUrl = (): string => {
  // Try to get from Expo Constants (app.json or app.config.js)
  const envApiUrl = Constants.expoConfig?.extra?.apiUrl;
  
  // Return the environment variable value or fall back to default
  return envApiUrl || DEFAULT_API_URL;
};

// API configuration object
export const API_CONFIG = {
  baseURL: getApiUrl(),
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

// WebSocket configuration
export const SOCKET_CONFIG = {
  url: getApiUrl(),
  path: '/socket.io', // Must match server configuration
  options: {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  },
};

// App theme colors - match with web app
export const COLORS = {
  primary: '#cc0000', // Dark red
  secondary: '#ff4500', // Orange-red
  success: '#28a745', // Green
  warning: '#ffa500', // Orange
  danger: '#dc3545', // Red
  info: '#17a2b8', // Teal
  light: '#f8f9fa', // Light gray
  dark: '#343a40', // Dark gray
  white: '#ffffff',
  black: '#000000',
  background: '#f8f9fa',
  card: '#ffffff',
  text: '#212529',
  border: '#dee2e6',
  notification: '#cc0000',
  
  // Severity colors
  critical: '#cc0000', // Dark red
  high: '#ff4500', // Orange-red
  medium: '#ffa500', // Orange
  low: '#ffcc00', // Amber
};

// Push notification configuration
export const PUSH_NOTIFICATION_CONFIG = {
  enabled: false, // Set to true when fully implemented
};

// Authentication configuration
export const AUTH_CONFIG = {
  tokenStorageKey: 'emergencyAlertAuthToken',
  userStorageKey: 'emergencyAlertUser',
  // Token expiration time in milliseconds (default: 24 hours)
  tokenExpirationTime: 24 * 60 * 60 * 1000,
};