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
