import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { SonoScreen } from './SonoScreen';

describe('SonoScreen', () => {
  beforeEach(() => AsyncStorage.clear());

  it('shows an empty state, then starts and stops a sleep session from the button', async () => {
    await render(<SonoScreen />);

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
});
