import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getApiUrl } from '../config';
import { getAuthToken, userApi } from './api';

/**
 * Configure notification handling
 */
export function configureNotifications() {
  // Set notification handler for when app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,  // Show alert even when app is in foreground
      shouldPlaySound: true,  // Play sound
      shouldSetBadge: true,   // Update app badge count
    }),
  });
}

/**
 * Register for push notifications
 * @returns {Promise<string|null>} Push token or null if registration failed
 */
export async function registerForPushNotifications() {
  let token;
  
  if (!Device.isDevice) {
    console.log('Push notifications are not available in an emulator/simulator');
    return null;
  }

  try {
    // Check permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // If not determined, ask user for permission
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // If not granted, exit
    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions');
      return null;
    }
    
    // Get push token
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
    
    // Configure for Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('emergency-alerts', {
        name: 'Emergency Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF453A',
        sound: true,
      });
    }

    console.log('Push token:', token);
    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Register push token with the server
 * @param {number} userId - User ID
 * @param {string} pushToken - Push token
 * @returns {Promise<boolean>} True if registration succeeded
 */
export async function registerPushTokenWithServer(userId: number, pushToken: string): Promise<boolean> {
  try {
    // Use the userApi client to register the push token
    const response = await userApi.registerPushToken(userId, pushToken);
    
    if (response.success) {
      console.log('Push token registered with server');
      return true;
    } else {
      console.error('Failed to register push token with server:', response.error);
      return false;
    }
  } catch (error) {
    console.error('Error registering push token with server:', error);
    return false;
  }
}

/**
 * Add a notification listener
 * @param {Function} callback - Callback function that receives notification
 * @returns {Function} Function to remove the listener
 */
export function addNotificationListener(callback: (notification: Notifications.Notification) => void) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add a notification response listener for when user taps on a notification
 * @param {Function} callback - Callback function that receives notification response
 * @returns {Function} Function to remove the listener
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}