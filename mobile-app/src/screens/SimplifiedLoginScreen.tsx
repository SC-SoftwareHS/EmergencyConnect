import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { 
  COLORS, 
  getApiUrl, 
  setCustomApiUrl, 
  useLocalApi, 
  useReplitApi 
} from '../config';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import debugService from '../services/debugService';

interface SimplifiedLoginScreenProps {
  onLoginSuccess?: () => void;
  navigation?: any;
}

// This is a simplified login screen that bypasses the context system
// to test direct API connectivity with our server
const SimplifiedLoginScreen: React.FC<SimplifiedLoginScreenProps> = ({ onLoginSuccess, navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [serverUrl, setServerUrl] = useState(getApiUrl());
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<'standard' | 'direct' | 'fetch'>('standard');
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Update API config when server URL changes
  useEffect(() => {
    setCustomApiUrl(serverUrl);
  }, [serverUrl]);
  
  // Load server status on mount
  useEffect(() => {
    const checkServer = async () => {
      setDiagnosticsRunning(true);
      try {
        const status = await debugService.getServerStatus();
        setServerStatus(status);
        
        if (status && status.success) {
          setErrorMessage('');
          setConnectionSuccess(true);
        } else {
          setErrorMessage('Server not reachable. Please check the URL.');
          setConnectionSuccess(false);
        }
      } catch (error) {
        console.error('Server check error:', error);
        setErrorMessage('Failed to connect to server.');
        setConnectionSuccess(false);
      } finally {
        setDiagnosticsRunning(false);
      }
    };
    
    checkServer();
  }, [serverUrl]);
  
  // Handle login button press with direct API call
  const handleLogin = async () => {
    // Validate form
    if (!username || !password) {
      setErrorMessage('Username and password are required');
      return;
    }
    
    setErrorMessage('');
    setIsLoading(true);
    
    try {
      console.log(`Making direct API request to ${serverUrl}/api/auth/login`);
      
      // Try two different methods to handle potential CORS or SSL issues
      let response;
      
      try {
        // First attempt: Use axios with full settings
        response = await axios.post(`${serverUrl}/api/auth/login`, {
          username,
          password
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000,
          withCredentials: true
        });
      } catch (firstError) {
        console.log('First login attempt failed, trying alternate method:', firstError.message);
        
        // Second attempt: Simpler fetch approach with default settings
        const fetchResponse = await fetch(`${serverUrl}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username,
            password
          })
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`HTTP error! Status: ${fetchResponse.status}`);
        }
        
        // Convert fetch response to match axios format
        response = {
          data: await fetchResponse.json()
        };
      }
      
      console.log('Login API response:', JSON.stringify(response.data));
      
      if (response.data.success) {
        // Store auth token and user info
        const { token, user } = response.data.data;
        await AsyncStorage.setItem('emergencyAlertAuthToken', token);
        await AsyncStorage.setItem('emergencyAlertUser', JSON.stringify(user));
        
        Alert.alert('Success', 'Login successful!');
        
        // Notify parent component
        if (onLoginSuccess) {
          onLoginSuccess({ user, token });
        }
      } else {
        setErrorMessage(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) console.error('Error details:', error.response?.data);
      
      // More detailed error handling
      if (error.response) {
        // Server responded with an error
        const errorMsg = error.response.data?.message || `Error ${error.response.status}: ${error.response.statusText}`;
        setErrorMessage(errorMsg);
      } else if (error.request) {
        // No response received
        setErrorMessage('No response from server. Check your internet connection or try a different server URL.');
      } else if (error.message && error.message.includes('Network Error')) {
        // Common RN network error
        setErrorMessage('Network error. Check that the server URL is correct and accessible.');
      } else {
        // Request setup error
        setErrorMessage(`Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Emergency Alert System</Text>
          <Text style={styles.versionText}>Simplified Login</Text>
        </View>
        
        <View style={styles.formContainer}>
          <Text style={styles.title}>Direct Login</Text>
          <Text style={styles.subtitle}>Testing direct API connection</Text>
          
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Server URL</Text>
            <TextInput
              style={styles.input}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="Server URL"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <View style={styles.urlButtonsContainer}>
              <TouchableOpacity 
                style={[styles.urlButton, serverUrl === 'http://localhost:5000' && styles.urlButtonActive]} 
                onPress={() => {
                  setServerUrl('http://localhost:5000');
                  useLocalApi();
                }}
              >
                <Text style={styles.urlButtonText}>Local</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.urlButton, serverUrl === 'http://10.0.2.2:5000' && styles.urlButtonActive]} 
                onPress={() => {
                  // Android emulator uses 10.0.2.2 to access host machine localhost
                  setServerUrl('http://10.0.2.2:5000');
                  setCustomApiUrl('http://10.0.2.2:5000');
                }}
              >
                <Text style={styles.urlButtonText}>Android</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.urlButton, serverUrl === 'https://emergency-connect.replit.app' && styles.urlButtonActive]} 
                onPress={() => {
                  setServerUrl('https://emergency-connect.replit.app');
                  useReplitApi();
                }}
              >
                <Text style={styles.urlButtonText}>Replit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.connectionStatusContainer}>
              {serverStatus ? (
                <Text style={[styles.connectionStatusText, connectionSuccess ? styles.successText : styles.errorText]}>
                  {connectionSuccess ? 'Connected' : 'Connection failed'}
                </Text>
              ) : (
                <Text style={styles.connectionStatusText}>Checking connection...</Text>
              )}
              <TouchableOpacity 
                style={[styles.connectivityButton, diagnosticsRunning && styles.buttonDisabled]}
                onPress={async () => {
                  setDiagnosticsRunning(true);
                  setErrorMessage('');
                  try {
                    const results = await debugService.testConnectivity(serverUrl);
                    console.log('Connectivity test results:', results);
                    
                    let message = 'Connectivity Test Results:\n';
                    message += `• Axios: ${results.axiosSuccess ? '✓' : '✗'}\n`;
                    message += `• Fetch: ${results.fetchSuccess ? '✓' : '✗'}\n`;
                    message += `• XMLHttpRequest: ${results.xmlHttpSuccess ? '✓' : '✗'}\n`;
                    
                    if (results.responseTime) {
                      message += `\nResponse Time: ${results.responseTime}ms`;
                    }
                    
                    Alert.alert('Connectivity Test', message);
                    
                    if (!results.axiosSuccess && !results.fetchSuccess && !results.xmlHttpSuccess) {
                      setErrorMessage('All connectivity methods failed. Please check your network connection and server URL.');
                    } else if (results.axiosSuccess || results.fetchSuccess || results.xmlHttpSuccess) {
                      // Refresh server status
                      const status = await debugService.getServerStatus();
                      setServerStatus(status);
                      if (status && status.success) {
                        setConnectionSuccess(true);
                        setErrorMessage('');
                      }
                    }
                  } catch (error) {
                    console.error('Connectivity test error:', error);
                    setErrorMessage('Failed to run connectivity test: ' + error.message);
                  } finally {
                    setDiagnosticsRunning(false);
                  }
                }}
                disabled={diagnosticsRunning}
              >
                <Text style={styles.connectivityButtonText}>Test Connectivity</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>
          
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Direct Sign In</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.debugButton}
            onPress={() => {
              setUsername('admin');
              setPassword('admin123');
            }}
          >
            <Text style={styles.debugButtonText}>Fill Admin Credentials</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.altButton, diagnosticsRunning && styles.buttonDisabled]}
            onPress={async () => {
              setIsLoading(true);
              setErrorMessage('');
              try {
                const result = await debugService.getDirectToken('admin');
                if (result) {
                  Alert.alert('Success', 'Got debug token for admin user!');
                  // Get user from storage and call onLoginSuccess
                  const userString = await AsyncStorage.getItem('emergencyAlertUser');
                  const token = await AsyncStorage.getItem('emergencyAlertAuthToken');
                  if (userString && token) {
                    const user = JSON.parse(userString);
                    onLoginSuccess({ user, token });
                  }
                } else {
                  setErrorMessage('Failed to get debug token');
                }
              } catch (error) {
                setErrorMessage('Error getting debug token: ' + error.message);
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={diagnosticsRunning || isLoading}
          >
            <Text style={styles.altButtonText}>Get Debug Token</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.altButton, diagnosticsRunning && styles.buttonDisabled]}
            onPress={async () => {
              setDiagnosticsRunning(true);
              setErrorMessage('');
              try {
                const results = await debugService.runDiagnostics();
                console.log('Diagnostics results:', results);
                
                if (results.serverOnline) {
                  if (results.authWorks) {
                    Alert.alert('Success', 'Server is online and debug token obtained successfully!');
                    
                    // Get user from storage and call onLoginSuccess if token is valid
                    if (results.tokenValid) {
                      const userString = await AsyncStorage.getItem('emergencyAlertUser');
                      const token = await AsyncStorage.getItem('emergencyAlertAuthToken');
                      if (userString && token) {
                        const user = JSON.parse(userString);
                        onLoginSuccess({ user, token });
                      }
                    } else {
                      setErrorMessage('Server online but token validation failed. Try login again.');
                    }
                  } else {
                    setErrorMessage('Server is online but auth failed. ' + results.errorMessages.join(', '));
                  }
                } else {
                  setErrorMessage('Server diagnostics failed: ' + results.errorMessages.join(', '));
                }
              } catch (error) {
                setErrorMessage('Diagnostics error: ' + error.message);
              } finally {
                setDiagnosticsRunning(false);
              }
            }}
            disabled={diagnosticsRunning || isLoading}
          >
            <Text style={styles.altButtonText}>Run Diagnostics</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is a debugging screen for direct API testing.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 10,
    textAlign: 'center',
  },
  versionText: {
    fontSize: 16,
    color: COLORS.secondary,
    marginTop: 5,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#444444',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  debugButton: {
    marginTop: 20,
    padding: 10,
    alignItems: 'center',
  },
  debugButtonText: {
    color: COLORS.info,
    fontSize: 14,
  },
  altButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  altButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  // URL selection buttons
  urlButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  urlButton: {
    flex: 1,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  urlButtonActive: {
    backgroundColor: COLORS.success + '30', // 30% opacity
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  urlButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Connection status
  connectionStatusContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  connectionStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  successText: {
    color: COLORS.success,
  },
  connectivityButton: {
    backgroundColor: COLORS.info + '20',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.info,
  },
  connectivityButtonText: {
    fontSize: 12,
    color: COLORS.info,
    fontWeight: '500',
  },
});

export default SimplifiedLoginScreen;