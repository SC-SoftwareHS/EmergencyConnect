import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/api';
import { AUTH_CONFIG } from '../config';
import { AuthState, LoginCredentials, User } from '../types';
import { disconnectSocket, initializeSocket } from '../services/socket';

// Default auth state
const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: true,
  error: null,
};

// Create the context
const AuthContext = createContext<{
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}>({
  authState: initialAuthState,
  login: async () => false,
  logout: async () => {},
  clearError: () => {},
});

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);

  // Load user from storage on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem(AUTH_CONFIG.tokenStorageKey);
        const userJson = await AsyncStorage.getItem(AUTH_CONFIG.userStorageKey);
        
        if (token && userJson) {
          const user = JSON.parse(userJson) as User;
          setAuthState({
            isAuthenticated: true,
            user,
            token,
            isLoading: false,
            error: null,
          });
          
          // Initialize Socket.io connection
          await initializeSocket();
        } else {
          setAuthState({
            ...initialAuthState,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
        setAuthState({
          ...initialAuthState,
          isLoading: false,
          error: 'Failed to restore session.',
        });
      }
    };
    
    loadUser();
    
    // Cleanup
    return () => {
      disconnectSocket();
    };
  }, []);

  // Login user
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setAuthState(prevState => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));
      
      const response = await authApi.login(credentials);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Save to storage
        await AsyncStorage.setItem(AUTH_CONFIG.tokenStorageKey, token);
        await AsyncStorage.setItem(AUTH_CONFIG.userStorageKey, JSON.stringify(user));
        
        // Update state
        setAuthState({
          isAuthenticated: true,
          user,
          token,
          isLoading: false,
          error: null,
        });
        
        // Initialize Socket.io connection
        await initializeSocket();
        
        return true;
      } else {
        setAuthState(prevState => ({
          ...prevState,
          isLoading: false,
          error: response.error || 'Login failed.',
        }));
        return false;
      }
    } catch (error: any) {
      setAuthState(prevState => ({
        ...prevState,
        isLoading: false,
        error: error.message || 'An unexpected error occurred.',
      }));
      return false;
    }
  };

  // Logout user
  const logout = async (): Promise<void> => {
    try {
      setAuthState(prevState => ({
        ...prevState,
        isLoading: true,
      }));
      
      // Disconnect Socket.io
      disconnectSocket();
      
      // API logout (ignoring errors)
      await authApi.logout();
      
      // Clear storage
      await AsyncStorage.removeItem(AUTH_CONFIG.tokenStorageKey);
      await AsyncStorage.removeItem(AUTH_CONFIG.userStorageKey);
      
      // Reset state
      setAuthState({
        ...initialAuthState,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      
      // Still clear storage and reset state on error
      await AsyncStorage.removeItem(AUTH_CONFIG.tokenStorageKey);
      await AsyncStorage.removeItem(AUTH_CONFIG.userStorageKey);
      
      setAuthState({
        ...initialAuthState,
        isLoading: false,
      });
    }
  };

  // Clear error
  const clearError = () => {
    setAuthState(prevState => ({
      ...prevState,
      error: null,
    }));
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);