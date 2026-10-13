import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { STORAGE_KEYS } from '../../storage/storage';
import { SonoScreen } from './SonoScreen';
import { ActiveSessionsProvider } from '../activeSessions/ActiveSessionsProvider';
import { ActiveSessionsWrapper } from '../../testUtils/ActiveSessionsWrapper';

describe('SonoScreen', () => {
  beforeEach(() => AsyncStorage.clear());

  it('shows an empty state, then starts and stops a sleep session from the button', async () => {
    await render(<SonoScreen />, { wrapper: ActiveSessionsWrapper });

    expect(await screen.findByText('Ainda sem registos.')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Iniciar sono' }));
    });

    expect(screen.getByRole('button', { name: 'Terminar sono' })).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Terminar sono' }));
    });

    expect(screen.getByRole('button', { name: 'Iniciar sono' })).toBeTruthy();
    expect(screen.queryByText('Ainda sem registos.')).toBeNull();
  });

  it('keeps a running sleep when you leave the screen and come back (#74)', async () => {
    // Stands in for switching tabs: the screen unmounts, the app-level provider stays.
    function App() {
      const [onSono, setOnSono] = useState(true);
      return (
        <>
          <Pressable accessibilityRole="button" onPress={() => setOnSono((v) => !v)}>
            <Text>Trocar de ecrã</Text>
          </Pressable>
          {onSono && <SonoScreen />}
        </>
      );
    }
    await render(
      <ActiveSessionsProvider>
        <App />
      </ActiveSessionsProvider>,
    );

    await act(async () => {
      fireEvent.press(await screen.findByRole('button', { name: 'Iniciar sono' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Trocar de ecrã' }));
    });
    expect(screen.queryByRole('button', { name: 'Terminar sono' })).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Trocar de ecrã' }));
    });
    expect(screen.getByRole('button', { name: 'Terminar sono' })).toBeTruthy();
  });

  it('corrects a session whose timer was left running (#126)', async () => {
    const today = new Date();
    const at = (h: number, m: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m).getTime();
    await AsyncStorage.setItem(STORAGE_KEYS.sono, JSON.stringify([{ id: 's1', startedAt: at(0, 30), endedAt: at(0, 31) }]));

    await render(<SonoScreen />, { wrapper: ActiveSessionsWrapper });
    await act(async () => {
      fireEvent.press(await screen.findByRole('button', { name: 'Editar' }));
    });

    // The form opens on the entry's own times.
    expect(screen.getByDisplayValue('00:30')).toBeTruthy();
    await act(async () => fireEvent.changeText(screen.getByDisplayValue('00:31'), '02:00'));
    await act(async () => fireEvent.press(screen.getByText('Guardar')));

    expect(await screen.findByText('1 h 30 min')).toBeTruthy();
    const saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.sono)) ?? '[]');
    expect(saved).toEqual([{ id: 's1', startedAt: at(0, 30), endedAt: at(2, 0) }]);
  });
});
