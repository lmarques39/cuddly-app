import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Live-updating "now" timestamp, ticking every `intervalMs` while `active`.
 * The one deliberate place components read the clock, so react-hooks/purity
 * has a single narrow exception instead of Date.now() scattered through render.
 */
export function useNow(intervalMs: number, active = true): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    // Coming back from a locked screen or another app, catch up at once —
    // not on the next tick, which for a 30 s/1 min interval left a timer
    // looking stuck where it was when the phone was locked (#130).
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });
    return () => {
      clearInterval(id);
      subscription.remove();
    };
  }, [intervalMs, active]);

  return now;
}
