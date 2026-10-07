import { useCallback, useEffect, useMemo, useState } from 'react';
import { addToList, loadList, makeId, removeFromList, replaceInList, saveList, STORAGE_KEYS } from '../../storage/storage';
import { subscribeToCollection, syncEntry } from '../../storage/sync';
import { FoodEntry } from '../../types/records';

const byNewest = (a: FoodEntry, b: FoodEntry) => b.introducedAt - a.introducedAt;

/** Case- and accent-insensitive, so "Maçã" and "maca " count as the same food. */
function normalize(food: string): string {
  return food
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Introdução alimentar (#11, #103): one entry per food tried for the first
 * time. No timer — same shape as useAppointments, not the tracker hooks.
 */
export function useFoods() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Cold-start cache: show what's already on-device instantly, before the
    // Firestore subscription below (which needs network) has a chance to arrive.
    loadList<FoodEntry>(STORAGE_KEYS.foods).then((list) => {
      setEntries(list);
      setLoaded(true);
    });

    // Firestore becomes the source of truth once connected — every update
    // here also refreshes the local cache above, so the next cold start is fresh.
    return subscribeToCollection<FoodEntry>('foods', (items) => {
      setEntries(items);
      setLoaded(true);
      saveList(STORAGE_KEYS.foods, items);
    });
  }, []);

  // Sorted here rather than on write: a backdated entry ("comeu ontem")
  // lands at the top of the local list but belongs further down.
  const sorted = useMemo(() => [...entries].sort(byNewest), [entries]);

  /** What's worth showing the pediatrician first: every food that caused a reaction. */
  const withReaction = useMemo(() => sorted.filter((e) => e.reaction !== 'nenhuma'), [sorted]);

  /** True if this food was already logged — the screen warns instead of silently adding it twice. */
  const isAlreadyIntroduced = useCallback(
    (food: string) => entries.some((e) => normalize(e.food) === normalize(food)),
    [entries],
  );

  const save = useCallback(async (entry: Omit<FoodEntry, 'id'>) => {
    const withId: FoodEntry = { ...entry, food: entry.food.trim(), id: makeId() };
    setEntries(await addToList(STORAGE_KEYS.foods, withId));
    syncEntry('foods', withId.id, withId);
    return withId;
  }, []);

  const update = useCallback((updated: FoodEntry) => {
    replaceInList(STORAGE_KEYS.foods, updated).then(setEntries);
    syncEntry('foods', updated.id, updated);
  }, []);

  const remove = useCallback((id: string) => {
    removeFromList<FoodEntry>(STORAGE_KEYS.foods, id).then(setEntries);
    syncEntry('foods', id, null);
  }, []);

  return { entries: sorted, withReaction, isAlreadyIntroduced, save, update, remove, loaded };
}
