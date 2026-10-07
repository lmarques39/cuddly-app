import { getDoc, onSnapshot } from 'firebase/firestore';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';
import React from 'react';
import { auth } from '../../services/firebase';
import { confirmDestructive } from '../../utils/confirm';
import { AccountDeletionError, deleteMyAccount } from './deleteAccount';
import { exportMyData } from './exportData';
import { PRIVACY_POLICY_URL, PrivacidadeScreen } from './PrivacidadeScreen';

jest.mock('../../utils/confirm');
jest.mock('./exportData');
jest.mock('./deleteAccount', () => ({
  ...jest.requireActual('./deleteAccount'),
  deleteMyAccount: jest.fn(),
}));

const mockExportMyData = exportMyData as jest.MockedFunction<typeof exportMyData>;
const mockDeleteMyAccount = deleteMyAccount as jest.MockedFunction<typeof deleteMyAccount>;
const mockConfirmDestructive = confirmDestructive as jest.MockedFunction<typeof confirmDestructive>;
const mockOnSnapshot = onSnapshot as jest.Mock;
const mockGetDoc = getDoc as jest.Mock;

function familyMembers(ids: string[]) {
  mockOnSnapshot.mockImplementation((ref: { segments: unknown[] }, cb: (snap: unknown) => void) => {
    const isMembers = ref.segments[ref.segments.length - 1] === 'members';
    cb({ docs: (isMembers ? ids : []).map((id) => ({ id, data: () => ({ name: id }) })) });
    return () => {};
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(auth, {
    currentUser: { uid: 'alice', email: 'alice@x.com', providerData: [{ providerId: 'password' }] },
  });
  mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ familyId: 'famA' }) });
  familyMembers(['alice']);
});

async function startDeletion(password?: string) {
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Eliminar conta e dados' }));
  });
  if (password != null) {
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Password'), password);
    });
  }
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Eliminar definitivamente' }));
  });
}

it('deletes the account with the typed password after confirming', async () => {
  mockConfirmDestructive.mockResolvedValue(true);
  mockDeleteMyAccount.mockResolvedValue();
  await render(<PrivacidadeScreen />);

  await startDeletion('segredo');

  expect(mockDeleteMyAccount).toHaveBeenCalledWith('segredo');
});

it('does nothing when the confirmation is cancelled', async () => {
  mockConfirmDestructive.mockResolvedValue(false);
  await render(<PrivacidadeScreen />);

  await startDeletion('segredo');

  expect(mockDeleteMyAccount).not.toHaveBeenCalled();
});

it('shows why the deletion was refused', async () => {
  mockConfirmDestructive.mockResolvedValue(true);
  mockDeleteMyAccount.mockRejectedValue(new AccountDeletionError('Password incorreta.'));
  await render(<PrivacidadeScreen />);

  await startDeletion('errada');

  expect(screen.getByText('Password incorreta.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Eliminar definitivamente' })).toBeTruthy(); // can retry
});

it('explains that the records stay with the other caregivers in a shared family', async () => {
  familyMembers(['alice', 'bob']);
  await render(<PrivacidadeScreen />);

  expect(await screen.findByText(/Os registos do bebé ficam com o outro cuidador/)).toBeTruthy();
});

it('does not ask Google accounts for a password', async () => {
  Object.assign(auth, { currentUser: { uid: 'alice', email: 'alice@x.com', providerData: [{ providerId: 'google.com' }] } });
  mockConfirmDestructive.mockResolvedValue(true);
  mockDeleteMyAccount.mockResolvedValue();
  await render(<PrivacidadeScreen />);

  await startDeletion();

  expect(screen.queryByPlaceholderText('Password')).toBeNull();
  expect(mockDeleteMyAccount).toHaveBeenCalledWith(undefined);
});

it('exports the data when the export button is pressed', async () => {
  mockExportMyData.mockResolvedValue();
  await render(<PrivacidadeScreen />);

  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Exportar dados (JSON)' }));
  });

  expect(mockExportMyData).toHaveBeenCalledWith('json');
  expect(screen.getByRole('button', { name: 'Exportar dados (JSON)' })).toBeTruthy(); // back to idle
});

it('exports the records as CSV from its own button', async () => {
  mockExportMyData.mockResolvedValue();
  await render(<PrivacidadeScreen />);

  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Exportar registos (CSV)' }));
  });

  expect(mockExportMyData).toHaveBeenCalledWith('csv');
});

it('shows the error when the export fails', async () => {
  mockExportMyData.mockRejectedValue(new Error('Não foi encontrada nenhuma família nesta conta.'));
  await render(<PrivacidadeScreen />);

  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Exportar dados (JSON)' }));
  });

  expect(screen.getByText('Não foi encontrada nenhuma família nesta conta.')).toBeTruthy();
});

it('opens the full privacy policy on the website (#92)', async () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  await render(<PrivacidadeScreen />);

  await act(async () => {
    fireEvent.press(screen.getByRole('link', { name: 'Ler a política de privacidade' }));
  });

  expect(openURL).toHaveBeenCalledWith(PRIVACY_POLICY_URL);
  expect(PRIVACY_POLICY_URL).toMatch(/privacidade\.html$/);
  openURL.mockRestore();
});
