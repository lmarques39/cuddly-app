import * as Notifications from 'expo-notifications';
import { Appointment } from '../../types/records';
import { BREASTFEEDING_REMINDER_ID } from './useNotificationPreferences';

/**
 * Called from BreastfeedingScreen right after a feed is logged — replaces
 * the baseline repeating reminder (set once in useNotificationPreferences)
 * with a fresh one-shot countdown from *now*, so the reminder always
 * reflects the real last feed time instead of an arbitrary fixed schedule.
 */
export async function rescheduleBreastfeedingReminder(intervalHours: number): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(BREASTFEEDING_REMINDER_ID);
  await Notifications.scheduleNotificationAsync({
    identifier: BREASTFEEDING_REMINDER_ID,
    content: {
      title: 'Hora de amamentar',
      body: `Já passaram ${intervalHours}h desde o último registo.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: intervalHours * 3600,
      repeats: false,
    },
  });
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
      title: 'Lembrete de consulta',
      body: `${appointment.title} — daqui a ${daysBefore} dia${daysBefore === 1 ? '' : 's'}.`,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerAt },
  });
}
