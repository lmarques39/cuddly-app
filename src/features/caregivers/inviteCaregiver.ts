import { collection, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { getFamilyId } from '../../storage/sync';
import { Invite } from '../../types/records';

/**
 * Creates a pending invite at families/{familyId}/invites/{inviteId} for the
 * signed-in user's own family. Direct Firestore write, like createFamily.ts —
 * an invite is a one-shot action, not a tracker entry, so it doesn't go
 * through storage.ts/sync.ts's AsyncStorage outbox.
 */
export async function inviteCaregiver(email: string): Promise<Invite> {
  const familyId = await getFamilyId();
  const uid = auth.currentUser?.uid;
  if (!familyId || !uid) {
    throw new Error('Sem família associada — não é possível convidar.');
  }

  const inviteRef = doc(collection(db, 'families', familyId, 'invites'));
  const invite: Invite = {
    id: inviteRef.id,
    email,
    invitedBy: uid,
    invitedAt: Date.now(),
    status: 'pending',
  };
  await setDoc(inviteRef, invite);
  return invite;
}
