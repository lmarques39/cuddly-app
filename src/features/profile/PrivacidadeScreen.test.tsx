import { signOut } from 'firebase/auth';
import { setDoc } from 'firebase/firestore';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { auth } from '../../services/firebase';
import { confirmDestructive } from '../../utils/confirm';
import { exportMyData } from './exportData';
import { PrivacidadeScreen } from './PrivacidadeScreen';

jest.mock('../../utils/confirm');
jest.mock('./exportData');

const mockExportMyData = exportMyData as jest.MockedFunction<typeof exportMyData>;

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

it('exports the data when the export button is pressed', async () => {
  mockExportMyData.mockResolvedValue();
  await render(<PrivacidadeScreen />);

  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Exportar dados (JSON)' }));
  });

  expect(mockExportMyData).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Exportar dados (JSON)' })).toBeTruthy(); // back to idle
});

it('shows the error when the export fails', async () => {
  mockExportMyData.mockRejectedValue(new Error('Não foi encontrada nenhuma família nesta conta.'));
  await render(<PrivacidadeScreen />);

  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Exportar dados (JSON)' }));
  });

  expect(screen.getByText('Não foi encontrada nenhuma família nesta conta.')).toBeTruthy();
});
