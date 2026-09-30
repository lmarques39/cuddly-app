import { getDoc } from 'firebase/firestore';
import { resolveOnboardingStep } from './resolveOnboarding';

const mockGetDoc = getDoc as jest.Mock;

type Ref = { segments: unknown[] };
const exists = (data: object) => ({ exists: () => true, data: () => data });
const missing = { exists: () => false, data: () => undefined };

/** Answers getDoc by path: users/{uid}, the member doc, and profile/baby. */
function firestoreWith(docs: { user?: object; member?: 'yes' | 'no' | 'denied'; baby?: boolean }) {
  mockGetDoc.mockImplementation(async (ref: Ref) => {
    const path = ref.segments.slice(1).join('/');
    if (path.startsWith('users/')) return docs.user ? exists(docs.user) : missing;
    if (path.includes('/members/')) {
      if (docs.member === 'denied') throw Object.assign(new Error('denied'), { code: 'permission-denied' });
      return docs.member === 'yes' ? exists({ name: 'Alice' }) : missing;
    }
    if (path.endsWith('profile/baby')) return docs.baby ? exists({ name: 'Bia' }) : missing;
    return missing;
  });
}

beforeEach(() => jest.clearAllMocks());

it('sends a fully set-up account straight into the app', async () => {
  firestoreWith({ user: { familyId: 'famA' }, member: 'yes', baby: true });
  expect(await resolveOnboardingStep('alice')).toBe('app');
});

it('sends an account with no family back to the parent step (e.g. its data was deleted but the login survived)', async () => {
  firestoreWith({});
  expect(await resolveOnboardingStep('alice')).toBe('registerParent');
});

it('sends an account that was removed from its family (#55) to the parent step', async () => {
  firestoreWith({ user: { familyId: 'famA' }, member: 'denied' });
  expect(await resolveOnboardingStep('alice')).toBe('registerParent');
});

it('treats a missing member doc the same as no family', async () => {
  firestoreWith({ user: { familyId: 'famA' }, member: 'no' });
  expect(await resolveOnboardingStep('alice')).toBe('registerParent');
});

it('sends an account that never finished the baby step to it', async () => {
  firestoreWith({ user: { familyId: 'famA' }, member: 'yes', baby: false });
  expect(await resolveOnboardingStep('alice')).toBe('registerBaby');
});

it('lets the app open as usual when Firestore is unreachable, instead of forcing onboarding again', async () => {
  mockGetDoc.mockRejectedValue(Object.assign(new Error('offline'), { code: 'unavailable' }));
  expect(await resolveOnboardingStep('alice')).toBe('app');
});
