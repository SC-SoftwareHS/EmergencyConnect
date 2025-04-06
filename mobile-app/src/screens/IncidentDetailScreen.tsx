import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config';
import { Incident, User } from '../types';
import { incidentsApi } from '../services/api';

const IncidentDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { incidentId } = route.params as { incidentId: string };
  
  const [user, setUser] = useState<User | null>(null);
  const [incident, setIncident] = useState<Incident | null>(null);
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
  
  // Fetch incident details
  const fetchIncidentDetails = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await incidentsApi.getIncidentById(incidentId);
      
      if (response.success && response.data) {
        setIncident(response.data);
      } else {
        setError(response.error || 'Failed to fetch incident details');
      }
    } catch (error) {
      console.error('Error fetching incident details:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    if (incidentId) {
      fetchIncidentDetails();
    } else {
      setError('No incident ID provided');
      setIsLoading(false);
    }
  }, [incidentId]);
  
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
  
  // Helper to get user name (in a real app, you'd lookup user details)
  const getUserName = (userId: number) => {
    if (userId === 1) return "Admin User";
    if (userId === 2) return "Operator User";
    if (userId === 3) return "Regular User";
    return `User ${userId}`;
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Check if user can add responses or update status
  const canManageIncident = () => {
    return user && (user.role === 'admin' || user.role === 'operator');
  };
  
  // Add a response to the incident
  const handleAddResponse = async (responseData: { action: string, notes: string }) => {
    try {
      const response = await incidentsApi.addResponse(incidentId, {
        action: responseData.action,
        notes: responseData.notes,
        userId: user?.id
      });
      
      if (response.success) {
        // Refresh incident data
        fetchIncidentDetails();
      } else {
        alert(`Error: ${response.error || 'Failed to add response'}`);
      }
    } catch (error) {
      console.error('Error adding response:', error);
      alert('Network error. Please try again.');
    }
  };
  
  // Update incident status
  const handleUpdateStatus = async (statusData: { status: string, notes: string }) => {
    try {
      const response = await incidentsApi.updateStatus(incidentId, {
        status: statusData.status,
        notes: statusData.notes,
        userId: user?.id
      });
      
      if (response.success) {
        // Refresh incident data
        fetchIncidentDetails();
      } else {
        alert(`Error: ${response.error || 'Failed to update status'}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Network error. Please try again.');
    }
  };
  
  // Create alert from incident
  const handleCreateAlert = async (alertData: any) => {
    try {
      const response = await incidentsApi.createAlert(incidentId, alertData);
      
      if (response.success) {
        alert(`Alert created successfully.`);
        // Refresh incident data
        fetchIncidentDetails();
      } else {
        alert(`Error: ${response.error || 'Failed to create alert'}`);
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      alert('Network error. Please try again.');
    }
  };

  // Render action buttons
  const renderActionButtons = () => {
    if (!canManageIncident() || !incident) return null;
    
    return (
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: COLORS.info }]}
          onPress={() => {
            // Would typically open a modal for adding a response
            alert('Add Response - Would open a form');
            // Mock response data for testing
            handleAddResponse({
              action: 'Test response action',
              notes: 'This is a test response from the mobile app'
            });
          }}
        >
          <Ionicons name="add-circle" size={16} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Add Response</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: COLORS.warning }]}
          onPress={() => {
            // Would typically open a modal for updating status
            alert('Update Status - Would open a form');
            // Mock status update data for testing
            handleUpdateStatus({
              status: incident.status === 'reported' ? 'investigating' : 
                     incident.status === 'investigating' ? 'resolved' : 'closed',
              notes: `Status updated from mobile app to ${incident.status === 'reported' ? 'investigating' : 
                     incident.status === 'investigating' ? 'resolved' : 'closed'}`
            });
          }}
        >
          <Ionicons name="refresh" size={16} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Update Status</Text>
        </TouchableOpacity>
        
        {incident.status !== 'resolved' && incident.status !== 'closed' && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
            onPress={() => {
              // Would typically navigate to alert creation
              alert('Create Alert - Would open alert form');
              // Mock alert data for testing
              handleCreateAlert({
                title: `Alert: ${incident.title}`,
                message: `This alert was created from an incident: ${incident.description.substring(0, 100)}...`,
                severity: incident.severity,
                channels: ['email', 'sms', 'push'],
                targeting: { all: true }
              });
            }}
          >
            <Ionicons name="warning" size={16} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Create Alert</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  
  if (error || !incident) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={40} color={COLORS.danger} />
        <Text style={styles.errorText}>{error || 'Incident not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchIncidentDetails}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor(incident.severity) }]} />
            <Text style={styles.incidentTitle}>{incident.title}</Text>
          </View>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(incident.status) }]}>
              <Text style={styles.statusText}>{incident.status}</Text>
            </View>
            <Text style={styles.incidentTimestamp}>
              Reported: {formatTimestamp(incident.reportedAt)}
            </Text>
          </View>
        </View>
        
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{incident.description}</Text>
        </View>
        
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={18} color="#666" />
            <Text style={styles.locationText}>{incident.location}</Text>
          </View>
        </View>
        
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Status Updates</Text>
          {incident.statusUpdates && incident.statusUpdates.length > 0 ? (
            incident.statusUpdates.map((update, index) => (
              <View key={index} style={styles.updateItem}>
                <View style={styles.updateHeader}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(update.status) }]} />
                  <Text style={styles.updateStatus}>{update.status}</Text>
                  <Text style={styles.updateTimestamp}>{formatTimestamp(update.timestamp)}</Text>
                </View>
                
                <Text style={styles.updateUser}>By: {getUserName(update.userId)}</Text>
                
                {update.notes && (
                  <Text style={styles.updateNotes}>{update.notes}</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No status updates yet</Text>
          )}
        </View>
        
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Response Actions</Text>
          {incident.responses && incident.responses.length > 0 ? (
            incident.responses.map((response, index) => (
              <View key={index} style={styles.responseItem}>
                <View style={styles.responseHeader}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  <Text style={styles.responseAction}>{response.action}</Text>
                </View>
                
                <View style={styles.responseDetails}>
                  <Text style={styles.responseTimestamp}>{formatTimestamp(response.timestamp)}</Text>
                  <Text style={styles.responseUser}>By: {getUserName(response.userId)}</Text>
                  
                  {response.notes && (
                    <Text style={styles.responseNotes}>{response.notes}</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No response actions yet</Text>
          )}
        </View>
        
        {incident.attachments && incident.attachments.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Attachments</Text>
            {incident.attachments.map((attachment, index) => (
              <TouchableOpacity key={index} style={styles.attachmentItem}>
                <View style={styles.attachmentIcon}>
                  <Ionicons 
                    name={attachment.type === 'image' ? 'image' : 'document-text'} 
                    size={24} 
                    color={COLORS.primary} 
                  />
                </View>
                <View style={styles.attachmentDetails}>
                  <Text style={styles.attachmentName}>{attachment.name}</Text>
                  <Text style={styles.attachmentType}>{attachment.type}</Text>
                </View>
                <Ionicons name="download" size={20} color={COLORS.info} />
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Render action buttons for admins and operators */}
        {renderActionButtons()}
        
        <View style={styles.footerSpacer} />
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
  headerCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  incidentTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  incidentTimestamp: {
    fontSize: 12,
    color: '#666',
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#444',
    marginLeft: 8,
  },
  updateItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  updateStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
    flex: 1,
  },
  updateTimestamp: {
    fontSize: 12,
    color: '#666',
  },
  updateUser: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  updateNotes: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
  },
  responseItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  responseAction: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  responseDetails: {
    marginLeft: 24,
  },
  responseTimestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  responseUser: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  responseNotes: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attachmentDetails: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  attachmentType: {
    fontSize: 12,
    color: '#888',
    textTransform: 'capitalize',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  footerSpacer: {
    height: 20,
  },
});

export default IncidentDetailScreen;