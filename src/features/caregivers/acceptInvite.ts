import { collectionGroup, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Invite } from '../../types/records';

export type PendingInvite = Invite & { familyId: string };

/**
 * Finds every pending invite addressed to this email, across any family —
 * a collectionGroup query, since we don't know the familyId up front (this
 * runs at login, before the invitee necessarily has a users/{uid} doc).
 * firestore.rules' invites read rule (email match) covers this: Firestore
 * only returns documents the caller is allowed to read.
 */
export async function getPendingInvitesForEmail(email: string): Promise<PendingInvite[]> {
  const q = query(collectionGroup(db, 'invites'), where('email', '==', email), where('status', '==', 'pending'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as Invite), familyId: d.ref.parent.parent!.id }));
}

/**
 * Accepts a pending invite: creates the invitee's members/{uid} doc in the
 * inviting family (same bootstrap shape as createFamily.ts, but joining an
 * existing family instead of creating a new one), points users/{uid} at it,
 * and flips the invite to accepted. Always joins as 'cuidador' — that's what
 * accepting a caregiver invite means, no role picker needed here.
 */
export async function acceptInvite(invite: PendingInvite, uid: string, name: string): Promise<void> {
  await setDoc(doc(db, 'families', invite.familyId, 'members', uid), {
    name,
    role: 'cuidador',
    email: invite.email,
    joinedAt: serverTimestamp(),
  });

  await setDoc(doc(db, 'users', uid), { familyId: invite.familyId }, { merge: true });

  await updateDoc(doc(db, 'families', invite.familyId, 'invites', invite.id), { status: 'accepted' });
}
