import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import i18n from '../i18n';

export const REMINDER_CHANNEL_ID = 'cuddly-reminders';

/**
 * How the app displays a notification while it's in the foreground — the
 * 3 reminders are things the user asked for themselves, so always show them.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      // A running timer's notification (#101) only belongs in the shade —
      // the app already shows it in the "a decorrer" bar.
      const isRunningTimer = notification.request.identifier.startsWith('active-session-');
      return {
        shouldShowBanner: !isRunningTimer,
        shouldShowList: true,
        shouldPlaySound: !isRunningTimer,
        shouldSetBadge: false,
      };
    },
  });
}

/** Android needs a channel to exist before any notification can use it. */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: i18n.t('reminders.channel'),
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
