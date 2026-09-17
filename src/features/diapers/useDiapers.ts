import { useCallback, useEffect, useMemo, useState } from 'react';
import { addToList, isToday, loadList, makeId, removeFromList, replaceInList, saveList, STORAGE_KEYS } from '../../storage/storage';
import { subscribeToCollection, syncEntry } from '../../storage/sync';
import { DiaperEntry, DiaperType } from '../../types/records';

export function useDiapers() {
  const [entries, setEntries] = useState<DiaperEntry[]>([]);

  useEffect(() => {
    // Cold-start cache: show what's already on-device instantly, before the
    // Firestore subscription below (which needs network) has a chance to arrive.
    loadList<DiaperEntry>(STORAGE_KEYS.diapers).then(setEntries);

    // Firestore becomes the source of truth once connected — every update
    // here also refreshes the local cache above, so the next cold start is fresh.
    return subscribeToCollection<DiaperEntry>('diapers', (items) => {
      const sorted = [...items].sort((a, b) => b.at - a.at);
      setEntries(sorted);
      saveList(STORAGE_KEYS.diapers, sorted);
    });
  }, []);

  const todayEntries = useMemo(() => entries.filter((e) => isToday(e.at)), [entries]);
  const lastEntry = entries[0];

  const register = useCallback(async (diaperType: DiaperType) => {
    const entry: DiaperEntry = { id: makeId(), type: diaperType, at: Date.now() };
    const next = await addToList(STORAGE_KEYS.diapers, entry);
    setEntries(next);
    syncEntry('diapers', entry.id, entry);
  }, []);

  const remove = useCallback((id: string) => {
    removeFromList<DiaperEntry>(STORAGE_KEYS.diapers, id).then(setEntries);
    syncEntry('diapers', id, null);
  }, []);

  const update = useCallback((updated: DiaperEntry) => {
    replaceInList(STORAGE_KEYS.diapers, updated).then(setEntries);
    syncEntry('diapers', updated.id, updated);
  }, []);

  return { entries, todayEntries, lastEntry, register, remove, update };
}
