import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useContractions } from './useContractions';

/** Controls Date.now() precisely instead of faking timers — the hook only ever reads Date.now(), never setTimeout/setInterval. */
function useControlledClock(startAt = 1_700_000_000_000) {
  let now = startAt;
  jest.spyOn(Date, 'now').mockImplementation(() => now);
  return {
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe('useContractions', () => {
  beforeEach(() => AsyncStorage.clear());

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts with nothing running and an empty history', async () => {
    const { result } = await renderHook(() => useContractions());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.runningSince).toBeNull();
    expect(result.current.entries).toEqual([]);
    expect(result.current.fiveOneOne).toBe(false);
  });

  it('records a contraction with the timestamps it started and stopped at', async () => {
    const clock = useControlledClock();
    const { result } = await renderHook(() => useContractions());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    const startedAt = Date.now();
    await act(async () => result.current.start());
    expect(result.current.runningSince).toBe(startedAt);

    clock.advance(60_000);
    await act(async () => result.current.stop());

    await waitFor(() => expect(result.current.entries).toHaveLength(1));
    expect(result.current.runningSince).toBeNull();
    expect(result.current.entries[0]).toMatchObject({ startedAt, endedAt: startedAt + 60_000 });
  });

  it('does not flag the 5-1-1 pattern for a single short contraction', async () => {
    const clock = useControlledClock();
    const { result } = await renderHook(() => useContractions());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => result.current.start());
    clock.advance(30_000);
    await act(async () => result.current.stop());

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.fiveOneOne).toBe(false);
  });

  it('flags the 5-1-1 pattern after three consecutive matching contractions', async () => {
    const clock = useControlledClock();
    const { result } = await renderHook(() => useContractions());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    // 3 contractions, each 70s long, 4min apart start-to-start (the "1" and "5" of 5-1-1).
    const DURATION_MS = 70_000;
    const START_TO_START_MS = 4 * 60_000;
    for (let i = 0; i < 3; i++) {
      await act(async () => result.current.start());
      clock.advance(DURATION_MS);
      await act(async () => result.current.stop());
      clock.advance(START_TO_START_MS - DURATION_MS);
    }

    expect(result.current.fiveOneOne).toBe(true);
  });

  it('removes and updates an entry', async () => {
    const clock = useControlledClock();
    const { result } = await renderHook(() => useContractions());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => result.current.start());
    clock.advance(60_000);
    await act(async () => result.current.stop());
    const [entry] = result.current.entries;

    await act(async () => result.current.update({ ...entry, endedAt: entry.endedAt + 1000 }));
    expect(result.current.entries[0].endedAt).toBe(entry.endedAt + 1000);

    await act(async () => result.current.remove(entry.id));
    expect(result.current.entries).toEqual([]);
  });
});
