import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useSono } from './useSono';

/** Controls Date.now() precisely — the hook only ever reads Date.now(), never setTimeout/setInterval. */
function useControlledClock(startAt = 1_700_000_000_000) {
  let now = startAt;
  jest.spyOn(Date, 'now').mockImplementation(() => now);
  return {
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe('useSono', () => {
  beforeEach(() => AsyncStorage.clear());

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts with nothing running and an empty history', async () => {
    const { result } = await renderHook(() => useSono());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.runningSince).toBeNull();
    expect(result.current.entries).toEqual([]);
  });

  it('records a sleep session with the timestamps it started and stopped at', async () => {
    const clock = useControlledClock();
    const { result } = await renderHook(() => useSono());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    const startedAt = Date.now();
    await act(async () => result.current.start());
    expect(result.current.runningSince).toBe(startedAt);

    clock.advance(8 * 60 * 60 * 1000); // 8h nap
    await act(async () => result.current.stop());

    expect(result.current.runningSince).toBeNull();
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]).toMatchObject({
      startedAt,
      endedAt: startedAt + 8 * 60 * 60 * 1000,
    });
  });

  it('does nothing when stop is called without a running session', async () => {
    const { result } = await renderHook(() => useSono());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => result.current.stop());

    expect(result.current.entries).toEqual([]);
  });

  it('sorts entries newest-first across multiple sessions', async () => {
    const clock = useControlledClock();
    const { result } = await renderHook(() => useSono());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => result.current.start());
    clock.advance(60 * 60 * 1000);
    await act(async () => result.current.stop());

    clock.advance(60 * 60 * 1000);

    const secondStart = Date.now();
    await act(async () => result.current.start());
    clock.advance(30 * 60 * 1000);
    await act(async () => result.current.stop());

    expect(result.current.entries).toHaveLength(2);
    expect(result.current.entries[0].startedAt).toBe(secondStart);
  });

  it('logs a manual entry with explicit start/end times, without touching runningSince', async () => {
    const { result } = await renderHook(() => useSono());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => result.current.addManual(1_700_000_000_000, 1_700_028_800_000));

    expect(result.current.runningSince).toBeNull();
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]).toMatchObject({
      startedAt: 1_700_000_000_000,
      endedAt: 1_700_028_800_000,
    });
  });

  it('removes and updates an entry', async () => {
    const { result } = await renderHook(() => useSono());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => result.current.start());
    await act(async () => result.current.stop());
    const [entry] = result.current.entries;

    await act(async () => result.current.update({ ...entry, endedAt: entry.endedAt + 1000 }));
    expect(result.current.entries[0].endedAt).toBe(entry.endedAt + 1000);

    await act(async () => result.current.remove(entry.id));
    expect(result.current.entries).toEqual([]);
  });
});
