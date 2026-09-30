import { setDoc } from 'firebase/firestore';
import { createFamilyForUser } from './createFamily';

const mockSetDoc = setDoc as jest.Mock;

it('records the creator as createdBy — firestore.rules only lets the founder bootstrap the first member doc (#87)', async () => {
  const familyId = await createFamilyForUser('alice', { name: 'Alice', role: 'mae', email: 'alice@x.com', phone: '' });

  const [familyRef, familyData] = mockSetDoc.mock.calls[0];
  expect(familyRef.segments.slice(1)).toEqual(['families', familyId]);
  expect(familyData).toMatchObject({ createdBy: 'alice' });

  const [memberRef] = mockSetDoc.mock.calls[1];
  expect(memberRef.segments.slice(1)).toEqual(['families', familyId, 'members', 'alice']);
});
