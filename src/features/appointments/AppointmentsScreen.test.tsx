import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { confirmDestructive } from '../../utils/confirm';
import { AppointmentsScreen } from './AppointmentsScreen';

jest.mock('../../utils/confirm');

const mockConfirmDestructive = confirmDestructive as jest.MockedFunction<typeof confirmDestructive>;

describe('AppointmentsScreen', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    mockConfirmDestructive.mockResolvedValue(true);
  });

  it('marks a new consulta, edits it, then removes it', async () => {
    await render(<AppointmentsScreen />);

    expect(await screen.findByText('Ainda sem consultas marcadas.')).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Ecografia'), 'Ecografia');
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Marcar consulta' }));
    });

    expect(screen.getByText(/toca para editar/)).toBeTruthy();
    expect(screen.getAllByText('Ecografia').length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.press(screen.getByText(/toca para editar/));
    });

    expect(screen.getByText('A editar consulta')).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Ecografia'), 'Ecografia morfológica');
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Guardar alterações' }));
    });

    expect(screen.queryByText('A editar consulta')).toBeNull();
    expect(screen.getByText(/Ecografia morfológica/)).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByText('Remover'));
    });

    // startEdit set the calendar filter to this consulta's day, so the
    // empty state here is the "nothing on this day" one, not the global one.
    expect(await screen.findByText('Sem consultas neste dia.')).toBeTruthy();
    expect(screen.queryByText(/toca para editar/)).toBeNull();
  });
});
