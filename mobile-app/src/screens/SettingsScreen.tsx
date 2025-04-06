import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config';
import { User } from '../types';

const SettingsScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // App settings
  const [enableBackgroundSync, setEnableBackgroundSync] = useState(true);
  const [enablePushNotifications, setEnablePushNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Load user and settings from storage
  useEffect(() => {
    const loadUserAndSettings = async () => {
      try {
        // Load user info
        const userString = await AsyncStorage.getItem('emergencyAlertUser');
        if (userString) {
          setUser(JSON.parse(userString));
        }
        
        // Load app settings
        const backgroundSyncSetting = await AsyncStorage.getItem('setting_backgroundSync');
        if (backgroundSyncSetting !== null) {
          setEnableBackgroundSync(JSON.parse(backgroundSyncSetting));
        }
        
        const pushNotificationsSetting = await AsyncStorage.getItem('setting_pushNotifications');
        if (pushNotificationsSetting !== null) {
          setEnablePushNotifications(JSON.parse(pushNotificationsSetting));
        }
        
        const soundSetting = await AsyncStorage.getItem('setting_sound');
        if (soundSetting !== null) {
          setSoundEnabled(JSON.parse(soundSetting));
        }
        
        const vibrationSetting = await AsyncStorage.getItem('setting_vibration');
        if (vibrationSetting !== null) {
          setVibrationEnabled(JSON.parse(vibrationSetting));
        }
        
        const darkModeSetting = await AsyncStorage.getItem('setting_darkMode');
        if (darkModeSetting !== null) {
          setDarkModeEnabled(JSON.parse(darkModeSetting));
        }
        
        const savedServerUrl = await AsyncStorage.getItem('setting_serverUrl');
        if (savedServerUrl) {
          setServerUrl(savedServerUrl);
        } else {
          // Default server URL
          setServerUrl('https://emergencyconnect-api.example.com');
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserAndSettings();
  }, []);
  
  // Save all settings
  const saveSettings = async () => {
    try {
      setIsSaving(true);
      
      // Validate server URL
      if (!serverUrl) {
        Alert.alert('Error', 'Server URL cannot be empty');
        setIsSaving(false);
        return;
      }
      
      // Save all settings to AsyncStorage
      await AsyncStorage.setItem('setting_backgroundSync', JSON.stringify(enableBackgroundSync));
      await AsyncStorage.setItem('setting_pushNotifications', JSON.stringify(enablePushNotifications));
      await AsyncStorage.setItem('setting_sound', JSON.stringify(soundEnabled));
      await AsyncStorage.setItem('setting_vibration', JSON.stringify(vibrationEnabled));
      await AsyncStorage.setItem('setting_darkMode', JSON.stringify(darkModeEnabled));
      await AsyncStorage.setItem('setting_serverUrl', serverUrl);
      
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Reset all settings to default
  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            setEnableBackgroundSync(true);
            setEnablePushNotifications(true);
            setSoundEnabled(true);
            setVibrationEnabled(true);
            setDarkModeEnabled(false);
            setServerUrl('https://emergencyconnect-api.example.com');
            
            // Save default settings
            await saveSettings();
          } 
        },
      ]
    );
  };
  
  // Clear app data
  const clearAppData = () => {
    Alert.alert(
      'Clear App Data',
      'This will clear all locally stored data including login information. You will need to log in again.\n\nAre you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Data', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Clear all AsyncStorage data
              await AsyncStorage.clear();
              
              Alert.alert(
                'Data Cleared',
                'All app data has been cleared. The app will now restart.',
                [
                  { 
                    text: 'OK',
                    onPress: () => {
                      // In a real app, this would navigate to the login screen
                      // or restart the app
                      Alert.alert('App would restart here');
                      setIsLoading(false);
                    } 
                  },
                ]
              );
            } catch (error) {
              console.error('Error clearing app data:', error);
              Alert.alert('Error', 'Failed to clear app data');
              setIsLoading(false);
            }
          } 
        },
      ]
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingRow}>
              <Ionicons name="sync-outline" size={22} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Background Sync</Text>
              <Switch
                value={enableBackgroundSync}
                onValueChange={setEnableBackgroundSync}
                trackColor={{ false: '#ddd', true: COLORS.primary }}
                thumbColor="#fff"
              />
            </View>
            <Text style={styles.settingDescription}>
              Keep alerts synchronized in the background
            </Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingRow}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Switch
                value={enablePushNotifications}
                onValueChange={setEnablePushNotifications}
                trackColor={{ false: '#ddd', true: COLORS.primary }}
                thumbColor="#fff"
              />
            </View>
            <Text style={styles.settingDescription}>
              Receive push notifications for new alerts
            </Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingRow}>
              <Ionicons name="volume-high-outline" size={22} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Alert Sounds</Text>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: '#ddd', true: COLORS.primary }}
                thumbColor="#fff"
              />
            </View>
            <Text style={styles.settingDescription}>
              Play sound when a new alert is received
            </Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingRow}>
              <Ionicons name="phone-portrait-outline" size={22} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Vibration</Text>
              <Switch
                value={vibrationEnabled}
                onValueChange={setVibrationEnabled}
                trackColor={{ false: '#ddd', true: COLORS.primary }}
                thumbColor="#fff"
              />
            </View>
            <Text style={styles.settingDescription}>
              Vibrate when a new alert is received
            </Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingRow}>
              <Ionicons name="moon-outline" size={22} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: '#ddd', true: COLORS.primary }}
                thumbColor="#fff"
              />
            </View>
            <Text style={styles.settingDescription}>
              Use dark theme throughout the app (requires restart)
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Server Configuration</Text>
          
          <View style={styles.formField}>
            <Text style={styles.label}>Server URL</Text>
            <TextInput
              style={styles.input}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="Enter server URL"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
            <Text style={styles.inputHint}>
              This is the base URL for the Emergency Connect API
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.testConnectionButton}
            onPress={() => {
              // Simulate testing connection
              Alert.alert('Testing Connection', 'This would test connection to the server');
            }}
          >
            <Ionicons name="radio-outline" size={16} color={COLORS.primary} />
            <Text style={styles.testConnectionText}>Test Connection</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={saveSettings}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={styles.saveButtonText}>Save Settings</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.dangerSection}>
          <Text style={styles.dangerSectionTitle}>Advanced</Text>
          
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={resetSettings}
          >
            <Ionicons name="refresh-outline" size={18} color={COLORS.warning} />
            <Text style={[styles.dangerButtonText, { color: COLORS.warning }]}>
              Reset to Default Settings
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={clearAppData}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            <Text style={[styles.dangerButtonText, { color: COLORS.danger }]}>
              Clear All App Data
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.versionText}>
            Emergency Connect v1.0.0 (Build 123)
          </Text>
          <Text style={styles.copyrightText}>
            © 2025 Emergency Connect Inc.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.white,
    marginTop: 16,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginLeft: 34,
  },
  formField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  inputHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  testConnectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 8,
  },
  testConnectionText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  buttonContainer: {
    margin: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  dangerSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dangerSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 8,
  },
  dangerButtonText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#999',
  },
});

export default SettingsScreen;