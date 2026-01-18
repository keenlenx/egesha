// constants/config.ts

export const CONFIG = {
  // Payment Configuration
  PAYMENT: {
    API_URL: 'http://agiza.co.ke:5000', // Your backend API URL
    TIMEOUT: 180000, // 3 minutes in milliseconds
    POLLING_INTERVAL: 5000, // 5 seconds
    COUNTRY_CODE: '254', // Kenya country code
    MAX_PHONE_RETRIES: 3,
    PAYMENT_TYPES: {
      MPESA: 'mpesa',
      CARD: 'card',
      WALLET: 'wallet',
    },
  },

  // Parking Configuration
  PARKING: {
    HOURLY_RATE: 60, // KSH per hour
    MINIMUM_COST: 1, // Minimum parking cost in KSH
    TAX_RATE: 0.16, // 16% VAT
    MIN_PARKING_DURATION: 60, // 1 minute in seconds
    MAX_PARKING_DURATION: 86400, // 24 hours in seconds
    AUTO_SAVE_INTERVAL: 30000, // Save session every 30 seconds
    LOCATION_ACCURACY_THRESHOLD: 50, // meters
    DEFAULT_SESSION_TIMEOUT: 300, // 5 minutes
  },

  // UI Configuration
  UI: {
    COLORS: {
      PRIMARY: '#00b2a4', // Teal/cyan - main brand color
      SECONDARY: '#ff3b30', // Red for warnings/errors
      SUCCESS: '#52c41a', // Green
      WARNING: '#faad14', // Orange
      ERROR: '#ff3b30', // Red
      INFO: '#1890ff', // Blue
      
      // Background colors
      BACKGROUND: '#ffffff',
      SURFACE: '#f8f8f8',
      CARD: '#ffffff',
      MODAL: 'rgba(0, 0, 0, 0.5)',
      
      // Text colors
      TEXT: '#333333',
      TEXT_SECONDARY: '#666666',
      TEXT_TERTIARY: '#999999',
      TEXT_DISABLED: '#cccccc',
      
      // Border colors
      BORDER: '#e0e0e0',
      BORDER_LIGHT: '#f0f0f0',
      BORDER_DARK: '#d0d0d0',
      
      // Status colors
      PARKING_ACTIVE: '#ff3b30',
      PARKING_INACTIVE: '#00b2a4',
      LIVE_INDICATOR: '#ff3b30',
      
      // Gradients
      GRADIENT_START: '#00b2a4',
      GRADIENT_END: '#008080',
    },
    
    SPACING: {
      XS: 4,
      SM: 8,
      MD: 16,
      LG: 24,
      XL: 32,
      XXL: 48,
    },
    
    BORDER_RADIUS: {
      SM: 6,
      MD: 12,
      LG: 16,
      XL: 24,
      ROUND: 999,
    },
    
    TYPOGRAPHY: {
      FONT_SIZES: {
        XS: 10,
        SM: 12,
        MD: 14,
        LG: 16,
        XL: 18,
        XXL: 24,
        XXXL: 32,
      },
      FONT_WEIGHTS: {
        REGULAR: '400',
        MEDIUM: '500',
        SEMIBOLD: '600',
        BOLD: '700',
        EXTRABOLD: '800',
      },
    },
    
    SHADOW: {
      SM: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      },
      MD: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
      LG: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
      },
      XL: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 12,
      },
    },
    
    ANIMATION: {
      DURATION: {
        FAST: 150,
        NORMAL: 300,
        SLOW: 500,
      },
      EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Phone Configuration
  PHONE: {
    COUNTRY_CODE: '254',
    VALID_PREFIXES: ['7', '1'], // Kenyan mobile prefixes
    MIN_LENGTH: 9,
    MAX_LENGTH: 12,
    FORMAT_PATTERN: 'XXX XXX XXX',
    EXAMPLE_NUMBER: '712345678',
  },

  // Map Configuration
  MAP: {
    DEFAULT_REGION: {
      latitude: -1.2921, // Nairobi CBD
      longitude: 36.8219,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    },
    ZOOM_LEVEL: 0.01,
    TRACKING_INTERVAL: 10000, // 10 seconds
    MAX_ACCURACY: 100, // meters
    LOCATION_TIMEOUT: 10000, // 10 seconds
    DEFAULT_ZOOM: 15,
    MIN_ZOOM: 12,
    MAX_ZOOM: 20,
  },

  // Storage Configuration
  STORAGE: {
    PARKING_SESSIONS_KEY: '@kenpark_parking_sessions',
    ACTIVE_CAR_KEY: '@kenpark_active_car',
    USER_SETTINGS_KEY: '@kenpark_user_settings',
    PAYMENT_INFO_KEY: '@kenpark_payment_info',
    SESSION_TIMEOUT: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    MAX_SESSIONS: 100,
  },

  // Validation Configuration
  VALIDATION: {
    CAR_PLATE_REGEX: /^[A-Z]{1,3}\s?\d{1,6}[A-Z]?$/i,
    PHONE_REGEX: /^(?:254|\+254|0)?(7\d{8}|1\d{8})$/,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },

  // Time Configuration
  TIME: {
    SESSION_TIMEOUT: 300, // 5 minutes in seconds
    TOAST_DURATION: 3000, // 3 seconds
    REFRESH_INTERVAL: 1000, // 1 second for timer
    DATE_FORMAT: 'DD/MM/YYYY',
    TIME_FORMAT: 'HH:mm',
    DATETIME_FORMAT: 'DD/MM/YYYY HH:mm',
  },

  // App Configuration
  APP: {
    NAME: 'KenPark',
    VERSION: '1.0.0',
    BUILD_NUMBER: '1',
    SUPPORT_EMAIL: 'support@kenpark.com',
    TERMS_URL: 'https://kenpark.com/terms',
    PRIVACY_URL: 'https://kenpark.com/privacy',
    FEEDBACK_URL: 'https://kenpark.com/feedback',
    APP_STORE_URL: 'https://apps.apple.com/app/kenpark',
    PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=com.kenpark',
  },

  // Feature Flags
  FEATURES: {
    ENABLE_LOCATION_TRACKING: true,
    ENABLE_PAYMENT_POLLING: true,
    ENABLE_SESSION_AUTO_SAVE: true,
    ENABLE_OFFLINE_MODE: false,
    ENABLE_BIOMETRIC_AUTH: false,
    ENABLE_DARK_MODE: false,
    ENABLE_NOTIFICATIONS: true,
  },

  // Limits
  LIMITS: {
    MAX_PARKING_DURATION: 24 * 60 * 60, // 24 hours in seconds
    MAX_PARKING_COST: 10000, // 10,000 KSH
    MAX_LOCATION_UPDATES: 1000,
    MAX_PAYMENT_RETRIES: 3,
    MAX_SESSION_RETRIES: 3,
  },
};

export const API_ENDPOINTS = {
  // Payment Endpoints
  INITIATE_PAYMENT: '/stkpush',
  CHECK_PAYMENT_STATUS: '/checkstatus',
  REFUND_PAYMENT: '/refund',
  
  // User Endpoints
  REGISTER_USER: '/register',
  LOGIN_USER: '/login',
  UPDATE_USER: '/user/update',
  GET_USER_PROFILE: '/user/profile',
  
  // Parking Endpoints
  GET_PARKING_HISTORY: '/history',
  GET_PARKING_SESSION: '/session',
  UPDATE_PARKING_SESSION: '/session/update',
  CANCEL_PARKING_SESSION: '/session/cancel',
  
  // Car Endpoints
  ADD_CAR: '/car/add',
  UPDATE_CAR: '/car/update',
  DELETE_CAR: '/car/delete',
  GET_USER_CARS: '/cars',
  
  // App Endpoints
  GET_APP_CONFIG: '/config',
  SUBMIT_FEEDBACK: '/feedback',
  REPORT_ISSUE: '/report',
  
  // Location Endpoints
  GET_PARKING_ZONES: '/zones',
  GET_NEARBY_PARKING: '/parking/nearby',
  CHECK_AVAILABILITY: '/parking/availability',
};

export const ERROR_MESSAGES = {
  // Location Errors
  LOCATION_PERMISSION: 'Location permission is required to use parking features.',
  LOCATION_UNAVAILABLE: 'Unable to fetch your location. Please ensure location services are enabled.',
  LOCATION_TIMEOUT: 'Location request timed out. Please try again.',
  
  // Network Errors
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  API_TIMEOUT: 'Request timeout. Please check your connection and try again.',
  
  // Payment Errors
  PAYMENT_INITIATION_FAILED: 'Failed to initiate payment. Please try again.',
  PAYMENT_TIMEOUT: 'Payment request timed out. Please try again.',
  PAYMENT_CANCELLED: 'Payment was cancelled.',
  PAYMENT_FAILED: 'Payment failed. Please try again or use a different method.',
  PAYMENT_PROCESSING: 'Payment is being processed. Please wait.',
  INSUFFICIENT_FUNDS: 'Insufficient funds. Please check your balance.',
  INVALID_AMOUNT: 'Invalid payment amount.',
  
  // Phone Errors
  INVALID_PHONE: 'Please enter a valid Kenyan phone number (e.g., 0712345678 or 712345678).',
  PHONE_NOT_REGISTERED: 'This phone number is not registered with M-Pesa.',
  
  // Car Errors
  INVALID_CAR_PLATE: 'Please enter a valid Kenyan number plate (e.g., KAA 123A).',
  CAR_ALREADY_EXISTS: 'This car is already registered.',
  NO_CAR_SELECTED: 'Please select a car to start parking.',
  
  // Parking Errors
  PARKING_NOT_STARTED: 'Parking session has not started.',
  PARKING_ALREADY_ACTIVE: 'You already have an active parking session.',
  PARKING_SESSION_EXPIRED: 'Parking session has expired.',
  INVALID_PARKING_DURATION: 'Invalid parking duration.',
  PARKING_LOCATION_REQUIRED: 'Location is required to start parking.',
  
  // Validation Errors
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PASSWORD: 'Password must be at least 6 characters.',
  PASSWORDS_DONT_MATCH: 'Passwords do not match.',
  
  // Session Errors
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  SESSION_SAVE_FAILED: 'Failed to save parking session.',
  SESSION_LOAD_FAILED: 'Failed to load parking sessions.',
  
  // General Errors
  UNKNOWN_ERROR: 'An unexpected error occurred.',
  OPERATION_FAILED: 'Operation failed. Please try again.',
  TRY_AGAIN: 'Something went wrong. Please try again.',
  NOT_IMPLEMENTED: 'This feature is not available yet.',
  
  // Success Messages
  SUCCESS: {
    PARKING_STARTED: 'Parking started successfully!',
    PARKING_STOPPED: 'Parking stopped successfully.',
    PAYMENT_SUCCESSFUL: 'Payment successful!',
    CAR_SAVED: 'Car saved successfully.',
    SESSION_SAVED: 'Parking session saved.',
    PROFILE_UPDATED: 'Profile updated successfully.',
  },
  
  // Warning Messages
  WARNING: {
    PAYMENT_CANCELLED: 'Payment cancelled.',
    PARKING_CANCELLED: 'Parking cancelled.',
    LOCATION_ACCURACY: 'Location accuracy is low. Parking may not be accurate.',
    SESSION_NOT_SAVED: 'Parking session was not saved.',
  },
  
  // Info Messages
  INFO: {
    PROCESSING_PAYMENT: 'Processing payment...',
    SAVING_SESSION: 'Saving parking session...',
    LOADING_LOCATION: 'Finding your location...',
    UPLOADING_DATA: 'Uploading data...',
  },
};

export const PARKING_STATUS = {
  ACTIVE: 'active',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
  PENDING: 'pending',
  EXPIRED: 'expired',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  PROCESSING: 'processing',
  TIMEOUT: 'timeout',
};

export const STORAGE_KEYS = {
  PARKING_SESSIONS: '@kenpark_parking_sessions',
  ACTIVE_CAR: '@kenpark_active_car',
  USER_SETTINGS: '@kenpark_user_settings',
  PAYMENT_HISTORY: '@kenpark_payment_history',
  APP_STATE: '@kenpark_app_state',
  LAST_LOCATION: '@kenpark_last_location',
  SESSION_CACHE: '@kenpark_session_cache',
};

export const DATE_FORMATS = {
  DISPLAY_DATE: 'DD MMM YYYY',
  DISPLAY_TIME: 'hh:mm A',
  DISPLAY_DATETIME: 'DD MMM YYYY, hh:mm A',
  API_DATE: 'YYYY-MM-DD',
  API_DATETIME: 'YYYY-MM-DD HH:mm:ss',
  TIMESTAMP: 'x', // milliseconds
};

export default CONFIG;