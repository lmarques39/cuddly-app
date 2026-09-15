import { deleteDoc, getDoc } from 'firebase/firestore';
import { auth } from '../../services/firebase';
import { removeCaregiver } from './removeCaregiver';

const mockGetDoc = getDoc as jest.Mock;
const mockDeleteDoc = deleteDoc as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// Must run before any test that successfully resolves a familyId: sync.ts
// caches it in a module-level variable for the life of the process.
it('throws when there is no signed-in family', async () => {
  Object.assign(auth, { currentUser: null });

  await expect(removeCaregiver('bob')).rejects.toThrow('Sem família associada');
  expect(mockDeleteDoc).not.toHaveBeenCalled();
});

it("deletes the given uid's member doc in the caller's family", async () => {
  Object.assign(auth, { currentUser: { uid: 'alice' } });
  mockGetDoc.mockResolvedValue({ data: () => ({ familyId: 'famA' }) });

  await removeCaregiver('bob');

  expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  const [ref] = mockDeleteDoc.mock.calls[0];
  expect(ref.segments).toEqual([{}, 'families', 'famA', 'members', 'bob']);
});
