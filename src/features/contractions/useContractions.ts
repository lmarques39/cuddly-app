import { useCallback, useEffect, useMemo, useState } from 'react';
import { addToList, loadList, makeId, STORAGE_KEYS } from '../../storage/storage';
import { ContractionEntry } from '../../types/records';

const FIVE_ONE_ONE_WINDOW_MS = 60 * 60 * 1000; // pattern must hold for the last hour
const FIVE_ONE_ONE_MAX_INTERVAL_MS = 5 * 60 * 1000;
const FIVE_ONE_ONE_MIN_DURATION_MS = 60 * 1000;
const FIVE_ONE_ONE_MIN_STREAK = 3; // 3+ contractions matching the pattern back-to-back

export function useContractions() {
  const [entries, setEntries] = useState<ContractionEntry[]>([]);
  const [runningSince, setRunningSince] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadList<ContractionEntry>(STORAGE_KEYS.contractions).then((list) => {
      setEntries(list);
      setLoaded(true);
    });
  }, []);

  const start = useCallback(() => {
    setRunningSince(Date.now());
  }, []);

  const stop = useCallback(async () => {
    setRunningSince((current) => {
      if (current == null) return current;
      const entry: ContractionEntry = { id: makeId(), startedAt: current, endedAt: Date.now() };
      addToList(STORAGE_KEYS.contractions, entry).then(setEntries);
      return null;
    });
  }, []);

  const fiveOneOne = useMemo(() => matchesFiveOneOne(entries), [entries]);

  return { entries, runningSince, start, stop, loaded, fiveOneOne };
}

function matchesFiveOneOne(entries: ContractionEntry[]): boolean {
  const recent = entries.filter((e) => Date.now() - e.endedAt <= FIVE_ONE_ONE_WINDOW_MS);
  if (recent.length < FIVE_ONE_ONE_MIN_STREAK) return false;

  // entries are stored newest-first; walk oldest-first to check consecutive gaps
  const chronological = [...recent].sort((a, b) => a.startedAt - b.startedAt);
  let streak = 0;
  for (let i = 0; i < chronological.length; i++) {
    const long_enough = chronological[i].endedAt - chronological[i].startedAt >= FIVE_ONE_ONE_MIN_DURATION_MS;
    const closeToPrevious =
      i === 0 || chronological[i].startedAt - chronological[i - 1].startedAt <= FIVE_ONE_ONE_MAX_INTERVAL_MS;
    streak = long_enough && closeToPrevious ? streak + 1 : long_enough ? 1 : 0;
    if (streak >= FIVE_ONE_ONE_MIN_STREAK) return true;
  }
  return false;
}
