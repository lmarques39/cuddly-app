import { useCallback, useEffect, useMemo, useState } from 'react';
import { addToList, isToday, loadList, makeId, STORAGE_KEYS } from '../../storage/storage';
import { BreastfeedingEntry } from '../../types/records';

export function useBreastfeeding() {
  const [entries, setEntries] = useState<BreastfeedingEntry[]>([]);
  const [running, setRunning] = useState<{ side: 'left' | 'right'; startedAt: number } | null>(null);

  useEffect(() => {
    loadList<BreastfeedingEntry>(STORAGE_KEYS.breastfeeding).then(setEntries);
  }, []);

  const start = useCallback((side: 'left' | 'right') => {
    setRunning({ side, startedAt: Date.now() });
  }, []);

  const stop = useCallback(async () => {
    setRunning((current) => {
      if (current == null) return current;
      const entry: BreastfeedingEntry = { id: makeId(), side: current.side, startedAt: current.startedAt, endedAt: Date.now() };
      addToList(STORAGE_KEYS.breastfeeding, entry).then(setEntries);
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

  return { entries, todayEntries, todayDurationMs, running, start, stop, suggestedSide };
}
