// src/screens/History.tsx - FIXED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useParking } from '../../hooks/useParking';
import { ParkingSession } from '../../types/parking';
import { CONFIG } from '../../constants/config';
import { formatTime } from '../../utils/timeFormatter';
import { formatDate } from '../../utils/dateFormatter';
import { parkingHistoryStorage } from '../../utils/parkingHistoryStorage';

const History = () => {
  const { parkingSessions, loadSessions } = useParking();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displaySessions, setDisplaySessions] = useState<ParkingSession[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      console.log('📂 [HISTORY] Loading history...');
      setRefreshing(true);
      
      // Load sessions directly from storage
      const sessions = await parkingHistoryStorage.getHistory();
      console.log(`📂 [HISTORY] Loaded ${sessions.length} sessions from storage`);
      
      // Update display
      setDisplaySessions(sessions);
      
      // Also update hook state
      await loadSessions();
      
    } catch (error) {
      console.error('❌ [HISTORY] Error loading sessions:', error);
      Alert.alert('Error', 'Failed to load parking history');
      setDisplaySessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadSessions]);

  // Initial load
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Listen for changes in parkingSessions
  useEffect(() => {
    if (parkingSessions && parkingSessions.length > 0) {
      console.log(`📂 [HISTORY] Hook updated with ${parkingSessions.length} sessions`);
      setDisplaySessions(parkingSessions);
    }
  }, [parkingSessions]);

  const getStatusStyles = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'success':
      case 'paid': 
        return { color: CONFIG.UI.COLORS.SUCCESS || '#10B981', bg: '#ECFDF5', icon: 'checkmark-done-circle' };
      case 'cancelled': 
        return { color: CONFIG.UI.COLORS.ERROR || '#EF4444', bg: '#FEF2F2', icon: 'close-circle' };
      case 'failed': 
        return { color: CONFIG.UI.COLORS.WARNING || '#F59E0B', bg: '#FFFBEB', icon: 'alert-circle' };
      case 'pending':
        return { color: CONFIG.UI.COLORS.WARNING || '#F59E0B', bg: '#FFFBEB', icon: 'time' };
      default: 
        return { color: '#6B7280', bg: '#F3F4F6', icon: 'help-circle' };
    }
  };

  const formatCarPlate = (plate: string) => {
    if (!plate) return 'Unknown';
    return plate.toUpperCase().replace(/([A-Z]{1,3})(\d{1,4})([A-Z]{0,3})/, '$1 $2 $3').trim();
  };

  const formatLocation = (address?: string) => {
    if (!address || address === 'Location not available') return 'Standard Parking Zone';
    if (address.length > 30) return address.substring(0, 30) + '...';
    return address;
  };

  const formatCost = (cost: number) => {
    return `KES ${cost.toFixed(0)}`;
  };

  const formatSessionDate = (timestamp: number) => {
    try {
      if (!timestamp) return 'Unknown date';
      return formatDate(new Date(timestamp));
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTimeRange = (startTime: number, duration: number) => {
    try {
      const start = new Date(startTime);
      const end = new Date(startTime + (duration * 1000));
      
      const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      };
      
      return `${formatTime(start)} - ${formatTime(end)}`;
    } catch (error) {
      return 'Time not available';
    }
  };

  const renderSession = ({ item, index }: { item: ParkingSession, index: number }) => {
    const status = getStatusStyles(item.status || 'unknown');
    const carPlate = formatCarPlate(item.carNumberPlate || item.carPlate || '');
    const location = formatLocation(item.location?.address);
    const cost = formatCost(item.cost || 0);
    const duration = item.duration || 0;
    const startTime = item.startTime || item.createdAt || 0;

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.7}
        onPress={() => {
          Alert.alert(
            'Session Details',
            `Car: ${carPlate}\n` +
            `Amount: ${cost}\n` +
            `Duration: ${formatTime(duration)}\n` +
            `Status: ${item.status}\n` +
            `Location: ${location}\n` +
            `Receipt: ${item.receiptNumber || 'N/A'}\n` +
            `Phone: ${item.phoneNumber || 'N/A'}\n` +
            `Date: ${formatSessionDate(startTime)}`
          );
        }}
      >
        <View style={[styles.accentStrip, { backgroundColor: status.color }]} />
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.carInfo}>
              <View style={styles.carIconContainer}>
                <Ionicons name="car" size={16} color="#4B5563" />
                <Text style={styles.sessionIndex}>{index + 1}</Text>
              </View>
              <View>
                <Text style={styles.carPlateText}>{carPlate}</Text>
                <View style={styles.locationWrapper}>
                  <Ionicons name="location" size={12} color="#9CA3AF" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {location}
                  </Text>
                </View>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Ionicons name={status.icon as any} size={14} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>
                {item.status?.charAt(0).toUpperCase() + item.status?.slice(1) || 'Unknown'}
              </Text>
            </View>
          </View>

          <View style={styles.timeInfoRow}>
            <View style={styles.timeInfoItem}>
              <Ionicons name="time-outline" size={14} color="#9CA3AF" />
              <Text style={styles.timeInfoLabel}>TIME</Text>
              <Text style={styles.timeInfoValue}>
                {formatTimeRange(startTime, duration)}
              </Text>
            </View>
            <View style={styles.timeInfoItem}>
              <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
              <Text style={styles.timeInfoLabel}>DATE</Text>
              <Text style={styles.timeInfoValue}>
                {formatSessionDate(startTime)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>DURATION</Text>
              <Text style={styles.statValue}>{formatTime(duration)}</Text>
            </View>
            <View style={[styles.statItem, { alignItems: 'flex-end' }]}>
              <Text style={styles.statLabel}>AMOUNT</Text>
              <Text style={styles.costValue}>{cost}</Text>
            </View>
          </View>

          {(item.receiptNumber || item.phoneNumber) && (
            <View style={styles.detailsRow}>
              {item.receiptNumber && (
                <View style={styles.detailItem}>
                  <Ionicons name="receipt-outline" size={12} color="#6B7280" />
                  <Text style={styles.detailText}>{item.receiptNumber}</Text>
                </View>
              )}
              {item.phoneNumber && (
                <View style={styles.detailItem}>
                  <Ionicons name="phone-portrait-outline" size={12} color="#6B7280" />
                  <Text style={styles.detailText}>{item.phoneNumber}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <ActivityIndicator size="large" color={CONFIG.UI.COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <FlatList
        data={displaySessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.id || `session-${Date.now()}-${Math.random()}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={loadHistory}
            colors={[CONFIG.UI.COLORS.PRIMARY]}
            tintColor={CONFIG.UI.COLORS.PRIMARY}
          />
        }
        ListHeaderComponent={
          <View style={styles.pageHeader}>
            <View style={styles.headerTop}>
              <Text style={styles.title}>Parking History</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={loadHistory}
                >
                  <Ionicons name="refresh" size={20} color={CONFIG.UI.COLORS.PRIMARY} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.debugButton}
                  onPress={async () => {
                    const debugInfo = await parkingHistoryStorage.debugStorage();
                    Alert.alert(
                      'Storage Info',
                      `Total Sessions: ${debugInfo.count}\n` +
                      `Storage Key: @parking_history\n` +
                      `Last Updated: ${new Date().toLocaleTimeString()}`
                    );
                  }}
                >
                  <Ionicons name="information-circle" size={20} color={CONFIG.UI.COLORS.PRIMARY} />
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.subtitle}>
              {displaySessions.length} session{displaySessions.length !== 1 ? 's' : ''}
            </Text>
            
            {displaySessions.length > 0 && (
              <View style={styles.statsHeader}>
                <Text style={styles.statsText}>
                  Total spent: KES {displaySessions.reduce((sum, s) => sum + (s.cost || 0), 0)}
                </Text>
                <Text style={styles.statsSubText}>
                  Last session: {formatSessionDate(displaySessions[0]?.startTime || Date.now())}
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>No parking history</Text>
            <Text style={styles.emptySub}>
              Your completed parking sessions will appear here.
            </Text>
            
            {/* Debug buttons - REMOVE IN PRODUCTION */}
            <TouchableOpacity 
              style={[styles.tryAgainButton, { backgroundColor: '#8B5CF6' }]}
              onPress={async () => {
                const saved = await parkingHistoryStorage.addTestSession();
                if (saved) {
                  Alert.alert('Test Complete', 'Test session added! Pull to refresh.');
                  loadHistory();
                }
              }}
            >
              <Text style={styles.tryAgainText}>Add Test Session</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tryAgainButton, { backgroundColor: CONFIG.UI.COLORS.PRIMARY, marginTop: 12 }]}
              onPress={loadHistory}
            >
              <Text style={styles.tryAgainText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          displaySessions.length > 0 ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Pull down to refresh • {displaySessions.length} total sessions
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
  },
  debugButton: {
    padding: 8,
    borderRadius: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  statsHeader: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: CONFIG.UI.COLORS.PRIMARY,
    marginBottom: 4,
  },
  statsSubText: {
    fontSize: 12,
    color: '#6B7280',
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  accentStrip: {
    width: 6,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  carInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  carIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  sessionIndex: {
    position: 'absolute',
    fontSize: 8,
    fontWeight: '900',
    color: '#6B7280',
    top: 2,
    right: 2,
  },
  carPlateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  locationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
    maxWidth: 180,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  timeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timeInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeInfoLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 2,
  },
  timeInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  costValue: {
    fontSize: 16,
    fontWeight: '800',
    color: CONFIG.UI.COLORS.PRIMARY,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
  },
  emptySub: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  tryAgainButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  tryAgainText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default History;