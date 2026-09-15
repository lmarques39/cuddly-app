import { getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../../services/firebase';
import { inviteCaregiver } from './inviteCaregiver';

const mockGetDoc = getDoc as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// Must run before any test that successfully resolves a familyId: sync.ts
// caches it in a module-level variable for the life of the process (see
// sync.test.ts), so once cached, changing auth.currentUser has no effect.
it('throws when there is no signed-in family', async () => {
  Object.assign(auth, { currentUser: null });

  await expect(inviteCaregiver('bob@x.com')).rejects.toThrow('Sem família associada');
  expect(mockSetDoc).not.toHaveBeenCalled();
});

it("creates a pending invite for the given email under the caller's family", async () => {
  Object.assign(auth, { currentUser: { uid: 'alice' } });
  mockGetDoc.mockResolvedValue({ data: () => ({ familyId: 'famA' }) });

  const invite = await inviteCaregiver('bob@x.com');

  expect(mockSetDoc).toHaveBeenCalledTimes(1);
  expect(invite).toMatchObject({ email: 'bob@x.com', invitedBy: 'alice', status: 'pending' });
  expect(typeof invite.id).toBe('string');
  expect(invite.id.length).toBeGreaterThan(0);
});
