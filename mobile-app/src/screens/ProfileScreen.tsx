import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config';
import { User, NotificationPreferences } from '../types';

// Mock API for profile operations
const mockProfileApi = {
  updateProfile: async (userId: number, updates: Partial<User>) => {
    console.log('Updating profile for user', userId, updates);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },
  
  updateNotificationPreferences: async (userId: number, preferences: NotificationPreferences) => {
    console.log('Updating notification preferences for user', userId, preferences);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('emergencyAlertUser');
    await AsyncStorage.removeItem('emergencyAlertToken');
    return { success: true };
  }
};

const ProfileScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile form state
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [severityThreshold, setSeverityThreshold] = useState<'critical' | 'high' | 'medium' | 'low' | 'all'>('medium');
  
  // Load user from storage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userString = await AsyncStorage.getItem('emergencyAlertUser');
        if (userString) {
          const loadedUser = JSON.parse(userString);
          setUser(loadedUser);
          
          // Initialize form with user data
          setEmail(loadedUser.email || '');
          setPhoneNumber(loadedUser.phoneNumber || '');
          
          // Initialize notification preferences
          setEmailNotifications(loadedUser.channels?.email || false);
          setSmsNotifications(loadedUser.channels?.sms || false);
          setPushNotifications(loadedUser.channels?.push || false);
          
          // This would normally come from user's preferences in a real app
          setSeverityThreshold('medium');
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, []);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      Alert.alert(
        'Confirm Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Logout', 
            style: 'destructive',
            onPress: async () => {
              setIsLoading(true);
              await mockProfileApi.logout();
              // In a real app, we would navigate to the login screen here
              Alert.alert('Logged Out', 'You have been logged out successfully.\n\n(In a real app, this would navigate to the login screen)');
              setIsLoading(false);
            } 
          },
        ]
      );
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Save profile changes
  const saveProfileChanges = async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      // Validate email
      if (email && !/\S+@\S+\.\S+/.test(email)) {
        Alert.alert('Invalid Email', 'Please enter a valid email address');
        setIsSaving(false);
        return;
      }
      
      // Validate phone number
      if (phoneNumber && !/^\+?[0-9]{10,15}$/.test(phoneNumber.replace(/[^0-9+]/g, ''))) {
        Alert.alert('Invalid Phone Number', 'Please enter a valid phone number');
        setIsSaving(false);
        return;
      }
      
      // Update user profile
      const profileResponse = await mockProfileApi.updateProfile(user.id, {
        email,
        phoneNumber,
        channels: {
          email: emailNotifications,
          sms: smsNotifications,
          push: pushNotifications,
        }
      });
      
      // Update notification preferences
      const preferencesResponse = await mockProfileApi.updateNotificationPreferences(user.id, {
        email: emailNotifications,
        sms: smsNotifications,
        push: pushNotifications,
        alertSeverityThreshold: severityThreshold,
      });
      
      if (profileResponse.success && preferencesResponse.success) {
        // Update local user data
        const updatedUser = {
          ...user,
          email,
          phoneNumber,
          channels: {
            email: emailNotifications,
            sms: smsNotifications,
            push: pushNotifications,
          }
        };
        
        setUser(updatedUser);
        await AsyncStorage.setItem('emergencyAlertUser', JSON.stringify(updatedUser));
        
        Alert.alert('Success', 'Your profile has been updated successfully');
        setIsEditing(false);
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Render severity option
  const renderSeverityOption = (value: 'critical' | 'high' | 'medium' | 'low' | 'all', label: string) => {
    const isSelected = severityThreshold === value;
    const backgroundColor = isSelected ? getSeverityColor(value) : '#f2f2f2';
    const textColor = isSelected ? '#fff' : '#333';
    
    return (
      <TouchableOpacity
        style={[styles.severityOption, { backgroundColor }]}
        onPress={() => setSeverityThreshold(value)}
      >
        <Text style={[styles.severityOptionText, { color: textColor }]}>{label}</Text>
      </TouchableOpacity>
    );
  };
  
  // Helper to get color based on severity
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return COLORS.critical;
      case 'high': return COLORS.high;
      case 'medium': return COLORS.medium;
      case 'low': return COLORS.low;
      case 'all': return COLORS.info;
      default: return COLORS.medium;
    }
  };
  
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  
  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={40} color={COLORS.danger} />
        <Text style={styles.errorText}>User information not available</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.roleLabel}>{user.role}</Text>
          
          {!isEditing && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="create-outline" size={18} color={COLORS.white} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {isEditing ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Edit Profile</Text>
            
            <View style={styles.formField}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.formField}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  // Reset form to original values
                  setEmail(user.email || '');
                  setPhoneNumber(user.phoneNumber || '');
                  setEmailNotifications(user.channels?.email || false);
                  setSmsNotifications(user.channels?.sms || false);
                  setPushNotifications(user.channels?.push || false);
                  
                  setIsEditing(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={saveProfileChanges}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            
            <View style={styles.infoItem}>
              <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{user.email || 'Not provided'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="call-outline" size={20} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{user.phoneNumber || 'Not provided'}</Text>
            </View>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceRow}>
              <Ionicons name="mail" size={20} color={COLORS.primary} />
              <Text style={styles.preferenceLabel}>Email Notifications</Text>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: '#ddd', true: COLORS.primary }}
                thumbColor="#fff"
                disabled={!isEditing}
              />
            </View>
          </View>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceRow}>
              <Ionicons name="chatbubble" size={20} color={COLORS.primary} />
              <Text style={styles.preferenceLabel}>SMS Notifications</Text>
              <Switch
                value={smsNotifications}
                onValueChange={setSmsNotifications}
                trackColor={{ false: '#ddd', true: COLORS.primary }}
                thumbColor="#fff"
                disabled={!isEditing}
              />
            </View>
          </View>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceRow}>
              <Ionicons name="notifications" size={20} color={COLORS.primary} />
              <Text style={styles.preferenceLabel}>Push Notifications</Text>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: '#ddd', true: COLORS.primary }}
                thumbColor="#fff"
                disabled={!isEditing}
              />
            </View>
          </View>
          
          {isEditing && (
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceSubtitle}>Alert Severity Threshold</Text>
              <Text style={styles.preferenceDescription}>
                You will only receive alerts for incidents at or above this severity level
              </Text>
              
              <View style={styles.severityOptions}>
                {renderSeverityOption('all', 'All')}
                {renderSeverityOption('low', 'Low')}
                {renderSeverityOption('medium', 'Medium')}
                {renderSeverityOption('high', 'High')}
                {renderSeverityOption('critical', 'Critical')}
              </View>
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
        
        <View style={styles.footer}>
          <Text style={styles.versionText}>Emergency Connect v1.0.0</Text>
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
  errorText: {
    fontSize: 16,
    color: COLORS.danger,
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: COLORS.white,
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  roleLabel: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
    marginTop: 4,
    marginBottom: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  editButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
  section: {
    backgroundColor: COLORS.white,
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 16,
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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginLeft: 8,
    width: 60,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginLeft: 4,
  },
  preferenceItem: {
    marginBottom: 16,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceLabel: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  preferenceSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  preferenceDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  severityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  severityOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 4,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  severityOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  formField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
});

export default ProfileScreen;