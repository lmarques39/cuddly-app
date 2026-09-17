import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { DEFAULT_NOTIFICATION_PREFERENCES, NotificationPreferences } from '../../types/records';
import { BREASTFEEDING_REMINDER_ID, DAILY_SUMMARY_REMINDER_ID, useNotificationPreferences } from './useNotificationPreferences';

const mockGetPermissions = Notifications.getPermissionsAsync as jest.Mock;
const mockSchedule = Notifications.scheduleNotificationAsync as jest.Mock;
const mockCancel = Notifications.cancelScheduledNotificationAsync as jest.Mock;

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  mockGetPermissions.mockResolvedValue({ granted: true });
});

it('starts with the defaults when nothing is stored yet', async () => {
  const { result } = await renderHook(() => useNotificationPreferences());
  await waitFor(() => expect(result.current.loaded).toBe(true));

  expect(result.current.preferences).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
});

it('schedules a repeating breastfeeding reminder when enabled, using the chosen interval', async () => {
  const { result } = await renderHook(() => useNotificationPreferences());
  await waitFor(() => expect(result.current.loaded).toBe(true));

  const next: NotificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    breastfeeding: { enabled: true, intervalHours: 4 },
  };
  await act(async () => result.current.save(next));

  expect(mockSchedule).toHaveBeenCalledWith(
    expect.objectContaining({
      identifier: BREASTFEEDING_REMINDER_ID,
      trigger: expect.objectContaining({ seconds: 4 * 3600, repeats: true }),
    }),
  );
});

it('cancels the breastfeeding reminder when turned off', async () => {
  const { result } = await renderHook(() => useNotificationPreferences());
  await waitFor(() => expect(result.current.loaded).toBe(true));

  await act(async () =>
    result.current.save({ ...DEFAULT_NOTIFICATION_PREFERENCES, breastfeeding: { enabled: false, intervalHours: 3 } }),
  );

  expect(mockCancel).toHaveBeenCalledWith(BREASTFEEDING_REMINDER_ID);
});

it('schedules the daily summary at the chosen hour', async () => {
  const { result } = await renderHook(() => useNotificationPreferences());
  await waitFor(() => expect(result.current.loaded).toBe(true));

  await act(async () =>
    result.current.save({ ...DEFAULT_NOTIFICATION_PREFERENCES, dailySummary: { enabled: true, hour: 21 } }),
  );

  expect(mockSchedule).toHaveBeenCalledWith(
    expect.objectContaining({ identifier: DAILY_SUMMARY_REMINDER_ID, trigger: expect.objectContaining({ hour: 21 }) }),
  );
});

it('does not schedule anything when permission is denied, but still saves the preference', async () => {
  mockGetPermissions.mockResolvedValue({ granted: false });
  const mockRequest = Notifications.requestPermissionsAsync as jest.Mock;
  mockRequest.mockResolvedValue({ granted: false });

  const { result } = await renderHook(() => useNotificationPreferences());
  await waitFor(() => expect(result.current.loaded).toBe(true));

  const next: NotificationPreferences = { ...DEFAULT_NOTIFICATION_PREFERENCES, breastfeeding: { enabled: true, intervalHours: 3 } };
  await act(async () => result.current.save(next));

  expect(mockSchedule).not.toHaveBeenCalled();
  expect(result.current.preferences).toEqual(next);
});
