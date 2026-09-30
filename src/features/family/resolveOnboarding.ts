import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export type OnboardingStep = 'registerParent' | 'registerBaby' | 'app';

/**
 * Where an *existing* signed-in account should land — login, a returning
 * Google user, or reopening the app. Being signed in doesn't mean the
 * account is set up: its family may be gone (account data deleted but the
 * Auth account survived, or removed as a caregiver, #55) or the baby step
 * may never have been finished. Those used to drop straight into an empty
 * app with nowhere to save anything.
 *
 * Network trouble is *not* treated as "no family": offline, this returns
 * 'app' like before, so nobody gets pushed through onboarding again just
 * for opening the app without signal.
 */
export async function resolveOnboardingStep(uid: string): Promise<OnboardingStep> {
  try {
    const userSnap = await getDoc(doc(db, 'users', uid));
    const familyId = userSnap.data()?.familyId as string | undefined;
    if (!familyId) return 'registerParent';

    try {
      const memberSnap = await getDoc(doc(db, 'families', familyId, 'members', uid));
      if (!memberSnap.exists()) return 'registerParent';
    } catch (e) {
      // firestore.rules only let members read member docs — being refused
      // here means this account isn't in that family any more.
      if ((e as { code?: string }).code === 'permission-denied') return 'registerParent';
      throw e;
    }

    const babySnap = await getDoc(doc(db, 'families', familyId, 'profile', 'baby'));
    return babySnap.exists() ? 'app' : 'registerBaby';
  } catch {
    return 'app';
  }
}
