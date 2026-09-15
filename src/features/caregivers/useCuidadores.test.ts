import { getDoc, onSnapshot } from 'firebase/firestore';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { auth } from '../../services/firebase';
import { useCuidadores } from './useCuidadores';

const mockGetDoc = getDoc as jest.Mock;
const mockOnSnapshot = onSnapshot as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(auth, { currentUser: { uid: 'alice' } });
  mockGetDoc.mockResolvedValue({ data: () => ({ familyId: 'famA' }) });
});

it('starts empty and not loaded before the subscriptions fire', async () => {
  mockOnSnapshot.mockReturnValue(() => {});
  const { result } = await renderHook(() => useCuidadores());

  expect(result.current.members).toEqual([]);
  expect(result.current.pendingInvites).toEqual([]);
  expect(result.current.loaded).toBe(false);
  expect(result.current.currentUid).toBe('alice');
});

it('exposes members and only pending invites once both subscriptions report back', async () => {
  const listeners: Record<string, (snap: unknown) => void> = {};
  let call = 0;
  mockOnSnapshot.mockImplementation((_ref, cb) => {
    // First subscribeToCollection call in the hook is 'members', second is 'invites'.
    listeners[call === 0 ? 'members' : 'invites'] = cb as (snap: unknown) => void;
    call += 1;
    return () => {};
  });

  const { result } = await renderHook(() => useCuidadores());
  await waitFor(() => expect(mockOnSnapshot).toHaveBeenCalledTimes(2));

  await act(async () => {
    listeners.members({ docs: [{ id: 'alice', data: () => ({ name: 'Alice', role: 'mae', email: 'alice@x.com' }) }] });
    listeners.invites({
      docs: [
        { id: 'inv1', data: () => ({ id: 'inv1', email: 'bob@x.com', invitedBy: 'alice', invitedAt: 1, status: 'pending' }) },
        { id: 'inv2', data: () => ({ id: 'inv2', email: 'carol@x.com', invitedBy: 'alice', invitedAt: 1, status: 'accepted' }) },
      ],
    });
  });

  await waitFor(() => expect(result.current.loaded).toBe(true));
  expect(result.current.members).toEqual([{ id: 'alice', name: 'Alice', role: 'mae', email: 'alice@x.com' }]);
  expect(result.current.pendingInvites).toHaveLength(1);
  expect(result.current.pendingInvites[0].id).toBe('inv1');
});
