import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { ActiveSessionKind } from '../../types/records';
import { ACTION_FINISH, handleFinishTap, isSessionNotification, sessionKindOf } from './sessionNotification';

/**
 * Taps on a running-timer notification while the app is open — or the tap
 * that just opened it from closed. "Ver" and the notification body open
 * the timer's screen; "Terminar" (if the background task didn't get it
 * first) finishes it. Mounted by the tab bar, which knows how to navigate.
 * The web build uses useSessionNotificationTaps.web.ts — this hook doesn't exist there (#113).
 */
export function useSessionNotificationTaps(onOpen: (kind: ActiveSessionKind) => void): void {
  const response = Notifications.useLastNotificationResponse();
  const onOpenRef = useRef(onOpen);
  useEffect(() => {
    onOpenRef.current = onOpen;
  });

  useEffect(() => {
    if (Platform.OS !== 'android' || !response || !isSessionNotification(response.notification)) return;
    const kind = sessionKindOf(response);
    if (!kind) return;
    // Otherwise the same tap is handed back again the next time this mounts.
    Notifications.clearLastNotificationResponse();
    if (response.actionIdentifier === ACTION_FINISH) {
      handleFinishTap(response);
    } else {
      onOpenRef.current(kind);
    }
  }, [response]);
}
