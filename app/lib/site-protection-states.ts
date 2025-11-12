/**
 * Site Protection State Management
 *
 * Defines the different view states for progressive site protection
 * based on user authentication status and countdown expiration.
 */

export type ProtectionViewState =
  | 'locked'           // Initial state: no access granted
  | 'password-granted' // Password entered, but countdown still active
  | 'countdown-expired'// Countdown passed, but password not entered
  | 'fully-unlocked';  // All conditions met (should redirect)

export interface ProtectionContext {
  type: 'site' | 'collection' | 'product';
  collectionHandle?: string;
  collectionName?: string;
  productHandle?: string;
  productName?: string;
}

export interface ProtectionState {
  viewState: ProtectionViewState;
  hasPasswordAuth: boolean;
  isCountdownExpired: boolean;
  canEnterPassword: boolean;
  canShowCountdown: boolean;
  shouldShowWaitingMessage: boolean;
  accessGranted: boolean;
}

export interface ProtectionConfig {
  _id?: string;
  name?: string;
  enabled?: boolean;
  accessMode?: 'password' | 'countdown' | 'both' | 'either';
  password?: string;
  countdown?: string;
  title?: any[];
  message?: any[];
  countdownLabel?: any[];
  passwordLabel?: any[];
  redirectPage?: {
    _ref?: string;
    _type?: string;
  };

  // New fields for multiple view states
  passwordGrantedTitle?: any[];
  passwordGrantedMessage?: any[];
  countdownExpiredTitle?: any[];
  countdownExpiredMessage?: any[];

  // Media and styling
  mediaType?: 'image' | 'video';
  backgroundImage?: any;
  backgroundVideo?: any;
  overlayOpacity?: number;
  colorScheme?: any;
}

/**
 * Determines the current protection state based on access mode,
 * authentication status, and countdown expiration.
 */
export function determineProtectionState(
  protection: ProtectionConfig,
  hasPasswordAuth: boolean,
  isCountdownExpired: boolean
): ProtectionState {
  const { accessMode } = protection;

  // Helper flags
  const passwordRequired = ['password', 'both', 'either'].includes(accessMode || '');
  const countdownRequired = ['countdown', 'both', 'either'].includes(accessMode || '');

  // Determine if user has full access
  let accessGranted = false;
  switch (accessMode) {
    case 'password':
      accessGranted = hasPasswordAuth;
      break;
    case 'countdown':
      accessGranted = isCountdownExpired;
      break;
    case 'both':
      accessGranted = hasPasswordAuth && isCountdownExpired;
      break;
    case 'either':
      accessGranted = hasPasswordAuth || isCountdownExpired;
      break;
  }

  // If fully unlocked, return that state
  if (accessGranted) {
    return {
      viewState: 'fully-unlocked',
      hasPasswordAuth,
      isCountdownExpired,
      canEnterPassword: false,
      canShowCountdown: false,
      shouldShowWaitingMessage: false,
      accessGranted: true
    };
  }

  // Determine view state for partial access scenarios
  let viewState: ProtectionViewState = 'locked';

  if (accessMode === 'both') {
    // For 'both' mode: need BOTH password AND countdown
    if (hasPasswordAuth && !isCountdownExpired) {
      viewState = 'password-granted'; // Has password, waiting for countdown
    } else if (!hasPasswordAuth && isCountdownExpired) {
      viewState = 'countdown-expired'; // Countdown done, needs password
    } else {
      viewState = 'locked'; // Neither condition met
    }
  } else if (accessMode === 'either') {
    // For 'either' mode: need password OR countdown (but not both)
    // Since we already checked accessGranted above, we're in a partial state
    if (hasPasswordAuth && countdownRequired) {
      viewState = 'password-granted'; // Has password, could still wait for countdown
    } else if (isCountdownExpired && passwordRequired) {
      viewState = 'countdown-expired'; // Countdown done, could still enter password
    } else {
      viewState = 'locked'; // Initial state
    }
  } else {
    // For single-mode protection ('password' or 'countdown' only)
    viewState = 'locked';
  }

  return {
    viewState,
    hasPasswordAuth,
    isCountdownExpired,
    canEnterPassword: passwordRequired && !hasPasswordAuth,
    canShowCountdown: countdownRequired && !isCountdownExpired,
    shouldShowWaitingMessage: viewState === 'password-granted' || viewState === 'countdown-expired',
    accessGranted: false
  };
}

/**
 * Gets the appropriate title for the current view state
 */
export function getStateTitle(
  protection: ProtectionConfig,
  viewState: ProtectionViewState
): string {
  const defaultTitle = getLocalizedValue(protection.title) || 'Coming Soon';

  switch (viewState) {
    case 'password-granted':
      return getLocalizedValue(protection.passwordGrantedTitle) || 'Access Granted';
    case 'countdown-expired':
      return getLocalizedValue(protection.countdownExpiredTitle) || 'Now Available';
    case 'locked':
    case 'fully-unlocked':
    default:
      return defaultTitle;
  }
}

/**
 * Gets the appropriate message for the current view state
 */
export function getStateMessage(
  protection: ProtectionConfig,
  viewState: ProtectionViewState
): string | undefined {
  const defaultMessage = getLocalizedValue(protection.message);

  switch (viewState) {
    case 'password-granted':
      return getLocalizedValue(protection.passwordGrantedMessage) || 'Please wait for the countdown to complete.';
    case 'countdown-expired':
      return getLocalizedValue(protection.countdownExpiredMessage) || 'Enter your password to access the content.';
    case 'locked':
    case 'fully-unlocked':
    default:
      return defaultMessage;
  }
}

/**
 * Helper to extract localized values from internationalized fields
 */
function getLocalizedValue(field: any[] | string | undefined): string | undefined {
  if (!field) return undefined;
  if (typeof field === 'string') return field;
  if (Array.isArray(field) && field.length > 0) {
    return (field[0] as any)?.value;
  }
  return undefined;
}