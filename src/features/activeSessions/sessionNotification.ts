import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ensureNotificationPermission } from '../../notifications/setup';
import { ActiveSession, ActiveSessionKind } from '../../types/records';
import i18n from '../../i18n';
import { formatClock } from '../../utils/time';
import { canFinishWithoutInput, finishSessionOutsideApp } from './finishSession';

export const SESSION_CHANNEL_ID = 'cuddly-active-sessions';
const CATEGORY_WITH_FINISH = 'active-session';
// Extração can't be finished from the notification — it needs the ml amount.
const CATEGORY_VIEW_ONLY = 'active-session-view-only';
export const ACTION_VIEW = 'view';
export const ACTION_FINISH = 'finish';

const KINDS: ActiveSessionKind[] = ['sono', 'breastfeeding', 'pumping', 'contractions'];

export function sessionNotificationId(kind: ActiveSessionKind): string {
  return `active-session-${kind}`;
}

export function isSessionNotification(notification: Notifications.Notification): boolean {
  return notification.request.identifier.startsWith('active-session-');
}

/** The running timer a notification (or a tap on one of its buttons) belongs to. */
export function sessionKindOf(response: Notifications.NotificationResponse): ActiveSessionKind | null {
  const kind = response.notification.request.content.data?.kind;
  return typeof kind === 'string' && (KINDS as string[]).includes(kind) ? (kind as ActiveSessionKind) : null;
}

/** Channel + the Ver/Terminar buttons. Android only — the whole feature is (#101: iOS out of scope). */
export async function setUpSessionNotifications(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(SESSION_CHANNEL_ID, {
    name: i18n.t('sessionNotification.channel'),
    // LOW: sits in the shade without sound, vibration or a heads-up banner.
    importance: Notifications.AndroidImportance.LOW,
    showBadge: false,
  });
  await Notifications.setNotificationCategoryAsync(CATEGORY_WITH_FINISH, [
    { identifier: ACTION_VIEW, buttonTitle: i18n.t('sessionNotification.view'), options: { opensAppToForeground: true } },
    { identifier: ACTION_FINISH, buttonTitle: i18n.t('sessionNotification.finish'), options: { opensAppToForeground: false } },
  ]);
  await Notifications.setNotificationCategoryAsync(CATEGORY_VIEW_ONLY, [
    { identifier: ACTION_VIEW, buttonTitle: i18n.t('sessionNotification.view'), options: { opensAppToForeground: true } },
  ]);
}

/**
 * Shows (or replaces) the "Sono a decorrer desde as 14:32" notification. It
 * can't tick like the in-app bar — Android notifications don't run JS — so
 * it shows the start time instead.
 */
export async function showSessionNotification(session: ActiveSession): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (!(await ensureNotificationPermission())) return;

  const side = session.side ? i18n.t(session.side === 'left' ? 'sessionNotification.leftBreast' : 'sessionNotification.rightBreast') : '';
  await Notifications.scheduleNotificationAsync({
    identifier: sessionNotificationId(session.kind),
    content: {
      title: i18n.t(`sessionNotification.title.${session.kind}`),
      body: i18n.t('sessionNotification.since', { time: formatClock(session.startedAt) }) + side,
      data: { kind: session.kind },
      categoryIdentifier: canFinishWithoutInput(session.kind) ? CATEGORY_WITH_FINISH : CATEGORY_VIEW_ONLY,
      sticky: true,
      autoDismiss: false,
    },
    trigger: { channelId: SESSION_CHANNEL_ID },
  });
}

export async function dismissSessionNotification(kind: ActiveSessionKind): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.dismissNotificationAsync(sessionNotificationId(kind)).catch(() => {});
}

// With the app in the background, a "Terminar" tap reaches both the
// background task and the in-app listener (same JS runtime) — the first one
// to see a given tap handles it.
const handledTaps = new Set<string>();

/**
 * "Terminar" from the notification: finishes the timer and saves its entry
 * without opening the app. Returns true if this call handled the tap.
 */
export async function handleFinishTap(response: Notifications.NotificationResponse): Promise<boolean> {
  const kind = sessionKindOf(response);
  if (response.actionIdentifier !== ACTION_FINISH || !kind || !canFinishWithoutInput(kind)) return false;

  const tapId = `${response.notification.request.identifier}:${response.notification.date}`;
  if (handledTaps.has(tapId)) return true;
  handledTaps.add(tapId);

  await finishSessionOutsideApp(kind);
  await dismissSessionNotification(kind);
  return true;
}
