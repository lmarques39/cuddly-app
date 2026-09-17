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

/** Turns a "HH:MM" string into an epoch ms on the given day, or undefined if malformed. */
function parseTimeOnDay(time: string, dayMs: number): number | undefined {
  const match = time.trim().match(/^([0-2]?\d):([0-5]\d)$/);
  if (!match) return undefined;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23) return undefined;
  const day = new Date(dayMs);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute).getTime();
}

/**
 * Parses a "DD/MM" string into that day's epoch ms, assuming the current
 * year (referenceMs). Returns undefined if malformed or not a real date
 * (e.g. 31/02).
 */
export function parseDayOnly(dateStr: string, referenceMs: number = Date.now()): number | undefined {
  const match = dateStr.trim().match(/^([0-3]?\d)\/([0-1]?\d)$/);
  if (!match) return undefined;
  const day = Number(match[1]);
  const month = Number(match[2]);
  if (day < 1 || month < 1 || month > 12) return undefined;
  const year = new Date(referenceMs).getFullYear();
  const date = new Date(year, month - 1, day);
  if (date.getMonth() !== month - 1) return undefined; // rolled over — not a real date
  return date.getTime();
}

/**
 * Resolves a manually-typed "start/end" pair of "HH:MM" times on a given day
 * (for logging a past session the timer never ran for) into epoch ms. If the
 * end time is earlier than the start, assumes it crossed midnight (e.g.
 * asleep 23:30, woke up 06:00) and rolls it to the next day.
 */
export function resolveManualRange(
  dayMs: number,
  startTime: string,
  endTime: string
): { startedAt: number; endedAt: number } | undefined {
  const startedAt = parseTimeOnDay(startTime, dayMs);
  let endedAt = parseTimeOnDay(endTime, dayMs);
  if (startedAt == null || endedAt == null) return undefined;
  if (endedAt < startedAt) endedAt += 24 * 60 * 60 * 1000;
  return { startedAt, endedAt };
}
