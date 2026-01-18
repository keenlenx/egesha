// src/utils/parkingHistoryStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ParkingSession } from '../types/parking';

const HISTORY_STORAGE_KEY = '@parking_history';

export const parkingHistoryStorage = {
  // Save a parking session to history
  async saveSession(session: ParkingSession): Promise<boolean> {
    try {
      console.log('💾 [STORAGE] Saving session:', session.id);
      
      const history = await this.getHistory();
      
      // Ensure no duplicate ID
      const existingIndex = history.findIndex(s => s.id === session.id);
      if (existingIndex >= 0) {
        history[existingIndex] = session; // Update existing
        console.log('💾 [STORAGE] Updated existing session');
      } else {
        history.unshift(session); // Add new session to the beginning
        console.log('💾 [STORAGE] Added new session');
      }
      
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
      console.log('✅ [STORAGE] Session saved successfully:', session.id);
      console.log(`✅ [STORAGE] Total sessions: ${history.length}`);
      return true;
    } catch (error) {
      console.error('❌ [STORAGE] Error saving parking session:', error);
      return false;
    }
  },

  // Get all parking sessions
  async getHistory(): Promise<ParkingSession[]> {
    try {
      const historyJson = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (historyJson) {
        const sessions = JSON.parse(historyJson);
        console.log(`📂 [STORAGE] Loaded ${sessions.length} sessions from storage`);
        return sessions;
      }
      console.log('📂 [STORAGE] No sessions found in storage');
      return [];
    } catch (error) {
      console.error('❌ [STORAGE] Error loading parking history:', error);
      return [];
    }
  },

  // Clear all parking history
  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
      console.log('🧹 [STORAGE] Cleared all history');
    } catch (error) {
      console.error('❌ [STORAGE] Error clearing parking history:', error);
      throw error;
    }
  },

  // Delete a specific session by ID
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const history = await this.getHistory();
      const updatedHistory = history.filter(session => session.id !== sessionId);
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
      console.log(`🗑️ [STORAGE] Deleted session: ${sessionId}`);
    } catch (error) {
      console.error('❌ [STORAGE] Error deleting parking session:', error);
      throw error;
    }
  },

  // Debug function
  async debugStorage(): Promise<{ count: number; sessions: ParkingSession[] }> {
    try {
      const historyJson = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      console.log('🔍 [DEBUG] Raw storage data:', historyJson);
      
      if (historyJson) {
        const sessions = JSON.parse(historyJson);
        console.log(`🔍 [DEBUG] Found ${sessions.length} sessions in storage`);
        
        if (sessions.length > 0) {
          console.log('🔍 [DEBUG] First session:', JSON.stringify(sessions[0], null, 2));
        }
        
        return { count: sessions.length, sessions };
      }
      
      console.log('🔍 [DEBUG] No sessions found in storage');
      return { count: 0, sessions: [] };
    } catch (error) {
      console.error('🔍 [DEBUG] Error reading storage:', error);
      return { count: 0, sessions: [] };
    }
  },

  // Add a test session
  async addTestSession(): Promise<boolean> {
    try {
      const testSession: ParkingSession = {
        id: `test_${Date.now()}`,
        carNumberPlate: 'KAA 123X',
        cost: 150,
        duration: 3600,
        startTime: Date.now() - 3600000,
        stopTime: Date.now(),
        location: {
          latitude: -1.286389,
          longitude: 36.817223,
          address: 'Test Location, Nairobi CBD'
        },
        status: 'success',
        phoneNumber: '0712345678',
        receiptNumber: `TEST-${Date.now()}`,
        createdAt: Date.now(),
      };
      
      return await this.saveSession(testSession);
    } catch (error) {
      console.error('❌ [TEST] Error adding test session:', error);
      return false;
    }
  },
};