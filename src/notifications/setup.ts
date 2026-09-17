import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const REMINDER_CHANNEL_ID = 'cuddly-reminders';

/**
 * How the app displays a notification while it's in the foreground — all 3
 * reminders here are things the user asked for themselves, so always show
 * them, no silent/badge-only handling needed.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Android needs a channel to exist before any notification can use it. */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Lembretes',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/**
 * Asks for notification permission if not already decided. Only local
 * notifications are used in this app (see #14's "why local, not push"
 * decision) — Android grants these by default, this mainly matters on iOS.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Call once at app startup. */
export async function initNotifications(): Promise<void> {
  configureNotificationHandler();
  await ensureAndroidChannel();
}
