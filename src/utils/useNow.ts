import { useEffect, useState } from 'react';

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
    return () => clearInterval(id);
  }, [intervalMs, active]);

  return now;
}
