import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
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

  // Denormalized onto the invite itself — see records.ts's Invite comment
  // for why (the invitee can't read members/{uid} to look this up later).
  const selfSnap = await getDoc(doc(db, 'families', familyId, 'members', uid));
  const invitedByName = (selfSnap.data() as { name?: string } | undefined)?.name ?? null;

  const inviteRef = doc(collection(db, 'families', familyId, 'invites'));
  const invite: Invite = {
    id: inviteRef.id,
    email,
    invitedBy: uid,
    invitedByName,
    invitedAt: Date.now(),
    status: 'pending',
  };
  await setDoc(inviteRef, invite);
  return invite;
}
