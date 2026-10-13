/** One thing that happened — a timed session (with an end) or a moment (a bottle, a nappy). */
export type CalendarEvent = {
  id: string;
  startedAt: number;
  endedAt?: number;
  /** What a tap on its mark shows, e.g. "14:32 · 12 min de duração". */
  label: string;
};

/** The part of an event that falls on one day's column, in minutes since that day's midnight. */
export type CalendarSegment = { event: CalendarEvent; dayIndex: number; startMin: number; endMin: number };

/** Midnight of `epochMs`'s day, plus `addDays` days — by calendar date, so DST days stay whole. */
export function dayStart(epochMs: number, addDays = 0): number {
  const d = new Date(epochMs);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + addDays).getTime();
}

/**
 * Places events on a `days`-column calendar starting at `firstDay` (a
 * midnight). A session that runs past midnight — a night's sleep — is
 * split, so it shows at the bottom of one column and the top of the next.
 */
export function layOutWeek(events: CalendarEvent[], firstDay: number, days = 7): CalendarSegment[] {
  const bounds = Array.from({ length: days + 1 }, (_, i) => dayStart(firstDay, i));
  const segments: CalendarSegment[] = [];
  events.forEach((event) => {
    const end = event.endedAt ?? event.startedAt;
    for (let i = 0; i < days; i++) {
      const from = Math.max(event.startedAt, bounds[i]);
      const to = Math.min(end, bounds[i + 1]);
      const isMoment = event.endedAt == null;
      const inDay = isMoment ? event.startedAt >= bounds[i] && event.startedAt < bounds[i + 1] : from < to;
      if (!inDay) continue;
      segments.push({ event, dayIndex: i, startMin: (from - bounds[i]) / 60000, endMin: (to - bounds[i]) / 60000 });
    }
  });
  return segments;
}

/**
 * Average per day over the shown days — counting only days that have
 * already started and, so a brand-new account doesn't read "0,3 por dia",
 * only from the first logged one. Null when there's nothing to average.
 */
export function averagePerDay(events: CalendarEvent[], firstDay: number, now: number, days = 7): number | null {
  const windowEnd = dayStart(firstDay, days);
  const inWindow = events.filter((e) => e.startedAt >= firstDay && e.startedAt < windowEnd);
  if (inWindow.length === 0) return null;
  const firstLogged = Math.min(...events.map((e) => e.startedAt));
  const from = Math.max(firstDay, dayStart(firstLogged));
  const to = Math.min(windowEnd, dayStart(now, 1));
  const countedDays = Math.max(1, Math.round((to - from) / (24 * 60 * 60 * 1000)));
  return inWindow.length / countedDays;
}
