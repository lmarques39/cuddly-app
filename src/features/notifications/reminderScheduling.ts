import i18n from '../../i18n';
import { appointmentDisplayTitle } from '../appointments/appointmentTypes';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';
import { loadObject, STORAGE_KEYS } from '../../storage/storage';
import { Appointment, NotificationPreferences } from '../../types/records';

export const BREASTFEEDING_REMINDER_ID = 'breastfeeding-reminder';

/**
 * "Já passaram 3 h desde a última mamada" — a one-shot countdown from when
 * the last feed *started* (#123: that's how feeds are spaced, and the time
 * everything else in the app shows). Fires at least a minute from now, so a
 * feed logged late still gets its reminder instead of an instant one.
 */
export async function scheduleBreastfeedingReminder(intervalHours: number, lastFeedStartedAt: number): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(BREASTFEEDING_REMINDER_ID);
  const dueAt = lastFeedStartedAt + intervalHours * 3600 * 1000;
  await Notifications.scheduleNotificationAsync({
    identifier: BREASTFEEDING_REMINDER_ID,
    content: {
      title: i18n.t('reminders.breastfeedingTitle'),
      body: i18n.t('reminders.breastfeedingBody', { hours: intervalHours }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(60, Math.round((dueAt - Date.now()) / 1000)),
      repeats: false,
    },
  });
}

/** A feed is under way (on this phone or the other caregiver's) — no "time to feed" reminder until it's over (#123). */
export async function cancelBreastfeedingReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(BREASTFEEDING_REMINDER_ID);
}

/**
 * A feed has just been finished or logged: restarts the countdown from its
 * start, if the reminder is turned on. Reads the preference itself because
 * it's also called with no React tree around (the notification's
 * "Terminar", #101) and from ActiveSessionsProvider.
 */
export async function restartBreastfeedingReminder(feedStartedAt: number): Promise<void> {
  const preferences = await loadObject<NotificationPreferences>(STORAGE_KEYS.notificationPreferences);
  if (!preferences?.breastfeeding.enabled) return;
  await scheduleBreastfeedingReminder(preferences.breastfeeding.intervalHours, feedStartedAt);
}

/**
 * Takes an already-delivered "time to feed" reminder out of the
 * notification shade once the app is open — whoever opens it has seen it
 * (#123). The running-timer notifications (#101) stay.
 */
export function dismissDeliveredRemindersWhenOpened(): () => void {
  if (Platform.OS === 'web') return () => {};
  const dismiss = () => Notifications.dismissNotificationAsync(BREASTFEEDING_REMINDER_ID).catch(() => {});
  dismiss();
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') dismiss();
  });
  return () => subscription.remove();
}

export function appointmentReminderId(appointmentId: string): string {
  return `appointment-reminder-${appointmentId}`;
}

/**
 * Called from AppointmentsScreen right after a new consulta is saved.
 * Silently does nothing if the reminder date would already be in the past
 * (e.g. daysBefore is longer than the time left until the appointment).
 */
export async function scheduleAppointmentReminder(appointment: Appointment, daysBefore: number): Promise<void> {
  const triggerAt = appointment.scheduledAt - daysBefore * 24 * 60 * 60 * 1000;
  if (triggerAt <= Date.now()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: appointmentReminderId(appointment.id),
    content: {
      title: i18n.t('reminders.appointmentTitle'),
      body: i18n.t('reminders.appointmentBody', { title: appointmentDisplayTitle(appointment), count: daysBefore }),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerAt },
  });
}

/**
 * Called when a consulta is edited or removed — without this, an old
 * reminder would keep pointing at the previous date/time (or fire for an
 * appointment that no longer exists).
 */
export async function cancelAppointmentReminder(appointmentId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(appointmentReminderId(appointmentId));
}
