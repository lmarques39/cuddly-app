import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect } from 'react';

// Dismisses the popup once the OAuth redirect completes — the standard
// expo-auth-session pattern, needs to run once at module load.
WebBrowser.maybeCompleteAuthSession();

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

/**
 * Web Google sign-in: expo-auth-session's popup flow (what #7 shipped).
 * Native builds use useGoogleSignIn.ts (Credential Manager) instead — same
 * shape, so LoginScreen doesn't care which one Metro picked.
 */
export function useGoogleSignIn(onIdToken: (idToken: string) => void) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({ webClientId });

  useEffect(() => {
    if (response?.type === 'success' && response.params.id_token) {
      onIdToken(response.params.id_token);
    }
  }, [response, onIdToken]);

  const start = useCallback(async () => {
    await promptAsync();
  }, [promptAsync]);

  return { available: !!webClientId && !!request, start, error: null as string | null };
}

export async function signOutOfGoogle(): Promise<void> {
  // Nothing kept on this side — Firebase's signOut() is enough on the web.
}
