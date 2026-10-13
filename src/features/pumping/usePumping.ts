import { useCallback, useEffect, useState } from 'react';
import { addToList, loadList, makeId, removeFromList, replaceInList, saveList, STORAGE_KEYS } from '../../storage/storage';
import { subscribeToCollection, syncEntry } from '../../storage/sync';
import { PumpingEntry, PumpingSide } from '../../types/records';
import { useActiveSession } from '../activeSessions/ActiveSessionsProvider';

export function usePumping() {
  const [entries, setEntries] = useState<PumpingEntry[]>([]);
  // The running timer lives in ActiveSessionsProvider (#99), not in this
  // hook — so it survives leaving the screen and the other caregiver sees it.
  const { session, start: startSession, stop: stopSession, pause, resume } = useActiveSession('pumping');
  const runningSince = session?.startedAt ?? null;
  const runningSide: PumpingSide | null = session ? (session.side ?? 'both') : null;
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

  const start = useCallback((side: PumpingSide) => startSession(side), [startSession]);

  const stop = useCallback(
    async (amountMl: number) => {
      const finished = stopSession();
      if (!finished) return;
      const entry: PumpingEntry = {
        id: makeId(),
        startedAt: finished.startedAt,
        endedAt: finished.endedAt,
        amountMl,
        ...(finished.side ? { side: finished.side } : {}),
        ...(finished.pausedMs ? { pausedMs: finished.pausedMs } : {}),
      };
      addToList(STORAGE_KEYS.pumping, entry).then(setEntries);
      syncEntry('pumping', entry.id, entry);
    },
    [stopSession],
  );

  /** Logs an extraction the timer never ran for. */
  const addManual = useCallback((startedAt: number, endedAt: number, amountMl: number, side: PumpingSide) => {
    const entry: PumpingEntry = { id: makeId(), startedAt, endedAt, amountMl, side };
    addToList(STORAGE_KEYS.pumping, entry).then(setEntries);
    syncEntry('pumping', entry.id, entry);
  }, []);

  const remove = useCallback((id: string) => {
    removeFromList<PumpingEntry>(STORAGE_KEYS.pumping, id).then(setEntries);
    syncEntry('pumping', id, null);
  }, []);

  /**
   * Picks the latest extraction back up as the same one, same side — the
   * time in between counts as a pause (#127). Returns its ml so the screen
   * can offer them again when it's finished.
   */
  const continueLast = useCallback((): number | null => {
    const last = entries[0];
    if (!last || session) return null;
    startSession(last.side ?? 'both', last);
    remove(last.id);
    return last.amountMl;
  }, [entries, session, startSession, remove]);

  const update = useCallback((updated: PumpingEntry) => {
    replaceInList(STORAGE_KEYS.pumping, updated).then(setEntries);
    syncEntry('pumping', updated.id, updated);
  }, []);

  return { entries, session, runningSince, runningSide, pause, resume, continueLast, start, stop, addManual, remove, update, loaded };
}
