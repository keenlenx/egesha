import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carStorage } from '../../utils/carStorage';
import { CONFIG } from '../../constants/config';

const MyCars = () => {
  const [numberPlate, setNumberPlate] = useState('');
  const [activeCar, setActiveCar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadActiveCar();
  }, []);

  const loadActiveCar = async () => {
    const car = await carStorage.getActiveCar();
    setActiveCar(car);
  };

  const handleSaveCar = async () => {
    if (!numberPlate.trim()) {
      Alert.alert('Error', 'Please enter a number plate');
      return;
    }

    // Basic Kenyan number plate validation
    const plateRegex = /^[A-Z]{1,3}\s?\d{1,6}[A-Z]?$/i;
    if (!plateRegex.test(numberPlate)) {
      Alert.alert('Invalid Format', 'Please enter a valid Kenyan number plate (e.g., KAA 123A)');
      return;
    }

    setIsLoading(true);
    try {
      const success = await carStorage.setActiveCar(numberPlate);
      if (success) {
        setActiveCar(numberPlate.trim().toUpperCase());
        setNumberPlate('');
        Alert.alert('Success', 'Car saved successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save car. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCar = () => {
    Alert.alert(
      'Remove Car',
      'Are you sure you want to remove your car?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await carStorage.clearActiveCar();
            setActiveCar(null);
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Car</Text>
        </View>

        {/* Current Car */}
        {activeCar && (
          <View style={styles.currentCarCard}>
            <View style={styles.currentCarHeader}>
              <Ionicons name="car" size={24} color={CONFIG.UI.COLORS.PRIMARY} />
              <Text style={styles.currentCarTitle}>Current Car</Text>
            </View>
            <Text style={styles.numberPlate}>{activeCar}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleClearCar}
            >
              <Text style={styles.removeButtonText}>Remove Car</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add/Update Car */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {activeCar ? 'Update Car' : 'Add Your Car'}
          </Text>
          
          <Text style={styles.label}>Number Plate</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., KAA 123A"
            placeholderTextColor="#9CA3AF"
            value={numberPlate}
            onChangeText={setNumberPlate}
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus={!activeCar}
          />
          <Text style={styles.hint}>
            Enter your Kenyan number plate
          </Text>

          <TouchableOpacity
            style={[
              styles.saveButton,
              (!numberPlate.trim() || isLoading) && styles.saveButtonDisabled,
            ]}
            onPress={handleSaveCar}
            disabled={!numberPlate.trim() || isLoading}
          >
            {isLoading ? (
              <Text style={styles.saveButtonText}>Saving...</Text>
            ) : (
              <Text style={styles.saveButtonText}>
                {activeCar ? 'Update Car' : 'Save Car'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#6B7280" />
          <Text style={styles.infoText}>
            Your car number plate will be saved with parking history
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
  },
  header: {
    paddingVertical: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  currentCarCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CONFIG.UI.COLORS.PRIMARY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  currentCarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentCarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  numberPlate: {
    fontSize: 32,
    fontWeight: '800',
    color: CONFIG.UI.COLORS.PRIMARY,
    letterSpacing: 2,
    marginBottom: 20,
  },
  removeButton: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  removeButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: CONFIG.UI.COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: CONFIG.UI.COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
  },
});

export default MyCars;