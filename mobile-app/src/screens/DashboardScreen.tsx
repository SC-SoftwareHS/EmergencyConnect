import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config';
import { Alert, User } from '../types';
import { alertsApi } from '../services/api';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  
  const [user, setUser] = useState<User | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  
  // Fetch active alerts
  const fetchActiveAlerts = async () => {
    try {
      setError(null);
      const response = await alertsApi.getAlerts();
      
      if (response.success && response.data) {
        // Filter for active alerts and sort by createdAt (most recent first)
        const active = response.data
          .filter(alert => alert.status === 'active')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setActiveAlerts(active);
      } else {
        setError(response.error || 'Failed to fetch alerts');
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchActiveAlerts();
  }, []);
  
  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchActiveAlerts();
  };
  
  // Render an alert card
  const renderAlertCard = (alert: Alert) => {
    const hasUserAcknowledged = alert.acknowledgments?.some(
      ack => user && ack.userId === user.id
    );
    
    return (
      <TouchableOpacity
        key={alert.id}
        style={[
          styles.alertCard,
          { backgroundColor: hasUserAcknowledged ? '#f8f9fa' : '#fff' }
        ]}
        onPress={() => navigation.navigate('AlertDetail' as never, { alertId: alert.id } as never)}
      >
        <View style={styles.alertHeader}>
          <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor(alert.severity) }]} />
          <Text style={styles.alertTitle}>{alert.title}</Text>
        </View>
        
        <Text style={styles.alertMessage} numberOfLines={2}>
          {alert.message}
        </Text>
        
        <View style={styles.alertFooter}>
          <Text style={styles.alertTimestamp}>
            {new Date(alert.createdAt).toLocaleString()}
          </Text>
          
          {hasUserAcknowledged ? (
            <View style={styles.acknowledgedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.acknowledgedText}>Acknowledged</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.acknowledgeButton}
              onPress={async (e) => {
                e.stopPropagation(); // Prevent navigation to detail
                try {
                  const response = await alertsApi.acknowledgeAlert(alert.id);
                  if (response.success) {
                    // Update local state to show acknowledgment
                    setActiveAlerts(
                      activeAlerts.map(a => {
                        if (a.id === alert.id && user) {
                          return {
                            ...a,
                            acknowledgments: [
                              ...(a.acknowledgments || []),
                              { userId: user.id, timestamp: new Date().toISOString() }
                            ]
                          };
                        }
                        return a;
                      })
                    );
                  }
                } catch (error) {
                  console.error('Error acknowledging alert:', error);
                }
              }}
            >
              <Text style={styles.acknowledgeButtonText}>Acknowledge</Text>
            </TouchableOpacity>
          )}
        </View>
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
      default: return COLORS.medium;
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>
            Welcome, {user?.username || 'User'}
          </Text>
          <Text style={styles.roleText}>Role: {user?.role || 'User'}</Text>
        </View>
        
        {/* Status Overview */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={styles.statusGrid}>
            <View style={[styles.statusItem, { backgroundColor: COLORS.light }]}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.statusLabel}>Server</Text>
              <Text style={styles.statusValue}>Online</Text>
            </View>
            <View style={[styles.statusItem, { backgroundColor: COLORS.light }]}>
              <Ionicons name="notifications" size={24} color={COLORS.primary} />
              <Text style={styles.statusLabel}>Notifications</Text>
              <Text style={styles.statusValue}>
                {user?.channels?.push ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            <View style={[styles.statusItem, { backgroundColor: COLORS.light }]}>
              <Ionicons name="warning" size={24} color={activeAlerts.length > 0 ? COLORS.warning : COLORS.success} />
              <Text style={styles.statusLabel}>Active Alerts</Text>
              <Text style={styles.statusValue}>{activeAlerts.length}</Text>
            </View>
            <View style={[styles.statusItem, { backgroundColor: COLORS.light }]}>
              <Ionicons name="shield" size={24} color={COLORS.info} />
              <Text style={styles.statusLabel}>Security</Text>
              <Text style={styles.statusValue}>Secure</Text>
            </View>
          </View>
        </View>
        
        {/* Active Alerts Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Alerts</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Alerts' as never)}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={40} color={COLORS.danger} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchActiveAlerts}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : activeAlerts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle" size={40} color={COLORS.success} />
              <Text style={styles.emptyText}>No active alerts at this time</Text>
            </View>
          ) : (
            activeAlerts.slice(0, 3).map(renderAlertCard)
          )}
        </View>
        
        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('IncidentReport' as never)}
            >
              <Ionicons name="add-circle" size={28} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Report Incident</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.info }]}
              onPress={() => navigation.navigate('Profile' as never)}
            >
              <Ionicons name="notifications" size={28} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Notification Settings</Text>
            </TouchableOpacity>
          </View>
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
  welcomeCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  roleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusItem: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.light,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  alertCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  acknowledgeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  acknowledgeButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  acknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  acknowledgedText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default DashboardScreen;