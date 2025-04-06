import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config';
import { Alert, User } from '../types';
import { alertsApi } from '../services/api';

const AlertsScreen = () => {
  const navigation = useNavigation();
  
  const [user, setUser] = useState<User | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
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
  
  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      setError(null);
      const response = await alertsApi.getAlerts();
      
      if (response.success && response.data) {
        // Sort by createdAt (most recent first)
        const sortedAlerts = response.data.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setAlerts(sortedAlerts);
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
    fetchAlerts();
  }, []);
  
  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
  };
  
  // Filtered alerts based on active filter
  const filteredAlerts = React.useMemo(() => {
    if (!activeFilter) return alerts;
    return alerts.filter(alert => alert.status === activeFilter);
  }, [alerts, activeFilter]);
  
  // Filter buttons
  const renderFilterButtons = () => {
    const filters = [
      { id: null, label: 'All' },
      { id: 'active', label: 'Active' },
      { id: 'resolved', label: 'Resolved' },
      { id: 'cancelled', label: 'Cancelled' }
    ];
    
    return (
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.id || 'all'}
              style={[
                styles.filterButton,
                activeFilter === filter.id && styles.filterButtonActive
              ]}
              onPress={() => setActiveFilter(filter.id)}
            >
              <Text 
                style={[
                  styles.filterButtonText,
                  activeFilter === filter.id && styles.filterButtonTextActive
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  
  // Render a single alert item
  const renderAlertItem = ({ item }: { item: Alert }) => {
    const hasUserAcknowledged = item.acknowledgments?.some(
      ack => user && ack.userId === user.id
    );
    
    return (
      <TouchableOpacity
        style={[
          styles.alertCard,
          { backgroundColor: hasUserAcknowledged ? '#f8f9fa' : '#fff' }
        ]}
        onPress={() => navigation.navigate('AlertDetail' as never, { alertId: item.id } as never)}
      >
        <View style={styles.alertHeader}>
          <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor(item.severity) }]} />
          <Text style={styles.alertTitle}>{item.title}</Text>
          {item.status !== 'active' && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.alertMessage} numberOfLines={2}>
          {item.message}
        </Text>
        
        <View style={styles.alertFooter}>
          <Text style={styles.alertTimestamp}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
          
          {item.status === 'active' && (
            hasUserAcknowledged ? (
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
                    const response = await alertsApi.acknowledgeAlert(item.id);
                    if (response.success) {
                      // Update local state to show acknowledgment
                      setAlerts(
                        alerts.map(a => {
                          if (a.id === item.id && user) {
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
            )
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
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {renderFilterButtons()}
      
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={40} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAlerts}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredAlerts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="information-circle" size={40} color={COLORS.info} />
          <Text style={styles.emptyText}>
            {activeFilter 
              ? `No ${activeFilter} alerts found` 
              : 'No alerts found'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAlerts}
          renderItem={renderAlertItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
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
    backgroundColor: '#f8f9fa',
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  filterScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.light,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    color: COLORS.dark,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  listContainer: {
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
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
});

export default AlertsScreen;