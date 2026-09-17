import { NavigationContainer } from '@react-navigation/native';
import { getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { auth } from '../../services/firebase';
import { PerfilScreen } from './PerfilScreen';

const mockGetDoc = getDoc as jest.Mock;
const mockOnSnapshot = onSnapshot as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;

function renderPerfil() {
  return render(
    <NavigationContainer>
      <PerfilScreen />
    </NavigationContainer>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(auth, { currentUser: { uid: 'alice', email: 'alice@x.com' } });
  mockGetDoc.mockResolvedValue({ data: () => ({ familyId: 'famA' }) });
  mockOnSnapshot.mockImplementation((_ref, cb) => {
    cb({ exists: () => true, data: () => ({ name: 'Alice', role: 'mae', email: 'alice@x.com' }) });
    return () => {};
  });
});

it("shows the caller's own name with an edit link", async () => {
  await renderPerfil();

  expect(await screen.findByText('Alice')).toBeTruthy();
  expect(screen.getByText('Editar')).toBeTruthy();
});

it('lets the name be edited and saved, showing the success feedback', async () => {
  await renderPerfil();
  await screen.findByText('Alice');

  await act(async () => {
    fireEvent.press(screen.getByText('Editar'));
  });
  await act(async () => {
    fireEvent.changeText(screen.getByPlaceholderText('O teu nome'), 'Alicia');
  });
  await act(async () => {
    fireEvent.press(screen.getByText('Guardar'));
  });

  expect(mockSetDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ name: 'Alicia' }));
  expect(screen.getByText('Guardado com sucesso.')).toBeTruthy();
});
