import { getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../../services/firebase';
import { inviteCaregiver } from './inviteCaregiver';

const mockGetDoc = getDoc as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;

/**
 * getFamilyId() caches its result at module scope for the process lifetime
 * (see sync.test.ts), so a later test in this file may never call getDoc for
 * the users/{uid} lookup again — only for inviteCaregiver's own
 * members/{uid} self-lookup. Routing by the ref's segments (rather than call
 * order) keeps every test correct regardless of what got cached earlier.
 */
function mockFirestoreReads(familyId: string | null, selfMemberData: Record<string, unknown> | undefined) {
  mockGetDoc.mockImplementation((ref: { segments: unknown[] }) => {
    if (ref.segments.includes('members')) {
      return Promise.resolve({ data: () => selfMemberData });
    }
    return Promise.resolve({ data: () => (familyId ? { familyId } : undefined) });
  });
}

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

it("creates a pending invite for the given email under the caller's family, denormalizing the inviter's own name", async () => {
  Object.assign(auth, { currentUser: { uid: 'alice' } });
  mockFirestoreReads('famA', { name: 'Alice' });

  const invite = await inviteCaregiver('bob@x.com');

  expect(mockSetDoc).toHaveBeenCalledTimes(1);
  expect(invite).toMatchObject({ email: 'bob@x.com', invitedBy: 'alice', invitedByName: 'Alice', status: 'pending' });
  expect(typeof invite.id).toBe('string');
  expect(invite.id.length).toBeGreaterThan(0);
});

it('falls back to null for invitedByName when the inviter has no name on their member doc', async () => {
  Object.assign(auth, { currentUser: { uid: 'alice' } });
  mockFirestoreReads('famA', undefined);

  const invite = await inviteCaregiver('bob@x.com');

  expect(invite.invitedByName).toBeNull();
});
