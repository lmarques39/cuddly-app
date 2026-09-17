export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function formatClock(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

export function formatSince(epochMs: number): string {
  const diffMs = Date.now() - epochMs;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'agora mesmo';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remMin = minutes % 60;
    return remMin > 0 ? `há ${hours}h ${remMin}min` : `há ${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return days === 1 ? 'há 1 dia' : `há ${days} dias`;
}

/** Turns a "HH:MM" string into today's epoch ms, or undefined if malformed. */
function parseTimeToday(time: string, referenceMs: number): number | undefined {
  const match = time.trim().match(/^([0-2]?\d):([0-5]\d)$/);
  if (!match) return undefined;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23) return undefined;
  const reference = new Date(referenceMs);
  return new Date(reference.getFullYear(), reference.getMonth(), reference.getDate(), hour, minute).getTime();
}

/**
 * Resolves a manually-typed "start/end" pair of "HH:MM" times (for logging a
 * past session the timer never ran for) into epoch ms. If the end time is
 * earlier than the start, assumes it crossed midnight (e.g. asleep 23:30,
 * woke up 06:00) and rolls it to the next day.
 */
export function resolveManualRange(
  startTime: string,
  endTime: string,
  referenceMs: number = Date.now()
): { startedAt: number; endedAt: number } | undefined {
  const startedAt = parseTimeToday(startTime, referenceMs);
  let endedAt = parseTimeToday(endTime, referenceMs);
  if (startedAt == null || endedAt == null) return undefined;
  if (endedAt < startedAt) endedAt += 24 * 60 * 60 * 1000;
  return { startedAt, endedAt };
}
