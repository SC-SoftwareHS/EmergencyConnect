import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import PanicButton from '../components/PanicButton';

type PanicAlertScreenProps = {
  navigation: StackNavigationProp<any>;
};

const PanicAlertScreen: React.FC<PanicAlertScreenProps> = ({ navigation }) => {
  const [lastAlertTime, setLastAlertTime] = useState<Date | null>(null);

  const handlePanicSuccess = () => {
    setLastAlertTime(new Date());
    
    // Show success message
    Alert.alert(
      'Alert Sent',
      'Your emergency alert has been sent. Help is on the way.',
      [{ text: 'OK' }]
    );
  };

  const handlePanicError = (error: Error) => {
    console.error('Panic alert error:', error);
    
    // Show error message
    Alert.alert(
      'Alert Error',
      'There was a problem sending your emergency alert. Please try again.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Emergency Panic Alert</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.description}>
            Use the panic button below in case of emergency. This will:
          </Text>
          
          <View style={styles.bulletPoints}>
            <Text style={styles.bulletPoint}>• Send an immediate high-priority alert</Text>
            <Text style={styles.bulletPoint}>• Notify all administrators and operators</Text>
            <Text style={styles.bulletPoint}>• Include your current location (if available)</Text>
            <Text style={styles.bulletPoint}>• Use all notification channels (SMS, Email, Push)</Text>
          </View>
          
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>IMPORTANT</Text>
            <Text style={styles.warningText}>
              Only use this button in genuine emergency situations that require immediate attention.
            </Text>
          </View>
          
          <View style={styles.panicButtonContainer}>
            <PanicButton
              onSuccess={handlePanicSuccess}
              onError={handlePanicError}
              buttonText="SEND EMERGENCY ALERT"
              confirmText="Are you sure you want to send an emergency alert? This will notify all emergency responders."
              cooldownPeriod={60} // 1 minute cooldown
            />
          </View>
          
          {lastAlertTime && (
            <View style={styles.lastAlertContainer}>
              <Text style={styles.lastAlertText}>
                Last alert sent: {lastAlertTime.toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#d9534f',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    lineHeight: 22,
  },
  bulletPoints: {
    marginBottom: 20,
  },
  bulletPoint: {
    fontSize: 15,
    color: '#444',
    marginBottom: 8,
    lineHeight: 20,
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 25,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 5,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  panicButtonContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  lastAlertContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  lastAlertText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default PanicAlertScreen;