import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { usePumping } from './usePumping';

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

describe('usePumping', () => {
  beforeEach(() => AsyncStorage.clear());

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts with nothing running and an empty history', async () => {
    const { result } = await renderHook(() => usePumping());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.runningSince).toBeNull();
    expect(result.current.entries).toEqual([]);
  });

  it('records a pumping session with the amount given to stop()', async () => {
    const clock = useControlledClock();
    const { result } = await renderHook(() => usePumping());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    const startedAt = Date.now();
    await act(async () => result.current.start());
    expect(result.current.runningSince).toBe(startedAt);

    clock.advance(15 * 60 * 1000); // 15 min session
    await act(async () => result.current.stop(120));

    expect(result.current.runningSince).toBeNull();
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]).toMatchObject({
      startedAt,
      endedAt: startedAt + 15 * 60 * 1000,
      amountMl: 120,
    });
  });

  it('does nothing when stop is called without a running session', async () => {
    const { result } = await renderHook(() => usePumping());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => result.current.stop(120));

    expect(result.current.entries).toEqual([]);
  });
});
