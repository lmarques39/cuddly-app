import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { ContractionsScreen } from './ContractionsScreen';

describe('ContractionsScreen', () => {
  beforeEach(() => AsyncStorage.clear());

  it('shows an empty state, then starts and stops a contraction from the button', async () => {
    await render(<ContractionsScreen />);

    expect(await screen.findByText('Ainda sem registos hoje.')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Iniciar contração' }));
    });

    expect(screen.getByRole('button', { name: 'Parar contração' })).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Parar contração' }));
    });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Iniciar contração' })).toBeTruthy());
    expect(screen.queryByText('Ainda sem registos hoje.')).toBeNull();
  });
});
