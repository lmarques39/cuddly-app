import { useCallback, useState } from 'react';
import {
  GoogleOneTapSignIn,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from 'react-native-nitro-google-signin';
import i18n from '../../i18n';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

let configured = false;
function ensureConfigured() {
  if (configured || !webClientId) return;
  // The *web* client id, even on Android: it's the audience Firebase checks
  // the idToken against. The Android OAuth client (package + SHA-1) only has
  // to exist in Google Cloud — see google-services.json and #78.
  GoogleOneTapSignIn.configure({ webClientId });
  configured = true;
}

function describeGoogleError(err: unknown): string {
  if (isErrorWithCode(err)) {
    switch (err.code) {
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return i18n.t('auth.google.playServices');
      case statusCodes.IN_PROGRESS:
        return i18n.t('auth.google.inProgress');
      case statusCodes.DEVELOPER_ERROR:
        // Wrong/missing SHA-1 for the certificate that signed this build.
        return i18n.t('auth.google.misconfigured');
    }
  }
  return i18n.t('auth.google.failed');
}

/**
 * Native Google sign-in (#78) through Android's Credential Manager, via
 * react-native-nitro-google-signin — expo-auth-session's browser redirect
 * is what Expo no longer recommends for native builds. The web build uses
 * useGoogleSignIn.web.ts instead; both hand LoginScreen the same idToken.
 */
export function useGoogleSignIn(onIdToken: (idToken: string) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    ensureConfigured();
    setError(null);
    setBusy(true);
    try {
      await GoogleOneTapSignIn.checkPlayServices();
      const response = await GoogleOneTapSignIn.presentExplicitSignIn();
      if (isSuccessResponse(response) && response.data.idToken) {
        onIdToken(response.data.idToken);
      } else if (!isCancelledResponse(response)) {
        setError(i18n.t('auth.google.failed'));
      }
    } catch (err) {
      setError(describeGoogleError(err));
    } finally {
      setBusy(false);
    }
  }, [onIdToken]);

  return { available: !!webClientId && !busy, start, error };
}

/** Forgets the Google account on this device, so the next login asks which account again. */
export async function signOutOfGoogle(): Promise<void> {
  ensureConfigured();
  await GoogleOneTapSignIn.signOut().catch(() => {});
}
