import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AlertDetailScreen from './src/screens/AlertDetailScreen';

// Import context providers
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Import types and services
import { RootStackParamList } from './src/types';
import { configureNotifications } from './src/services/notificationService';

// Configure notifications for the app
configureNotifications();

// Create the navigation stack
const Stack = createNativeStackNavigator<RootStackParamList>();

// Navigation component
const AppNavigator = () => {
  const { authState } = useAuth();
  const { isAuthenticated, isLoading } = authState;

  // Show loading screen while checking authentication
  if (isLoading) {
    return null; // Or a loading screen component
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
          // Auth screens
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          // App screens
          <>
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="AlertDetail" 
              component={AlertDetailScreen}
              options={{ title: 'Alert Details' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Import notification services
    import('./src/services/notificationService')
      .then(({ registerForPushNotifications, addNotificationListener, addNotificationResponseListener }) => {
        // Register for push notifications
        registerForPushNotifications().then(token => {
          if (token) {
            setExpoPushToken(token);
            console.log('Push token obtained:', token);
          }
        });

        // Handle received notifications
        notificationListener.current = addNotificationListener(notification => {
          console.log('Notification received:', notification);
        });

        // Handle notification responses (when user taps on notification)
        responseListener.current = addNotificationResponseListener(response => {
          console.log('Notification response:', response);
          // Here we could navigate to a specific screen based on notification data
          // e.g., navigate to AlertDetail if the notification is about a new alert
        });
      })
      .catch(error => {
        console.error('Error setting up notifications:', error);
      });

    // Clean up listeners on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}