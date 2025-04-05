import React, { useState } from 'react';
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
import { COLORS } from '../config';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This is a simplified login screen that bypasses the context system
// to test direct API connectivity with our server
const SimplifiedLoginScreen = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [serverUrl, setServerUrl] = useState('http://workspace.graftssalable0o.replit.app');
  
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
      
      const response = await axios.post(`${serverUrl}/api/auth/login`, {
        username,
        password
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
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
      console.error('Error details:', error.response?.data);
      
      if (error.response) {
        // Server responded with an error
        setErrorMessage(error.response.data.message || `Error ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        // No response received
        setErrorMessage('No response from server. Check your internet connection.');
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
});

export default SimplifiedLoginScreen;