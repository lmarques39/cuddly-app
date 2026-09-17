import { useCallback, useEffect, useState } from 'react';
import { auth } from '../../services/firebase';
import { subscribeToDocument, syncEntry } from '../../storage/sync';
import { Member } from '../../types/records';

/**
 * The signed-in user's own members/{uid} doc — for the Home greeting and
 * letting someone update their own name from Perfil. A single-document
 * subscription (like useBabyProfile), not the full member list like
 * useCuidadores — most screens only care about "me", not everyone.
 */
export function useCurrentMember() {
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
      syncEntry('members', uid, { ...rest, name });
    },
    [uid, member],
  );

  return { member, loaded, updateName };
}
