// src/hooks/useParking.ts
import { useState, useEffect, useCallback } from 'react';
import { parkingHistoryStorage } from '../utils/parkingHistoryStorage';
import { ParkingSession } from '../types/parking';

export const useParking = () => {
  const [isParking, setIsParking] = useState(false);
  const [parkingStartTime, setParkingStartTime] = useState<number | null>(null);
  const [parkingStopTime, setParkingStopTime] = useState<number | null>(null);
  const [parkingDuration, setParkingDuration] = useState(0);
  const [parkingCost, setParkingCost] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [parkingSessions, setParkingSessions] = useState<ParkingSession[]>([]);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  // Load parking sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      console.log('🔄 [LOAD] Loading sessions from storage...');
      const sessions = await parkingHistoryStorage.getHistory();
      console.log(`🔄 [LOAD] Found ${sessions.length} sessions in storage`);
      setParkingSessions(sessions);
      return sessions;
    } catch (error) {
      console.error('❌ [LOAD] Error loading parking sessions:', error);
      return [];
    }
  }, []);

  const startParking = useCallback((carPlate: string, lat?: number, lng?: number) => {
    console.log('🚗 [START] Starting parking for:', carPlate);
    
    setIsParking(true);
    const startTime = Date.now();
    setParkingStartTime(startTime);
    setParkingStopTime(null);
    setParkingDuration(0);
    setParkingCost(0);
    
    if (lat && lng) {
      setCurrentLocation({ latitude: lat, longitude: lng });
    }
    
    // Start timer interval
    const interval = setInterval(() => {
      setParkingDuration((prev) => {
        const newDuration = prev + 1;
        const hourlyRate = 50; // KSH per hour from CONFIG
        const cost = (newDuration / 3600) * hourlyRate;
        setParkingCost(Math.max(1, Math.ceil(cost)));
        return newDuration;
      });
    }, 1000);
    
    setTimerInterval(interval);
    
    return () => clearInterval(interval);
  }, []);

  const updateLocation = useCallback((latitude: number, longitude: number) => {
    setCurrentLocation({ latitude, longitude });
  }, []);

  const saveParkingSession = useCallback(async (
    cost: number,
    duration: number,
    startTime: number,
    location: {
      latitude: number;
      longitude: number;
      address: string;
    },
    status: 'success' | 'cancelled' | 'failed',
    phoneNumber: string,
    receiptNumber?: string,
    carPlate?: string
  ): Promise<boolean> => {
    try {
      console.log('💾 [SAVE] Starting to save parking session...');
      console.log('💾 [SAVE] Input:', {
        cost, duration, startTime, location, status, phoneNumber, receiptNumber, carPlate
      });

      const session: ParkingSession = {
        id: `parking_${startTime}_${Date.now()}`,
        carNumberPlate: carPlate || 'Unknown',
        cost,
        duration,
        startTime,
        stopTime: Date.now(),
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address || 'Unknown location',
        },
        status,
        phoneNumber,
        receiptNumber,
        createdAt: Date.now(),
      };

      console.log('💾 [SAVE] Session object:', session);
      
      // Save to storage
      const saved = await parkingHistoryStorage.saveSession(session);
      
      if (saved) {
        console.log('✅ [SAVE] Session saved to storage successfully!');
        
        // Force reload sessions
        await loadSessions();
        
        // Debug: Check storage
        const debugInfo = await parkingHistoryStorage.debugStorage();
        console.log(`✅ [SAVE] Storage now has ${debugInfo.count} sessions`);
        
        return true;
      } else {
        console.error('❌ [SAVE] Failed to save session to storage');
        return false;
      }
    } catch (error) {
      console.error('❌ [SAVE] Error saving parking session:', error);
      return false;
    }
  }, [loadSessions]);

  const resetParking = useCallback(() => {
    console.log('🔄 [RESET] Resetting parking state');
    setIsParking(false);
    setParkingStartTime(null);
    setParkingStopTime(null);
    setParkingDuration(0);
    setParkingCost(0);
    setCurrentLocation(null);
    
    // Clear timer interval
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  }, [timerInterval]);

  const getParkingSessions = useCallback(async () => {
    return await loadSessions();
  }, [loadSessions]);

  // Add debug function
  const debugStorage = useCallback(async () => {
    return await parkingHistoryStorage.debugStorage();
  }, []);

  return {
    isParking,
    parkingStartTime,
    parkingStopTime,
    parkingDuration,
    parkingCost,
    currentLocation,
    parkingSessions,
    startParking,
    updateLocation,
    saveParkingSession,
    resetParking,
    getParkingSessions,
    loadSessions,
    debugStorage,
  };
};