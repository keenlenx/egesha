import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { CONFIG } from '../constants/config';
import { mapStyle } from '../constants/mapStyle';
import type { LocationData } from '../services/locationService';

type Props = {
  loading: boolean;
  location: LocationData | null;
  isParking: boolean;
};

export default function ParkingMap({ loading, location, isParking }: Props) {
  if (loading) return null;

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: location?.coords.latitude ?? CONFIG.MAP.DEFAULT_REGION.latitude,
        longitude: location?.coords.longitude ?? CONFIG.MAP.DEFAULT_REGION.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }}
      customMapStyle={mapStyle}
      showsUserLocation
      followsUserLocation={isParking}
      loadingEnabled
      zoomEnabled
      scrollEnabled
      rotateEnabled={false}
      pitchEnabled={false}
    >
      {location && (
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          tracksViewChanges={false}
        >
          <View style={styles.markerContainer}>
            <View style={[styles.markerPin, isParking && styles.markerPinActive]}>
              <Ionicons name={isParking ? 'car-sport' : 'car'} size={18} color="white" />
            </View>
            {isParking && <View style={styles.markerPulse} />}
          </View>
        </Marker>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  markerContainer: { alignItems: 'center' },
  markerPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CONFIG.UI.COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  markerPinActive: { backgroundColor: CONFIG.UI.COLORS.SECONDARY },
  markerPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: CONFIG.UI.COLORS.SECONDARY,
    marginTop: 4,
    opacity: 0.7,
  },
});