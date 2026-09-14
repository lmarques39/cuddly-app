import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../services/firebase';
import { migrateLocalDataToFirestore } from './migrate';
import { saveList, saveObject, STORAGE_KEYS } from './storage';

const mockGetDoc = getDoc as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  Object.assign(auth, { currentUser: { uid: 'u1' } });
  mockGetDoc.mockResolvedValue({ data: () => ({ familyId: 'fam1' }) });
  mockSetDoc.mockResolvedValue(undefined);
});

it('pushes every existing local entry and the baby profile to Firestore', async () => {
  await saveList(STORAGE_KEYS.contractions, [{ id: 'c1', startedAt: 1, endedAt: 2 }]);
  await saveList(STORAGE_KEYS.diapers, [{ id: 'd1', type: 'wet', at: 3 }]);
  await saveObject(STORAGE_KEYS.babyProfile, { name: 'Manuel' });

  await migrateLocalDataToFirestore('u1');

  expect(mockSetDoc).toHaveBeenCalledTimes(3);
});

it('does nothing on a second call once the migration flag is set', async () => {
  await saveList(STORAGE_KEYS.contractions, [{ id: 'c1', startedAt: 1, endedAt: 2 }]);

  await migrateLocalDataToFirestore('u1');
  expect(mockSetDoc).toHaveBeenCalledTimes(1);

  mockSetDoc.mockClear();
  await migrateLocalDataToFirestore('u1');

  expect(mockSetDoc).not.toHaveBeenCalled();
});

it('runs independently per uid', async () => {
  await saveList(STORAGE_KEYS.contractions, [{ id: 'c1', startedAt: 1, endedAt: 2 }]);

  await migrateLocalDataToFirestore('u1');
  mockSetDoc.mockClear();

  await migrateLocalDataToFirestore('u2');

  expect(mockSetDoc).toHaveBeenCalledTimes(1);
});
