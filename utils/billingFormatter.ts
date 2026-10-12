import type { ParkingSession } from '../types/parking';
import { formatTime } from './timeFormatter';

export const formatSessionDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-KE', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatSessionTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatSessionDuration = (seconds: number): string => {
  return formatTime(seconds);
};

export const getStatusColor = (status: ParkingSession['status']): string => {
  switch (status) {
    case 'success':
      return '#52c41a';
    case 'failed':
      return '#faad14';
    case 'cancelled':
      return '#ff3b30';
    default:
      return '#666';
  }
};

export const getStatusLabel = (status: ParkingSession['status']): string => {
  switch (status) {
    case 'success':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};