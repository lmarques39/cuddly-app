import { resolveManualRange } from './time';

describe('resolveManualRange', () => {
  const noon = new Date(2026, 8, 17, 12, 0, 0).getTime(); // 2026-09-17 12:00, fixed reference "today"

  it('resolves a same-day start/end pair', () => {
    const range = resolveManualRange('13:30', '14:15', noon);

    expect(range).toEqual({
      startedAt: new Date(2026, 8, 17, 13, 30).getTime(),
      endedAt: new Date(2026, 8, 17, 14, 15).getTime(),
    });
  });

  it('rolls the end time to the next day when it is earlier than the start (overnight sleep)', () => {
    const range = resolveManualRange('23:30', '06:00', noon);

    expect(range).toEqual({
      startedAt: new Date(2026, 8, 17, 23, 30).getTime(),
      endedAt: new Date(2026, 8, 18, 6, 0).getTime(),
    });
  });

  it('returns undefined for a malformed time', () => {
    expect(resolveManualRange('25:00', '10:00', noon)).toBeUndefined();
    expect(resolveManualRange('10:00', 'abc', noon)).toBeUndefined();
  });
});
