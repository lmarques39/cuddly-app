import { getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { auth } from '../../services/firebase';
import { useCurrentMember } from './useCurrentMember';

const mockGetDoc = getDoc as jest.Mock;
const mockOnSnapshot = onSnapshot as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(auth, { currentUser: { uid: 'alice' } });
  mockGetDoc.mockResolvedValue({ data: () => ({ familyId: 'famA' }) });
  mockOnSnapshot.mockReturnValue(() => {});
});

it('starts with no member and not loaded until the subscription reports back', async () => {
  const { result } = await renderHook(() => useCurrentMember());
  expect(result.current.member).toBeNull();
});

it("exposes the caller's own member doc, with the uid merged in as id", async () => {
  mockOnSnapshot.mockImplementation((_ref, cb) => {
    cb({ exists: () => true, data: () => ({ name: 'Alice', role: 'mae', email: 'alice@x.com' }) });
    return () => {};
  });

  const { result } = await renderHook(() => useCurrentMember());
  await waitFor(() => expect(result.current.loaded).toBe(true));

  expect(result.current.member).toEqual({ id: 'alice', name: 'Alice', role: 'mae', email: 'alice@x.com' });
});

it('updateName writes the full member doc back with just the name changed', async () => {
  mockOnSnapshot.mockImplementation((_ref, cb) => {
    cb({ exists: () => true, data: () => ({ name: 'Alice', role: 'mae', email: 'alice@x.com' }) });
    return () => {};
  });

  const { result } = await renderHook(() => useCurrentMember());
  await waitFor(() => expect(result.current.loaded).toBe(true));

  await act(async () => result.current.updateName('Alicia'));

  expect(mockSetDoc).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ name: 'Alicia', role: 'mae', email: 'alice@x.com' }),
  );
});
