// src/hooks/usePayment.ts - FIXED VERSION
import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { CONFIG, ERROR_MESSAGES } from '../constants/config';
import { paymentService, PaymentStatus } from '../services/paymentService';
import { formatPhoneNumber } from '../utils/phoneFormatter';

interface UsePaymentReturn {
  phoneNumber: string;
  paymentStatus: PaymentStatus['status'];
  checkoutRequestID: string | null;
  receiptNumber: string | null;
  error: string | null;
  isProcessingPayment: boolean;
  setPhoneNumber: (phone: string) => void;
  initiatePayment: (amount: number) => Promise<boolean>;
  checkPaymentStatus: () => Promise<void>;
  cancelPayment: () => void;
  resetPayment: () => void;
  // Add this new function
  forceResetPayment: () => void;
}

export const usePayment = (): UsePaymentReturn => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus['status']>('idle');
  const [checkoutRequestID, setCheckoutRequestID] = useState<string | null>(null);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('🛑 [PAYMENT CLEANUP] Stopping polling and timers');
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsProcessingPayment(false);
  }, []);

  // Start payment status polling
  const startPolling = useCallback((checkoutID: string) => {
    console.log('⏳ [PAYMENT POLLING] Starting polling for:', checkoutID);
    
    // Clear any existing polling
    cleanup();

    pollingIntervalRef.current = setInterval(async () => {
      try {
        console.log('🔍 [PAYMENT POLLING] Checking status...');
        const response = await paymentService.checkPaymentStatus(checkoutID);
        
        if (response.success && response.currentState) {
          const status = response.currentState.status;
          console.log('📊 [PAYMENT POLLING] Status:', status);
          
          if (status === 'SUCCESS') {
            // Payment successful
            console.log('✅ [PAYMENT POLLING] Payment successful!');
            cleanup();
            setPaymentStatus('success');
            setReceiptNumber(response.currentState.mpesaReceiptNumber || null);
            
            // Don't show alert here - let component handle it
            console.log('💰 [PAYMENT] Receipt:', response.currentState.mpesaReceiptNumber);
            
          } else if (status === 'FAILED') {
            // Payment failed
            console.log('❌ [PAYMENT POLLING] Payment failed');
            cleanup();
            setPaymentStatus('failed');
            setError(response.currentState.resultDesc || 'Payment failed');
            
            Alert.alert(
              'Payment Failed',
              response.currentState.resultDesc || 'Please try again',
              [{ text: 'OK' }]
            );
            
          } else if (status === 'CANCELLED') {
            // Payment cancelled
            console.log('🚫 [PAYMENT POLLING] Payment cancelled');
            cleanup();
            setPaymentStatus('cancelled');
            setError('Payment cancelled');
            
            Alert.alert(
              'Payment Cancelled',
              'The payment was cancelled',
              [{ text: 'OK' }]
            );
          }
          // If still PENDING, continue polling
        } else {
          console.error('❌ [PAYMENT POLLING] API error:', response.error);
          // Continue polling even on API errors
        }
      } catch (error) {
        console.error('❌ [PAYMENT POLLING] Network error:', error);
        // Don't stop polling on network errors
      }
    }, CONFIG.PAYMENT.POLLING_INTERVAL);

    // Auto-stop polling after timeout
    timeoutRef.current = setTimeout(() => {
      console.log('⏰ [PAYMENT TIMEOUT] Polling timeout reached');
      if (paymentStatus === 'pending') {
        cleanup();
        setPaymentStatus('failed');
        setError(ERROR_MESSAGES.PAYMENT_TIMEOUT);
        
        Alert.alert(
          'Payment Timeout',
          ERROR_MESSAGES.PAYMENT_TIMEOUT,
          [{ text: 'OK' }]
        );
      }
    }, CONFIG.PAYMENT.TIMEOUT);
  }, [paymentStatus, cleanup]);

  // Initiate payment
  const initiatePayment = useCallback(async (amount: number): Promise<boolean> => {
    console.log('💰 [PAYMENT INITIATE] Starting payment for:', amount);
    
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return false;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      setError(ERROR_MESSAGES.INVALID_PHONE);
      return false;
    }

    if (amount < CONFIG.PARKING.MINIMUM_COST) {
      setError(`Minimum payment amount is KSH ${CONFIG.PARKING.MINIMUM_COST}`);
      return false;
    }

    setIsProcessingPayment(true);
    setPaymentStatus('pending');
    setError(null);
    setReceiptNumber(null); // Reset receipt number

    try {
      const request = {
        phone: formattedPhone,
        amount,
        user_id: `parking_user_${Date.now()}`,
        accountReference: paymentService.generateReference(),
        transactionDesc: `Parking payment - ${Math.round(amount / CONFIG.PARKING.HOURLY_RATE * 100) / 100} hours`,
      };

      console.log('📤 [PAYMENT] Sending request:', request);
      
      const response = await paymentService.initiatePayment(request);
      
      if (response.success && response.checkoutRequestID) {
        console.log('✅ [PAYMENT] Request successful, checkout ID:', response.checkoutRequestID);
        setCheckoutRequestID(response.checkoutRequestID);
        startPolling(response.checkoutRequestID);
        return true;
      } else {
        throw new Error(response.error || ERROR_MESSAGES.PAYMENT_INITIATION_FAILED);
      }
    } catch (error: any) {
      console.error('❌ [PAYMENT] Initiation error:', error);
      
      cleanup();
      setPaymentStatus('failed');
      setError(error.message || ERROR_MESSAGES.PAYMENT_INITIATION_FAILED);
      
      Alert.alert(
        'Payment Failed',
        error.message || ERROR_MESSAGES.PAYMENT_INITIATION_FAILED,
        [{ text: 'Try Again' }]
      );
      
      return false;
    }
  }, [phoneNumber, cleanup, startPolling]);

  // Manual payment status check
  const checkPaymentStatus = useCallback(async () => {
    if (!checkoutRequestID) {
      console.log('⚠️ [PAYMENT CHECK] No checkout ID');
      return;
    }

    console.log('🔍 [PAYMENT CHECK] Manual check for:', checkoutRequestID);

    try {
      const response = await paymentService.checkPaymentStatus(checkoutRequestID);
      
      if (response.success && response.currentState) {
        const status = response.currentState.status;
        console.log('📊 [PAYMENT CHECK] Manual status:', status);
        
        if (status === 'SUCCESS') {
          cleanup();
          setPaymentStatus('success');
          setReceiptNumber(response.currentState.mpesaReceiptNumber || null);
          console.log('✅ [PAYMENT CHECK] Manual check: Success!');
        } else if (status === 'FAILED' || status === 'CANCELLED') {
          cleanup();
          setPaymentStatus('failed');
          setError(response.currentState.resultDesc || 'Payment failed');
          console.log('❌ [PAYMENT CHECK] Manual check: Failed');
        }
      } else {
        console.error('❌ [PAYMENT CHECK] Manual check failed:', response.error);
      }
    } catch (error) {
      console.error('❌ [PAYMENT CHECK] Network error:', error);
    }
  }, [checkoutRequestID, cleanup]);

  // Cancel payment - user manually cancels
  const cancelPayment = useCallback(() => {
    console.log('🚫 [PAYMENT CANCEL] User cancelled payment');
    cleanup();
    setPaymentStatus('cancelled');
    setError('Payment cancelled by user');
  }, [cleanup]);

  // Reset payment - called AFTER session is saved
  const resetPayment = useCallback(() => {
    console.log('🔄 [PAYMENT RESET] Resetting payment state (soft reset)');
    setPhoneNumber('');
    setReceiptNumber(null);
    setIsProcessingPayment(false);
    setError(null);
    setCheckoutRequestID(null);
    // DO NOT reset paymentStatus here - it needs to stay so Parking component can save
    // The Parking component will call forceResetPayment after saving
  }, []);

  // Force reset - called by Parking component AFTER saving
  const forceResetPayment = useCallback(() => {
    console.log('💥 [PAYMENT FORCE RESET] Full reset including status');
    cleanup();
    setPhoneNumber('');
    setPaymentStatus('idle'); // This is the key line!
    setReceiptNumber(null);
    setCheckoutRequestID(null);
    setError(null);
    setIsProcessingPayment(false);
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 [PAYMENT] Cleaning up on unmount');
      cleanup();
    };
  }, [cleanup]);

  return {
    phoneNumber,
    paymentStatus,
    checkoutRequestID,
    receiptNumber,
    error,
    isProcessingPayment,
    setPhoneNumber,
    initiatePayment,
    checkPaymentStatus,
    cancelPayment,
    resetPayment,
    forceResetPayment, // Add this
  };
};