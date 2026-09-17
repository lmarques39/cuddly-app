import { useCallback, useEffect, useState } from 'react';
import { addToList, loadList, makeId, removeFromList, replaceInList, saveList, STORAGE_KEYS } from '../../storage/storage';
import { subscribeToCollection, syncEntry } from '../../storage/sync';
import { PumpingEntry } from '../../types/records';

export function usePumping() {
  const [entries, setEntries] = useState<PumpingEntry[]>([]);
  const [runningSince, setRunningSince] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Cold-start cache: show what's already on-device instantly, before the
    // Firestore subscription below (which needs network) has a chance to arrive.
    loadList<PumpingEntry>(STORAGE_KEYS.pumping).then((list) => {
      setEntries(list);
      setLoaded(true);
    });

    // Firestore becomes the source of truth once connected — every update
    // here also refreshes the local cache above, so the next cold start is fresh.
    return subscribeToCollection<PumpingEntry>('pumping', (items) => {
      const sorted = [...items].sort((a, b) => b.startedAt - a.startedAt);
      setEntries(sorted);
      setLoaded(true);
      saveList(STORAGE_KEYS.pumping, sorted);
    });
  }, []);

  const start = useCallback(() => {
    setRunningSince(Date.now());
  }, []);

  const stop = useCallback(async (amountMl: number) => {
    setRunningSince((current) => {
      if (current == null) return current;
      const entry: PumpingEntry = { id: makeId(), startedAt: current, endedAt: Date.now(), amountMl };
      addToList(STORAGE_KEYS.pumping, entry).then(setEntries);
      syncEntry('pumping', entry.id, entry);
      return null;
    });
  }, []);

  const remove = useCallback((id: string) => {
    removeFromList<PumpingEntry>(STORAGE_KEYS.pumping, id).then(setEntries);
    syncEntry('pumping', id, null);
  }, []);

  const update = useCallback((updated: PumpingEntry) => {
    replaceInList(STORAGE_KEYS.pumping, updated).then(setEntries);
    syncEntry('pumping', updated.id, updated);
  }, []);

  return { entries, runningSince, start, stop, remove, update, loaded };
}
