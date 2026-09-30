import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteDoc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { auth } from '../services/firebase';
import { loadList } from './storage';
import { clearFamilyData, flushOutbox, getFamilyId, resetFamilyIdCache, syncEntry } from './sync';

const mockGetDoc = getDoc as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;
const mockDeleteDoc = deleteDoc as jest.Mock;

const OUTBOX_KEY = '@cuddly/outbox';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  Object.assign(auth, { currentUser: { uid: 'u1' } });
  mockGetDoc.mockResolvedValue({ data: () => ({ familyId: 'fam1' }) });
});

it('queues the entry locally but never calls Firestore without a signed-in family', async () => {
  Object.assign(auth, { currentUser: null });

  await syncEntry('contractions', 'e1', { id: 'e1', startedAt: 1, endedAt: 2 });

  expect(mockSetDoc).not.toHaveBeenCalled();
  const outbox = await loadList<{ entryId: string }>(OUTBOX_KEY);
  expect(outbox).toHaveLength(1);
  expect(outbox[0].entryId).toBe('e1');
});

describe('syncEntry', () => {
  it('writes straight to Firestore and leaves the outbox empty when online', async () => {
    mockSetDoc.mockResolvedValueOnce(undefined);

    await syncEntry('contractions', 'e1', { id: 'e1', startedAt: 1, endedAt: 2 });

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(await loadList(OUTBOX_KEY)).toEqual([]);
  });

  it('keeps the entry queued when the Firestore write fails (offline)', async () => {
    mockSetDoc.mockRejectedValueOnce(new Error('network error'));

    await syncEntry('contractions', 'e1', { id: 'e1', startedAt: 1, endedAt: 2 });

    const outbox = await loadList<{ entryId: string }>(OUTBOX_KEY);
    expect(outbox).toHaveLength(1);
    expect(outbox[0].entryId).toBe('e1');
  });
});

describe('flushOutbox', () => {
  it('retries queued entries and clears them once Firestore accepts the write', async () => {
    mockSetDoc.mockRejectedValueOnce(new Error('network error'));
    await syncEntry('contractions', 'e1', { id: 'e1', startedAt: 1, endedAt: 2 });
    expect(await loadList(OUTBOX_KEY)).toHaveLength(1);

    mockSetDoc.mockResolvedValueOnce(undefined);
    await flushOutbox();

    expect(await loadList(OUTBOX_KEY)).toEqual([]);
  });

  it('leaves entries queued if the retry fails again', async () => {
    mockSetDoc.mockRejectedValue(new Error('still offline'));
    await syncEntry('contractions', 'e1', { id: 'e1', startedAt: 1, endedAt: 2 });

    await flushOutbox();

    expect(await loadList(OUTBOX_KEY)).toHaveLength(1);
  });
});

describe('clearFamilyData', () => {
  it('deletes every doc across all tracker collections plus the baby profile', async () => {
    mockGetDocs.mockResolvedValue({ docs: [{ ref: 'ref-a' }, { ref: 'ref-b' }] });
    mockDeleteDoc.mockResolvedValue(undefined);

    await clearFamilyData();

    // 7 tracker collections x 2 docs each (from the mock above) + 1 profile doc
    expect(mockDeleteDoc).toHaveBeenCalledTimes(15);
  });
});

describe('getFamilyId', () => {
  it("re-reads users/{uid} when another account signs in, instead of reusing the previous account's family (#86)", async () => {
    Object.assign(auth, { currentUser: { uid: 'alice' } });
    mockGetDoc.mockResolvedValueOnce({ data: () => ({ familyId: 'famAlice' }) });
    expect(await getFamilyId()).toBe('famAlice');
    expect(await getFamilyId()).toBe('famAlice'); // cached for the same uid

    Object.assign(auth, { currentUser: { uid: 'bob' } });
    mockGetDoc.mockResolvedValueOnce({ data: () => ({ familyId: 'famBob' }) });
    expect(await getFamilyId()).toBe('famBob');
    expect(mockGetDoc).toHaveBeenCalledTimes(2);
  });

  it('re-reads users/{uid} after resetFamilyIdCache()', async () => {
    Object.assign(auth, { currentUser: { uid: 'carol' } });
    mockGetDoc.mockResolvedValueOnce({ data: () => ({ familyId: 'famOld' }) });
    expect(await getFamilyId()).toBe('famOld');

    resetFamilyIdCache();
    mockGetDoc.mockResolvedValueOnce({ data: () => ({}) });
    expect(await getFamilyId()).toBeNull();
  });
});
