import { Dimensions, Platform, StyleSheet } from 'react-native';
import { CONFIG } from './config';

const { width, height } = Dimensions.get('window');

export const globalStyles = StyleSheet.create({
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: CONFIG.UI.COLORS.BACKGROUND,
  },

  // Map Styles
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapFallbackText: {
    fontSize: 16,
    color: CONFIG.UI.COLORS.TEXT,
    textAlign: 'center',
    marginBottom: 10,
  },
  mapFallbackNote: {
    fontSize: 14,
    color: CONFIG.UI.COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CONFIG.UI.COLORS.SURFACE,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: CONFIG.UI.COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: CONFIG.UI.COLORS.ERROR,
    fontWeight: '500',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: CONFIG.UI.COLORS.PRIMARY,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },

  // Marker Styles
  markerContainer: {
    alignItems: 'center',
  },
  markerPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CONFIG.UI.COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    ...CONFIG.UI.SHADOW,
  },
  markerPinActive: {
    backgroundColor: CONFIG.UI.COLORS.SECONDARY,
  },
  markerPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: CONFIG.UI.COLORS.SECONDARY,
    marginTop: 4,
    opacity: 0.7,
  },

  // Status Card
  statusCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: CONFIG.UI.BORDER_RADIUS,
    padding: CONFIG.UI.SPACING,
    ...CONFIG.UI.SHADOW,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: CONFIG.UI.COLORS.SUCCESS,
  },
  statusInactive: {
    backgroundColor: CONFIG.UI.COLORS.TEXT_TERTIARY,
  },
  statusPulse: {
    animationKeyframes: {
      '0%': { opacity: 1, transform: [{ scale: 1 }] },
      '50%': { opacity: 0.5, transform: [{ scale: 1.2 }] },
      '100%': { opacity: 1, transform: [{ scale: 1 }] },
    },
    animationDuration: '2000ms',
    animationIterationCount: 'infinite',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: CONFIG.UI.COLORS.TEXT,
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CONFIG.UI.COLORS.SECONDARY,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: CONFIG.UI.COLORS.SECONDARY,
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: CONFIG.UI.COLORS.SECONDARY,
    letterSpacing: 0.5,
  },

  // Timer Container
  timerContainer: {
    marginBottom: 12,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timerItem: {
    alignItems: 'center',
    flex: 1,
  },
  timerLabel: {
    fontSize: 12,
    color: CONFIG.UI.COLORS.TEXT_SECONDARY,
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '500',
  },
  timerValue: {
    fontSize: 20,
    fontWeight: '800',
    color: CONFIG.UI.COLORS.TEXT,
    letterSpacing: 1,
  },
  costValue: {
    fontSize: 20,
    fontWeight: '800',
    color: CONFIG.UI.COLORS.PRIMARY,
    letterSpacing: 1,
  },
  rateInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  rateText: {
    fontSize: 12,
    color: CONFIG.UI.COLORS.TEXT_TERTIARY,
    fontStyle: 'italic',
  },

  // Bottom Container
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...CONFIG.UI.SHADOW,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  sliderCard: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  sliderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CONFIG.UI.COLORS.TEXT,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  thumbIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    ...CONFIG.UI.SHADOW,
  },
  sliderHint: {
    marginTop: 16,
    fontSize: 14,
    color: CONFIG.UI.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  modalContent: {
    margin: 20,
    borderRadius: CONFIG.UI.BORDER_RADIUS,
    padding: CONFIG.UI.SPACING,
    borderWidth: 1,
    minWidth: width * 0.8,
    maxWidth: width * 0.9,
    ...CONFIG.UI.SHADOW,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  modalProgressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Payment Modal Styles (to be used with paymentStyles)
  paymentModalContent: {
    flex: 1,
  },
  paymentModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: CONFIG.UI.COLORS.TEXT,
    marginBottom: 4,
  },
  paymentModalSubtitle: {
    fontSize: 14,
    color: CONFIG.UI.COLORS.TEXT_SECONDARY,
    marginBottom: 24,
  },
  summarySectionPayment: {
    backgroundColor: CONFIG.UI.COLORS.SURFACE,
    borderRadius: CONFIG.UI.BORDER_RADIUS,
    padding: CONFIG.UI.SPACING,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: CONFIG.UI.COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: CONFIG.UI.COLORS.TEXT,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: CONFIG.UI.COLORS.BORDER,
    marginVertical: 4,
  },
  summaryLabelTotal: {
    fontSize: 16,
    color: CONFIG.UI.COLORS.TEXT,
    fontWeight: '700',
  },
  summaryValueTotal: {
    fontSize: 20,
    color: CONFIG.UI.COLORS.PRIMARY,
    fontWeight: '700',
  },
  paymentProcessingContainer: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 24,
  },
  processingText: {
    fontSize: 16,
    color: CONFIG.UI.COLORS.TEXT,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
    fontWeight: '600',
  },
  processingHint: {
    fontSize: 14,
    color: CONFIG.UI.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  transactionInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
  },
  transactionId: {
    fontSize: 12,
    color: '#3B82F6',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginLeft: 8,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: CONFIG.UI.COLORS.TEXT,
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CONFIG.UI.COLORS.BORDER,
    borderRadius: CONFIG.UI.BORDER_RADIUS,
    backgroundColor: CONFIG.UI.COLORS.SURFACE,
    overflow: 'hidden',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: CONFIG.UI.COLORS.TEXT,
    marginRight: 4,
    paddingHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: CONFIG.UI.COLORS.TEXT,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  inputHint: {
    fontSize: 12,
    color: CONFIG.UI.COLORS.TEXT_TERTIARY,
    marginTop: 6,
    marginLeft: 4,
  },
  paymentButtonContainer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  paymentInfo: {
    fontSize: 12,
    color: CONFIG.UI.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  buttonGroup: {
    width: '100%',
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: CONFIG.UI.COLORS.PRIMARY,
    borderRadius: CONFIG.UI.BORDER_RADIUS,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...CONFIG.UI.SHADOW,
  },
  payButtonDisabled: {
    backgroundColor: CONFIG.UI.COLORS.TEXT_TERTIARY,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginLeft: 8,
  },
  cancelButton: {
    fontSize: 16,
    fontWeight: '600',
    color: CONFIG.UI.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    paddingVertical: 12,
  },
});