import { useCallback, useEffect, useState } from 'react';
import { loadObject, saveObject, STORAGE_KEYS } from '../../storage/storage';
import { AppMode, BabyProfile } from '../../types/records';

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
    refresh();
  }, [refresh]);

  const save = useCallback(async (next: BabyProfile) => {
    await saveObject(STORAGE_KEYS.babyProfile, next);
    setProfile(next);
  }, []);

  // no birth registered yet defaults to Grávida, matching the "já nasceu?" onboarding step
  const mode: AppMode = profile?.birthDate != null ? 'posparto' : 'gravida';

  return { profile, mode, loaded, refresh, save };
}
