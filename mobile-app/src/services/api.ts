import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, AUTH_CONFIG } from '../config';
import { ApiResponse, LoginCredentials, User, Alert } from '../types';

// Function to get the current auth token from storage
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(AUTH_CONFIG.tokenStorageKey);
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
};

// Create an Axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(AUTH_CONFIG.tokenStorageKey);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      // Clear stored auth data
      await AsyncStorage.removeItem(AUTH_CONFIG.tokenStorageKey);
      await AsyncStorage.removeItem(AUTH_CONFIG.userStorageKey);
    }
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authApi = {
  // Login user and get token
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ user: User, token: string }>> => {
    try {
      const response: AxiosResponse = await api.post('/api/auth/login', credentials);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed. Please check your credentials.' 
      };
    }
  },

  // Get current user profile
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    try {
      const response: AxiosResponse = await api.get('/api/auth/profile');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to fetch user profile.' 
      };
    }
  },

  // Logout user
  logout: async (): Promise<ApiResponse<null>> => {
    try {
      await api.post('/api/auth/logout');
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Logout failed.' 
      };
    }
  },
};

// User API calls
export const userApi = {
  // Register push token
  registerPushToken: async (userId: number, pushToken: string): Promise<ApiResponse<User>> => {
    try {
      const response: AxiosResponse = await api.post(`/api/users/${userId}/push-token`, { pushToken });
      return { success: true, data: response.data.data.user };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to register push token.'
      };
    }
  },
  
  // Update notification preferences
  updateNotificationPreferences: async (userId: number, channels: Record<string, boolean>): Promise<ApiResponse<User>> => {
    try {
      const response: AxiosResponse = await api.put(`/api/users/${userId}/notifications`, { channels });
      return { success: true, data: response.data.data.user };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update notification preferences.'
      };
    }
  },
};

// Alerts API calls
export const alertsApi = {
  // Get all alerts
  getAlerts: async (): Promise<ApiResponse<Alert[]>> => {
    try {
      const response: AxiosResponse = await api.get('/api/alerts');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to fetch alerts.' 
      };
    }
  },

  // Get a single alert by ID
  getAlertById: async (alertId: string): Promise<ApiResponse<Alert>> => {
    try {
      const response: AxiosResponse = await api.get(`/api/alerts/${alertId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to fetch alert details.' 
      };
    }
  },

  // Acknowledge an alert
  acknowledgeAlert: async (alertId: string): Promise<ApiResponse<Alert>> => {
    try {
      const response: AxiosResponse = await api.post(`/api/alerts/${alertId}/acknowledge`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to acknowledge alert.' 
      };
    }
  },
};

export default api;