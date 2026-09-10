import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// firebase/auth's published .d.ts doesn't resolve the "react-native" export
// condition (only the runtime bundle does, via Metro) — getReactNativePersistence
// exists and works, tsc just can't see it. See firebase-js-sdk#8188.
// @ts-expect-error — see comment above
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  throw new Error(
    'Firebase config is missing. Copy .env.example to .env and fill in the values from the Firebase console (Project settings > General > Your apps).'
  );
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// initializeAuth must run exactly once per app instance — Fast Refresh can
// re-execute this module, so fall back to the already-initialized auth
// instance instead of throwing.
export const auth = (() => {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(app);
  }
})();

// experimentalAutoDetectLongPolling: defensive default recommended by
// Firebase for browser environments where the SDK's transport
// auto-detection can otherwise pick a transport that stalls. Same
// Fast-Refresh re-execution guard as auth above.
export const db = (() => {
  try {
    return initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch {
    return getFirestore(app);
  }
})();

export default app;
