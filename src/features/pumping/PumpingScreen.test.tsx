import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { PumpingScreen } from './PumpingScreen';

describe('PumpingScreen', () => {
  beforeEach(() => AsyncStorage.clear());

  it('does not let stop happen without a valid amount, and records it when given one', async () => {
    await render(<PumpingScreen />);

    expect(await screen.findByText('Ainda sem registos.')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Iniciar extração' }));
    });

    // No amount typed yet — pressing stop should not do anything.
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Terminar extração' }));
    });
    expect(screen.getByRole('button', { name: 'Terminar extração' })).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('120'), '150');
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Terminar extração' }));
    });

    expect(screen.getByRole('button', { name: 'Iniciar extração' })).toBeTruthy();
    expect(screen.getByText(/150ml/)).toBeTruthy();
  });
});
