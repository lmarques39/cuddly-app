import { loadList, loadObject, saveObject, STORAGE_KEYS } from './storage';
import { syncEntry } from './sync';

const MIGRATION_FLAG_PREFIX = '@cuddly/migrated-to-firestore/';

const LIST_COLLECTIONS: { storageKey: string; collectionName: string }[] = [
  { storageKey: STORAGE_KEYS.contractions, collectionName: 'contractions' },
  { storageKey: STORAGE_KEYS.breastfeeding, collectionName: 'breastfeeding' },
  { storageKey: STORAGE_KEYS.bottle, collectionName: 'bottle' },
  { storageKey: STORAGE_KEYS.diapers, collectionName: 'diapers' },
  { storageKey: STORAGE_KEYS.appointments, collectionName: 'appointments' },
];

/**
 * One-time push of whatever's already in AsyncStorage (from before the
 * Firestore sync layer existed) into this account's family, so nobody loses
 * history when the app updates to this version. Scoped per-uid, not
 * per-device, per issue #58 — see project memory for the known limitation
 * this doesn't solve (AsyncStorage is still shared across accounts that
 * sign into an *existing* account on the same device without creating a
 * new one first).
 *
 * Safe to call more than once: syncEntry() writes each entry to the same
 * Firestore document id every time, so a repeat run before the flag is set
 * just re-writes the same data rather than duplicating it.
 */
export async function migrateLocalDataToFirestore(uid: string): Promise<void> {
  const flagKey = `${MIGRATION_FLAG_PREFIX}${uid}`;
  const alreadyDone = await loadObject<boolean>(flagKey);
  if (alreadyDone) return;

  for (const { storageKey, collectionName } of LIST_COLLECTIONS) {
    const entries = await loadList<{ id: string }>(storageKey);
    for (const entry of entries) {
      await syncEntry(collectionName, entry.id, entry as Record<string, unknown>);
    }
  }

  const profile = await loadObject<Record<string, unknown>>(STORAGE_KEYS.babyProfile);
  if (profile) {
    await syncEntry('profile', 'baby', profile);
  }

  await saveObject(flagKey, true);
}
