import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDoc } from 'firebase/firestore';
import { NavigationContainer } from '@react-navigation/native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { auth } from '../services/firebase';
import { STORAGE_KEYS } from '../storage/storage';
import { CurrentMemberProvider } from '../features/profile/useCurrentMember';
import { ActiveSessionsWrapper } from '../testUtils/ActiveSessionsWrapper';
import { RootNavigator } from './RootNavigator';

const mockGetDoc = getDoc as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(auth, { currentUser: { uid: 'alice', email: 'alice@x.com' } });
  mockGetDoc.mockResolvedValue({ data: () => ({ familyId: 'famA' }) });
});

function renderApp() {
  return render(
    <CurrentMemberProvider>
      <ActiveSessionsWrapper>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </ActiveSessionsWrapper>
    </CurrentMemberProvider>,
  );
}

it('going deep into Perfil, switching tabs, and coming back lands on the Perfil hub, not stuck on the sub-screen', async () => {
  await renderApp();

  await act(async () => {
    fireEvent.press(screen.getByText('Perfil'));
  });
  await act(async () => {
    fireEvent.press(await screen.findByText('Notificações'));
  });
  expect(await screen.findByText('Só lembretes que tu crias — nunca notificações push de marketing.')).toBeTruthy();

  await act(async () => {
    fireEvent.press(screen.getByText('Registar'));
  });
  await act(async () => {
    fireEvent.press(screen.getByText('Perfil'));
  });

  // Back on the Perfil hub (shows the settings list), not still on Notificações.
  expect(await screen.findByText('Cuidadores')).toBeTruthy();
  expect(screen.queryByText('Só lembretes que tu crias — nunca notificações push de marketing.')).toBeNull();
});

it('does not break switching to every other tab after the Perfil reset-on-blur fires', async () => {
  await renderApp();

  await act(async () => {
    fireEvent.press(screen.getByText('Perfil'));
  });
  await act(async () => {
    fireEvent.press(await screen.findByText('Notificações'));
  });
  await act(async () => {
    fireEvent.press(screen.getByText('Registar')); // triggers Perfil's blur reset
  });

  // Every tab must still be reachable — this is exactly what broke when
  // reset() was called on the tab navigator itself instead of the nested stack.
  // "Marcar consulta" shows in the Registar hub regardless of Grávida/Pós-parto mode.
  expect(await screen.findByText('Marcar consulta')).toBeTruthy();

  await act(async () => {
    fireEvent.press(screen.getByText('Histórico'));
  });
  // "Histórico" now matches both the tab bar label and this screen's own
  // heading — two matches confirms the screen actually rendered.
  await waitFor(() => expect(screen.getAllByText('Histórico')).toHaveLength(2));

  await act(async () => {
    fireEvent.press(screen.getByText('Início'));
  });
  await act(async () => {
    fireEvent.press(screen.getByText('Registar'));
  });
  expect(await screen.findByText('Marcar consulta')).toBeTruthy();
});

it('shows a running timer on every tab, and tapping it goes back to the timer (#100)', async () => {
  await renderApp();

  await act(async () => {
    fireEvent.press(screen.getByText('Registar'));
  });
  await act(async () => {
    fireEvent.press(await screen.findByText('Contração'));
  });
  await act(async () => {
    fireEvent.press(await screen.findByRole('button', { name: 'Iniciar contração' }));
  });
  // Already on the timer's own screen — the bar doesn't repeat it.
  expect(screen.queryByRole('button', { name: 'Contração a decorrer, abrir' })).toBeNull();

  await act(async () => {
    fireEvent.press(screen.getByText('Início'));
  });
  const chip = await screen.findByRole('button', { name: 'Contração a decorrer, abrir' });

  await act(async () => {
    fireEvent.press(chip);
  });
  expect(await screen.findByRole('button', { name: 'Parar contração' })).toBeTruthy();
});

it('opens Introdução alimentar from the Registar hub in Pós-parto mode (#105)', async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.babyProfile, JSON.stringify({ birthDate: Date.now() - 200 * 24 * 60 * 60 * 1000 }));
  await renderApp();

  await act(async () => {
    fireEvent.press(screen.getByText('Registar'));
  });
  await act(async () => {
    fireEvent.press(await screen.findByText('Alimento novo'));
  });

  expect(await screen.findByText('Introdução alimentar')).toBeTruthy();
  await AsyncStorage.clear();
});

it('hides Introdução alimentar from the Registar hub during pregnancy', async () => {
  await AsyncStorage.clear();
  await renderApp();

  await act(async () => {
    fireEvent.press(screen.getByText('Registar'));
  });

  expect(await screen.findByText('Marcar consulta')).toBeTruthy();
  expect(screen.queryByText('Alimento novo')).toBeNull();
});
