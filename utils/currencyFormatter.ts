import { CONFIG } from '../constants/config';

/**
 * Format amount to Kenyan Shillings
 */
export const formatCurrency = (amount: number): string => {
  if (isNaN(amount)) return 'KSH 0';
  
  return `KSH ${amount.toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format amount with tax included
 */
export const formatAmountWithTax = (baseAmount: number): string => {
  const tax = baseAmount * CONFIG.PARKING.TAX_RATE;
  const total = Math.ceil(baseAmount + tax);
  return formatCurrency(total);
};

/**
 * Calculate tax amount
 */
export const calculateTax = (amount: number): number => {
  return amount * CONFIG.PARKING.TAX_RATE;
};

/**
 * Calculate total with tax
 */
export const calculateTotalWithTax = (baseAmount: number): number => {
  const tax = calculateTax(baseAmount);
  return Math.ceil(baseAmount + tax);
};

/**
 * Format amount per hour
 */
export const formatHourlyRate = (): string => {
  return `KSH ${CONFIG.PARKING.HOURLY_RATE}/hr`;
};

/**
 * Format amount per minute
 */
export const formatMinuteRate = (): string => {
  const perMinute = Math.round(CONFIG.PARKING.HOURLY_RATE / 60 * 100) / 100;
  return `~KSH ${perMinute}/min`;
};