import AsyncStorage from '@react-native-async-storage/async-storage';
import { addToList, isToday, loadList, loadObject, makeId, saveList, saveObject } from './storage';

const KEY = '@cuddly-test/list';
const OBJ_KEY = '@cuddly-test/object';

beforeEach(() => AsyncStorage.clear());

describe('loadList / saveList / addToList', () => {
  it('returns an empty array when nothing is stored yet', async () => {
    expect(await loadList(KEY)).toEqual([]);
  });

  it('round-trips a list through save and load', async () => {
    await saveList(KEY, [{ id: 'a' }, { id: 'b' }]);
    expect(await loadList(KEY)).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  it('prepends new items, most recent first', async () => {
    await saveList(KEY, [{ id: 'old' }]);
    const next = await addToList(KEY, { id: 'new' });
    expect(next).toEqual([{ id: 'new' }, { id: 'old' }]);
    expect(await loadList(KEY)).toEqual(next);
  });

  it('returns an empty array for corrupted JSON instead of throwing', async () => {
    await AsyncStorage.setItem(KEY, 'not json');
    expect(await loadList(KEY)).toEqual([]);
  });
});

describe('loadObject / saveObject', () => {
  it('returns null when nothing is stored yet', async () => {
    expect(await loadObject(OBJ_KEY)).toBeNull();
  });

  it('round-trips an object through save and load', async () => {
    await saveObject(OBJ_KEY, { name: 'Manuel' });
    expect(await loadObject(OBJ_KEY)).toEqual({ name: 'Manuel' });
  });
});

describe('makeId', () => {
  it('produces unique, non-empty ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => makeId()));
    expect(ids.size).toBe(50);
    ids.forEach((id) => expect(id.length).toBeGreaterThan(0));
  });
});

describe('isToday', () => {
  it('is true for the current moment', () => {
    expect(isToday(Date.now())).toBe(true);
  });

  it('is false for a week ago', () => {
    expect(isToday(Date.now() - 7 * 24 * 60 * 60 * 1000)).toBe(false);
  });
});
