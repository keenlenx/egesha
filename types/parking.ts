// src/types/parking.ts
export interface ParkingSession {
  id: string;
  carNumberPlate: string;
  cost: number;
  duration: number; // in seconds
  startTime: number; // timestamp
  stopTime: number; // NEW: timestamp when parking stopped
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: 'success' | 'cancelled' | 'failed';
  phoneNumber: string;
  receiptNumber?: string;
  createdAt: number;
}