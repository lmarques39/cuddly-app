import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { getDoc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { auth } from '../../services/firebase';
import { loadList, STORAGE_KEYS } from '../../storage/storage';
import { FoodEntry } from '../../types/records';
import { useFoods } from './useFoods';

const mockGetDoc = getDoc as jest.Mock;
const mockOnSnapshot = onSnapshot as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;
const mockDeleteDoc = deleteDoc as jest.Mock;

type Ref = { segments: unknown[] };
const path = (ref: Ref) => ref.segments.slice(1).join('/');

const day = (d: number) => new Date(2026, 9, d, 12, 0).getTime();
const carrot: Omit<FoodEntry, 'id'> = { food: 'Cenoura', introducedAt: day(1), preparation: 'puré', reaction: 'nenhuma' };

async function renderLoaded() {
  const hook = await renderHook(() => useFoods());
  await waitFor(() => expect(hook.result.current.loaded).toBe(true));
  return hook;
}

describe('useFoods', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    Object.assign(auth, { currentUser: { uid: 'alice' } });
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ familyId: 'famA' }) });
    mockOnSnapshot.mockImplementation(() => () => {});
  });

  it('starts empty', async () => {
    const { result } = await renderLoaded();
    expect(result.current.entries).toEqual([]);
    expect(result.current.withReaction).toEqual([]);
  });

  it('saves a food locally and to families/{familyId}/foods/{id}', async () => {
    const { result } = await renderLoaded();

    await act(async () => {
      await result.current.save({ ...carrot, food: '  Cenoura ' });
    });

    const [saved] = result.current.entries;
    expect(saved).toMatchObject({ ...carrot, food: 'Cenoura', id: expect.any(String) });
    expect(await loadList(STORAGE_KEYS.foods)).toEqual([saved]);
    await waitFor(() => expect(mockSetDoc).toHaveBeenCalled());
    expect(path(mockSetDoc.mock.calls[0][0])).toBe(`families/famA/foods/${saved.id}`);
  });

  it('lists newest first even when a food is logged with an earlier date', async () => {
    const { result } = await renderLoaded();

    await act(async () => {
      await result.current.save({ ...carrot, food: 'Abóbora', introducedAt: day(5) });
      await result.current.save({ ...carrot, food: 'Banana', introducedAt: day(3) }); // backdated
    });

    expect(result.current.entries.map((e) => e.food)).toEqual(['Abóbora', 'Banana']);
  });

  it('picks out the foods that caused a reaction', async () => {
    const { result } = await renderLoaded();

    await act(async () => {
      await result.current.save(carrot);
      await result.current.save({ ...carrot, food: 'Ovo', introducedAt: day(2), reaction: 'forte', reactionNotes: 'manchas' });
    });

    expect(result.current.withReaction.map((e) => e.food)).toEqual(['Ovo']);
  });

  it('knows a food was already introduced, ignoring case, spaces and accents', async () => {
    const { result } = await renderLoaded();
    await act(async () => {
      await result.current.save({ ...carrot, food: 'Maçã' });
    });

    expect(result.current.isAlreadyIntroduced(' maca')).toBe(true);
    expect(result.current.isAlreadyIntroduced('Pera')).toBe(false);
  });

  it('updates and removes an entry, locally and in Firestore', async () => {
    const { result } = await renderLoaded();
    await act(async () => {
      await result.current.save(carrot);
    });
    const [saved] = result.current.entries;

    await act(async () => result.current.update({ ...saved, reaction: 'ligeira' }));
    await waitFor(() => expect(result.current.entries[0].reaction).toBe('ligeira'));

    await act(async () => result.current.remove(saved.id));
    await waitFor(() => expect(result.current.entries).toEqual([]));
    await waitFor(() => expect(mockDeleteDoc).toHaveBeenCalled());
    expect(path(mockDeleteDoc.mock.calls[0][0])).toBe(`families/famA/foods/${saved.id}`);
  });

  it('takes Firestore as the source of truth once it arrives', async () => {
    let push: (docs: { id: string; data: object }[]) => void = () => {};
    mockOnSnapshot.mockImplementation((_ref, cb) => {
      push = (docs) => cb({ docs: docs.map((d) => ({ id: d.id, data: () => d.data })) });
      return () => {};
    });
    const { result } = await renderLoaded();
    await waitFor(() => expect(mockOnSnapshot).toHaveBeenCalled());

    const fromOtherCaregiver = { ...carrot, id: 'f9', food: 'Batata-doce' };
    await act(async () => push([{ id: 'f9', data: fromOtherCaregiver }]));

    expect(result.current.entries).toEqual([fromOtherCaregiver]);
    expect(await loadList(STORAGE_KEYS.foods)).toEqual([fromOtherCaregiver]);
  });
});
