import { CONFIG } from '../constants/config';

/**
 * Validate email address
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate name (first name or last name)
 */
export const isValidName = (name: string): boolean => {
  if (!name || name.trim().length < 2) return false;
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  return nameRegex.test(name);
};

/**
 * Validate amount
 */
export const isValidAmount = (amount: number): boolean => {
  return !isNaN(amount) && amount >= CONFIG.PARKING.MINIMUM_COST;
};

/**
 * Validate location coordinates
 */
export const isValidLocation = (latitude: number, longitude: number): boolean => {
  return (
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

/**
 * Validate receipt number format
 */
export const isValidReceiptNumber = (receipt: string): boolean => {
  if (!receipt || receipt.length < 5) return false;
  // M-Pesa receipt numbers are typically alphanumeric
  const receiptRegex = /^[A-Z0-9]+$/;
  return receiptRegex.test(receipt);
};