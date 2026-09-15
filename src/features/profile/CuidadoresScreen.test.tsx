import { getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { auth } from '../../services/firebase';
import { CuidadoresScreen } from './CuidadoresScreen';

const mockGetDoc = getDoc as jest.Mock;
const mockOnSnapshot = onSnapshot as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;

function fireMembers(list: unknown[]) {
  mockOnSnapshot.mock.calls[0][1]({ docs: list });
}

function fireInvites(list: unknown[]) {
  mockOnSnapshot.mock.calls[1][1]({ docs: list });
}

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(auth, { currentUser: { uid: 'alice' } });
  mockGetDoc.mockResolvedValue({ data: () => ({ familyId: 'famA' }) });
  mockOnSnapshot.mockReturnValue(() => {});
});

it('shows the current user with a "Tu" badge and other members without one', async () => {
  await render(<CuidadoresScreen />);

  await act(async () => {
    fireMembers([
      { id: 'alice', data: () => ({ name: 'Alice', role: 'mae', email: 'alice@x.com' }) },
      { id: 'bob', data: () => ({ name: 'Bob', role: 'cuidador', email: 'bob@x.com' }) },
    ]);
    fireInvites([]);
  });

  expect(screen.getByText('Alice')).toBeTruthy();
  expect(screen.getByText('Bob')).toBeTruthy();
  expect(screen.getByText('Tu')).toBeTruthy();
});

it('shows a pending invite as a distinct row with how long ago it was sent', async () => {
  await render(<CuidadoresScreen />);

  await act(async () => {
    fireMembers([{ id: 'alice', data: () => ({ name: 'Alice', role: 'mae', email: 'alice@x.com' }) }]);
    fireInvites([
      {
        id: 'inv1',
        data: () => ({ id: 'inv1', email: 'pedro@x.com', invitedBy: 'alice', invitedAt: Date.now() - 60_000, status: 'pending' }),
      },
    ]);
  });

  expect(screen.getByText('pedro@x.com')).toBeTruthy();
  expect(screen.getByText(/Convite pendente/)).toBeTruthy();
});

it('reveals the invite form on "Convidar cuidador" and creates the invite on submit', async () => {
  await render(<CuidadoresScreen />);

  await act(async () => {
    fireMembers([{ id: 'alice', data: () => ({ name: 'Alice', role: 'mae', email: 'alice@x.com' }) }]);
    fireInvites([]);
  });

  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Convidar cuidador' }));
  });
  await act(async () => {
    fireEvent.changeText(screen.getByPlaceholderText('cuidador@email.com'), 'novo@x.com');
  });
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Convidar cuidador' }));
  });

  expect(mockSetDoc).toHaveBeenCalledTimes(1);
  expect(mockSetDoc.mock.calls[0][1]).toMatchObject({ email: 'novo@x.com', invitedBy: 'alice', status: 'pending' });
});
