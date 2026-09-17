import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ensureAndroidChannel, ensureNotificationPermission } from './setup';

const mockGetPermissions = Notifications.getPermissionsAsync as jest.Mock;
const mockRequestPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const mockSetChannel = Notifications.setNotificationChannelAsync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ensureNotificationPermission', () => {
  it('does not re-request permission when already granted', async () => {
    mockGetPermissions.mockResolvedValue({ granted: true });

    const result = await ensureNotificationPermission();

    expect(result).toBe(true);
    expect(mockRequestPermissions).not.toHaveBeenCalled();
  });

  it('requests permission when not yet granted, and returns the outcome', async () => {
    mockGetPermissions.mockResolvedValue({ granted: false });
    mockRequestPermissions.mockResolvedValue({ granted: true });

    const result = await ensureNotificationPermission();

    expect(result).toBe(true);
    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
  });

  it('returns false when the user denies the request', async () => {
    mockGetPermissions.mockResolvedValue({ granted: false });
    mockRequestPermissions.mockResolvedValue({ granted: false });

    expect(await ensureNotificationPermission()).toBe(false);
  });
});

describe('ensureAndroidChannel', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalOS });
  });

  it('creates the reminders channel on Android', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'android' });

    await ensureAndroidChannel();

    expect(mockSetChannel).toHaveBeenCalledWith('cuddly-reminders', expect.any(Object));
  });

  it('does nothing on iOS — there is no channel concept there', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios' });

    await ensureAndroidChannel();

    expect(mockSetChannel).not.toHaveBeenCalled();
  });
});
