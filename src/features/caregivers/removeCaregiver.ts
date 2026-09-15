import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { getFamilyId } from '../../storage/sync';

/**
 * Removes a caregiver from the signed-in user's family — deletes their
 * members/{uid} doc, which immediately revokes their access: every read/
 * write in firestore.rules gates on isFamilyMember(familyId), an exists()
 * check re-evaluated on every request, so there's no separate "access
 * token" to invalidate. Direct write, like createFamily.ts/inviteCaregiver.ts
 * — a one-shot action, not a tracker.
 */
export async function removeCaregiver(memberUid: string): Promise<void> {
  const familyId = await getFamilyId();
  if (!familyId) {
    throw new Error('Sem família associada — não é possível remover.');
  }

  await deleteDoc(doc(db, 'families', familyId, 'members', memberUid));
}
