/**
 * Debug service for the mobile app
 * This service provides utilities for testing and debugging
 * For DEVELOPMENT USE ONLY - DO NOT use in production!
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, AUTH_CONFIG } from '../config';

interface ServerStatus {
  success: boolean;
  status: string;
  timestamp: string;
  version: string;
  node_version: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
}

interface TestUser {
  username: string;
  role: string;
  loginData: {
    username: string;
    password: string;
  };
}

interface DebugTokenResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: any;
  };
}

/**
 * Get server status for diagnostics
 */
export const getServerStatus = async (): Promise<ServerStatus | null> => {
  try {
    console.log('Checking server status...');
    const response = await axios.get(`${API_CONFIG.baseURL}/api/debug/status`, {
      timeout: 5000
    });
    
    console.log('Server status response:', response.status);
    return response.data;
  } catch (error) {
    console.error('Failed to get server status:', error);
    return null;
  }
};

/**
 * Get available test users (development only)
 */
export const getTestUsers = async (): Promise<TestUser[] | null> => {
  try {
    console.log('Fetching test users...');
    const response = await axios.get(`${API_CONFIG.baseURL}/api/debug/users`, {
      timeout: 5000
    });
    
    if (response.data.success) {
      return response.data.data.users;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get test users:', error);
    return null;
  }
};

/**
 * Get a token directly for a test account
 * Development use only!
 */
export const getDirectToken = async (username: string): Promise<boolean> => {
  try {
    console.log(`Getting direct token for user: ${username}`);
    
    const response = await axios.post<DebugTokenResponse>(
      `${API_CONFIG.baseURL}/api/debug/direct-token`,
      { username },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );
    
    if (response.data.success) {
      const { token, user } = response.data.data;
      
      // Store token and user in AsyncStorage
      await AsyncStorage.setItem(AUTH_CONFIG.tokenStorageKey, token);
      await AsyncStorage.setItem(AUTH_CONFIG.userStorageKey, JSON.stringify(user));
      
      console.log('Debug token stored successfully');
      return true;
    }
    
    console.error('Failed to get direct token:', response.data.message);
    return false;
  } catch (error) {
    console.error('Error getting direct token:', error);
    return false;
  }
};

/**
 * Test connectivity with different methods to troubleshoot network issues
 */
export const testConnectivity = async (url: string): Promise<{
  axiosSuccess: boolean;
  fetchSuccess: boolean;
  xmlHttpSuccess: boolean;
  responseTime: number | null;
  error: string | null;
}> => {
  const result = {
    axiosSuccess: false,
    fetchSuccess: false,
    xmlHttpSuccess: false,
    responseTime: null,
    error: null
  };
  
  // Test with axios
  try {
    const startTime = Date.now();
    await axios.get(`${url}/api/debug/status`, { 
      timeout: 10000,
      headers: { 'Cache-Control': 'no-cache' }
    });
    result.axiosSuccess = true;
    result.responseTime = Date.now() - startTime;
  } catch (error) {
    console.log('Axios connectivity test failed:', error.message);
  }
  
  // Test with fetch API
  try {
    const startTime = Date.now();
    const response = await fetch(`${url}/api/debug/status`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (response.ok) {
      result.fetchSuccess = true;
      if (!result.responseTime) {
        result.responseTime = Date.now() - startTime;
      }
    }
  } catch (error) {
    console.log('Fetch API connectivity test failed:', error.message);
  }
  
  // Test with XMLHttpRequest (lower level)
  return new Promise((resolve) => {
    try {
      const xhr = new XMLHttpRequest();
      const startTime = Date.now();
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            result.xmlHttpSuccess = true;
            if (!result.responseTime) {
              result.responseTime = Date.now() - startTime;
            }
          }
          resolve(result);
        }
      };
      
      xhr.onerror = function() {
        result.error = 'XMLHttpRequest failed';
        resolve(result);
      };
      
      xhr.ontimeout = function() {
        result.error = 'XMLHttpRequest timed out';
        resolve(result);
      };
      
      xhr.open('GET', `${url}/api/debug/status`, true);
      xhr.timeout = 10000;
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      xhr.send();
    } catch (error) {
      result.error = `XMLHttpRequest exception: ${error.message}`;
      resolve(result);
    }
  });
};

/**
 * Main debug function - perform various checks
 */
export const runDiagnostics = async (): Promise<{
  serverOnline: boolean;
  authWorks: boolean;
  tokenValid: boolean;
  networkConnectivity: {
    axiosSuccess: boolean;
    fetchSuccess: boolean;
    xmlHttpSuccess: boolean;
    responseTime: number | null;
  };
  errorMessages: string[];
}> => {
  const results = {
    serverOnline: false,
    authWorks: false,
    tokenValid: false,
    networkConnectivity: {
      axiosSuccess: false,
      fetchSuccess: false,
      xmlHttpSuccess: false,
      responseTime: null
    },
    errorMessages: []
  };
  
  try {
    // First test basic connectivity
    console.log('Testing basic network connectivity...');
    const connectivityResults = await testConnectivity(API_CONFIG.baseURL);
    results.networkConnectivity = {
      axiosSuccess: connectivityResults.axiosSuccess,
      fetchSuccess: connectivityResults.fetchSuccess,
      xmlHttpSuccess: connectivityResults.xmlHttpSuccess,
      responseTime: connectivityResults.responseTime
    };
    
    if (!connectivityResults.axiosSuccess && 
        !connectivityResults.fetchSuccess && 
        !connectivityResults.xmlHttpSuccess) {
      results.errorMessages.push('Network connectivity failed with all methods');
    }
    
    // Check server status
    console.log('Checking server status...');
    const status = await getServerStatus();
    if (status && status.success) {
      results.serverOnline = true;
    } else {
      results.errorMessages.push('Server is offline or unreachable');
    }
    
    // Try to get a direct token for admin user
    if (results.serverOnline) {
      console.log('Testing authentication...');
      const gotToken = await getDirectToken('admin');
      if (gotToken) {
        results.authWorks = true;
      } else {
        results.errorMessages.push('Failed to get authentication token');
      }
    }
    
    // Check if a stored token is present and valid
    const storedToken = await AsyncStorage.getItem(AUTH_CONFIG.tokenStorageKey);
    if (storedToken) {
      try {
        // Make a simple request that requires authentication
        console.log('Verifying token validity...');
        const response = await axios.get(`${API_CONFIG.baseURL}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          },
          timeout: 5000
        });
        
        if (response.data.success) {
          results.tokenValid = true;
        }
      } catch (error) {
        results.errorMessages.push('Stored token is invalid or expired');
      }
    } else if (!results.authWorks) {
      results.errorMessages.push('No authentication token found');
    }
  } catch (error) {
    results.errorMessages.push(`Diagnostics error: ${error.message}`);
  }
  
  return results;
};

export default {
  getServerStatus,
  getTestUsers,
  getDirectToken,
  runDiagnostics,
  testConnectivity
};