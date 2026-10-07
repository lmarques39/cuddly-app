import { ActiveSessionKind } from '../../types/records';

/**
 * Web: no running-timer notifications (#101 is Android-only), and
 * expo-notifications' useLastNotificationResponse throws there — calling it
 * blanked the whole app after login (#113). Same signature as the native hook.
 */
export function useSessionNotificationTaps(_onOpen: (kind: ActiveSessionKind) => void): void {}
