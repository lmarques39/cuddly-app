import { useCallback, useEffect, useState } from 'react';
import { addToList, loadList, makeId, removeFromList, replaceInList, saveList, STORAGE_KEYS } from '../../storage/storage';
import { subscribeToCollection, syncEntry } from '../../storage/sync';
import { SonoEntry } from '../../types/records';

export function useSono() {
  const [entries, setEntries] = useState<SonoEntry[]>([]);
  const [runningSince, setRunningSince] = useState<number | null>(null);
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

  const start = useCallback(() => {
    setRunningSince(Date.now());
  }, []);

  const stop = useCallback(async () => {
    setRunningSince((current) => {
      if (current == null) return current;
      const entry: SonoEntry = { id: makeId(), startedAt: current, endedAt: Date.now() };
      addToList(STORAGE_KEYS.sono, entry).then(setEntries);
      syncEntry('sono', entry.id, entry);
      return null;
    });
  }, []);

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
