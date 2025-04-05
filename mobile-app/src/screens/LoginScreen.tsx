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
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../config';

const LoginScreen = () => {
  const { authState, login, clearError } = useAuth();
  const { isLoading, error } = authState;
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  
  // Handle login button press
  const handleLogin = async () => {
    // Validate form
    if (!username || !password) {
      setFormError('Username and password are required');
      return;
    }
    
    setFormError('');
    clearError();
    
    // Attempt login
    const success = await login({ username, password });
    
    if (!success && !authState.error) {
      setFormError('Login failed. Please check your credentials.');
    }
  };
  
  // Show error alert if needed
  React.useEffect(() => {
    if (error) {
      Alert.alert('Login Error', error);
    }
  }, [error]);
  
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
        </View>
        
        <View style={styles.formContainer}>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Please sign in to continue</Text>
          
          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
          
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
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            For emergency use only. Unauthorized access is prohibited.
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

export default LoginScreen;