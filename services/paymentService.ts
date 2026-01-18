import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG, API_ENDPOINTS, ERROR_MESSAGES } from '../constants/config';

export interface PaymentInitiationRequest {
  phone: string;
  amount: number;
  user_id: string;
  accountReference: string;
  transactionDesc: string;
}

export interface PaymentInitiationResponse {
  success: boolean;
  checkoutRequestID?: string;
  error?: string;
  message?: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  currentState?: {
    status: 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'PENDING';
    mpesaReceiptNumber?: string;
    resultDesc?: string;
    amount?: number;
    phone?: string;
    transactionDate?: string;
  };
  error?: string;
}

export interface PaymentStatus {
  status: 'idle' | 'pending' | 'success' | 'failed' | 'cancelled';
  checkoutRequestID: string | null;
  receiptNumber: string | null;
  error: string | null;
}

export interface ParkingHistory {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  cost: number;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  paymentStatus: 'paid' | 'pending' | 'failed' | 'cancelled';
  receiptNumber?: string;
  checkoutRequestID?: string;
  phoneNumber: string;
  createdAt: Date;
}

export interface HistoryResponse {
  success: boolean;
  history?: ParkingHistory[];
  error?: string;
}

class PaymentService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = CONFIG.PAYMENT.API_URL;
    this.timeout = CONFIG.PAYMENT.TIMEOUT;
  }

  /**
   * Initiate M-Pesa STK Push payment
   */
  async initiatePayment(request: PaymentInitiationRequest): Promise<PaymentInitiationResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}${API_ENDPOINTS.INITIATE_PAYMENT}`,
        request,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Payment initiation error:', error);
      
      const axiosError = error as AxiosError;
      let errorMessage = ERROR_MESSAGES.PAYMENT_INITIATION_FAILED;

      if (axiosError.response) {
        errorMessage = axiosError.response.data?.error || 
                      axiosError.response.data?.message || 
                      errorMessage;
      } else if (axiosError.request) {
        errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
      } else if (axiosError.code === 'ECONNABORTED') {
        errorMessage = ERROR_MESSAGES.PAYMENT_TIMEOUT;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(checkoutRequestID: string): Promise<PaymentStatusResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}${API_ENDPOINTS.CHECK_PAYMENT_STATUS}`,
        { CheckoutRequestID: checkoutRequestID },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Payment status check error:', error);
      
      const axiosError = error as AxiosError;
      let errorMessage = ERROR_MESSAGES.SERVER_ERROR;

      if (axiosError.response) {
        errorMessage = axiosError.response.data?.error || errorMessage;
      } else if (axiosError.request) {
        errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Validate phone number
   */
  validatePhoneNumber(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < CONFIG.PHONE.MIN_LENGTH || cleanPhone.length > CONFIG.PHONE.MAX_LENGTH) {
      return false;
    }

    // Check if it starts with valid Kenyan prefix
    const prefix = cleanPhone.charAt(0);
    return CONFIG.PHONE.VALID_PREFIXES.includes(prefix);
  }

  /**
   * Format amount (add tax, etc.)
   */
  calculateTotalAmount(baseAmount: number): number {
    const tax = baseAmount * CONFIG.PARKING.TAX_RATE;
    const total = baseAmount + tax;
    
    // Round up to nearest whole number
    return Math.ceil(total);
  }

  /**
   * Generate unique reference
   */
  generateReference(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `PARKING_${timestamp}_${random}`;
  }

  /**
   * Validate payment response
   */
  validatePaymentResponse(response: PaymentStatusResponse): boolean {
    if (!response.success) {
      return false;
    }

    if (!response.currentState) {
      return false;
    }

    const validStatuses = ['SUCCESS', 'FAILED', 'CANCELLED', 'PENDING'];
    return validStatuses.includes(response.currentState.status);
  }

  /**
   * Get REAL parking history from storage
   */
  async getParkingHistory(): Promise<HistoryResponse> {
    try {
      // Get real history from AsyncStorage
      const history = await this.getRealHistoryFromStorage();
      
      return {
        success: true,
        history: history,
      };
    } catch (error) {
      console.error('Error fetching parking history:', error);
      return {
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR,
      };
    }
  }

  /**
   * Get real history from AsyncStorage
   */
  private async getRealHistoryFromStorage(): Promise<ParkingHistory[]> {
    try {
      // Try to get history from AsyncStorage
      const historyJson = await AsyncStorage.getItem('parking_history');
      
      if (!historyJson) {
        return []; // Return empty array if no history exists
      }
      
      const history = JSON.parse(historyJson);
      
      // Convert date strings back to Date objects
      return history.map((item: any) => ({
        ...item,
        startTime: new Date(item.startTime),
        endTime: new Date(item.endTime),
        createdAt: new Date(item.createdAt),
      }));
    } catch (error) {
      console.error('Error reading history from storage:', error);
      return [];
    }
  }

  /**
   * Save parking session to history
   */
  async saveParkingSession(session: Omit<ParkingHistory, 'id' | 'createdAt'>): Promise<boolean> {
    try {
      const currentHistory = await this.getRealHistoryFromStorage();
      
      const newSession: ParkingHistory = {
        ...session,
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
      };
      
      // Add new session to the beginning
      const updatedHistory = [newSession, ...currentHistory];
      
      // Keep only last 100 sessions
      const limitedHistory = updatedHistory.slice(0, 100);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('parking_history', JSON.stringify(limitedHistory));
      
      return true;
    } catch (error) {
      console.error('Error saving parking session:', error);
      return false;
    }
  }

  /**
   * Get parking statistics from REAL data
   */
  async getParkingStats(): Promise<{
    totalSessions: number;
    totalCost: number;
    totalDuration: number;
    averageDuration: number;
    mostFrequentLocation: string;
  }> {
    try {
      const history = await this.getRealHistoryFromStorage();
      
      const paidHistory = history.filter(h => h.paymentStatus === 'paid');
      
      if (paidHistory.length === 0) {
        return {
          totalSessions: 0,
          totalCost: 0,
          totalDuration: 0,
          averageDuration: 0,
          mostFrequentLocation: 'No parking yet',
        };
      }

      // Calculate statistics from REAL data
      const totalSessions = paidHistory.length;
      const totalCost = paidHistory.reduce((sum, h) => sum + h.cost, 0);
      const totalDuration = paidHistory.reduce((sum, h) => sum + h.duration, 0);
      const averageDuration = Math.round(totalDuration / totalSessions);

      // Find most frequent location from REAL data
      const locationCounts: Record<string, number> = {};
      paidHistory.forEach(h => {
        const loc = h.location.address || 'Unknown Location';
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      });

      const mostFrequentLocation = Object.entries(locationCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Various locations';

      return {
        totalSessions,
        totalCost,
        totalDuration,
        averageDuration,
        mostFrequentLocation,
      };
    } catch (error) {
      console.error('Error calculating parking stats:', error);
      return {
        totalSessions: 0,
        totalCost: 0,
        totalDuration: 0,
        averageDuration: 0,
        mostFrequentLocation: 'N/A',
      };
    }
  }

  /**
   * Clear all parking history
   */
  async clearParkingHistory(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem('parking_history');
      return true;
    } catch (error) {
      console.error('Error clearing parking history:', error);
      return false;
    }
  }

  /**
   * Add sample data for testing (optional)
   */
  async addSampleDataForTesting(): Promise<void> {
    try {
      const currentHistory = await this.getRealHistoryFromStorage();
      
      // Only add sample data if history is empty
      if (currentHistory.length === 0) {
        const sampleSessions: ParkingHistory[] = [
          {
            id: 'sample_1',
            startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
            duration: 7200, // 2 hours in seconds
            cost: 120, // KSH 120
            location: {
              latitude: -1.2921,
              longitude: 36.8219,
              address: 'Nairobi CBD - Moi Avenue',
            },
            paymentStatus: 'paid',
            receiptNumber: 'MP12345678',
            checkoutRequestID: 'ws_CO_123456',
            phoneNumber: '254712345678',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
          },
          {
            id: 'sample_2',
            startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000), // 1.5 hours later
            duration: 5400, // 1.5 hours in seconds
            cost: 90, // KSH 90
            location: {
              latitude: -1.2675,
              longitude: 36.8022,
              address: 'Westlands - ABC Place',
            },
            paymentStatus: 'paid',
            receiptNumber: 'MP87654321',
            checkoutRequestID: 'ws_CO_654321',
            phoneNumber: '254712345678',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000),
          },
        ];

        const updatedHistory = [...sampleSessions, ...currentHistory];
        await AsyncStorage.setItem('parking_history', JSON.stringify(updatedHistory));
        console.log('Sample data added for testing');
      }
    } catch (error) {
      console.error('Error adding sample data:', error);
    }
  }
}

export const paymentService = new PaymentService();