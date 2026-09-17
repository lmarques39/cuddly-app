import { useCallback, useEffect, useMemo, useState } from 'react';
import { addToList, isToday, loadList, makeId, removeFromList, replaceInList, saveList, STORAGE_KEYS } from '../../storage/storage';
import { subscribeToCollection, syncEntry } from '../../storage/sync';
import { BreastfeedingEntry } from '../../types/records';

export function useBreastfeeding() {
  const [entries, setEntries] = useState<BreastfeedingEntry[]>([]);
  const [running, setRunning] = useState<{ side: 'left' | 'right'; startedAt: number } | null>(null);

  useEffect(() => {
    // Cold-start cache: show what's already on-device instantly, before the
    // Firestore subscription below (which needs network) has a chance to arrive.
    loadList<BreastfeedingEntry>(STORAGE_KEYS.breastfeeding).then(setEntries);

    // Firestore becomes the source of truth once connected — every update
    // here also refreshes the local cache above, so the next cold start is fresh.
    return subscribeToCollection<BreastfeedingEntry>('breastfeeding', (items) => {
      const sorted = [...items].sort((a, b) => b.startedAt - a.startedAt);
      setEntries(sorted);
      saveList(STORAGE_KEYS.breastfeeding, sorted);
    });
  }, []);

  const start = useCallback((side: 'left' | 'right') => {
    setRunning({ side, startedAt: Date.now() });
  }, []);

  const stop = useCallback(async () => {
    setRunning((current) => {
      if (current == null) return current;
      const entry: BreastfeedingEntry = { id: makeId(), side: current.side, startedAt: current.startedAt, endedAt: Date.now() };
      addToList(STORAGE_KEYS.breastfeeding, entry).then(setEntries);
      syncEntry('breastfeeding', entry.id, entry);
      return null;
    });
  }, []);

  const todayEntries = useMemo(() => entries.filter((e) => isToday(e.startedAt)), [entries]);
  const todayDurationMs = useMemo(
    () => todayEntries.reduce((sum, e) => sum + (e.endedAt - e.startedAt), 0),
    [todayEntries],
  );
  const suggestedSide: 'left' | 'right' = useMemo(() => {
    if (entries.length === 0) return 'left';
    return entries[0].side === 'left' ? 'right' : 'left';
  }, [entries]);

  const remove = useCallback((id: string) => {
    removeFromList<BreastfeedingEntry>(STORAGE_KEYS.breastfeeding, id).then(setEntries);
    syncEntry('breastfeeding', id, null);
  }, []);

  const update = useCallback((updated: BreastfeedingEntry) => {
    replaceInList(STORAGE_KEYS.breastfeeding, updated).then(setEntries);
    syncEntry('breastfeeding', updated.id, updated);
  }, []);

  return { entries, todayEntries, todayDurationMs, running, start, stop, remove, update, suggestedSide };
}
