// src/screens/Parking.tsx - CLEANED UP VERSION
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import SwipeButton from 'rn-swipe-button';

import { CONFIG } from '../../constants/config';
import { mapStyle } from '../../constants/mapStyle';
import { useParking } from '../../hooks/useParking';
import { usePayment } from '../../hooks/usePayment';
import { carStorage } from '../../utils/carStorage';
import { locationService, LocationData } from '../../services/locationService';
import { formatPhoneNumber } from '../../utils/phoneFormatter';
import { formatTime } from '../../utils/timeFormatter';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_MIN_HEIGHT = 140;
const DRAWER_MAX_HEIGHT = SCREEN_HEIGHT * 0.85;
const KEYBOARD_OFFSET = Platform.OS === 'ios' ? 180 : 100;

const Parking = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [drawerHeight, setDrawerHeight] = useState(new Animated.Value(DRAWER_MIN_HEIGHT));
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [activeCar, setActiveCar] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [swipeButtonKey, setSwipeButtonKey] = useState(Date.now());
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [selectedPinLocation, setSelectedPinLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  
  const phoneInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const mapRef = useRef<MapView>(null);
  const lastLocationUpdateRef = useRef<number>(0);

  const parking = useParking();
  const payment = usePayment();

  // Load active car
  useEffect(() => {
    const loadActiveCar = async () => {
      try {
        const car = await carStorage.getActiveCar();
        setActiveCar(car);
      } catch (error) {
        console.error('Error loading active car:', error);
      }
    };
    
    loadActiveCar();
    
    const intervalId = setInterval(loadActiveCar, 2000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Reset swipe button
  useEffect(() => {
    setSwipeButtonKey(Date.now());
  }, [parking.isParking]);

  // Payment status handler
  useEffect(() => {
    console.log('💰 [PAYMENT STATUS] Changed:', {
      status: payment.paymentStatus,
      isParking: parking.isParking,
      startTime: parking.parkingStartTime,
      activeCar,
      processing: isProcessing,
      receipt: payment.receiptNumber
    });

    const processPaymentStatus = async () => {
      // Don't process if idle
      if (!payment.paymentStatus || payment.paymentStatus === 'idle') {
        console.log('💰 [PAYMENT] Status is idle, skipping...');
        return;
      }

      // Reset processing flag for new status changes
      if (payment.paymentStatus === 'pending' && isProcessing) {
        console.log('🔄 [PAYMENT] Resetting processing flag for pending status');
        setIsProcessing(false);
      }

      // If already processing, wait a bit and retry
      if (isProcessing && payment.paymentStatus !== 'pending') {
        console.log('⏳ [PAYMENT] Already processing, waiting...');
        setTimeout(() => {
          console.log('🔄 [PAYMENT] Retrying after delay...');
          processPaymentStatus();
        }, 500);
        return;
      }

      // Capture the status immediately
      const currentPaymentStatus = payment.paymentStatus;
      console.log('🔄 [PAYMENT] Starting to process:', currentPaymentStatus);
      
      setIsProcessing(true);

      try {
        // Only save for terminal statuses
        if (currentPaymentStatus === 'success' || 
            currentPaymentStatus === 'cancelled' || 
            currentPaymentStatus === 'failed') {
          
          console.log('💾 [PAYMENT] Terminal status detected, saving session...');
          
          // Check if we have all required data
          if (!parking.parkingStartTime || !activeCar) {
            console.error('❌ [PAYMENT] Missing data:', {
              hasStartTime: !!parking.parkingStartTime,
              hasActiveCar: !!activeCar,
              cost: parking.parkingCost,
              duration: parking.parkingDuration
            });
            
            // Still handle UI for success
            if (currentPaymentStatus === 'success') {
              setShowPaymentSuccess(true);
              setTimeout(() => {
                setPaymentModalVisible(false);
                parking.resetParking();
                payment.forceResetPayment();
                setIsProcessing(false);
              }, 2000);
            }
            return;
          }

          // Get location data
          let address = 'Location not available';
          let latitude = CONFIG.MAP.DEFAULT_REGION.latitude;
          let longitude = CONFIG.MAP.DEFAULT_REGION.longitude;

          try {
            const manualLocation = locationService.getManualLocation();
            const useManualLocation = manualLocation && Date.now() - manualLocation.timestamp < 300000;
            
            if (useManualLocation && manualLocation) {
              latitude = manualLocation.latitude;
              longitude = manualLocation.longitude;
              console.log('📍 [PAYMENT] Using manual location');
            } else if (location) {
              latitude = location.coords.latitude;
              longitude = location.coords.longitude;
              console.log('📍 [PAYMENT] Using current location');
            }

            // Get address
            const addr = await locationService.getAddressFromCoords(latitude, longitude);
            if (addr) address = addr;
            console.log('📍 [PAYMENT] Address:', address);
          } catch (locError) {
            console.error('📍 [PAYMENT] Error getting location:', locError);
          }

          // Generate receipt number if not provided
          const receiptNumber = payment.receiptNumber || 
            `REC-${Date.now().toString().slice(-8)}`;
          
          // Log what we're saving
          console.log('💾 [PAYMENT] Saving session data:', {
            cost: parking.parkingCost,
            duration: parking.parkingDuration,
            startTime: parking.parkingStartTime,
            location: { latitude, longitude, address },
            status: currentPaymentStatus,
            phoneNumber: payment.phoneNumber,
            receiptNumber: receiptNumber,
            carPlate: activeCar
          });

          // SAVE THE SESSION
          const saved = await parking.saveParkingSession(
            parking.parkingCost,
            parking.parkingDuration,
            parking.parkingStartTime,
            {
              latitude,
              longitude,
              address,
            },
            currentPaymentStatus,
            payment.phoneNumber,
            receiptNumber,
            activeCar
          );

          if (saved) {
            console.log('✅ [PAYMENT] Session saved successfully!');
          } else {
            console.error('❌ [PAYMENT] Failed to save session');
          }
        }

        // Handle UI based on status
        switch (currentPaymentStatus) {
          case 'success':
            console.log('🎉 [PAYMENT] Payment successful!');
            setShowPaymentSuccess(true);
            // Reset after showing success
            setTimeout(() => {
              console.log('🔄 [PAYMENT] Resetting after success');
              setPaymentModalVisible(false);
              parking.resetParking();
              payment.forceResetPayment();
              setIsProcessing(false);
            }, 2000);
            break;

          case 'cancelled':
            console.log('🚫 [PAYMENT] Payment cancelled');
            setTimeout(() => {
              setPaymentModalVisible(false);
              parking.resetParking();
              payment.forceResetPayment();
              setIsProcessing(false);
            }, 1000);
            break;

          case 'failed':
            console.log('❌ [PAYMENT] Payment failed');
            setTimeout(() => {
              setPaymentModalVisible(false);
              parking.resetParking();
              payment.forceResetPayment();
              setIsProcessing(false);
            }, 1000);
            break;

          case 'pending':
            console.log('⏳ [PAYMENT] Payment pending...');
            // Don't reset - stay in pending state
            setIsProcessing(false);
            break;
            
          default:
            console.log('❓ [PAYMENT] Unknown status, resetting...');
            setIsProcessing(false);
        }

      } catch (error) {
        console.error('❌ [PAYMENT] Error processing payment:', error);
        // Always reset on error
        setTimeout(() => {
          setPaymentModalVisible(false);
          parking.resetParking();
          payment.forceResetPayment();
          setIsProcessing(false);
        }, 1000);
      }
    };

    // Execute the handler
    processPaymentStatus();
  }, [payment.paymentStatus, payment.receiptNumber]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => {
          if (scrollViewRef.current && isDrawerExpanded) {
            scrollViewRef.current.scrollTo({ y: 120, animated: true });
          }
        }, 150);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [isDrawerExpanded]);

  // Pan responder for drawer
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderGrant: () => {
        toggleDrawer();
      },
    })
  ).current;

  // Toggle drawer expansion
  const toggleDrawer = () => {
    if (paymentModalVisible && !payment.isProcessingPayment) {
      const toValue = isDrawerExpanded ? DRAWER_MIN_HEIGHT : DRAWER_MAX_HEIGHT;
      Animated.spring(drawerHeight, {
        toValue,
        useNativeDriver: false,
        tension: 50,
        friction: 12,
      }).start();
      setIsDrawerExpanded(!isDrawerExpanded);
    }
  };

  // Handle parking toggle
  const toggleParking = async () => {
    if (isProcessing || payment.isProcessingPayment) {
      Alert.alert('Please Wait', 'A payment is currently being processed');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      if (!activeCar) {
        Alert.alert('No Car Selected', 'Please select a car first');
        setIsProcessing(false);
        return;
      }

      if (parking.isParking) {
        // Stop parking - show payment modal
        console.log('🛑 [PARKING] Stopping parking, showing payment modal');
        setPaymentModalVisible(true);
        Animated.spring(drawerHeight, {
          toValue: DRAWER_MAX_HEIGHT,
          useNativeDriver: false,
          tension: 50,
          friction: 12,
        }).start();
        setIsDrawerExpanded(true);
        
        // Focus phone input
        setTimeout(() => {
          phoneInputRef.current?.focus();
          setTimeout(() => {
            if (scrollViewRef.current) {
              scrollViewRef.current.scrollTo({ y: 120, animated: true });
            }
          }, 100);
        }, 500);
      } else {
        // Start parking
        console.log('🚗 [PARKING] Starting parking for:', activeCar);
        const manualLocation = locationService.getManualLocation();
        const useManualLocation = manualLocation && Date.now() - manualLocation.timestamp < 300000;
        
        if (useManualLocation) {
          parking.startParking(activeCar, manualLocation.latitude, manualLocation.longitude);
        } else {
          parking.startParking(activeCar);
        }
      }
    } catch (error) {
      console.error('❌ [PARKING] Error toggling parking:', error);
      Alert.alert('Error', 'Failed to toggle parking. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle cancel payment
  const handleCancelPayment = () => {
    Keyboard.dismiss();
    
    if (payment.isProcessingPayment || payment.paymentStatus === 'pending') {
      Alert.alert(
        'Payment in Progress',
        'Payment is currently being processed. Do you want to cancel?',
        [
          {
            text: 'Continue',
            style: 'cancel',
          },
          {
            text: 'Cancel Payment',
            onPress: async () => {
              await payment.cancelPayment();
            },
            style: 'destructive',
          },
        ]
      );
    } else {
      setPaymentModalVisible(false);
      // Only reset parking if we cancel before initiating payment
      if (payment.paymentStatus === 'idle') {
        setTimeout(() => {
          parking.resetParking();
          payment.resetPayment();
        }, 300);
      }
    }
  };

  // Handle payment initiation
  const handleInitiatePayment = async () => {
    Keyboard.dismiss();
    
    if (!payment.phoneNumber.trim()) {
      Alert.alert('Phone Required', 'Please enter your phone number');
      return;
    }

    const formattedPhone = formatPhoneNumber(payment.phoneNumber);
    if (!formattedPhone) {
      Alert.alert('Invalid Phone', 'Please enter a valid Kenyan phone number');
      return;
    }

    if (parking.parkingCost < 1) {
      Alert.alert('Invalid Amount', 'Parking cost must be at least KSH 1');
      return;
    }

    console.log('💰 [PAYMENT] Initiating payment:', {
      amount: parking.parkingCost,
      phone: formattedPhone,
      car: activeCar
    });

    setIsProcessing(true);
    try {
      const success = await payment.initiatePayment(parking.parkingCost);
      if (!success) {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('❌ [PAYMENT] Error initiating payment:', error);
      setIsProcessing(false);
      Alert.alert('Payment Failed', 'Failed to initiate payment. Please try again.');
    }
  };

  // Fetch location
  useEffect(() => {
    let mounted = true;

    const fetchLocation = async () => {
      try {
        const hasPermission = await locationService.requestPermission();
        if (!hasPermission && mounted) {
          setLoadingLocation(false);
          Alert.alert('Location Permission Required', 'Please enable location services to use parking features.');
          return;
        }

        const currentLocation = await locationService.getCurrentLocation();
        if (mounted) {
          if (currentLocation) {
            setLocation(currentLocation);
          } else {
            setLocation({
              coords: {
                latitude: CONFIG.MAP.DEFAULT_REGION.latitude,
                longitude: CONFIG.MAP.DEFAULT_REGION.longitude,
                altitude: null,
                accuracy: 100,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
              },
              timestamp: Date.now(),
            });
          }
          setLoadingLocation(false);
        }
      } catch (error) {
        if (mounted) {
          console.error('❌ [LOCATION] Error:', error);
          setLoadingLocation(false);
          Alert.alert('Location Error', 'Unable to fetch your location. Using default position.');
        }
      }
    };

    fetchLocation();

    return () => {
      mounted = false;
    };
  }, []);

  // Watch location when parking is active
  useEffect(() => {
    let isMounted = true;

    const manageLocationTracking = async () => {
      if (parking.isParking) {
        try {
          await locationService.startWatchingLocation(
            (newLocation) => {
              if (!isMounted) return;
              
              setLocation(newLocation);
              
              const now = Date.now();
              if (now - lastLocationUpdateRef.current >= 30000) {
                parking.updateLocation(
                  newLocation.coords.latitude,
                  newLocation.coords.longitude
                );
                lastLocationUpdateRef.current = now;
              }
            },
            {
              interval: 30000,
              distance: 20,
            }
          );
        } catch (error) {
          console.error('❌ [LOCATION] Failed to start tracking:', error);
        }
      } else {
        try {
          await locationService.stopWatchingLocation();
        } catch (error) {
          console.error('❌ [LOCATION] Failed to stop tracking:', error);
        }
      }
    };

    manageLocationTracking();

    return () => {
      isMounted = false;
      locationService.stopWatchingLocation().catch(console.error);
    };
  }, [parking.isParking]);

  // Handle map press for pin selection
  const handleMapPress = async (event: any) => {
    if (!isSelectingLocation) return;
    
    const { coordinate } = event.nativeEvent;
    
    try {
      const address = await locationService.getAddressFromCoords(
        coordinate.latitude,
        coordinate.longitude
      );
      
      const locationData = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address: address || 'Selected location',
      };
      
      setSelectedPinLocation(locationData);
      
      locationService.setManualLocation(locationData);
      
      Alert.alert(
        'Location Selected',
        `Parking location set to: ${address || 'Selected coordinates'}`,
        [{ text: 'OK', onPress: () => setIsSelectingLocation(false) }]
      );
    } catch (error) {
      console.error('❌ [MAP] Error getting address:', error);
      Alert.alert('Error', 'Unable to get address for selected location. Using coordinates only.');
    }
  };

  // Calculate drawer height with keyboard
  const getDrawerHeight = () => {
    if (keyboardVisible && isDrawerExpanded) {
      return Math.max(SCREEN_HEIGHT * 0.8, SCREEN_HEIGHT - keyboardHeight - 50);
    }
    return isDrawerExpanded ? DRAWER_MAX_HEIGHT : DRAWER_MIN_HEIGHT;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Payment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={paymentModalVisible}
        onRequestClose={handleCancelPayment}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.paymentOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? KEYBOARD_OFFSET : 0}
        >
          <TouchableOpacity
            style={styles.paymentBackdrop}
            activeOpacity={1}
            onPress={handleCancelPayment}
          />
          
          <Animated.View
            style={[
              styles.paymentDrawer,
              {
                height: drawerHeight.interpolate({
                  inputRange: [DRAWER_MIN_HEIGHT, DRAWER_MAX_HEIGHT],
                  outputRange: [DRAWER_MIN_HEIGHT, getDrawerHeight()],
                }),
                transform: [{
                  translateY: drawerHeight.interpolate({
                    inputRange: [DRAWER_MIN_HEIGHT, DRAWER_MAX_HEIGHT],
                    outputRange: [SCREEN_HEIGHT - DRAWER_MIN_HEIGHT, SCREEN_HEIGHT - getDrawerHeight()],
                    extrapolate: 'clamp'
                  })
                }]
              }
            ]}
          >
            {showPaymentSuccess ? (
              <View style={styles.successContainer}>
                <View style={styles.successCircle}>
                  <Ionicons name="checkmark" size={80} color="#16A34A" />
                </View>
                <Text style={styles.successTitle}>Payment Successful!</Text>
                <Text style={styles.successMessage}>
                  KSH {parking.parkingCost} paid for {activeCar}
                </Text>
                <Text style={styles.successSub}>
                  Session saved to history
                </Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.drawerHandleContainer}
                  onPress={toggleDrawer}
                  {...panResponder.panHandlers}
                >
                  <View style={styles.drawerHandle} />
                </TouchableOpacity>

                <View style={styles.paymentHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.paymentTitle}>Complete Payment</Text>
                    {!isDrawerExpanded && (
                      <Text style={styles.paymentSubtitle}>
                        KSH {parking.parkingCost} • {formatTime(parking.parkingDuration)}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={handleCancelPayment}
                    disabled={payment.isProcessingPayment || isProcessing}
                    style={styles.closeButton}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={(payment.isProcessingPayment || isProcessing) ? '#9CA3AF' : CONFIG.UI.COLORS.PRIMARY}
                    />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  ref={scrollViewRef}
                  style={styles.paymentScrollView}
                  contentContainerStyle={[
                    styles.paymentContent,
                    keyboardVisible && styles.paymentContentWithKeyboard
                  ]}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="interactive"
                >
                  {/* Phone input */}
                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <View style={styles.phoneInputContainer}>
                      <View style={styles.countryCodeContainer}>
                        <Text style={styles.countryCode}>+254</Text>
                      </View>
                      <TextInput
                        ref={phoneInputRef}
                        style={styles.phoneInput}
                        placeholder="712 345 678"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="phone-pad"
                        value={payment.phoneNumber}
                        onChangeText={payment.setPhoneNumber}
                        maxLength={9}
                        editable={!payment.isProcessingPayment && !isProcessing}
                        returnKeyType="done"
                        onSubmitEditing={handleInitiatePayment}
                        blurOnSubmit={false}
                        autoFocus={true}
                      />
                    </View>
                    <Text style={styles.inputHint}>
                      Enter your M-Pesa registered phone number
                    </Text>
                  </View>

                  <Text style={styles.paymentStatus}>
                    {payment.paymentStatus === 'pending'
                      ? 'Waiting for payment confirmation...'
                      : 'Enter your phone number to pay'}
                  </Text>

                  {activeCar && (
                    <View style={styles.activeCarDisplay}>
                      <Ionicons name="car" size={16} color={CONFIG.UI.COLORS.PRIMARY} />
                      <Text style={styles.activeCarText}>{activeCar}</Text>
                    </View>
                  )}

                  <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                        <Text style={styles.summaryLabel}>Duration</Text>
                        <Text style={styles.summaryValue}>{formatTime(parking.parkingDuration)}</Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryItem}>
                        <Ionicons name="speedometer-outline" size={16} color="#6B7280" />
                        <Text style={styles.summaryLabel}>Rate</Text>
                        <Text style={styles.summaryValue}>KSH {CONFIG.PARKING.HOURLY_RATE}/hr</Text>
                      </View>
                    </View>
                    
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total Amount</Text>
                      <Text style={styles.totalValue}>KSH {parking.parkingCost}</Text>
                    </View>
                  </View>

                  {payment.paymentStatus === 'pending' ? (
                    <View style={styles.processingContainer}>
                      <ActivityIndicator size="large" color={CONFIG.UI.COLORS.PRIMARY} />
                      <Text style={styles.processingText}>
                        Complete payment on your phone
                      </Text>
                      <Text style={styles.processingHint}>
                        Check for M-Pesa STK Push prompt
                      </Text>
                      
                      <TouchableOpacity
                        style={styles.cancelPaymentButton}
                        onPress={async () => {
                          await payment.cancelPayment();
                        }}
                      >
                        <Text style={styles.cancelPaymentButtonText}>
                          Cancel Payment
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  <View style={[
                    styles.actionContainer,
                    keyboardVisible && styles.actionContainerWithKeyboard
                  ]}>
                    <Text style={styles.infoText}>
                      A payment prompt will be sent to your phone via M-Pesa
                    </Text>
                    
                    {payment.paymentStatus !== 'pending' && (
                      <TouchableOpacity
                        style={[
                          styles.payButton,
                          (payment.isProcessingPayment || isProcessing) && styles.payButtonDisabled
                        ]}
                        onPress={handleInitiatePayment}
                        disabled={payment.isProcessingPayment || isProcessing}
                      >
                        {(payment.isProcessingPayment || isProcessing) ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <>
                            <Ionicons name="card-outline" size={20} color="white" />
                            <Text style={styles.payButtonText}>
                              Pay KSH {parking.parkingCost}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Map */}
      {loadingLocation ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={CONFIG.UI.COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Finding your location...</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: location?.coords.latitude || CONFIG.MAP.DEFAULT_REGION.latitude,
            longitude: location?.coords.longitude || CONFIG.MAP.DEFAULT_REGION.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          customMapStyle={mapStyle}
          showsUserLocation={!isSelectingLocation}
          followsUserLocation={parking.isParking && !selectedPinLocation}
          loadingEnabled={true}
          zoomEnabled={true}
          scrollEnabled={!isSelectingLocation}
          rotateEnabled={false}
          pitchEnabled={false}
          onPress={handleMapPress}
        >
          {/* User marker */}
          {location && !isSelectingLocation && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              tracksViewChanges={false}
            >
              <View style={styles.markerContainer}>
                <View style={[
                  styles.markerPin,
                  parking.isParking && styles.markerPinActive,
                ]}>
                  <Ionicons
                    name={parking.isParking ? "car-sport" : "car"}
                    size={parking.isParking ? 20 : 18}
                    color="white"
                  />
                </View>
                {parking.isParking && <View style={styles.markerPulse} />}
              </View>
            </Marker>
          )}
          
          {/* Selected pin marker */}
          {selectedPinLocation && (
            <Marker
              coordinate={{
                latitude: selectedPinLocation.latitude,
                longitude: selectedPinLocation.longitude,
              }}
              tracksViewChanges={false}
            >
              <View style={styles.pinMarkerContainer}>
                <View style={styles.pinMarker}>
                  <Ionicons name="pin" size={24} color={CONFIG.UI.COLORS.PRIMARY} />
                </View>
                <View style={styles.pinMarkerPulse} />
              </View>
            </Marker>
          )}
          
          {/* Selection mode indicator */}
          {isSelectingLocation && location && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              tracksViewChanges={false}
            >
              <View style={styles.selectionMarker}>
                <Ionicons name="locate" size={28} color={CONFIG.UI.COLORS.SECONDARY} />
                <Text style={styles.selectionText}>Tap to set location</Text>
              </View>
            </Marker>
          )}
        </MapView>
      )}

      {/* Location selection button */}
      <TouchableOpacity
        style={styles.locationSelectButton}
        onPress={() => {
          setIsSelectingLocation(!isSelectingLocation);
          if (isSelectingLocation) {
            setSelectedPinLocation(null);
            locationService.clearManualLocation();
            Alert.alert('Location Selection Cancelled', 'Manual location selection has been cancelled.');
          } else {
            Alert.alert('Select Location', 'Tap on the map to set your parking location.');
          }
        }}
      >
        <Ionicons
          name={isSelectingLocation ? "close-circle" : "pin"}
          size={22}
          color={isSelectingLocation ? CONFIG.UI.COLORS.ERROR : CONFIG.UI.COLORS.PRIMARY}
        />
        <Text style={[
          styles.locationSelectText,
          { color: isSelectingLocation ? CONFIG.UI.COLORS.ERROR : CONFIG.UI.COLORS.PRIMARY }
        ]}>
          {isSelectingLocation ? 'Cancel' : 'Set Location'}
        </Text>
      </TouchableOpacity>

      {/* Status Card */}
      <View style={styles.statusContainer}>
        <View style={styles.statusHeader}>
          <View style={[
            styles.statusIndicator,
            parking.isParking ? styles.statusActive : styles.statusInactive,
            parking.isParking && styles.statusPulse
          ]} />
          <Text style={styles.statusText}>
            {parking.isParking ? 'PARKING ACTIVE' : 'READY TO PARK'}
          </Text>
          {parking.isParking && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>
        
        {parking.isParking && (
          <View style={styles.timerContainer}>
            <View style={styles.timerRow}>
              <View style={styles.timerItem}>
                <Ionicons name="time-outline" size={20} color={CONFIG.UI.COLORS.PRIMARY} />
                <Text style={styles.timerLabel}>Duration</Text>
                <Text style={styles.timerValue}>{formatTime(parking.parkingDuration)}</Text>
              </View>
              
              <View style={styles.timerItem}>
                <Ionicons name="cash-outline" size={20} color={CONFIG.UI.COLORS.SECONDARY} />
                <Text style={styles.timerLabel}>Current Cost</Text>
                <Text style={styles.costValue}>KSH {parking.parkingCost}</Text>
              </View>
            </View>
            
            <Text style={styles.rateText}>
              Rate: KSH {CONFIG.PARKING.HOURLY_RATE} per hour
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Slider */}
      <View style={styles.bottomContainer}>
        <View style={styles.sliderCard}>
          <View style={styles.sliderHeader}>
            <Ionicons
              name={parking.isParking ? "lock-closed" : "lock-open"}
              size={22}
              color={parking.isParking ? CONFIG.UI.COLORS.SECONDARY : CONFIG.UI.COLORS.PRIMARY}
            />
            <Text style={styles.sliderTitle}>
              {parking.isParking ? 'SWIPE TO STOP & PAY' : 'SWIPE TO START PARKING'}
            </Text>
          </View>
          
          <SwipeButton
            key={`swipe_${swipeButtonKey}_${parking.isParking ? 'active' : 'inactive'}_${activeCar || 'no-car'}`}
            height={60}
            width={SCREEN_WIDTH - 80}
            railBackgroundColor="#F3F4F6"
            railFillBackgroundColor={parking.isParking ? CONFIG.UI.COLORS.SECONDARY : CONFIG.UI.COLORS.PRIMARY}
            railFillBorderColor="transparent"
            railBorderColor="transparent"
            thumbIconBackgroundColor="white"
            thumbIconBorderColor="transparent"
            thumbIconComponent={() => (
              <View style={styles.thumbIcon}>
                <Ionicons
                  name={parking.isParking ? "stop" : "play"}
                  size={26}
                  color={parking.isParking ? CONFIG.UI.COLORS.SECONDARY : CONFIG.UI.COLORS.PRIMARY}
                />
              </View>
            )}
            title={parking.isParking ? "← Slide to stop parking" : "Slide to start parking →"}
            titleColor={parking.isParking ? CONFIG.UI.COLORS.SECONDARY : CONFIG.UI.COLORS.PRIMARY}
            titleFontSize={16}
            titleStyles={{ fontWeight: '700', letterSpacing: 0.5 }}
            onSwipeSuccess={toggleParking}
            railStyles={{ borderRadius: 30 }}
            thumbIconStyles={{ borderRadius: 28 }}
            containerStyles={{ borderRadius: 30 }}
            disableResetOnTap={true}
            disabled={paymentModalVisible || isProcessing || payment.isProcessingPayment}
            shouldResetAfterSuccess={false}
            resetAfterSuccessAnimDelay={0}
            resetAfterSuccessAnimDuration={0}
          />
          
          <Text style={styles.sliderHint}>
            {parking.isParking
              ? `Parking active for ${activeCar || 'your car'}. Timer is running.`
              : activeCar 
                ? `Swipe to start parking for ${activeCar}`
                : 'Add your car first to start parking'
            }
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  statusContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: CONFIG.UI.COLORS.SECONDARY,
  },
  statusInactive: {
    backgroundColor: CONFIG.UI.COLORS.PRIMARY,
  },
  statusPulse: {
    shadowColor: CONFIG.UI.COLORS.SECONDARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  timerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timerItem: {
    alignItems: 'center',
    flex: 1,
  },
  timerLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    marginBottom: 2,
  },
  timerValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  costValue: {
    fontSize: 18,
    fontWeight: '700',
    color: CONFIG.UI.COLORS.SECONDARY,
  },
  rateText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  sliderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sliderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  thumbIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sliderHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
  paymentOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  paymentBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  paymentDrawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#DCFCE7',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#16A34A',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSub: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  drawerHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
  },
  drawerHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D1D5DB',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  paymentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  paymentScrollView: {
    flex: 1,
  },
  paymentContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  paymentContentWithKeyboard: {
    paddingBottom: 100,
  },
  paymentStatus: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  activeCarDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 16,
  },
  activeCarText: {
    fontSize: 14,
    fontWeight: '600',
    color: CONFIG.UI.COLORS.PRIMARY,
    marginLeft: 6,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: CONFIG.UI.COLORS.PRIMARY,
  },
  processingContainer: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  processingHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  cancelPaymentButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  cancelPaymentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  countryCodeContainer: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    minHeight: 48,
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    marginLeft: 4,
  },
  actionContainer: {
    marginTop: 'auto',
  },
  actionContainerWithKeyboard: {
    marginBottom: 40,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: CONFIG.UI.COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: CONFIG.UI.COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  payButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginLeft: 8,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CONFIG.UI.COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  markerPinActive: {
    backgroundColor: CONFIG.UI.COLORS.SECONDARY,
  },
  markerPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: CONFIG.UI.COLORS.SECONDARY,
    opacity: 0.3,
    zIndex: -1,
  },
  locationSelectButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    right: 20,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationSelectText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  pinMarkerContainer: {
    alignItems: 'center',
  },
  pinMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: CONFIG.UI.COLORS.PRIMARY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  pinMarkerPulse: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: CONFIG.UI.COLORS.PRIMARY,
    opacity: 0.2,
    zIndex: -1,
  },
  selectionMarker: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  selectionText: {
    fontSize: 12,
    fontWeight: '600',
    color: CONFIG.UI.COLORS.SECONDARY,
    marginTop: 4,
  },
});

export default Parking;