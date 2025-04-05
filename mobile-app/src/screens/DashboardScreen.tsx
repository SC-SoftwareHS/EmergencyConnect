import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList, Alert as AlertType } from '../types';
import { COLORS } from '../config';
import { alertsApi } from '../services/api';
import {
  initializeSocket,
  onNewAlert,
  onAlertUpdate,
  onSocketError,
} from '../services/socket';

// Navigation prop type
type DashboardScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Dashboard'
>;

const DashboardScreen = () => {
  const { authState, logout } = useAuth();
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Socket event handlers
  const handleNewAlert = (alert: AlertType) => {
    setAlerts(prevAlerts => [alert, ...prevAlerts]);
    // Show notification
    Alert.alert('New Alert', `${alert.title}: ${alert.message}`);
  };
  
  const handleAlertUpdate = (updatedAlert: AlertType) => {
    setAlerts(prevAlerts =>
      prevAlerts.map(alert =>
        alert.id === updatedAlert.id ? updatedAlert : alert
      )
    );
  };
  
  const handleSocketError = (error: any) => {
    console.error('Socket error:', error);
  };
  
  // Fetch alerts from API
  const fetchAlerts = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      setError(null);
      const response = await alertsApi.getAlerts();
      
      if (response.success && response.data) {
        setAlerts(response.data);
      } else {
        setError(response.error || 'Failed to fetch alerts');
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Initialize data and socket connections
  useEffect(() => {
    // Set up socket event listeners
    onNewAlert(handleNewAlert);
    onAlertUpdate(handleAlertUpdate);
    onSocketError(handleSocketError);
    
    // Connect to socket if needed
    initializeSocket();
    
    // Fetch initial alerts
    fetchAlerts();
    
    // Clean up on unmount
    return () => {
      // Note: Socket cleanup is handled in AuthContext
    };
  }, []);
  
  // Handle refresh
  const handleRefresh = () => {
    fetchAlerts(true);
  };
  
  // Handle alert press - navigate to detail
  const handleAlertPress = (alert: AlertType) => {
    navigation.navigate('AlertDetail', { alertId: alert.id });
  };
  
  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logout() },
      ]
    );
  };
  
  // Render alert item
  const renderAlertItem = ({ item }: { item: AlertType }) => {
    // Determine status color
    let statusColor = '#666666';
    if (item.status === 'active') statusColor = COLORS.danger;
    else if (item.status === 'resolved') statusColor = COLORS.success;
    else if (item.status === 'cancelled') statusColor = COLORS.dark;
    
    // Determine severity color
    let severityColor = COLORS.dark;
    if (item.severity === 'critical') severityColor = COLORS.critical;
    else if (item.severity === 'high') severityColor = COLORS.high;
    else if (item.severity === 'medium') severityColor = COLORS.medium;
    else if (item.severity === 'low') severityColor = COLORS.low;
    
    return (
      <TouchableOpacity
        style={styles.alertItem}
        onPress={() => handleAlertPress(item)}
      >
        <View style={[styles.severityIndicator, { backgroundColor: severityColor }]} />
        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertTitle}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
          
          <Text style={styles.alertMessage} numberOfLines={2}>
            {item.message}
          </Text>
          
          <View style={styles.alertMeta}>
            <Text style={styles.alertTime}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
            
            {item.acknowledged ? (
              <View style={styles.acknowledgedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.acknowledgedText}>Acknowledged</Text>
              </View>
            ) : (
              <View style={styles.unacknowledgedBadge}>
                <Ionicons name="alert-circle" size={16} color={COLORS.warning} />
                <Text style={styles.unacknowledgedText}>Action needed</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Emergency Alerts</Text>
          <Text style={styles.username}>
            {authState.user ? `Welcome, ${authState.user.username}` : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Alert list */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Loading alerts...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={40} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchAlerts()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : alerts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle" size={40} color={COLORS.success} />
          <Text style={styles.emptyText}>No active alerts at this time</Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={renderAlertItem}
          contentContainerStyle={styles.alertsList}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  username: {
    fontSize: 14,
    color: COLORS.dark,
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.danger,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  alertsList: {
    padding: 16,
  },
  alertItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  severityIndicator: {
    width: 6,
    alignSelf: 'stretch',
    borderRadius: 3,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  alertMessage: {
    fontSize: 14,
    color: '#444444',
    marginBottom: 8,
    lineHeight: 20,
  },
  alertMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTime: {
    fontSize: 12,
    color: '#777777',
  },
  acknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  acknowledgedText: {
    fontSize: 12,
    color: COLORS.success,
    marginLeft: 4,
  },
  unacknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unacknowledgedText: {
    fontSize: 12,
    color: COLORS.warning,
    marginLeft: 4,
  },
});

export default DashboardScreen;