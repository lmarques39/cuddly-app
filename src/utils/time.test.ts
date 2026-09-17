import { parseDayOnly, resolveManualRange } from './time';

describe('resolveManualRange', () => {
  const day = new Date(2026, 8, 17, 12, 0, 0).getTime(); // 2026-09-17, the chosen day

  it('resolves a same-day start/end pair', () => {
    const range = resolveManualRange(day, '13:30', '14:15');

    expect(range).toEqual({
      startedAt: new Date(2026, 8, 17, 13, 30).getTime(),
      endedAt: new Date(2026, 8, 17, 14, 15).getTime(),
    });
  });

  it('rolls the end time to the next day when it is earlier than the start (overnight sleep)', () => {
    const range = resolveManualRange(day, '23:30', '06:00');

    expect(range).toEqual({
      startedAt: new Date(2026, 8, 17, 23, 30).getTime(),
      endedAt: new Date(2026, 8, 18, 6, 0).getTime(),
    });
  });

  it('returns undefined for a malformed time', () => {
    expect(resolveManualRange(day, '25:00', '10:00')).toBeUndefined();
    expect(resolveManualRange(day, '10:00', 'abc')).toBeUndefined();
  });
});

describe('parseDayOnly', () => {
  const referenceMs = new Date(2026, 8, 17).getTime(); // 2026-09-17, used only for the year

  it('parses a "DD/MM" string onto the reference year', () => {
    expect(parseDayOnly('05/03', referenceMs)).toBe(new Date(2026, 2, 5).getTime());
  });

  it('returns undefined for a date that does not exist', () => {
    expect(parseDayOnly('31/02', referenceMs)).toBeUndefined();
  });

  it('returns undefined for malformed input', () => {
    expect(parseDayOnly('ontem', referenceMs)).toBeUndefined();
    expect(parseDayOnly('', referenceMs)).toBeUndefined();
  });
});
