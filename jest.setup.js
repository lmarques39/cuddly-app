jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// firebase's real SDK is ESM and would hit the network — the __mocks__/firebase/
// folder replaces app/auth/firestore automatically for every test (Jest's
// manual-mock convention for node_modules packages, no jest.mock() call
// needed). These env vars just satisfy services/firebase.ts's own guard
// that throws if the Firebase config looks unset.
process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com';
process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'test-sender';
process.env.EXPO_PUBLIC_FIREBASE_APP_ID = 'test-app-id';

// The suite's assertions are written against the Portuguese UI (#118): pin the
// "device" to Portuguese so i18n starts in pt. English is covered by its own
// tests, which switch with i18n.changeLanguage('en').
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'pt', languageTag: 'pt-PT', textDirection: 'ltr' }],
  useLocales: () => [{ languageCode: 'pt', languageTag: 'pt-PT', textDirection: 'ltr' }],
}));

// Initialise i18next once for every test file (in the app, App.tsx imports it first).
require('./src/i18n');
