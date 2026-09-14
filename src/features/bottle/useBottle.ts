import { useCallback, useEffect, useMemo, useState } from 'react';
import { addToList, isToday, loadList, makeId, saveList, STORAGE_KEYS } from '../../storage/storage';
import { subscribeToCollection, syncEntry } from '../../storage/sync';
import { BottleEntry, BottleType } from '../../types/records';

export function useBottle() {
  const [entries, setEntries] = useState<BottleEntry[]>([]);

  useEffect(() => {
    // Cold-start cache: show what's already on-device instantly, before the
    // Firestore subscription below (which needs network) has a chance to arrive.
    loadList<BottleEntry>(STORAGE_KEYS.bottle).then(setEntries);

    // Firestore becomes the source of truth once connected — every update
    // here also refreshes the local cache above, so the next cold start is fresh.
    return subscribeToCollection<BottleEntry>('bottle', (items) => {
      const sorted = [...items].sort((a, b) => b.at - a.at);
      setEntries(sorted);
      saveList(STORAGE_KEYS.bottle, sorted);
    });
  }, []);

  const todayEntries = useMemo(() => entries.filter((e) => isToday(e.at)), [entries]);
  const todayTotalMl = useMemo(() => todayEntries.reduce((sum, e) => sum + e.amountMl, 0), [todayEntries]);

  const save = useCallback(async (amountMl: number, type: BottleType) => {
    const entry: BottleEntry = { id: makeId(), amountMl, type, at: Date.now() };
    const next = await addToList(STORAGE_KEYS.bottle, entry);
    setEntries(next);
    syncEntry('bottle', entry.id, entry);
  }, []);

  return { entries, todayEntries, todayTotalMl, save };
}
