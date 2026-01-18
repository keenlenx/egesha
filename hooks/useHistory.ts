import { useState, useEffect, useCallback } from 'react';
import { paymentService, ParkingHistory } from '../services/paymentService';
import { formatDate, formatTimeHuman } from '../utils/timeFormatter';
import { formatPhoneForDisplay } from '../utils/phoneFormatter';

interface ParkingStats {
  totalSessions: number;
  totalCost: number;
  totalDuration: number;
  averageDuration: number;
  mostFrequentLocation: string;
}

interface UseHistoryReturn {
  history: ParkingHistory[];
  filteredHistory: ParkingHistory[];
  loading: boolean;
  error: string | null;
  stats: ParkingStats;
  filters: {
    dateRange: {
      start: Date | null;
      end: Date | null;
    };
    paymentStatus: 'all' | 'paid' | 'pending' | 'failed' | 'cancelled';
    minAmount: number | null;
    maxAmount: number | null;
  };
  searchQuery: string;
  refreshHistory: () => Promise<void>;
  setFilters: (filters: Partial<UseHistoryReturn['filters']>) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  formatHistoryItem: (item: ParkingHistory) => {
    formattedDate: string;
    formattedTime: string;
    formattedDuration: string;
    formattedCost: string;
    formattedPhone: string;
    locationName: string;
    statusColor: string;
    statusIcon: string;
  };
  getMonthSummary: (monthOffset?: number) => {
    month: string;
    totalCost: number;
    totalSessions: number;
    totalDuration: number;
  };
}

export const useHistory = (): UseHistoryReturn => {
  const [history, setHistory] = useState<ParkingHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ParkingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ParkingStats>({
    totalSessions: 0,
    totalCost: 0,
    totalDuration: 0,
    averageDuration: 0,
    mostFrequentLocation: 'N/A',
  });
  
  const [filters, setFiltersState] = useState<UseHistoryReturn['filters']>({
    dateRange: {
      start: null,
      end: null,
    },
    paymentStatus: 'all',
    minAmount: null,
    maxAmount: null,
  });
  
  const [searchQuery, setSearchQuery] = useState('');

  // Load history
  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentService.getParkingHistory();
      
      if (response.success && response.history) {
        setHistory(response.history);
        
        // Load stats
        const statsData = await paymentService.getParkingStats();
        setStats(statsData);
      } else {
        setError(response.error || 'Failed to load history');
      }
    } catch (err: any) {
      console.error('Error loading history:', err);
      setError(err.message || 'Failed to load parking history');
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...history];

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.location.address?.toLowerCase().includes(query) ||
        item.receiptNumber?.toLowerCase().includes(query) ||
        formatPhoneForDisplay(item.phoneNumber).toLowerCase().includes(query)
      );
    }

    // Apply payment status filter
    if (filters.paymentStatus !== 'all') {
      result = result.filter(item => item.paymentStatus === filters.paymentStatus);
    }

    // Apply date range filter
    if (filters.dateRange.start) {
      result = result.filter(item => item.startTime >= filters.dateRange.start!);
    }
    if (filters.dateRange.end) {
      const endOfDay = new Date(filters.dateRange.end);
      endOfDay.setHours(23, 59, 59, 999);
      result = result.filter(item => item.startTime <= endOfDay);
    }

    // Apply amount filters
    if (filters.minAmount !== null) {
      result = result.filter(item => item.cost >= filters.minAmount!);
    }
    if (filters.maxAmount !== null) {
      result = result.filter(item => item.cost <= filters.maxAmount!);
    }

    setFilteredHistory(result);
  }, [history, filters, searchQuery]);

  // Set filters
  const setFilters = useCallback((newFilters: Partial<UseHistoryReturn['filters']>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFiltersState({
      dateRange: { start: null, end: null },
      paymentStatus: 'all',
      minAmount: null,
      maxAmount: null,
    });
    setSearchQuery('');
  }, []);

  // Format history item for display
  const formatHistoryItem = useCallback((item: ParkingHistory) => {
    const statusColors: Record<ParkingHistory['paymentStatus'], string> = {
      paid: '#10B981',
      pending: '#F59E0B',
      failed: '#EF4444',
      cancelled: '#6B7280',
    };

    const statusIcons: Record<ParkingHistory['paymentStatus'], string> = {
      paid: 'checkmark-circle',
      pending: 'time',
      failed: 'close-circle',
      cancelled: 'close-circle',
    };

    return {
      formattedDate: formatDate(item.startTime),
      formattedTime: `${item.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${item.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      formattedDuration: formatTimeHuman(item.duration),
      formattedCost: `KSH ${item.cost.toLocaleString()}`,
      formattedPhone: formatPhoneForDisplay(item.phoneNumber),
      locationName: item.location.address || 'Unknown Location',
      statusColor: statusColors[item.paymentStatus],
      statusIcon: statusIcons[item.paymentStatus],
    };
  }, []);

  // Get month summary
  const getMonthSummary = useCallback((monthOffset: number = 0) => {
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const nextMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
    
    const monthHistory = history.filter(item =>
      item.startTime >= targetMonth && item.startTime <= nextMonth
    );

    const paidHistory = monthHistory.filter(h => h.paymentStatus === 'paid');
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    return {
      month: `${monthNames[targetMonth.getMonth()]} ${targetMonth.getFullYear()}`,
      totalCost: paidHistory.reduce((sum, h) => sum + h.cost, 0),
      totalSessions: paidHistory.length,
      totalDuration: paidHistory.reduce((sum, h) => sum + h.duration, 0),
    };
  }, [history]);

  // Initial load
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    filteredHistory,
    loading,
    error,
    stats,
    filters,
    searchQuery,
    refreshHistory: loadHistory,
    setFilters,
    setSearchQuery,
    clearFilters,
    formatHistoryItem,
    getMonthSummary,
  };
};