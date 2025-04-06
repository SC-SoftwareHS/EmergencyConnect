// API URL Configuration
// For Expo Go, you can use your computer's local network IP address
// For example: 'http://192.168.1.100:5000'
// For production, use your deployed server URL

// Replit URL for production
const REPLIT_API_URL = 'http://workspace.graftssalable0o.replit.app';

// Fallback local URL for testing
const LOCAL_API_URL = 'http://localhost:5000';

// Variable to store the current API URL
let CURRENT_API_URL = REPLIT_API_URL;

// Function to get the currently set API URL
export const getApiUrl = (): string => {
  console.log('Using server URL:', CURRENT_API_URL);
  return CURRENT_API_URL;
};

// Set API URL to local dev environment
export const useLocalApi = (): void => {
  CURRENT_API_URL = LOCAL_API_URL;
  console.log('Switched to local API:', CURRENT_API_URL);
};

// Set API URL to Replit environment
export const useReplitApi = (): void => {
  CURRENT_API_URL = REPLIT_API_URL;
  console.log('Switched to Replit API:', CURRENT_API_URL);
};

// Set API URL to a custom endpoint
export const setCustomApiUrl = (url: string): void => {
  if (!url) return;
  CURRENT_API_URL = url;
  console.log('Set custom API URL:', CURRENT_API_URL);
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