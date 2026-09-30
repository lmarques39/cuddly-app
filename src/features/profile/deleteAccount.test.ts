import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteUser, reauthenticateWithCredential } from 'firebase/auth';
import { deleteDoc, getDoc, getDocs } from 'firebase/firestore';
import { auth } from '../../services/firebase';
import { loadList, STORAGE_KEYS } from '../../storage/storage';
import { TRACKER_COLLECTIONS } from '../../storage/sync';
import { AccountDeletionError, deleteMyAccount } from './deleteAccount';

const mockGetDoc = getDoc as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;
const mockDeleteDoc = deleteDoc as jest.Mock;
const mockDeleteUser = deleteUser as jest.Mock;
const mockReauth = reauthenticateWithCredential as jest.Mock;

type Ref = { segments: unknown[] };
const path = (ref: Ref) => ref.segments.slice(1).join('/');

function signInAs(providerId: 'password' | 'google.com', authTime = new Date().toISOString()) {
  Object.assign(auth, {
    currentUser: {
      uid: 'alice',
      email: 'alice@x.com',
      providerData: [{ providerId }],
      getIdTokenResult: jest.fn(async () => ({ authTime })),
    },
  });
}

function familyWithMembers(memberIds: string[]) {
  mockGetDocs.mockImplementation(async (ref: Ref) => {
    const name = ref.segments[ref.segments.length - 1];
    const ids = name === 'members' ? memberIds : name === 'invites' ? ['inv1'] : name === 'diapers' ? ['d1'] : [];
    return { docs: ids.map((id) => ({ id, ref: { segments: [...ref.segments, id] } })) };
  });
}

const deletedPaths = () => mockDeleteDoc.mock.calls.map(([ref]: [Ref]) => path(ref));

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ familyId: 'famA' }) });
});

it('deletes the whole family when the account is its only member', async () => {
  signInAs('password');
  familyWithMembers(['alice']);
  await AsyncStorage.setItem('@cuddly/outbox', JSON.stringify([{ id: 'o1' }]));
  await AsyncStorage.setItem(STORAGE_KEYS.diapers, JSON.stringify([{ id: 'd1' }]));

  await deleteMyAccount('segredo');

  expect(mockReauth).toHaveBeenCalledWith(auth.currentUser, { email: 'alice@x.com', password: 'segredo' });
  const deleted = deletedPaths();
  expect(deleted).toEqual(
    expect.arrayContaining([
      'families/famA/diapers/d1',
      'families/famA/profile/baby',
      'families/famA/invites/inv1',
      'families/famA',
      'families/famA/members/alice',
      'users/alice',
    ]),
  );
  // The member doc is what grants access to the rest — it must go last on the family side.
  expect(deleted.indexOf('families/famA/members/alice')).toBeGreaterThan(deleted.indexOf('families/famA'));
  expect(mockDeleteUser).toHaveBeenCalledWith(auth.currentUser);
  expect(await loadList('@cuddly/outbox')).toEqual([]);
  expect(await loadList(STORAGE_KEYS.diapers)).toEqual([]);
});

it('only removes this member when other caregivers remain in the family', async () => {
  signInAs('password');
  familyWithMembers(['alice', 'bob']);

  await deleteMyAccount('segredo');

  expect(deletedPaths()).toEqual(['families/famA/members/alice', 'users/alice']);
  // None of the family's data collections were even read.
  const readCollections = mockGetDocs.mock.calls.map(([ref]: [Ref]) => ref.segments[ref.segments.length - 1]);
  expect(readCollections).toEqual(['members']);
  expect(TRACKER_COLLECTIONS.some((c) => readCollections.includes(c))).toBe(false);
  expect(mockDeleteUser).toHaveBeenCalledTimes(1);
});

it('deletes nothing when the password is wrong', async () => {
  signInAs('password');
  familyWithMembers(['alice']);
  mockReauth.mockRejectedValueOnce(Object.assign(new Error('bad'), { code: 'auth/invalid-credential' }));

  await expect(deleteMyAccount('errada')).rejects.toThrow(new AccountDeletionError('Password incorreta.'));

  expect(mockDeleteDoc).not.toHaveBeenCalled();
  expect(mockDeleteUser).not.toHaveBeenCalled();
});

it('asks for the password on password accounts', async () => {
  signInAs('password');

  await expect(deleteMyAccount()).rejects.toThrow('Escreve a tua password para confirmar.');
  expect(mockDeleteDoc).not.toHaveBeenCalled();
});

it('asks a Google account with a stale login to sign in again, deleting nothing', async () => {
  signInAs('google.com', new Date(Date.now() - 10 * 60 * 1000).toISOString());
  familyWithMembers(['alice']);

  await expect(deleteMyAccount()).rejects.toThrow(/volta a entrar com o Google/);

  expect(mockDeleteDoc).not.toHaveBeenCalled();
  expect(mockDeleteUser).not.toHaveBeenCalled();
});

it('deletes a Google account with a fresh login without asking for a password', async () => {
  signInAs('google.com');
  familyWithMembers(['alice']);

  await deleteMyAccount();

  expect(mockReauth).not.toHaveBeenCalled();
  expect(mockDeleteUser).toHaveBeenCalledTimes(1);
});
