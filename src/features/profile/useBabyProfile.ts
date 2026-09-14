import { useCallback, useEffect, useState } from 'react';
import { loadObject, saveObject, STORAGE_KEYS } from '../../storage/storage';
import { subscribeToDocument, syncEntry } from '../../storage/sync';
import { AppMode, BabyProfile } from '../../types/records';

// BabyProfile is a single record, not a list — synced as one fixed-id
// document, not entry-per-document like the trackers. See sync.ts's
// subscribeToDocument for why (and #56 for why "last write wins" here is
// an accepted simplification, unlike the trackers).
const PROFILE_COLLECTION = 'profile';
const PROFILE_DOC_ID = 'baby';

export function useBabyProfile() {
  const [profile, setProfile] = useState<BabyProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    loadObject<BabyProfile>(STORAGE_KEYS.babyProfile).then((p) => {
      setProfile(p);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    // Cold-start cache: show what's already on-device instantly, before the
    // Firestore subscription below (which needs network) has a chance to arrive.
    refresh();

    // Firestore becomes the source of truth once connected — every update
    // here also refreshes the local cache above, so the next cold start is fresh.
    return subscribeToDocument<BabyProfile>(PROFILE_COLLECTION, PROFILE_DOC_ID, (next) => {
      if (next == null) return; // nothing synced from this account yet — keep the local cache as-is
      setProfile(next);
      setLoaded(true);
      saveObject(STORAGE_KEYS.babyProfile, next);
    });
  }, [refresh]);

  const save = useCallback(async (next: BabyProfile) => {
    await saveObject(STORAGE_KEYS.babyProfile, next);
    setProfile(next);
    syncEntry(PROFILE_COLLECTION, PROFILE_DOC_ID, next);
  }, []);

  // no birth registered yet defaults to Grávida, matching the "já nasceu?" onboarding step
  const mode: AppMode = profile?.birthDate != null ? 'posparto' : 'gravida';

  return { profile, mode, loaded, refresh, save };
}
