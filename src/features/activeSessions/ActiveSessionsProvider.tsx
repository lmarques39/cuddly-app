import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { auth } from '../../services/firebase';
import { loadList, saveList, STORAGE_KEYS } from '../../storage/storage';
import { subscribeToCollection, syncEntry } from '../../storage/sync';
import { ActiveSession, ActiveSessionKind, PumpingSide } from '../../types/records';
import { cancelBreastfeedingReminder, restartBreastfeedingReminder } from '../notifications/reminderScheduling';
import { finishedFrom, onSessionFinishedOutsideApp } from './finishSession';
import { dismissSessionNotification, showSessionNotification } from './sessionNotification';

type Sessions = Partial<Record<ActiveSessionKind, ActiveSession>>;

const ALL_KINDS: ActiveSessionKind[] = ['sono', 'breastfeeding', 'pumping', 'contractions'];

/** What stop() hands back so the tracker can save the finished entry. */
export type FinishedSession = { startedAt: number; endedAt: number; side?: PumpingSide; pausedMs?: number };

/** A finished entry being picked back up ("Continuar", #127). */
export type ContinuedFrom = { startedAt: number; endedAt: number; pausedMs?: number };

type ActiveSessionsValue = {
  sessions: Sessions;
  start: (kind: ActiveSessionKind, side?: PumpingSide, continuedFrom?: ContinuedFrom) => void;
  stop: (kind: ActiveSessionKind) => FinishedSession | null;
  pause: (kind: ActiveSessionKind) => void;
  resume: (kind: ActiveSessionKind) => void;
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
  // Until the AsyncStorage cache is read, an empty `sessions` means "don't
  // know yet", not "nothing running" — mustn't clear notifications on it.
  const [cacheLoaded, setCacheLoaded] = useState(false);
  // What each notification currently shows, so it's only re-posted on change.
  // Starts as "unknown" for every kind: the first sync then clears whatever
  // a previous run of the app left in the shade for timers that have since
  // finished (e.g. on the other caregiver's phone while this app was closed).
  const notifiedRef = useRef<Partial<Record<ActiveSessionKind, string>>>(
    Object.fromEntries(ALL_KINDS.map((kind) => [kind, 'unknown'])),
  );

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
      setCacheLoaded(true);
    });

    // "Terminar" on the notification (#101) already saved the entry and
    // cleared the cache — just drop the timer here too, without waiting for
    // Firestore (which may be offline).
    const stopListening = onSessionFinishedOutsideApp((kind) => {
      const { [kind]: _finished, ...rest } = sessionsRef.current;
      sessionsRef.current = rest;
      setSessions(rest);
    });

    const unsubscribe = subscribeToCollection<ActiveSession & { id: string }>('activeSessions', (items) => {
      apply(toSessions(items.map(({ id: _id, ...session }) => session)));
    });
    return () => {
      stopListening();
      unsubscribe();
    };
  }, [apply]);

  // One persistent Android notification per running timer (#101), kept in
  // step with `sessions` whoever started or finished it — this phone, the
  // in-app bar, the notification itself or the other caregiver's phone.
  useEffect(() => {
    if (!cacheLoaded) return;
    ALL_KINDS.forEach((kind) => {
      const session = sessions[kind];
      const shown = notifiedRef.current[kind];
      const wanted = session ? `${session.startedAt}:${session.side ?? ''}:${session.pausedAt ?? ''}:${session.pausedMs ?? ''}` : undefined;
      if (wanted === shown) return;
      if (session) {
        notifiedRef.current[kind] = wanted;
        showSessionNotification(session).catch(() => {});
      } else {
        delete notifiedRef.current[kind];
        dismissSessionNotification(kind);
      }
    });
  }, [sessions, cacheLoaded]);

  // The "time to feed" reminder (#123) pauses while a feed runs — whoever
  // started it — and counts again from that feed's start once it's over.
  const feedStartedAtRef = useRef<number | null>(null);
  useEffect(() => {
    if (!cacheLoaded) return;
    const feed = sessions.breastfeeding;
    if (feed && feedStartedAtRef.current == null) {
      cancelBreastfeedingReminder().catch(() => {});
    } else if (!feed && feedStartedAtRef.current != null) {
      restartBreastfeedingReminder(feedStartedAtRef.current).catch(() => {});
    }
    feedStartedAtRef.current = feed?.startedAt ?? null;
  }, [sessions, cacheLoaded]);

  // Signing out unmounts this provider — the next account mustn't inherit
  // this family's "a decorrer" notifications.
  useEffect(() => () => ALL_KINDS.forEach((kind) => dismissSessionNotification(kind)), []);

  const put = useCallback(
    (session: ActiveSession) => {
      apply({ ...sessionsRef.current, [session.kind]: session });
      syncEntry('activeSessions', session.kind, session);
    },
    [apply],
  );

  const start = useCallback(
    (kind: ActiveSessionKind, side?: PumpingSide, continuedFrom?: ContinuedFrom) => {
      const now = Date.now();
      // Continuing keeps the original start; the break since it ended counts as a pause.
      const pausedMs = continuedFrom ? (continuedFrom.pausedMs ?? 0) + Math.max(0, now - continuedFrom.endedAt) : 0;
      put({
        kind,
        startedAt: continuedFrom?.startedAt ?? now,
        startedBy: auth.currentUser?.uid ?? '',
        ...(side ? { side } : {}),
        ...(pausedMs ? { pausedMs } : {}),
      });
    },
    [put],
  );

  const pause = useCallback(
    (kind: ActiveSessionKind) => {
      const session = sessionsRef.current[kind];
      if (!session || session.pausedAt != null) return;
      put({ ...session, pausedAt: Date.now() });
    },
    [put],
  );

  const resume = useCallback(
    (kind: ActiveSessionKind) => {
      const session = sessionsRef.current[kind];
      if (!session || session.pausedAt == null) return;
      const { pausedAt, ...rest } = session;
      put({ ...rest, pausedMs: (session.pausedMs ?? 0) + Math.max(0, Date.now() - pausedAt) });
    },
    [put],
  );

  const stop = useCallback(
    (kind: ActiveSessionKind): FinishedSession | null => {
      const session = sessionsRef.current[kind];
      // Already stopped — e.g. the other caregiver ended it a moment ago.
      if (!session) return null;

      const { [kind]: _stopped, ...rest } = sessionsRef.current;
      apply(rest);
      syncEntry('activeSessions', kind, null);
      return finishedFrom(session, Date.now());
    },
    [apply],
  );

  const value = useMemo(() => ({ sessions, start, stop, pause, resume }), [sessions, start, stop, pause, resume]);
  return <ActiveSessionsContext.Provider value={value}>{children}</ActiveSessionsContext.Provider>;
}

/** Every running timer — for the global "a decorrer" bar (#100). */
export function useActiveSessions(): ActiveSessionsValue {
  const ctx = useContext(ActiveSessionsContext);
  if (!ctx) throw new Error('useActiveSessions must be used within an ActiveSessionsProvider');
  return ctx;
}

/** One tracker's timer: { session, start(side?, continuedFrom?), stop(), pause(), resume() } — stop() returns the finished times, or null if nothing was running. */
export function useActiveSession(kind: ActiveSessionKind) {
  const { sessions, start, stop, pause, resume } = useActiveSessions();
  return {
    session: sessions[kind] ?? null,
    start: useCallback((side?: PumpingSide, continuedFrom?: ContinuedFrom) => start(kind, side, continuedFrom), [start, kind]),
    stop: useCallback(() => stop(kind), [stop, kind]),
    pause: useCallback(() => pause(kind), [pause, kind]),
    resume: useCallback(() => resume(kind), [resume, kind]),
  };
}
