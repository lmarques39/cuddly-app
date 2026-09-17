import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useBottle } from './useBottle';

describe('useBottle', () => {
  beforeEach(() => AsyncStorage.clear());

  it('saves an entry with the given amount and type', async () => {
    const { result } = await renderHook(() => useBottle());
    await waitFor(() => expect(result.current.entries).toEqual([]));

    await act(async () => result.current.save(120, 'formula'));

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]).toMatchObject({ amountMl: 120, type: 'formula' });
  });

  it('removes and updates an entry, e.g. correcting a mistyped amount', async () => {
    const { result } = await renderHook(() => useBottle());
    await act(async () => result.current.save(120, 'formula'));
    const [entry] = result.current.entries;

    await act(async () => result.current.update({ ...entry, amountMl: 150 }));
    expect(result.current.entries[0].amountMl).toBe(150);

    await act(async () => result.current.remove(entry.id));
    expect(result.current.entries).toEqual([]);
  });
});
