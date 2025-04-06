import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config';
import { Incident, User } from '../types';
import { incidentsApi } from '../services/api';

const IncidentsScreen = () => {
  const navigation = useNavigation();
  
  const [user, setUser] = useState<User | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
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
  
  // Fetch incidents
  const fetchIncidents = async () => {
    try {
      setError(null);
      const response = await incidentsApi.getIncidents();
      
      if (response.success && response.data) {
        // Sort by reportedAt (most recent first)
        const sortedIncidents = response.data.sort((a, b) => 
          new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
        );
        
        setIncidents(sortedIncidents);
      } else {
        setError(response.error || 'Failed to fetch incidents');
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchIncidents();
  }, []);
  
  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIncidents();
  };
  
  // Filtered incidents based on active filter
  const filteredIncidents = React.useMemo(() => {
    if (!activeFilter) return incidents;
    return incidents.filter(incident => incident.status === activeFilter);
  }, [incidents, activeFilter]);
  
  // Filter buttons
  const renderFilterButtons = () => {
    const filters = [
      { id: null, label: 'All' },
      { id: 'reported', label: 'Reported' },
      { id: 'investigating', label: 'Investigating' },
      { id: 'resolved', label: 'Resolved' },
      { id: 'closed', label: 'Closed' }
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
  
  // Render a single incident item
  const renderIncidentItem = ({ item }: { item: Incident }) => {
    return (
      <TouchableOpacity
        style={styles.incidentCard}
        onPress={() => navigation.navigate('IncidentDetail' as never, { incidentId: item.id } as never)}
      >
        <View style={styles.incidentHeader}>
          <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor(item.severity) }]} />
          <Text style={styles.incidentTitle}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        <Text style={styles.incidentDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.incidentFooter}>
          <Text style={styles.incidentTimestamp}>
            {new Date(item.reportedAt).toLocaleString()}
          </Text>
          
          <View style={styles.incidentMeta}>
            <Ionicons name="location" size={12} color="#666" />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
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
      case 'reported': return COLORS.warning;
      case 'investigating': return COLORS.info;
      case 'resolved': return COLORS.success;
      case 'closed': return COLORS.dark;
      case 'cancelled': return COLORS.muted;
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchIncidents}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredIncidents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="information-circle" size={40} color={COLORS.info} />
          <Text style={styles.emptyText}>
            {activeFilter 
              ? `No ${activeFilter} incidents found` 
              : 'No incidents found'}
          </Text>
          
          {user && (user.role === 'admin' || user.role === 'operator') && (
            <TouchableOpacity 
              style={styles.reportButton}
              onPress={() => navigation.navigate('IncidentReport' as never)}
            >
              <Text style={styles.reportButtonText}>Report New Incident</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredIncidents}
          renderItem={renderIncidentItem}
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
          ListFooterComponent={() => (
            user && (user.role === 'admin' || user.role === 'operator') ? (
              <TouchableOpacity 
                style={styles.floatingActionButton}
                onPress={() => navigation.navigate('IncidentReport' as never)}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            ) : null
          )}
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
    paddingBottom: 80, // Space for the FAB
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
    marginBottom: 20,
  },
  reportButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    marginTop: 10,
  },
  reportButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  incidentCard: {
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
  incidentHeader: {
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
  incidentTitle: {
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
  incidentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  incidentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incidentTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  incidentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  floatingActionButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default IncidentsScreen;