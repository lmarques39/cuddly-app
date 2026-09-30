import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { auth } from '../../services/firebase';
import { subscribeToDocument, syncEntry } from '../../storage/sync';
import { Member } from '../../types/records';

type CurrentMemberValue = {
  member: Member | null;
  loaded: boolean;
  updateName: (name: string) => void;
};

const CurrentMemberContext = createContext<CurrentMemberValue | null>(null);

/**
 * Mounted once near the app root (see App.tsx) — a single Firestore
 * subscription to members/{uid}, shared by every screen via useCurrentMember()
 * below. Each screen used to open its own independent subscription; on
 * Android that left screens like Home showing a stale name after Perfil
 * edited it, needing a full app restart to catch up (#83) — a single shared
 * subscription means there's only ever one source of truth to go stale.
 */
export function CurrentMemberProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [loaded, setLoaded] = useState(false);
  const uid = auth.currentUser?.uid ?? null;

  useEffect(() => {
    if (!uid) {
      setLoaded(true);
      return;
    }
    return subscribeToDocument<Omit<Member, 'id'>>('members', uid, (data) => {
      setMember(data ? { id: uid, ...data } : null);
      setLoaded(true);
    });
  }, [uid]);

  const updateName = useCallback(
    (name: string) => {
      if (!uid || !member) return;
      const { id: _id, ...rest } = member;
      // Optimistic: every screen sees the new name right away, without
      // waiting on the snapshot round-trip (which is what lagged on Android).
      setMember({ ...member, name });
      syncEntry('members', uid, { ...rest, name });
    },
    [uid, member],
  );

  return <CurrentMemberContext.Provider value={{ member, loaded, updateName }}>{children}</CurrentMemberContext.Provider>;
}

/**
 * The signed-in user's own members/{uid} doc — for the Home greeting and
 * letting someone update their own name from Perfil. Must be called under
 * a CurrentMemberProvider.
 */
export function useCurrentMember(): CurrentMemberValue {
  const ctx = useContext(CurrentMemberContext);
  if (!ctx) throw new Error('useCurrentMember must be used within a CurrentMemberProvider');
  return ctx;
}
