import NetInfo from '@react-native-community/netinfo';
import { collection, doc, deleteDoc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { loadList, makeId, saveList } from './storage';

/**
 * Firestore sync: entry-per-document under families/{familyId}/{collectionName}/{entryId},
 * with an AsyncStorage outbox as the offline write queue (the Firestore JS
 * SDK has no native offline persistence on React Native). Kept separate
 * from storage.ts so the pure AsyncStorage helpers stay dependency-free and
 * easy to unit-test without a Firestore mock.
 */

let cachedFamilyId: string | null = null;

async function getFamilyId(): Promise<string | null> {
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
 * calling onChange with the full list on every update. Returns the
 * unsubscribe function — callers are responsible for caching to AsyncStorage
 * if they want a cold-start cache (each hook decides this for itself).
 */
export function subscribeToCollection<T>(
  familyId: string,
  collectionName: string,
  onChange: (items: T[]) => void,
): () => void {
  return onSnapshot(collection(db, 'families', familyId, collectionName), (snap) => {
    onChange(snap.docs.map((d) => d.data() as T));
  });
}
