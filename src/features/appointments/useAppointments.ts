import { useCallback, useEffect, useState } from 'react';
import { addToList, loadList, makeId, removeFromList, replaceInList, saveList, STORAGE_KEYS } from '../../storage/storage';
import { subscribeToCollection, syncEntry } from '../../storage/sync';
import { Appointment } from '../../types/records';

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    // Cold-start cache: show what's already on-device instantly, before the
    // Firestore subscription below (which needs network) has a chance to arrive.
    loadList<Appointment>(STORAGE_KEYS.appointments).then(setAppointments);

    // Firestore becomes the source of truth once connected — every update
    // here also refreshes the local cache above, so the next cold start is
    // fresh. Unlike the trackers, the screen already sorts by scheduledAt
    // itself (soonest first, split into upcoming/past), so there's no
    // "most recent first" order to preserve here.
    return subscribeToCollection<Appointment>('appointments', (items) => {
      setAppointments(items);
      saveList(STORAGE_KEYS.appointments, items);
    });
  }, []);

  const save = useCallback(async (entry: Omit<Appointment, 'id'>) => {
    const withId: Appointment = { ...entry, id: makeId() };
    const next = await addToList(STORAGE_KEYS.appointments, withId);
    setAppointments(next);
    syncEntry('appointments', withId.id, withId);
    return withId;
  }, []);

  const remove = useCallback((id: string) => {
    removeFromList<Appointment>(STORAGE_KEYS.appointments, id).then(setAppointments);
    syncEntry('appointments', id, null);
  }, []);

  const update = useCallback((updated: Appointment) => {
    replaceInList(STORAGE_KEYS.appointments, updated).then(setAppointments);
    syncEntry('appointments', updated.id, updated);
  }, []);

  return { appointments, save, remove, update };
}
