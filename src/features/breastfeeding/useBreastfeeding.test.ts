import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useBreastfeeding } from './useBreastfeeding';

function useControlledClock(startAt = 1_700_000_000_000) {
  let now = startAt;
  jest.spyOn(Date, 'now').mockImplementation(() => now);
  return { advance: (ms: number) => (now += ms) };
}

describe('useBreastfeeding', () => {
  beforeEach(() => AsyncStorage.clear());
  afterEach(() => jest.restoreAllMocks());

  it('records a feed with the side given to start()', async () => {
    const clock = useControlledClock();
    const { result } = await renderHook(() => useBreastfeeding());
    await waitFor(() => expect(result.current.entries).toEqual([]));

    await act(async () => result.current.start('left'));
    clock.advance(10 * 60 * 1000);
    await act(async () => result.current.stop());

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]).toMatchObject({ side: 'left' });
  });

  it('removes and updates an entry, e.g. correcting the side after the fact', async () => {
    const { result } = await renderHook(() => useBreastfeeding());
    await act(async () => result.current.start('left'));
    await act(async () => result.current.stop());
    const [entry] = result.current.entries;

    await act(async () => result.current.update({ ...entry, side: 'right' }));
    expect(result.current.entries[0].side).toBe('right');

    await act(async () => result.current.remove(entry.id));
    expect(result.current.entries).toEqual([]);
  });
});
