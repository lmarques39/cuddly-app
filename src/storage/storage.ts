import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * MVP persistence: one JSON array per record type in AsyncStorage.
 * Deliberately simple for the Sept 18 delivery — swap for SQLite/sync
 * once multi-caregiver support (v1.1) is in scope.
 */

export const STORAGE_KEYS = {
  contractions: '@ninho/contractions',
  breastfeeding: '@ninho/breastfeeding',
  bottle: '@ninho/bottle',
  diapers: '@ninho/diapers',
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

export function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
