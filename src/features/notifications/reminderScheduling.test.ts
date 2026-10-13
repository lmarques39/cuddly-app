import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../storage/storage';
import { Appointment, DEFAULT_NOTIFICATION_PREFERENCES } from '../../types/records';
import {
  appointmentReminderId,
  BREASTFEEDING_REMINDER_ID,
  cancelAppointmentReminder,
  restartBreastfeedingReminder,
  scheduleAppointmentReminder,
  scheduleBreastfeedingReminder,
} from './reminderScheduling';

const mockSchedule = Notifications.scheduleNotificationAsync as jest.Mock;
const mockCancel = Notifications.cancelScheduledNotificationAsync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('scheduleBreastfeedingReminder', () => {
  it('counts the interval from when the last feed started, not from now (#123)', async () => {
    const startedAt = Date.now() - 30 * 60 * 1000; // feed began 30 min ago

    await scheduleBreastfeedingReminder(3, startedAt);

    expect(mockCancel).toHaveBeenCalledWith(BREASTFEEDING_REMINDER_ID);
    const { trigger } = mockSchedule.mock.calls[0][0];
    expect(trigger.repeats).toBe(false);
    expect(trigger.seconds).toBeGreaterThanOrEqual(2.5 * 3600 - 2);
    expect(trigger.seconds).toBeLessThanOrEqual(2.5 * 3600);
  });

  it('never schedules it in the past — a feed logged late fires a minute from now', async () => {
    await scheduleBreastfeedingReminder(3, Date.now() - 5 * 3600 * 1000);

    expect(mockSchedule.mock.calls[0][0].trigger.seconds).toBe(60);
  });
});

describe('restartBreastfeedingReminder', () => {
  afterEach(() => AsyncStorage.clear());

  it('does nothing while the reminder is switched off', async () => {
    await restartBreastfeedingReminder(Date.now());
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('uses the saved interval when it is on', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.notificationPreferences,
      JSON.stringify({ ...DEFAULT_NOTIFICATION_PREFERENCES, breastfeeding: { enabled: true, intervalHours: 2 } }),
    );

    await restartBreastfeedingReminder(Date.now());

    expect(mockSchedule.mock.calls[0][0].trigger.seconds).toBeGreaterThan(2 * 3600 - 5);
  });
});

describe('scheduleAppointmentReminder', () => {
  const appointment: Appointment = { id: 'apt1', title: 'Ecografia', scheduledAt: Date.now() + 5 * 24 * 60 * 60 * 1000 };

  it('schedules a reminder for daysBefore the appointment, with its own identifier', async () => {
    await scheduleAppointmentReminder(appointment, 1);

    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: appointmentReminderId('apt1'),
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: appointment.scheduledAt - 24 * 60 * 60 * 1000 },
      }),
    );
  });

  it('does nothing when the reminder date would already be in the past', async () => {
    const soonAppointment: Appointment = { id: 'apt2', title: 'Consulta', scheduledAt: Date.now() + 60_000 };

    await scheduleAppointmentReminder(soonAppointment, 5); // 5 days before something an hour away

    expect(mockSchedule).not.toHaveBeenCalled();
  });
});

describe('cancelAppointmentReminder', () => {
  it('cancels the reminder scheduled under that appointment id', async () => {
    await cancelAppointmentReminder('apt1');

    expect(mockCancel).toHaveBeenCalledWith(appointmentReminderId('apt1'));
  });
});
