import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { PumpingScreen } from './PumpingScreen';
import { ActiveSessionsWrapper } from '../../testUtils/ActiveSessionsWrapper';

describe('PumpingScreen', () => {
  beforeEach(() => AsyncStorage.clear());

  it('asks for the amount instead of silently doing nothing, and records side + amount when given (#125)', async () => {
    await render(<PumpingScreen />, { wrapper: ActiveSessionsWrapper });

    expect(await screen.findByText('Ainda sem registos.')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'Esquerda' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Iniciar extração' }));
    });

    // No amount typed yet — the timer keeps going and the screen says why.
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Terminar extração' }));
    });
    expect(screen.getByRole('button', { name: 'Terminar extração' })).toBeTruthy();
    expect(screen.getByText('Indica quantos ml tiraste para terminar.')).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('120'), '150');
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Terminar extração' }));
    });

    expect(screen.getByRole('button', { name: 'Iniciar extração' })).toBeTruthy();
    expect(screen.getByText('Mama esquerda · 150 ml')).toBeTruthy();
  });
});
