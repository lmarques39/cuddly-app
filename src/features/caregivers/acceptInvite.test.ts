import { getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { acceptInvite, getPendingInvitesForEmail, PendingInvite } from './acceptInvite';

const mockGetDocs = getDocs as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getPendingInvitesForEmail', () => {
  it('returns an empty list when there are no matching invites', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    expect(await getPendingInvitesForEmail('bob@x.com')).toEqual([]);
  });

  it('maps each doc to an Invite plus the familyId read from its parent path', async () => {
    const invite = { id: 'inv1', email: 'bob@x.com', invitedBy: 'alice', invitedAt: 1, status: 'pending' };
    mockGetDocs.mockResolvedValue({
      docs: [{ data: () => invite, ref: { parent: { parent: { id: 'famA' } } } }],
    });

    const result = await getPendingInvitesForEmail('bob@x.com');

    expect(result).toEqual([{ ...invite, familyId: 'famA' }]);
  });
});

describe('acceptInvite', () => {
  const invite: PendingInvite = {
    id: 'inv1',
    email: 'bob@x.com',
    invitedBy: 'alice',
    invitedByName: 'Alice',
    invitedAt: 1,
    status: 'pending',
    familyId: 'famA',
  };

  it("creates the member doc as 'cuidador', points users/{uid} at the family, and marks the invite accepted", async () => {
    await acceptInvite(invite, 'bob', 'Bob');

    expect(mockSetDoc).toHaveBeenCalledTimes(2);
    expect(mockSetDoc.mock.calls[0][1]).toMatchObject({ name: 'Bob', role: 'cuidador', email: 'bob@x.com' });
    expect(mockSetDoc.mock.calls[1][1]).toEqual({ familyId: 'famA' });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    expect(mockUpdateDoc.mock.calls[0][1]).toEqual({ status: 'accepted' });
  });
});
