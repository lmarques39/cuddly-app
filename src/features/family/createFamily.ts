import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ParentInfo } from '../auth/RegisterParentScreen';
import { db } from '../../services/firebase';

/**
 * Creates the family/member structure firestore.rules already expects
 * (families/{familyId}, families/{familyId}/members/{uid}) and points
 * users/{uid} at it. Called once, right after sign-up, from the
 * "Sobre ti" step — see App.tsx's handleParentContinue.
 */
export async function createFamilyForUser(uid: string, parent: ParentInfo): Promise<string> {
  const familyId = doc(collection(db, 'families')).id;

  await setDoc(doc(db, 'families', familyId), { createdAt: serverTimestamp() });

  await setDoc(doc(db, 'families', familyId, 'members', uid), {
    name: parent.name,
    role: parent.role,
    email: parent.email,
    phone: parent.phone || null,
    joinedAt: serverTimestamp(),
  });

  await setDoc(doc(db, 'users', uid), { familyId }, { merge: true });

  return familyId;
}
