/**
 * expo-auth-session's Google provider throws synchronously (crashing the
 * whole screen, not just the button) if the *current platform's* client id
 * isn't set — e.g. `androidClientId` missing on a native Android build.
 * Confirmed via a real Android crash log (`FATAL EXCEPTION: ... Client Id
 * property 'androidClientId' must be defined`) — this app only ever
 * configured `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, so every native Android
 * launch that rendered LoginScreen died instantly.
 *
 * Pulled out as a pure function so it's testable without mocking the whole
 * expo-auth-session hook — LoginScreen uses it to (a) know whether the
 * button should even be pressable, and (b) always pass a truthy
 * `androidClientId` (a placeholder when unset) so the hook itself never
 * throws, regardless of platform.
 */
export function isGoogleSignInAvailable(
  platformOS: string,
  clientIds: { android?: string; web?: string }
): boolean {
  if (platformOS === 'android') return !!clientIds.android;
  return !!clientIds.web;
}

/** A syntactically-valid placeholder — keeps the hook's invariant check happy without a real Android client id configured yet. */
export const PLACEHOLDER_ANDROID_CLIENT_ID = 'not-configured';
