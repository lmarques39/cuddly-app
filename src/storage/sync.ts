import NetInfo from '@react-native-community/netinfo';
import { collection, doc, deleteDoc, getDoc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { loadList, makeId, saveList } from './storage';

const TRACKER_COLLECTIONS = ['contractions', 'breastfeeding', 'bottle', 'diapers', 'appointments', 'sono', 'pumping'];

/**
 * Firestore sync: entry-per-document under families/{familyId}/{collectionName}/{entryId},
 * with an AsyncStorage outbox as the offline write queue (the Firestore JS
 * SDK has no native offline persistence on React Native). Kept separate
 * from storage.ts so the pure AsyncStorage helpers stay dependency-free and
 * easy to unit-test without a Firestore mock.
 */

let cachedFamilyId: string | null = null;

/** Exported for one-shot direct-write features (e.g. invites) that need the caller's familyId but aren't trackers. */
export async function getFamilyId(): Promise<string | null> {
  if (cachedFamilyId) return cachedFamilyId;
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  const familyId = (snap.data()?.familyId as string | undefined) ?? null;
  cachedFamilyId = familyId;
  return familyId;
}

type OutboxEntry = {
  id: string;
  collectionName: string;
  entryId: string;
  payload: Record<string, unknown> | null; // null means delete
};

const OUTBOX_KEY = '@cuddly/outbox';

async function loadOutbox(): Promise<OutboxEntry[]> {
  return loadList<OutboxEntry>(OUTBOX_KEY);
}

async function pushToOutbox(entry: OutboxEntry): Promise<void> {
  const current = await loadOutbox();
  await saveList(OUTBOX_KEY, [...current, entry]);
}

async function removeFromOutbox(id: string): Promise<void> {
  const current = await loadOutbox();
  await saveList(
    OUTBOX_KEY,
    current.filter((e) => e.id !== id),
  );
}

async function writeToFirestore(entry: OutboxEntry): Promise<boolean> {
  const familyId = await getFamilyId();
  if (!familyId) return false;
  try {
    const ref = doc(db, 'families', familyId, entry.collectionName, entry.entryId);
    if (entry.payload === null) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, entry.payload);
    }
    return true;
  } catch {
    return false; // no network (or a real error) — stays in the outbox for flushOutbox() to retry
  }
}

/**
 * Writes one entry: queues it in the outbox first (durable across app
 * restarts), then tries Firestore immediately. Call this alongside the
 * existing addToList/saveObject calls — it doesn't replace them yet.
 */
export async function syncEntry(
  collectionName: string,
  entryId: string,
  payload: Record<string, unknown> | null,
): Promise<void> {
  const outboxId = makeId();
  const entry: OutboxEntry = { id: outboxId, collectionName, entryId, payload };
  await pushToOutbox(entry);
  const ok = await writeToFirestore(entry);
  if (ok) await removeFromOutbox(outboxId);
}

/** Retries every entry still queued. Call on app launch and whenever connectivity returns. */
export async function flushOutbox(): Promise<void> {
  const pending = await loadOutbox();
  for (const entry of pending) {
    const ok = await writeToFirestore(entry);
    if (ok) await removeFromOutbox(entry.id);
  }
}

/**
 * Starts listening for connectivity changes and flushes the outbox whenever
 * the device comes back online. Call once at app startup; returns the
 * unsubscribe function.
 */
export function watchConnectivity(): () => void {
  return NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      flushOutbox();
    }
  });
}

/**
 * Subscribes to every document in families/{familyId}/{collectionName},
 * calling onChange with the full list on every update. Resolves the current
 * user's familyId internally (async) so callers don't need to know or pass
 * it. Returns an unsubscribe function usable immediately, even before the
 * familyId lookup and the Firestore subscription itself have resolved.
 * Callers are responsible for caching to AsyncStorage if they want a
 * cold-start cache (each hook decides this for itself).
 */
export function subscribeToCollection<T>(collectionName: string, onChange: (items: T[]) => void): () => void {
  let cancelled = false;
  let unsubscribeSnapshot: (() => void) | null = null;

  getFamilyId().then((familyId) => {
    if (cancelled || !familyId) return;
    unsubscribeSnapshot = onSnapshot(collection(db, 'families', familyId, collectionName), (snap) => {
      onChange(snap.docs.map((d) => d.data() as T));
    });
  });

  return () => {
    cancelled = true;
    unsubscribeSnapshot?.();
  };
}

/**
 * Deletes every tracker entry and the baby profile from this account's
 * family in Firestore. Pair with storage.ts's clearAllLocalData() — that one
 * only clears AsyncStorage, and on its own would get silently undone the
 * moment the live subscriptions reconnect and re-populate from whatever's
 * still in Firestore. Used by Perfil's "Limpar dados locais" dev tool.
 */
export async function clearFamilyData(): Promise<void> {
  const familyId = await getFamilyId();
  if (!familyId) return;

  for (const collectionName of TRACKER_COLLECTIONS) {
    const snap = await getDocs(collection(db, 'families', familyId, collectionName));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  }

  await deleteDoc(doc(db, 'families', familyId, 'profile', 'baby'));
}

/**
 * Subscribes to a single document at families/{familyId}/{collectionName}/{entryId}
 * — for things like BabyProfile that are one record, not a list of entries.
 * Write with syncEntry(collectionName, entryId, payload) as usual. Calls
 * onChange(null) if the document doesn't exist yet (e.g. nothing synced from
 * this account before); callers should keep whatever the local cache has in
 * that case rather than clearing it.
 */
export function subscribeToDocument<T>(
  collectionName: string,
  entryId: string,
  onChange: (item: T | null) => void,
): () => void {
  let cancelled = false;
  let unsubscribeSnapshot: (() => void) | null = null;

  getFamilyId().then((familyId) => {
    if (cancelled || !familyId) return;
    unsubscribeSnapshot = onSnapshot(doc(db, 'families', familyId, collectionName, entryId), (snap) => {
      onChange(snap.exists() ? (snap.data() as T) : null);
    });
  });

  return () => {
    cancelled = true;
    unsubscribeSnapshot?.();
  };
}
