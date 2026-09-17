import * as Notifications from 'expo-notifications';
import { Appointment } from '../../types/records';
import { appointmentReminderId, rescheduleBreastfeedingReminder, scheduleAppointmentReminder } from './reminderScheduling';
import { BREASTFEEDING_REMINDER_ID } from './useNotificationPreferences';

const mockSchedule = Notifications.scheduleNotificationAsync as jest.Mock;
const mockCancel = Notifications.cancelScheduledNotificationAsync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('rescheduleBreastfeedingReminder', () => {
  it('cancels the previous one and schedules a fresh one-shot countdown', async () => {
    await rescheduleBreastfeedingReminder(4);

    expect(mockCancel).toHaveBeenCalledWith(BREASTFEEDING_REMINDER_ID);
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: BREASTFEEDING_REMINDER_ID,
        trigger: expect.objectContaining({ seconds: 4 * 3600, repeats: false }),
      }),
    );
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
