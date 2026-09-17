import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useDiapers } from './useDiapers';

describe('useDiapers', () => {
  beforeEach(() => AsyncStorage.clear());

  it('registers an entry with the given type', async () => {
    const { result } = await renderHook(() => useDiapers());
    await waitFor(() => expect(result.current.entries).toEqual([]));

    await act(async () => result.current.register('wet'));

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]).toMatchObject({ type: 'wet' });
  });

  it('removes and updates an entry', async () => {
    const { result } = await renderHook(() => useDiapers());
    await act(async () => result.current.register('wet'));
    const [entry] = result.current.entries;

    await act(async () => result.current.update({ ...entry, type: 'both' }));
    expect(result.current.entries[0].type).toBe('both');

    await act(async () => result.current.remove(entry.id));
    expect(result.current.entries).toEqual([]);
  });
});
