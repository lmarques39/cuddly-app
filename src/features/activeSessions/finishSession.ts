import { auth } from '../../services/firebase';
import { addToList, loadList, makeId, saveList, STORAGE_KEYS } from '../../storage/storage';
import { syncEntry } from '../../storage/sync';
import { ActiveSession, ActiveSessionKind, BreastfeedingEntry, ContractionEntry, SonoEntry } from '../../types/records';
import type { FinishedSession } from './ActiveSessionsProvider';

/** Timers that can be finished with nothing but the times — Extração also needs the ml amount, so it's left out. */
export type QuickFinishKind = Exclude<ActiveSessionKind, 'pumping'>;

export function canFinishWithoutInput(kind: ActiveSessionKind): kind is QuickFinishKind {
  return kind !== 'pumping';
}

type QuickFinishEntry = SonoEntry | BreastfeedingEntry | ContractionEntry;

/**
 * Saves the entry a finished timer leaves behind — the one place that knows
 * how a running Sono/Amamentação/Contração turns into a history entry, so
 * the tracker screens and the notification's "Terminar" button (#101)
 * can't drift apart. Resolves with the updated local list as soon as it's
 * cached; `synced` is the Firestore write, for callers that must not stop
 * before it lands (the headless notification task).
 */
export async function saveFinishedSession<T extends QuickFinishEntry>(
  kind: QuickFinishKind,
  finished: FinishedSession,
): Promise<{ list: T[]; synced: Promise<void> }> {
  const entry = {
    id: makeId(),
    startedAt: finished.startedAt,
    endedAt: finished.endedAt,
    ...(kind === 'breastfeeding' ? { side: finished.side ?? 'left' } : {}),
  } as T;
  const list = await addToList<T>(STORAGE_KEYS[kind], entry);
  return { list, synced: syncEntry(kind, entry.id, entry) };
}

type Listener = (kind: ActiveSessionKind) => void;
const finishedElsewhereListeners = new Set<Listener>();

/** ActiveSessionsProvider listens here, so a timer finished from the notification drops off screen even while offline. */
export function onSessionFinishedOutsideApp(listener: Listener): () => void {
  finishedElsewhereListeners.add(listener);
  return () => finishedElsewhereListeners.delete(listener);
}

/**
 * Finishes a timer without ActiveSessionsProvider — for the notification's
 * "Terminar", which can run with the app in the background or not running
 * at all (a headless task: no React tree, no provider). Works off the
 * AsyncStorage copy of activeSessions the provider keeps up to date.
 * Returns false if that timer had already stopped (e.g. the other caregiver
 * finished it a moment ago).
 */
export async function finishSessionOutsideApp(kind: QuickFinishKind): Promise<boolean> {
  // A headless start restores the signed-in user from AsyncStorage
  // asynchronously — the Firestore writes below need it.
  await auth.authStateReady?.();

  const sessions = await loadList<ActiveSession>(STORAGE_KEYS.activeSessions);
  const session = sessions.find((s) => s.kind === kind);
  if (!session) return false;

  await saveList(
    STORAGE_KEYS.activeSessions,
    sessions.filter((s) => s.kind !== kind),
  );
  finishedElsewhereListeners.forEach((listener) => listener(kind));

  const finished: FinishedSession = { startedAt: session.startedAt, endedAt: Date.now(), ...(session.side ? { side: session.side } : {}) };
  const { synced } = await saveFinishedSession(kind, finished);
  await Promise.all([syncEntry('activeSessions', kind, null), synced]);
  return true;
}
