import { canContinue, CONTINUE_WINDOW_MS, entryDurationMs, runningElapsedMs, withEditedTimes } from './sessionTime';

const MIN = 60 * 1000;

describe('entryDurationMs', () => {
  it('leaves pauses out of the duration (#127)', () => {
    expect(entryDurationMs({ startedAt: 0, endedAt: 30 * MIN })).toBe(30 * MIN);
    expect(entryDurationMs({ startedAt: 0, endedAt: 30 * MIN, pausedMs: 5 * MIN })).toBe(25 * MIN);
  });
});

describe('runningElapsedMs', () => {
  it('counts up while running and stands still while paused', () => {
    expect(runningElapsedMs({ startedAt: 0 }, 10 * MIN)).toBe(10 * MIN);
    expect(runningElapsedMs({ startedAt: 0, pausedMs: 2 * MIN }, 10 * MIN)).toBe(8 * MIN);
    expect(runningElapsedMs({ startedAt: 0, pausedAt: 6 * MIN, pausedMs: 2 * MIN }, 60 * MIN)).toBe(4 * MIN);
  });
});

describe('withEditedTimes', () => {
  const entry = { id: 'a', startedAt: 0, endedAt: 30 * MIN, pausedMs: 5 * MIN };

  it('keeps the pause when only other fields change', () => {
    expect(withEditedTimes(entry, 0, 30 * MIN)).toBe(entry);
  });

  it('drops it once the times are typed in again — they now say how long it was', () => {
    expect(withEditedTimes(entry, 0, 20 * MIN)).toEqual({ id: 'a', startedAt: 0, endedAt: 20 * MIN });
  });
});

describe('canContinue', () => {
  it('only offers a session that ended within the window', () => {
    const last = { startedAt: 0, endedAt: 10 * MIN };
    expect(canContinue(last, 10 * MIN + CONTINUE_WINDOW_MS)).toBe(true);
    expect(canContinue(last, 10 * MIN + CONTINUE_WINDOW_MS + 1)).toBe(false);
    expect(canContinue(undefined, 0)).toBe(false);
  });
});
