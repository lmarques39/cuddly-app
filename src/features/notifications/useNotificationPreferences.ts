import i18n from '../../i18n';
import { useCallback, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { ensureNotificationPermission } from '../../notifications/setup';
import { loadList, loadObject, saveObject, STORAGE_KEYS } from '../../storage/storage';
import { ActiveSession, BreastfeedingEntry, DEFAULT_NOTIFICATION_PREFERENCES, NotificationPreferences } from '../../types/records';
import { BREASTFEEDING_REMINDER_ID, cancelBreastfeedingReminder, scheduleBreastfeedingReminder } from './reminderScheduling';

export { BREASTFEEDING_REMINDER_ID };
export const DAILY_SUMMARY_REMINDER_ID = 'daily-summary-reminder';

/**
 * Loads/saves NotificationPreferences and (re)schedules the breastfeeding
 * and daily-summary reminders when they're switched on or off. After that,
 * the breastfeeding one follows the feeds themselves (reminderScheduling.ts). The appointment reminder is
 * only persisted here: actually scheduling it needs a real appointment date,
 * which lives in useAppointments' own integration (#65), not here.
 */
export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadObject<NotificationPreferences>(STORAGE_KEYS.notificationPreferences).then((stored) => {
      setPreferences(stored ?? DEFAULT_NOTIFICATION_PREFERENCES);
      setLoaded(true);
    });
  }, []);

  const save = useCallback(async (next: NotificationPreferences) => {
    setPreferences(next);
    await saveObject(STORAGE_KEYS.notificationPreferences, next);

    const anyEnabled = next.breastfeeding.enabled || next.appointment.enabled || next.dailySummary.enabled;
    if (anyEnabled && !(await ensureNotificationPermission())) {
      return; // permission denied — leave preferences saved, but nothing gets scheduled
    }

    if (next.breastfeeding.enabled) {
      // Counts from the last feed's start (#123), not from the moment the
      // switch was flipped — and waits if a feed is running right now.
      const [feeds, sessions] = await Promise.all([
        loadList<BreastfeedingEntry>(STORAGE_KEYS.breastfeeding),
        loadList<ActiveSession>(STORAGE_KEYS.activeSessions),
      ]);
      if (sessions.some((s) => s.kind === 'breastfeeding')) {
        await cancelBreastfeedingReminder();
      } else {
        const lastStart = feeds.reduce((latest, f) => Math.max(latest, f.startedAt), 0);
        await scheduleBreastfeedingReminder(next.breastfeeding.intervalHours, lastStart || Date.now());
      }
    } else {
      await cancelBreastfeedingReminder();
    }

    if (next.dailySummary.enabled) {
      await Notifications.scheduleNotificationAsync({
        identifier: DAILY_SUMMARY_REMINDER_ID,
        content: { title: i18n.t('reminders.dailyTitle'), body: i18n.t('reminders.dailyBody') },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: next.dailySummary.hour,
          minute: 0,
          repeats: true,
        },
      });
    } else {
      await Notifications.cancelScheduledNotificationAsync(DAILY_SUMMARY_REMINDER_ID);
    }
  }, []);

  return { preferences, loaded, save };
}
