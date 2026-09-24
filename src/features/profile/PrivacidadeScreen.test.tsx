import { signOut } from 'firebase/auth';
import { setDoc } from 'firebase/firestore';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { auth } from '../../services/firebase';
import { confirmDestructive } from '../../utils/confirm';
import { PrivacidadeScreen } from './PrivacidadeScreen';

jest.mock('../../utils/confirm');

const mockSetDoc = setDoc as jest.Mock;
const mockSignOut = signOut as jest.Mock;
const mockConfirmDestructive = confirmDestructive as jest.MockedFunction<typeof confirmDestructive>;

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(auth, { currentUser: { uid: 'alice', email: 'alice@x.com' } });
});

it('marks the account for deletion and signs out after confirming', async () => {
  mockConfirmDestructive.mockResolvedValue(true);
  await render(<PrivacidadeScreen />);

  await act(async () => {
    fireEvent.press(screen.getByText('Eliminar conta e dados'));
  });

  expect(mockSetDoc).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ deletionRequestedAt: expect.any(Number) }),
    expect.objectContaining({ merge: true }),
  );
  expect(mockSignOut).toHaveBeenCalledTimes(1);
});

it('does nothing when the confirmation is cancelled', async () => {
  mockConfirmDestructive.mockResolvedValue(false);
  await render(<PrivacidadeScreen />);

  await act(async () => {
    fireEvent.press(screen.getByText('Eliminar conta e dados'));
  });

  expect(mockSetDoc).not.toHaveBeenCalled();
  expect(mockSignOut).not.toHaveBeenCalled();
});
