import { deleteUser, EmailAuthProvider, reauthenticateWithCredential, User } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { clearAllLocalData } from '../../storage/storage';
import { clearFamilyData, clearOutbox, getFamilyId, resetFamilyIdCache } from '../../storage/sync';

// Firebase's deleteUser() refuses (auth/requires-recent-login) once the
// last sign-in is older than ~5 minutes.
const RECENT_LOGIN_MS = 5 * 60 * 1000;

/** A deletion that was refused before anything was deleted — the message is meant for the user. */
export class AccountDeletionError extends Error {}

export function usesPassword(user: User): boolean {
  return user.providerData.some((p) => p.providerId === 'password');
}

/**
 * deleteUser() needs a recent login, and it has to be checked *before*
 * anything is deleted — otherwise a refusal at the very end would leave the
 * Firestore data gone but the account still alive. Password accounts
 * re-authenticate with the password typed on the Privacidade screen; Google
 * accounts would need the whole OAuth flow again, so they're just asked to
 * sign in again if their login isn't fresh.
 */
async function ensureRecentLogin(user: User, password?: string): Promise<void> {
  if (usesPassword(user)) {
    if (!password) throw new AccountDeletionError('Escreve a tua password para confirmar.');
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email ?? '', password));
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        throw new AccountDeletionError('Password incorreta.');
      }
      throw new AccountDeletionError('Não foi possível confirmar a tua identidade. Tenta outra vez.');
    }
    return;
  }

  const { authTime } = await user.getIdTokenResult();
  if (Date.now() - new Date(authTime).getTime() > RECENT_LOGIN_MS) {
    throw new AccountDeletionError('Por segurança, termina sessão e volta a entrar com o Google antes de eliminar a conta.');
  }
}

/**
 * Deletes the signed-in account right away (#69) — no 30-day window.
 *
 * Shared-family rule: if this is the family's only member, the whole family
 * goes (every tracker collection, baby profile, pending invites, the family
 * doc). If other caregivers remain, only this person leaves — their
 * members/{uid} doc — and the baby's records stay with everyone else.
 */
export async function deleteMyAccount(password?: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new AccountDeletionError('Sem sessão iniciada.');

  await ensureRecentLogin(user, password);

  const familyId = await getFamilyId();
  if (familyId) {
    const members = await getDocs(collection(db, 'families', familyId, 'members'));
    const isLastMember = members.docs.every((d) => d.id === user.uid);

    if (isLastMember) {
      await clearFamilyData();
      const invites = await getDocs(collection(db, 'families', familyId, 'invites'));
      await Promise.all(invites.docs.map((d) => deleteDoc(d.ref)));
      await deleteDoc(doc(db, 'families', familyId));
    }

    // Always last on the Firestore side: firestore.rules grants access to
    // everything above through this doc (isFamilyMember), so deleting it
    // first would lock us out of the rest.
    await deleteDoc(doc(db, 'families', familyId, 'members', user.uid));
  }

  await deleteDoc(doc(db, 'users', user.uid));

  await clearOutbox();
  await clearAllLocalData();
  resetFamilyIdCache();

  // Signs the user out too — App.tsx's onAuthStateChanged takes it from here.
  await deleteUser(user);
}
