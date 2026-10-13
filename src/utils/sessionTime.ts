type TimedEntry = { startedAt: number; endedAt: number; pausedMs?: number };
type RunningTimer = { startedAt: number; pausedAt?: number; pausedMs?: number };

/** How long a finished session actually lasted — start to end, minus any pauses (#127). */
export function entryDurationMs(entry: TimedEntry): number {
  return Math.max(0, entry.endedAt - entry.startedAt - (entry.pausedMs ?? 0));
}

/** A running timer's time so far; stands still while it's paused (#127). */
export function runningElapsedMs(timer: RunningTimer, now: number): number {
  return Math.max(0, (timer.pausedAt ?? now) - timer.startedAt - (timer.pausedMs ?? 0));
}

/**
 * An edited entry (#126). Typing new start/end times says how long it
 * really was, so any pause recorded for the old times no longer applies;
 * just changing the side or ml keeps it.
 */
export function withEditedTimes<T extends TimedEntry>(entry: T, startedAt: number, endedAt: number): T {
  if (entry.startedAt === startedAt && entry.endedAt === endedAt) return entry;
  const { pausedMs: _pausedMs, ...rest } = entry;
  return { ...rest, startedAt, endedAt } as T;
}

/** How soon after finishing a session it can still be continued as the same one (#127). */
export const CONTINUE_WINDOW_MS = 30 * 60 * 1000;

/** Whether `entry` (the latest one) can still be picked back up — "Continuar" (#127). */
export function canContinue(entry: TimedEntry | undefined, now: number): boolean {
  return entry != null && now - entry.endedAt <= CONTINUE_WINDOW_MS;
}
