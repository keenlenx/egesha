import { CONFIG } from '../constants/config';

/**
 * Format phone number to 254 format
 */
export const formatPhoneNumber = (phone: string): string | null => {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Remove all non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '');

  // Validate length
  if (cleanPhone.length < CONFIG.PHONE.MIN_LENGTH || cleanPhone.length > CONFIG.PHONE.MAX_LENGTH) {
    return null;
  }

  // Handle different formats
  if (cleanPhone.length === 9) {
    // 712345678 -> 254712345678
    if (CONFIG.PHONE.VALID_PREFIXES.includes(cleanPhone.charAt(0))) {
      return `${CONFIG.PHONE.COUNTRY_CODE}${cleanPhone}`;
    }
  } else if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) {
    // 0712345678 -> 254712345678
    const withoutZero = cleanPhone.substring(1);
    if (CONFIG.PHONE.VALID_PREFIXES.includes(withoutZero.charAt(0))) {
      return `${CONFIG.PHONE.COUNTRY_CODE}${withoutZero}`;
    }
  } else if (cleanPhone.length === 12 && cleanPhone.startsWith(CONFIG.PHONE.COUNTRY_CODE)) {
    // Already in 254 format
    const withoutCountryCode = cleanPhone.substring(3);
    if (CONFIG.PHONE.VALID_PREFIXES.includes(withoutCountryCode.charAt(0))) {
      return cleanPhone;
    }
  }

  return null;
};

/**
 * Format phone number for display
 */
export const formatPhoneForDisplay = (phone: string): string => {
  const formatted = formatPhoneNumber(phone);
  if (!formatted) return phone;

  // Format as +254 712 345 678
  const prefix = formatted.substring(0, 3); // 254
  const part1 = formatted.substring(3, 6); // 712
  const part2 = formatted.substring(6, 9); // 345
  const part3 = formatted.substring(9);    // 678

  return `+${prefix} ${part1} ${part2} ${part3}`.trim();
};

/**
 * Validate phone number without formatting
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  return formatPhoneNumber(phone) !== null;
};

/**
 * Extract last 9 digits (network number)
 */
export const getNetworkNumber = (phone: string): string | null => {
  const formatted = formatPhoneNumber(phone);
  if (!formatted) return null;
  
  return formatted.substring(3); // Remove 254 prefix
};

/**
 * Sanitize phone number input
 */
export const sanitizePhoneInput = (input: string): string => {
  // Remove all non-numeric characters except plus sign at the beginning
  return input.replace(/[^\d+]/g, '');
};

/**
 * Mask phone number for display (e.g., 2547*****89)
 */
export const maskPhoneNumber = (phone: string): string => {
  const formatted = formatPhoneNumber(phone);
  if (!formatted || formatted.length < 7) return phone;

  const visibleDigits = 4; // Show last 4 digits
  const maskedPart = '*'.repeat(formatted.length - visibleDigits);
  const visiblePart = formatted.substring(formatted.length - visibleDigits);
  
  return `+${formatted.substring(0, 3)} ${maskedPart}${visiblePart}`;
};