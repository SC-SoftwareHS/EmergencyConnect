import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert as RNAlert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config';
import { Alert, User } from '../types';
import { alertsApi } from '../services/api';

const AlertDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { alertId } = route.params as { alertId: string };
  
  const [user, setUser] = useState<User | null>(null);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load user from storage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userString = await AsyncStorage.getItem('emergencyAlertUser');
        if (userString) {
          setUser(JSON.parse(userString));
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      }
    };
    
    loadUser();
  }, []);
  
  // Fetch alert details
  const fetchAlertDetails = async () => {
    try {
      setError(null);
      const response = await alertsApi.getAlertById(alertId);
      
      if (response.success && response.data) {
        setAlert(response.data);
      } else {
        setError(response.error || 'Failed to fetch alert details');
      }
    } catch (error) {
      console.error('Error fetching alert details:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchAlertDetails();
  }, [alertId]);
  
  // Helper to get color based on severity
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return COLORS.critical;
      case 'high': return COLORS.high;
      case 'medium': return COLORS.medium;
      case 'low': return COLORS.low;
      default: return COLORS.medium;
    }
  };
  
  // Helper to get text based on severity
  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical': return 'Critical';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Unknown';
    }
  };
  
  // Helper to get color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return COLORS.primary;
      case 'resolved': return COLORS.success;
      case 'cancelled': return COLORS.warning;
      case 'expired': return COLORS.dark;
      default: return COLORS.info;
    }
  };
  
  // Check if the current user has acknowledged this alert
  const hasUserAcknowledged = alert?.acknowledgments?.some(
    ack => user && ack.userId === user.id
  );
  
  // Handle acknowledge action
  const handleAcknowledge = async () => {
    if (!alert || hasUserAcknowledged) return;
    
    try {
      const response = await alertsApi.acknowledgeAlert(alert.id);
      
      if (response.success) {
        // Update local state to show acknowledgment
        setAlert(prevAlert => {
          if (!prevAlert || !user) return prevAlert;
          
          return {
            ...prevAlert,
            acknowledgments: [
              ...(prevAlert.acknowledgments || []),
              { userId: user.id, timestamp: new Date().toISOString() }
            ]
          };
        });
        
        RNAlert.alert('Success', 'Alert acknowledged successfully');
      } else {
        RNAlert.alert('Error', response.error || 'Failed to acknowledge alert');
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      RNAlert.alert('Error', 'Failed to acknowledge alert');
    }
  };
  
  // Handle share alert
  const handleShare = async () => {
    if (!alert) return;
    
    try {
      const message = `Emergency Alert: ${alert.title}\n\n${alert.message}\n\nSeverity: ${getSeverityText(alert.severity)}\nStatus: ${alert.status}\nIssued: ${new Date(alert.createdAt).toLocaleString()}`;
      
      await Share.share({
        message
      });
    } catch (error) {
      console.error('Error sharing alert:', error);
    }
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }
  
  if (error || !alert) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={40} color={COLORS.danger} />
          <Text style={styles.errorText}>{error || 'Alert not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAlertDetails}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Alert Header */}
        <View style={styles.alertHeader}>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) }]}>
            <Text style={styles.severityText}>{getSeverityText(alert.severity)}</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(alert.status) }]}>
            <Text style={styles.statusText}>{alert.status.toUpperCase()}</Text>
          </View>
        </View>
        
        {/* Alert Title and Content */}
        <Text style={styles.alertTitle}>{alert.title}</Text>
        
        <Text style={styles.alertDate}>
          Issued: {new Date(alert.createdAt).toLocaleString()}
        </Text>
        
        <View style={styles.messageContainer}>
          <Text style={styles.alertMessage}>{alert.message}</Text>
        </View>
        
        {/* Delivery Info */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Delivery</Text>
          <View style={styles.channelsContainer}>
            {alert.channels.includes('email') && (
              <View style={styles.channelBadge}>
                <Ionicons name="mail" size={16} color={COLORS.white} />
                <Text style={styles.channelText}>Email</Text>
              </View>
            )}
            {alert.channels.includes('sms') && (
              <View style={styles.channelBadge}>
                <Ionicons name="chatbubble" size={16} color={COLORS.white} />
                <Text style={styles.channelText}>SMS</Text>
              </View>
            )}
            {alert.channels.includes('push') && (
              <View style={styles.channelBadge}>
                <Ionicons name="notifications" size={16} color={COLORS.white} />
                <Text style={styles.channelText}>Push</Text>
              </View>
            )}
          </View>
          
          {alert.deliveryStats && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{alert.deliveryStats.sent}</Text>
                <Text style={styles.statLabel}>Sent</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{alert.deliveryStats.delivered}</Text>
                <Text style={styles.statLabel}>Delivered</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{alert.deliveryStats.failed}</Text>
                <Text style={styles.statLabel}>Failed</Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Attachments (if any) */}
        {alert.attachments && alert.attachments.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Attachments</Text>
            {alert.attachments.map((attachment, index) => (
              <TouchableOpacity key={index} style={styles.attachmentItem}>
                <Ionicons 
                  name={
                    attachment.type.includes('image') ? 'image' : 
                    attachment.type.includes('pdf') ? 'document' : 
                    attachment.type.includes('video') ? 'videocam' : 
                    'document-attach'
                  } 
                  size={24} 
                  color={COLORS.primary} 
                />
                <Text style={styles.attachmentName}>{attachment.name}</Text>
                <Ionicons name="download" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {alert.status === 'active' && !hasUserAcknowledged ? (
            <TouchableOpacity style={styles.acknowledgeButton} onPress={handleAcknowledge}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
              <Text style={styles.acknowledgeButtonText}>Acknowledge Alert</Text>
            </TouchableOpacity>
          ) : alert.status === 'active' && hasUserAcknowledged ? (
            <View style={styles.acknowledgedContainer}>
              <Ionicons name="checkmark-done-circle" size={24} color={COLORS.success} />
              <Text style={styles.acknowledgedText}>You have acknowledged this alert</Text>
            </View>
          ) : null}
          
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color={COLORS.white} />
            <Text style={styles.shareButtonText}>Share Alert</Text>
          </TouchableOpacity>
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
  scrollContent: {
    padding: 16,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.danger,
    textAlign: 'center',
    marginVertical: 10,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    marginTop: 10,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  severityText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  alertTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  alertDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  messageContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertMessage: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  channelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  channelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  channelText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  attachmentName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
  actionContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  acknowledgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  acknowledgeButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  acknowledgedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6f7ef',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  acknowledgedText: {
    color: COLORS.success,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.info,
    borderRadius: 8,
    padding: 16,
  },
  shareButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default AlertDetailScreen;