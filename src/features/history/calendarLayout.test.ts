import { averagePerDay, CalendarEvent, dayStart, layOutWeek } from './calendarLayout';

const monday = new Date(2026, 9, 5).getTime(); // 2026-10-05 00:00
const at = (day: number, h: number, m = 0) => new Date(2026, 9, 5 + day, h, m).getTime();
const ev = (startedAt: number, endedAt?: number): CalendarEvent => ({ id: String(startedAt), startedAt, endedAt, label: '' });

describe('layOutWeek', () => {
  it('places a session in its day column by start time and length (#129)', () => {
    const [segment] = layOutWeek([ev(at(1, 14, 30), at(1, 15, 0))], monday);
    expect(segment).toMatchObject({ dayIndex: 1, startMin: 14.5 * 60, endMin: 15 * 60 });
  });

  it('splits a night across midnight into two columns', () => {
    const segments = layOutWeek([ev(at(2, 22), at(3, 6))], monday);
    expect(segments.map(({ dayIndex, startMin, endMin }) => ({ dayIndex, startMin, endMin }))).toEqual([
      { dayIndex: 2, startMin: 22 * 60, endMin: 24 * 60 },
      { dayIndex: 3, startMin: 0, endMin: 6 * 60 },
    ]);
  });

  it('shows moments (no end) as a point, and leaves out what falls outside the week', () => {
    const segments = layOutWeek([ev(at(0, 9)), ev(at(-1, 9)), ev(at(7, 9))], monday);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({ dayIndex: 0, startMin: 9 * 60, endMin: 9 * 60 });
  });
});

describe('averagePerDay', () => {
  it('averages over the days that have started, from the first logged day on', () => {
    // Logging began on Wednesday; it's Thursday afternoon → 2 days, 6 feeds.
    const events = [2, 2, 2, 3, 3, 3].map((d, i) => ev(at(d, 8 + i)));
    expect(averagePerDay(events, monday, at(3, 15))).toBe(3);
  });

  it('is null for an empty week', () => {
    expect(averagePerDay([ev(at(-3, 9))], monday, at(3, 15))).toBeNull();
  });

  it('uses whole calendar days', () => {
    expect(dayStart(at(1, 23, 59))).toBe(at(1, 0));
  });
});
