// src/screens/DeveloperSettings.tsx - FIXED VERSION
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { parkingHistoryStorage } from '../utils/parkingHistoryStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useParking } from '../hooks/useParking';
import { locationService } from '../services/locationService';
import { carStorage } from '../utils/carStorage';

const DeveloperSettings = () => {
  const parking = useParking();

  const clearParkingHistory = async () => {
    Alert.alert(
      'Clear Parking History',
      'This will delete ALL parking sessions. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await parkingHistoryStorage.clearHistory();
              Alert.alert('Success', 'Parking history cleared!');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear history');
            }
          }
        }
      ]
    );
  };

  const clearAllStorage = async () => {
    Alert.alert(
      'Clear ALL Storage',
      'This will delete ALL data from AsyncStorage. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'All storage cleared!');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear storage');
            }
          }
        }
      ]
    );
  };

  const viewStorage = async () => {
    try {
      const debugInfo = await parkingHistoryStorage.debugStorage();
      Alert.alert(
        'Storage Info',
        `Parking sessions: ${debugInfo.count}\n\n` +
        `Keys in storage:\n` +
        `• @parking_history\n` +
        `• @active_car\n` +
        `• @car_list`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to read storage');
    }
  };

  const addTestSession = async () => {
    console.log('🧪 [TEST] Adding test session...');
    const saved = await parkingHistoryStorage.addTestSession();
    Alert.alert(
      saved ? 'Success' : 'Failed',
      saved ? 'Test session added! Check History.' : 'Failed to add test session'
    );
  };

  const checkStorage = async () => {
    const debugInfo = await parkingHistoryStorage.debugStorage();
    Alert.alert(
      'Storage Info',
      `Sessions: ${debugInfo.count}\n\n` +
      (debugInfo.sessions.length > 0 
        ? `Latest: ${debugInfo.sessions[0].carNumberPlate}\n` +
          `Cost: KES ${debugInfo.sessions[0].cost}\n` +
          `Status: ${debugInfo.sessions[0].status}`
        : 'Empty')
    );
  };

  const saveManualSession = async () => {
    try {
      const activeCar = await carStorage.getActiveCar();
      
      if (!parking.isParking || !parking.parkingStartTime || !activeCar) {
        Alert.alert('Error', 'Start parking first! Or enter car details manually.');
        
        // Offer to create a test session anyway
        Alert.alert(
          'Create Test Session?',
          'No active parking session found. Create a test session instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Create Test',
              onPress: async () => {
                const saved = await parking.saveParkingSession(
                  100,
                  3600,
                  Date.now() - 3600000,
                  {
                    latitude: -1.286389,
                    longitude: 36.817223,
                    address: 'Test Location, Nairobi',
                  },
                  'success',
                  '0712345678',
                  'TEST-' + Date.now(),
                  'KAA 123X'
                );
                
                Alert.alert(
                  saved ? 'Success' : 'Failed',
                  saved ? 'Test session created!' : 'Failed to create test session'
                );
              }
            }
          ]
        );
        return;
      }
      
      // Try to get current location
      let location;
      try {
        const currentLocation = await locationService.getCurrentLocation();
        location = currentLocation;
      } catch (error) {
        console.log('❌ [DEBUG] Unable to get location, using default');
        location = {
          coords: {
            latitude: -1.286389,
            longitude: 36.817223,
            altitude: null,
            accuracy: 100,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        };
      }

      const saved = await parking.saveParkingSession(
        parking.parkingCost,
        parking.parkingDuration,
        parking.parkingStartTime,
        {
          latitude: location?.coords?.latitude || -1.286389,
          longitude: location?.coords?.longitude || 36.817223,
          address: 'Manual Save from Developer Settings',
        },
        'success',
        '0712345678',
        'MANUAL-' + Date.now(),
        activeCar
      );
      
      Alert.alert(
        saved ? 'Success' : 'Failed',
        saved ? 'Session saved manually!\nCheck History tab.' : 'Manual save failed'
      );
    } catch (error) {
      console.error('❌ [DEBUG] Manual save error:', error);
      Alert.alert('Error', 'Failed to save manual session: ' + error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="settings" size={32} color="#3B82F6" />
        <Text style={styles.title}>Developer Settings</Text>
        <Text style={styles.subtitle}>Debug tools - use with caution</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage Management</Text>
        
        <TouchableOpacity style={styles.button} onPress={viewStorage}>
          <Ionicons name="eye" size={20} color="#3B82F6" />
          <Text style={styles.buttonText}>View Storage Info</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.warningButton]} onPress={clearParkingHistory}>
          <Ionicons name="trash" size={20} color="#EF4444" />
          <Text style={[styles.buttonText, styles.warningText]}>Clear Parking History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearAllStorage}>
          <Ionicons name="nuclear" size={20} color="white" />
          <Text style={[styles.buttonText, styles.dangerText]}>Clear ALL Storage</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Tools</Text>
        
        <TouchableOpacity style={[styles.button, { backgroundColor: '#3B82F6' }]} onPress={addTestSession}>
          <Ionicons name="add-circle" size={20} color="white" />
          <Text style={[styles.buttonText, { color: 'white' }]}>Add Test Session</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#8B5CF6' }]} onPress={checkStorage}>
          <Ionicons name="bug" size={20} color="white" />
          <Text style={[styles.buttonText, { color: 'white' }]}>Check Storage</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#10B981' }]} onPress={saveManualSession}>
          <Ionicons name="save" size={20} color="white" />
          <Text style={[styles.buttonText, { color: 'white' }]}>Save Manual Session</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parking Info</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Parking Active:</Text>
          <Text style={[styles.infoValue, { color: parking.isParking ? '#10B981' : '#EF4444' }]}>
            {parking.isParking ? 'YES' : 'NO'}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Current Cost:</Text>
          <Text style={styles.infoValue}>KSH {parking.parkingCost}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Duration:</Text>
          <Text style={styles.infoValue}>{parking.parkingDuration} seconds</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Sessions in Memory:</Text>
          <Text style={styles.infoValue}>{parking.parkingSessions?.length || 0}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          App Version: 1.0.0 • Debug Mode
        </Text>
        <Text style={[styles.footerText, { fontSize: 10, marginTop: 8 }]}>
          Remove this screen before production
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 12,
  },
  warningButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warningText: {
    color: '#DC2626',
  },
  dangerButton: {
    backgroundColor: '#DC2626',
  },
  dangerText: {
    color: 'white',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default DeveloperSettings;