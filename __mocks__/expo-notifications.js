// Manual mock — expo-notifications is a native module with no jest-expo
// mock built in, unlike Firebase which we mock separately in __mocks__/firebase/.
module.exports = {
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve(null)),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('mock-notification-id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  AndroidImportance: { MIN: 1, LOW: 2, DEFAULT: 3, HIGH: 4, MAX: 5 },
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval', DATE: 'date', CALENDAR: 'calendar' },
};
