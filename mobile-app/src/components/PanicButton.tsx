import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Vibration
} from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { alertsApi } from '../services/api';

interface PanicButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  buttonText?: string;
  confirmText?: string;
  cooldownPeriod?: number; // in seconds
}

const PanicButton: React.FC<PanicButtonProps> = ({
  onSuccess,
  onError,
  buttonText = 'PANIC ALERT',
  confirmText = 'Are you sure you want to send a panic alert?',
  cooldownPeriod = 30
}) => {
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(cooldownPeriod);
  const [cooldownInterval, setCooldownInterval] = useState<NodeJS.Timeout | null>(null);
  
  const auth = useAuth();

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (cooldownInterval) {
        clearInterval(cooldownInterval);
      }
    };
  }, [cooldownInterval]);

  const startCooldown = () => {
    setCooldownActive(true);
    setCooldownRemaining(cooldownPeriod);

    const interval = setInterval(() => {
      setCooldownRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCooldownActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setCooldownInterval(interval);
  };

  const handlePanicButtonPress = () => {
    // Vibrate to provide haptic feedback
    Vibration.vibrate(200);
    
    // Show confirmation dialog
    setIsConfirmVisible(true);
  };

  const handleCancelConfirm = () => {
    setIsConfirmVisible(false);
  };

  const handleConfirmPanic = async () => {
    setIsConfirmVisible(false);
    setIsLoading(true);

    try {
      // Get location
      let locationData: any = null;
      
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High
          });
          
          locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy
          };
          console.log('Location obtained:', locationData);
        } else {
          console.log('Location permission not granted');
          locationData = { error: 'permission', message: 'Location permission not granted' };
        }
      } catch (error) {
        console.log('Error getting location:', error);
        locationData = { error: 'error', message: 'Error getting location' };
      }

      // Log the API call
      console.log('Sending panic alert with location:', locationData);
      
      // Send panic alert
      const response = await alertsApi.createPanicAlert(locationData);
      console.log('Panic alert response:', response);

      setIsLoading(false);
      
      if (response.success) {
        // Vibrate again to signal success
        Vibration.vibrate([400, 100, 400]);
        
        // Start cooldown
        startCooldown();
        
        // Call onSuccess callback
        if (onSuccess) {
          onSuccess();
        }
      } else {
        console.error('API reported failure:', response.error);
        throw new Error(response.error || 'Failed to send panic alert');
      }
    } catch (error) {
      setIsLoading(false);
      
      console.error('Error sending panic alert:', error);
      
      // Alert the user about the error
      Alert.alert(
        'Error',
        'Failed to send panic alert. Please try again.',
        [{ text: 'OK' }]
      );
      
      // Call onError callback
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.panicButton,
          cooldownActive && styles.panicButtonDisabled
        ]}
        onPress={handlePanicButtonPress}
        disabled={cooldownActive || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>{buttonText}</Text>
        )}
      </TouchableOpacity>
      
      {cooldownActive && (
        <Text style={styles.cooldownText}>
          Cooldown: {cooldownRemaining} seconds
        </Text>
      )}
      
      {/* Confirmation Modal */}
      <Modal
        visible={isConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelConfirm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Emergency Alert</Text>
            <Text style={styles.modalText}>{confirmText}</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelConfirm}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmPanic}
              >
                <Text style={styles.confirmButtonText}>Send Alert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  panicButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  panicButtonDisabled: {
    backgroundColor: '#888',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cooldownText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#444',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#ff3b30',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#f1f1f1',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
  },
});

export default PanicButton;