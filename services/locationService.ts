// src/services/locationService.ts
import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';

export interface LocationData {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

export interface SelectedLocation {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: number;
}

class LocationService {
  private watchPositionId: string | null = null;
  private lastLocation: LocationData | null = null;
  private locationCallbacks: ((location: LocationData) => void)[] = [];
  private manualLocation: SelectedLocation | null = null;
  private isTracking = false;

  /**
   * Request location permissions
   */
  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        // Request background permission on iOS
        if (Platform.OS === 'ios') {
          const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
          return bgStatus === 'granted';
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Get current location with optimal settings
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return null;
      }

      // Use cached location if recent (less than 30 seconds old)
      if (this.lastLocation && Date.now() - this.lastLocation.timestamp < 30000) {
        return this.lastLocation;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maximumAge: 30000, // Accept location up to 30 seconds old
        timeout: 10000, // Timeout after 10 seconds
      });

      const locationData: LocationData = {
        coords: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude,
          accuracy: location.coords.accuracy,
          altitudeAccuracy: location.coords.altitudeAccuracy,
          heading: location.coords.heading,
          speed: location.coords.speed,
        },
        timestamp: location.timestamp,
      };

      this.lastLocation = locationData;
      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      // Return cached location as fallback
      return this.lastLocation;
    }
  }

  /**
   * Start watching location with optimized settings for parking
   */
  async startWatchingLocation(
    callback: (location: LocationData) => void,
    options?: {
      interval?: number;
      distance?: number;
    }
  ): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        Alert.alert(
          'Location Permission Required',
          'Parking tracking requires location access. Please enable it in settings.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Add callback to list
      this.locationCallbacks.push(callback);

      if (!this.watchPositionId) {
        const watchOptions: Location.LocationOptions = {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: options?.interval || 30000, // Default 30 seconds
          distanceInterval: options?.distance || 20, // Default 20 meters
          mayShowUserSettingsDialog: true,
        };

        const subscription = await Location.watchPositionAsync(
          watchOptions,
          (location) => {
            const locationData: LocationData = {
              coords: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                altitude: location.coords.altitude,
                accuracy: location.coords.accuracy,
                altitudeAccuracy: location.coords.altitudeAccuracy,
                heading: location.coords.heading,
                speed: location.coords.speed,
              },
              timestamp: location.timestamp,
            };

            this.lastLocation = locationData;
            
            // Notify all callbacks
            this.locationCallbacks.forEach(cb => cb(locationData));
          }
        );

        // Store the subscription object directly
        this.watchPositionId = subscription as any;
        this.isTracking = true;
      }

      return true;
    } catch (error) {
      console.error('Error watching location:', error);
      return false;
    }
  }

  /**
   * Stop watching location - FIXED VERSION
   */
  async stopWatchingLocation(): Promise<void> {
    try {
      if (this.watchPositionId) {
        // The watchPositionId is actually a subscription object, not a string
        // We need to call remove() on it
        if (typeof this.watchPositionId === 'object' && this.watchPositionId.remove) {
          this.watchPositionId.remove();
        }
        this.watchPositionId = null;
      }
      
      // Clear all callbacks
      this.locationCallbacks = [];
      this.isTracking = false;
    } catch (error) {
      console.error('Error stopping location watch:', error);
    }
  }

  /**
   * Alternative simple method to stop location updates
   */
  async stopLocationUpdates(): Promise<void> {
    try {
      if (this.watchPositionId) {
        // Simply clear the reference - Expo should handle cleanup
        this.watchPositionId = null;
      }
      this.locationCallbacks = [];
      this.isTracking = false;
    } catch (error) {
      console.error('Error stopping location updates:', error);
    }
  }

  /**
   * Set manual location (pin selection)
   */
  setManualLocation(location: {
    latitude: number;
    longitude: number;
    address?: string;
  }): void {
    this.manualLocation = {
      ...location,
      timestamp: Date.now(),
    };
  }

  /**
   * Get manual location if set, otherwise get current
   */
  getManualLocation(): SelectedLocation | null {
    return this.manualLocation;
  }

  /**
   * Clear manual location
   */
  clearManualLocation(): void {
    this.manualLocation = null;
  }

  /**
   * Get address from coordinates
   */
  async getAddressFromCoords(latitude: number, longitude: number): Promise<string | null> {
    try {
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      if (geocode.length > 0) {
        const address = geocode[0];
        const parts = [];
        
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.region) parts.push(address.region);
        if (address.country) parts.push(address.country);
        
        return parts.join(', ') || 'Location not available';
      }
      
      return null;
    } catch (error) {
      console.error('Error getting address:', error);
      return null;
    }
  }

  /**
   * Check if location is being tracked
   */
  isLocationTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Get last known location
   */
  getLastLocation(): LocationData | null {
    return this.lastLocation;
  }
}

export const locationService = new LocationService();