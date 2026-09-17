import { useCallback, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { ensureNotificationPermission } from '../../notifications/setup';
import { loadObject, saveObject, STORAGE_KEYS } from '../../storage/storage';
import { DEFAULT_NOTIFICATION_PREFERENCES, NotificationPreferences } from '../../types/records';

export const BREASTFEEDING_REMINDER_ID = 'breastfeeding-reminder';
export const DAILY_SUMMARY_REMINDER_ID = 'daily-summary-reminder';

/**
 * Loads/saves NotificationPreferences and owns the two reminders that are
 * fully self-contained (breastfeeding interval, daily summary time) — both
 * can be scheduled from the preference alone. The appointment reminder is
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
      await Notifications.scheduleNotificationAsync({
        identifier: BREASTFEEDING_REMINDER_ID,
        content: {
          title: 'Hora de amamentar',
          body: `Já passaram ${next.breastfeeding.intervalHours}h desde o último registo.`,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: next.breastfeeding.intervalHours * 3600,
          repeats: true,
        },
      });
    } else {
      await Notifications.cancelScheduledNotificationAsync(BREASTFEEDING_REMINDER_ID);
    }

    if (next.dailySummary.enabled) {
      await Notifications.scheduleNotificationAsync({
        identifier: DAILY_SUMMARY_REMINDER_ID,
        content: { title: 'Resumo diário', body: 'Vê o resumo de hoje na Cuddly.' },
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
