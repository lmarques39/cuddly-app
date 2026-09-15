import { useEffect, useState } from 'react';
import { auth } from '../../services/firebase';
import { subscribeToCollection } from '../../storage/sync';
import { Invite, Member } from '../../types/records';

/**
 * Live members + pending invites for the signed-in user's own family. No
 * AsyncStorage cache here (unlike trackers) — this is always-online, small,
 * family-membership data, not something that needs an offline copy.
 */
export function useCuidadores() {
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [invitesLoaded, setInvitesLoaded] = useState(false);

  useEffect(() => {
    const unsubMembers = subscribeToCollection<Member>('members', (list) => {
      setMembers(list);
      setMembersLoaded(true);
    });
    const unsubInvites = subscribeToCollection<Invite>('invites', (list) => {
      setPendingInvites(list.filter((invite) => invite.status === 'pending'));
      setInvitesLoaded(true);
    });

    return () => {
      unsubMembers();
      unsubInvites();
    };
  }, []);

  return {
    members,
    pendingInvites,
    loaded: membersLoaded && invitesLoaded,
    currentUid: auth.currentUser?.uid ?? null,
  };
}
