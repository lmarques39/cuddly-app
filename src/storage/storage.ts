import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * MVP persistence: one JSON array per record type in AsyncStorage.
 * Deliberately dependency-free (no Firebase import here) so it stays easy
 * to unit-test without a Firestore mock — see sync.ts for the Firestore
 * mirroring built on top of these primitives.
 */

export const STORAGE_KEYS = {
  contractions: '@cuddly/contractions',
  breastfeeding: '@cuddly/breastfeeding',
  bottle: '@cuddly/bottle',
  diapers: '@cuddly/diapers',
  appointments: '@cuddly/appointments',
  babyProfile: '@cuddly/baby-profile',
  sono: '@cuddly/sono',
  pumping: '@cuddly/pumping',
  // Not wiped by clearAllLocalData() on a new sign-up, unlike babyProfile —
  // this is a device preference ("show me reminders"), not account data,
  // so there's no privacy reason to reset it when the signed-in account changes.
  notificationPreferences: '@cuddly/notification-preferences',
} as const;

export async function loadList<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

export async function saveList<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

export async function addToList<T>(key: string, item: T): Promise<T[]> {
  const current = await loadList<T>(key);
  const next = [item, ...current];
  await saveList(key, next);
  return next;
}

export async function loadObject<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function saveObject<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Wipes every local record. AsyncStorage is per-device, not per-account —
 * nothing here is scoped to the signed-in Firebase user — so this must run
 * whenever a *new* account is created on a device that already has another
 * account's local data, or the new account would see the previous one's
 * trackers. Also reachable manually from Perfil (dev tools) for testing.
 */
export async function clearAllLocalData(): Promise<void> {
  await Promise.all([
    saveObject(STORAGE_KEYS.babyProfile, null),
    saveList(STORAGE_KEYS.contractions, []),
    saveList(STORAGE_KEYS.breastfeeding, []),
    saveList(STORAGE_KEYS.bottle, []),
    saveList(STORAGE_KEYS.diapers, []),
    saveList(STORAGE_KEYS.appointments, []),
    saveList(STORAGE_KEYS.sono, []),
    saveList(STORAGE_KEYS.pumping, []),
  ]);
}

export function isToday(epochMs: number): boolean {
  const d = new Date(epochMs);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}
