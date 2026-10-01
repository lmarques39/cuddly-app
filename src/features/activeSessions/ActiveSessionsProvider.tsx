import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { auth } from '../../services/firebase';
import { loadList, saveList, STORAGE_KEYS } from '../../storage/storage';
import { subscribeToCollection, syncEntry } from '../../storage/sync';
import { ActiveSession, ActiveSessionKind } from '../../types/records';

type Sessions = Partial<Record<ActiveSessionKind, ActiveSession>>;

/** What stop() hands back so the tracker can save the finished entry. */
export type FinishedSession = { startedAt: number; endedAt: number; side?: 'left' | 'right' };

type ActiveSessionsValue = {
  sessions: Sessions;
  start: (kind: ActiveSessionKind, side?: 'left' | 'right') => void;
  stop: (kind: ActiveSessionKind) => FinishedSession | null;
};

const ActiveSessionsContext = createContext<ActiveSessionsValue | null>(null);

function toSessions(list: ActiveSession[]): Sessions {
  const map: Sessions = {};
  list.forEach((s) => {
    map[s.kind] = s;
  });
  return map;
}

/**
 * Running timers for the whole family (#98) — mounted once near the app root
 * (see App.tsx), like CurrentMemberProvider. Timers used to live in each
 * tracker screen's useState, so leaving the screen, closing the app or
 * switching phones lost them; now a running timer is a Firestore doc
 * (#97) that every screen — and every caregiver — sees.
 */
export function ActiveSessionsProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Sessions>({});
  // stop() needs the latest sessions synchronously, without doing its side
  // effects inside a setState updater (the bug the old hooks had).
  const sessionsRef = useRef<Sessions>({});

  const apply = useCallback((next: Sessions) => {
    sessionsRef.current = next;
    setSessions(next);
    saveList(STORAGE_KEYS.activeSessions, Object.values(next));
  }, []);

  useEffect(() => {
    // Cold-start cache: a timer started before the app was closed shows
    // straight away, before the Firestore subscription (needs network) arrives.
    loadList<ActiveSession>(STORAGE_KEYS.activeSessions).then((cached) => {
      if (Object.keys(sessionsRef.current).length === 0 && cached.length > 0) apply(toSessions(cached));
    });

    return subscribeToCollection<ActiveSession & { id: string }>('activeSessions', (items) => {
      apply(toSessions(items.map(({ id: _id, ...session }) => session)));
    });
  }, [apply]);

  const start = useCallback(
    (kind: ActiveSessionKind, side?: 'left' | 'right') => {
      const session: ActiveSession = {
        kind,
        startedAt: Date.now(),
        startedBy: auth.currentUser?.uid ?? '',
        ...(side ? { side } : {}),
      };
      apply({ ...sessionsRef.current, [kind]: session });
      syncEntry('activeSessions', kind, session);
    },
    [apply],
  );

  const stop = useCallback(
    (kind: ActiveSessionKind): FinishedSession | null => {
      const session = sessionsRef.current[kind];
      // Already stopped — e.g. the other caregiver ended it a moment ago.
      if (!session) return null;

      const { [kind]: _stopped, ...rest } = sessionsRef.current;
      apply(rest);
      syncEntry('activeSessions', kind, null);
      return { startedAt: session.startedAt, endedAt: Date.now(), ...(session.side ? { side: session.side } : {}) };
    },
    [apply],
  );

  const value = useMemo(() => ({ sessions, start, stop }), [sessions, start, stop]);
  return <ActiveSessionsContext.Provider value={value}>{children}</ActiveSessionsContext.Provider>;
}

/** Every running timer — for the global "a decorrer" bar (#100). */
export function useActiveSessions(): ActiveSessionsValue {
  const ctx = useContext(ActiveSessionsContext);
  if (!ctx) throw new Error('useActiveSessions must be used within an ActiveSessionsProvider');
  return ctx;
}

/** One tracker's timer: { session, start(side?), stop() } — stop() returns the finished times, or null if nothing was running. */
export function useActiveSession(kind: ActiveSessionKind) {
  const { sessions, start, stop } = useActiveSessions();
  return {
    session: sessions[kind] ?? null,
    start: useCallback((side?: 'left' | 'right') => start(kind, side), [start, kind]),
    stop: useCallback(() => stop(kind), [stop, kind]),
  };
}
