import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Import the simplified login screen (bypasses regular auth flow)
import SimplifiedLoginScreen from './src/screens/SimplifiedLoginScreen';
import { COLORS } from './src/config';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle successful login
  const handleLoginSuccess = (loginResult) => {
    console.log('Login successful with result:', JSON.stringify(loginResult));
    setUser(loginResult.user);
    setLoggedIn(true);
  };

  // If not logged in, show the simplified login screen
  if (!loggedIn) {
    return (
      <SafeAreaProvider>
        <SimplifiedLoginScreen onLoginSuccess={handleLoginSuccess} />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    );
  }

  // Simple dashboard after login (for testing)
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Emergency Connect</Text>
        </View>
        
        <View style={styles.content}>
          <View style={styles.userInfoCard}>
            <Text style={styles.welcomeText}>Welcome, {user?.username || 'User'}!</Text>
            <Text style={styles.userRole}>Role: {user?.role || 'Unknown'}</Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.successText}>
              Authentication successful! 🎉
            </Text>
            
            <Text style={styles.infoText}>
              You've successfully authenticated with the server. This simplified dashboard 
              confirms your login information is correct.
            </Text>
          </View>
          
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Connection Status</Text>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.statusText}>Server connection: <Text style={styles.statusHighlight}>Active</Text></Text>
            </View>
          </View>
        </View>
        
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userInfoCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  userRole: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 16,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.success,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#444444',
  },
  statusHighlight: {
    fontWeight: 'bold',
    color: COLORS.success,
  },
});