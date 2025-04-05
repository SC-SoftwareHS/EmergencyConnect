import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Alert as AlertType } from '../types';
import { alertsApi } from '../services/api';
import { COLORS } from '../config';
import { onAlertUpdate } from '../services/socket';

// Define route and navigation types
type AlertDetailRouteProp = RouteProp<RootStackParamList, 'AlertDetail'>;
type AlertDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AlertDetail'
>;

const AlertDetailScreen = () => {
  const route = useRoute<AlertDetailRouteProp>();
  const navigation = useNavigation<AlertDetailNavigationProp>();
  const { alertId } = route.params;
  
  const [alert, setAlert] = useState<AlertType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Update alert when socket emits update
  const handleAlertUpdate = (updatedAlert: AlertType) => {
    if (updatedAlert.id === alertId) {
      setAlert(updatedAlert);
    }
  };
  
  // Fetch alert details from API
  const fetchAlertDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await alertsApi.getAlertById(alertId);
      
      if (response.success && response.data) {
        setAlert(response.data);
      } else {
        setError(response.error || 'Failed to fetch alert details');
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle alert acknowledgment
  const acknowledgeAlert = async () => {
    try {
      setIsAcknowledging(true);
      
      const response = await alertsApi.acknowledgeAlert(alertId);
      
      if (response.success && response.data) {
        setAlert(response.data);
        Alert.alert('Success', 'Alert has been acknowledged');
      } else {
        Alert.alert('Error', response.error || 'Failed to acknowledge alert');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setIsAcknowledging(false);
    }
  };
  
  // Handle acknowledgment button press
  const handleAcknowledge = () => {
    if (!alert || alert.acknowledged) return;
    
    Alert.alert(
      'Acknowledge Alert',
      'Are you sure you want to acknowledge this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Acknowledge', onPress: acknowledgeAlert },
      ]
    );
  };
  
  // Set up effect for fetching and socket subscription
  useEffect(() => {
    // Add listener for alert updates
    onAlertUpdate(handleAlertUpdate);
    
    // Fetch initial alert details
    fetchAlertDetails();
    
    // Update header title
    navigation.setOptions({
      title: 'Alert Details',
    });
    
    // Clean up on unmount
    return () => {
      // Note: Socket cleanup is handled in AuthContext
    };
  }, [alertId]);
  
  // Determine status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return COLORS.danger;
      case 'resolved':
        return COLORS.success;
      case 'cancelled':
        return COLORS.dark;
      default:
        return '#666666';
    }
  };
  
  // Determine severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return COLORS.critical;
      case 'high':
        return COLORS.high;
      case 'medium':
        return COLORS.medium;
      case 'low':
        return COLORS.low;
      default:
        return COLORS.dark;
    }
  };
  
  // Format timestamp
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading alert details...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="alert-circle" size={60} color={COLORS.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchAlertDetails}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!alert) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="warning" size={60} color={COLORS.warning} />
        <Text style={styles.errorText}>Alert not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Alert header */}
        <View style={styles.headerContainer}>
          <View
            style={[
              styles.severityIndicator,
              { backgroundColor: getSeverityColor(alert.severity) },
            ]}
          />
          <View style={styles.headerContent}>
            <Text style={styles.title}>{alert.title}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(alert.status) },
              ]}
            >
              <Text style={styles.statusText}>{alert.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        
        {/* Alert details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Alert Details</Text>
          <Text style={styles.message}>{alert.message}</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#666666" />
            <Text style={styles.infoText}>
              Created: {formatDate(alert.createdAt)}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="alert-circle-outline" size={20} color="#666666" />
            <Text style={styles.infoText}>
              Severity: <Text style={{ color: getSeverityColor(alert.severity), fontWeight: 'bold' }}>
                {alert.severity.toUpperCase()}
              </Text>
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#666666" />
            <Text style={styles.infoText}>
              Created by: {alert.createdBy.username}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="notifications-outline" size={20} color="#666666" />
            <Text style={styles.infoText}>
              Channels: {alert.channels.join(', ')}
            </Text>
          </View>
          
          {alert.acknowledged && alert.acknowledgedAt && (
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.success} />
              <Text style={styles.infoText}>
                Acknowledged at: {formatDate(alert.acknowledgedAt)}
              </Text>
            </View>
          )}
        </View>
        
        {/* Acknowledgment button */}
        {alert.status === 'active' && !alert.acknowledged && (
          <TouchableOpacity
            style={styles.acknowledgeButton}
            onPress={handleAcknowledge}
            disabled={isAcknowledging}
          >
            {isAcknowledging ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.acknowledgeButtonText}>
                  Acknowledge Alert
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
        
        {/* Alert acknowledged indicator */}
        {alert.acknowledged && (
          <View style={styles.acknowledgedContainer}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={styles.acknowledgedText}>
              You have acknowledged this alert
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorText: {
    marginTop: 16,
    marginBottom: 16,
    fontSize: 18,
    color: COLORS.danger,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  severityIndicator: {
    width: 12,
    alignSelf: 'stretch',
  },
  headerContent: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#444444',
    marginLeft: 10,
  },
  acknowledgeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  acknowledgeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  acknowledgedContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  acknowledgedText: {
    color: COLORS.success,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default AlertDetailScreen;