import { useCallback, useEffect, useMemo, useState } from 'react';
import { addToList, isToday, loadList, makeId, removeFromList, replaceInList, saveList, STORAGE_KEYS } from '../../storage/storage';
import { subscribeToCollection, syncEntry } from '../../storage/sync';
import { BreastfeedingEntry } from '../../types/records';
import { useActiveSession } from '../activeSessions/ActiveSessionsProvider';

export function useBreastfeeding() {
  const [entries, setEntries] = useState<BreastfeedingEntry[]>([]);
  // The running timer lives in ActiveSessionsProvider (#99), not in this
  // hook — so it survives leaving the screen and the other caregiver sees it.
  const { session, start: startSession, stop: stopSession } = useActiveSession('breastfeeding');
  const running = useMemo(
    () => (session ? { side: session.side ?? ('left' as const), startedAt: session.startedAt } : null),
    [session],
  );

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

  const start = useCallback((side: 'left' | 'right') => startSession(side), [startSession]);

  const stop = useCallback(async () => {
    const finished = stopSession();
    if (!finished) return;
    const entry: BreastfeedingEntry = { id: makeId(), side: finished.side ?? 'left', startedAt: finished.startedAt, endedAt: finished.endedAt };
    addToList(STORAGE_KEYS.breastfeeding, entry).then(setEntries);
    syncEntry('breastfeeding', entry.id, entry);
  }, [stopSession]);

  /** Logs a feed the timer never ran for. */
  const addManual = useCallback((side: 'left' | 'right', startedAt: number, endedAt: number) => {
    const entry: BreastfeedingEntry = { id: makeId(), side, startedAt, endedAt };
    addToList(STORAGE_KEYS.breastfeeding, entry).then(setEntries);
    syncEntry('breastfeeding', entry.id, entry);
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

  return { entries, todayEntries, todayDurationMs, running, start, stop, addManual, remove, update, suggestedSide };
}
