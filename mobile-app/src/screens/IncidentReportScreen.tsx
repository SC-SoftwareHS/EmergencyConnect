import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config';
import { User } from '../types';

// This is a placeholder service until we fully implement the incidents API
const mockIncidentsService = {
  createIncident: async (incidentData: any) => {
    // In a real implementation, this would send to the server
    console.log('Creating incident', incidentData);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { 
      success: true, 
      data: { 
        id: 'new-incident-' + Math.floor(Math.random() * 1000),
        ...incidentData 
      } 
    };
  }
};

const IncidentReportScreen = () => {
  const navigation = useNavigation();
  
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createAlert, setCreateAlert] = useState(false);
  
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
  
  // Submit form
  const handleSubmit = async () => {
    // Validate form
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }
    
    if (!user) {
      Alert.alert('Error', 'User information not available');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const incidentData = {
        title,
        description,
        location,
        severity,
        reportedBy: user.id,
        reportedAt: new Date().toISOString(),
        status: 'reported',
      };
      
      const response = await mockIncidentsService.createIncident(incidentData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Incident report submitted successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                // If create alert is enabled, navigate to create alert form
                if (createAlert) {
                  // In a real app, we would navigate to create alert screen with the incident ID
                  Alert.alert('Create Alert', 'Would navigate to create alert form with incident ID: ' + response.data.id);
                }
                
                // Navigate back to incidents list
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting incident report:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render severity option
  const renderSeverityOption = (value: 'low' | 'medium' | 'high' | 'critical', label: string) => {
    const isSelected = severity === value;
    const backgroundColor = isSelected ? getSeverityColor(value) : '#f2f2f2';
    const textColor = isSelected ? '#fff' : '#333';
    
    return (
      <TouchableOpacity
        style={[styles.severityOption, { backgroundColor }]}
        onPress={() => setSeverity(value)}
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
      default: return COLORS.medium;
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formSection}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Brief title describing the incident"
            placeholderTextColor="#999"
          />
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Detailed description of the incident"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Where the incident occurred"
            placeholderTextColor="#999"
          />
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.label}>Severity</Text>
          <View style={styles.severityContainer}>
            {renderSeverityOption('low', 'Low')}
            {renderSeverityOption('medium', 'Medium')}
            {renderSeverityOption('high', 'High')}
            {renderSeverityOption('critical', 'Critical')}
          </View>
        </View>
        
        <View style={styles.formSection}>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Create Alert After Submission</Text>
            <Switch
              value={createAlert}
              onValueChange={setCreateAlert}
              trackColor={{ false: '#ddd', true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>
          <Text style={styles.switchDescription}>
            Toggle this if you want to immediately create an alert based on this incident
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
  },
  severityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  severityOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  severityOptionText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  switchDescription: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default IncidentReportScreen;