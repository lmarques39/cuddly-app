import { useCallback, useEffect, useState } from 'react';
import { addToList, loadList, makeId, removeFromList, replaceInList, saveList, STORAGE_KEYS } from '../../storage/storage';
import { subscribeToCollection, syncEntry } from '../../storage/sync';
import { SonoEntry } from '../../types/records';
import { useActiveSession } from '../activeSessions/ActiveSessionsProvider';

export function useSono() {
  const [entries, setEntries] = useState<SonoEntry[]>([]);
  // The running timer lives in ActiveSessionsProvider (#99), not in this
  // hook — so it survives leaving the screen and the other caregiver sees it.
  const { session, start: startSession, stop: stopSession } = useActiveSession('sono');
  const runningSince = session?.startedAt ?? null;
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Cold-start cache: show what's already on-device instantly, before the
    // Firestore subscription below (which needs network) has a chance to arrive.
    loadList<SonoEntry>(STORAGE_KEYS.sono).then((list) => {
      setEntries(list);
      setLoaded(true);
    });

    // Firestore becomes the source of truth once connected — every update
    // here also refreshes the local cache above, so the next cold start is fresh.
    return subscribeToCollection<SonoEntry>('sono', (items) => {
      const sorted = [...items].sort((a, b) => b.startedAt - a.startedAt);
      setEntries(sorted);
      setLoaded(true);
      saveList(STORAGE_KEYS.sono, sorted);
    });
  }, []);

  const start = useCallback(() => startSession(), [startSession]);

  const stop = useCallback(async () => {
    const finished = stopSession();
    if (!finished) return;
    const entry: SonoEntry = { id: makeId(), startedAt: finished.startedAt, endedAt: finished.endedAt };
    addToList(STORAGE_KEYS.sono, entry).then(setEntries);
    syncEntry('sono', entry.id, entry);
  }, [stopSession]);

  /** Logs a sleep the timer never ran for (e.g. noticed only after waking up). */
  const addManual = useCallback((startedAt: number, endedAt: number) => {
    const entry: SonoEntry = { id: makeId(), startedAt, endedAt };
    addToList(STORAGE_KEYS.sono, entry).then(setEntries);
    syncEntry('sono', entry.id, entry);
  }, []);

  const remove = useCallback((id: string) => {
    removeFromList<SonoEntry>(STORAGE_KEYS.sono, id).then(setEntries);
    syncEntry('sono', id, null);
  }, []);

  const update = useCallback((updated: SonoEntry) => {
    replaceInList(STORAGE_KEYS.sono, updated).then(setEntries);
    syncEntry('sono', updated.id, updated);
  }, []);

  return { entries, runningSince, start, stop, addManual, remove, update, loaded };
}
