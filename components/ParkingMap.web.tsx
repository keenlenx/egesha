import type { CSSProperties } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { CONFIG } from '../constants/config';
import type { LocationData } from '../services/locationService';

type Props = {
  loading: boolean;
  location: LocationData | null;
  isParking: boolean;
};

const iframeStyle: CSSProperties = { border: 0, width: '100%', height: '100%' };

export default function ParkingMap({ loading, location }: Props) {
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={CONFIG.UI.COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Finding your location...</Text>
      </View>
    );
  }

  const latitude = location?.coords.latitude ?? CONFIG.MAP.DEFAULT_REGION.latitude;
  const longitude = location?.coords.longitude ?? CONFIG.MAP.DEFAULT_REGION.longitude;
  const delta = 0.005;
  const bounds = [longitude - delta, latitude - delta, longitude + delta, latitude + delta]
    .map((coordinate) => coordinate.toFixed(6))
    .join(',');
  const source = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bounds)}&layer=mapnik&marker=${latitude}%2C${longitude}`;

  return (
    <View style={styles.container}>
      <iframe
        title="Parking location map"
        src={source}
        style={iframeStyle}
        loading="lazy"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 14 },
});