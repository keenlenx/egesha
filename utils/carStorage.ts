import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_CAR_KEY = '@kenpark_active_car';

export const carStorage = {
  // Get the active car number plate
  getActiveCar: async (): Promise<string | null> => {
    try {
      const car = await AsyncStorage.getItem(ACTIVE_CAR_KEY);
      return car || null;
    } catch (error) {
      console.error('Error getting active car:', error);
      return null;
    }
  },

  // Set the active car number plate
  setActiveCar: async (numberPlate: string): Promise<boolean> => {
    try {
      const normalizedPlate = numberPlate.trim().toUpperCase();
      await AsyncStorage.setItem(ACTIVE_CAR_KEY, normalizedPlate);
      return true;
    } catch (error) {
      console.error('Error setting active car:', error);
      return false;
    }
  },

  // Remove the active car
  clearActiveCar: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(ACTIVE_CAR_KEY);
    } catch (error) {
      console.error('Error clearing active car:', error);
    }
  },
};