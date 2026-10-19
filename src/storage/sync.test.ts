import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteDoc, getDoc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { auth } from '../services/firebase';
import { loadList } from './storage';
import {
  clearFamilyData,
  flushOutbox,
  getFamilyId,
  resetFamilyIdCache,
  subscribeToCollection,
  subscribeToDocument,
  syncEntry,
  TRACKER_COLLECTIONS,
} from './sync';

const mockGetDoc = getDoc as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;
const mockDeleteDoc = deleteDoc as jest.Mock;
const mockOnSnapshot = onSnapshot as jest.Mock;

const OUTBOX_KEY = '@cuddly/outbox';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Captures the listener subscribeTo*() hands onSnapshot, so a test can push snapshots into it. */
function captureSnapshotListener() {
  let listener: ((snap: unknown) => void) | null = null;
  mockOnSnapshot.mockImplementation((_ref, cb) => {
    listener = cb;
    return () => {};
  });
  return (snap: unknown) => listener!(snap);
}

const collectionSnap = (docs: { id: string; data: object }[], fromCache = false) => ({
  metadata: { fromCache },
  docs: docs.map((d) => ({ id: d.id, data: () => d.data })),
});

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  await resetFamilyIdCache();
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

    // every tracker collection x 2 docs each (from the mock above) + 1 profile doc
    expect(mockDeleteDoc).toHaveBeenCalledTimes(TRACKER_COLLECTIONS.length * 2 + 1);
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

describe('offline-first', () => {
  it('remembers the familyId on-device once read', async () => {
    expect(await getFamilyId()).toBe('fam1');
    expect(JSON.parse((await AsyncStorage.getItem('@cuddly/family-id/u1'))!)).toBe('fam1');
  });

  it('uses the on-device familyId on an offline start, without reading users/{uid}', async () => {
    await AsyncStorage.setItem('@cuddly/family-id/u1', JSON.stringify('famX'));
    mockGetDoc.mockRejectedValue(Object.assign(new Error('offline'), { code: 'unavailable' }));

    expect(await getFamilyId()).toBe('famX');
    expect(mockGetDoc).not.toHaveBeenCalled();
  });

  it('resolves null instead of throwing when offline with nothing cached, keeping the write queued', async () => {
    mockGetDoc.mockRejectedValue(Object.assign(new Error('offline'), { code: 'unavailable' }));

    await expect(syncEntry('diapers', 'd1', { id: 'd1', at: 1 })).resolves.toBeUndefined();

    expect(mockSetDoc).not.toHaveBeenCalled();
    expect(await loadList(OUTBOX_KEY)).toHaveLength(1);
  });

  it('drops a write Firestore refuses for good instead of retrying it forever', async () => {
    mockSetDoc.mockRejectedValueOnce(Object.assign(new Error('denied'), { code: 'permission-denied' }));

    await syncEntry('diapers', 'd1', { id: 'd1', at: 1 });

    expect(await loadList(OUTBOX_KEY)).toEqual([]);
  });

  it('runs one flush at a time, replaying the queue in order', async () => {
    mockSetDoc.mockRejectedValue(new Error('offline'));
    mockDeleteDoc.mockRejectedValue(new Error('offline'));
    await syncEntry('diapers', 'd1', { id: 'd1', at: 1 });
    await syncEntry('diapers', 'd1', null);
    mockSetDoc.mockReset().mockResolvedValue(undefined);
    mockDeleteDoc.mockReset().mockResolvedValue(undefined);

    await Promise.all([flushOutbox(), flushOutbox(), flushOutbox()]);

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    expect(mockSetDoc.mock.invocationCallOrder[0]).toBeLessThan(mockDeleteDoc.mock.invocationCallOrder[0]);
    expect(await loadList(OUTBOX_KEY)).toEqual([]);
  });

  it("ignores Firestore's from-cache snapshots, which would wipe the on-device list after an offline start", async () => {
    const emit = captureSnapshotListener();
    const onChange = jest.fn();
    subscribeToCollection('diapers', onChange);
    await flush();

    emit(collectionSnap([], true));
    await flush();

    expect(onChange).not.toHaveBeenCalled();
  });

  it('merges writes still queued offline into what the server sends when the connection returns', async () => {
    mockSetDoc.mockRejectedValue(new Error('offline'));
    mockDeleteDoc.mockRejectedValue(new Error('offline'));
    await syncEntry('diapers', 'new', { id: 'new', at: 3 }); // added offline
    await syncEntry('diapers', 'edited', { id: 'edited', at: 2, type: 'xixi' }); // edited offline
    await syncEntry('diapers', 'gone', null); // removed offline
    await syncEntry('sono', 'other', { id: 'other' }); // another collection — not merged here

    const emit = captureSnapshotListener();
    const onChange = jest.fn();
    subscribeToCollection('diapers', onChange);
    await flush();
    emit(
      collectionSnap([
        { id: 'edited', data: { id: 'edited', at: 2, type: 'coco' } },
        { id: 'gone', data: { id: 'gone', at: 1 } },
        { id: 'fromPartner', data: { id: 'fromPartner', at: 4 } },
      ]),
    );
    await flush();

    expect(onChange).toHaveBeenCalledWith([
      { id: 'edited', at: 2, type: 'xixi' },
      { id: 'fromPartner', at: 4 },
      { id: 'new', at: 3 },
    ]);
  });

  it('keeps a document edited offline over the older server copy', async () => {
    mockSetDoc.mockRejectedValue(new Error('offline'));
    await syncEntry('profile', 'baby', { name: 'Novo' });

    const emit = captureSnapshotListener();
    const onChange = jest.fn();
    subscribeToDocument('profile', 'baby', onChange);
    await flush();
    emit({ metadata: { fromCache: false }, exists: () => true, data: () => ({ name: 'Antigo' }) });
    await flush();

    expect(onChange).toHaveBeenCalledWith({ name: 'Novo' });
  });
});
