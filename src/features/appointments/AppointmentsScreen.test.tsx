import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { STORAGE_KEYS } from '../../storage/storage';
import { confirmDestructive } from '../../utils/confirm';
import { AppointmentsScreen } from './AppointmentsScreen';

jest.mock('../../utils/confirm');

const mockConfirmDestructive = confirmDestructive as jest.MockedFunction<typeof confirmDestructive>;

describe('AppointmentsScreen', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    mockConfirmDestructive.mockResolvedValue(true);
  });

  const openForm = async () => {
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: '+ Marcar nova consulta' }));
    });
  };

  const pickType = async (label: string) => {
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Tipo de consulta' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('menuitem', { name: label }));
    });
  };

  it('marks a new consulta, edits it, then removes it', async () => {
    await render(<AppointmentsScreen />);

    expect(await screen.findByText('Ainda sem consultas marcadas.')).toBeTruthy();
    expect(screen.queryByPlaceholderText('HH:MM')).toBeNull(); // form collapsed by default (#80)

    await openForm();
    expect(screen.getByText('Nova consulta')).toBeTruthy();

    await pickType('Ecografia');
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('HH:MM'), '10:30');
    });
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText(/Levar exames/), 'Bexiga cheia');
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Marcar consulta' }));
    });

    expect(screen.getByText(/toca para editar/)).toBeTruthy();
    expect(screen.getByText('Ecografia')).toBeTruthy();
    expect(screen.getByText('Bexiga cheia')).toBeTruthy();
    expect(screen.queryByPlaceholderText('HH:MM')).toBeNull(); // form collapses again after saving

    await act(async () => {
      fireEvent.press(screen.getByText(/toca para editar/));
    });

    expect(screen.getByText('A editar consulta')).toBeTruthy();
    expect(screen.getByDisplayValue('10:30')).toBeTruthy();
    expect(screen.getByDisplayValue('Bexiga cheia')).toBeTruthy();

    await pickType('Outra');
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText(/Qual\?/), 'Fisioterapia');
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Guardar alterações' }));
    });

    expect(screen.queryByText('A editar consulta')).toBeNull();
    expect(screen.getByText('Fisioterapia')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByText('Remover'));
    });

    // startEdit set the calendar filter to this consulta's day, so the
    // empty state here is the "nothing on this day" one, not the global one.
    expect(await screen.findByText('Sem consultas neste dia.')).toBeTruthy();
    expect(screen.queryByText(/toca para editar/)).toBeNull();
  });

  it('flags a badly-formatted hora and keeps the save disabled', async () => {
    await render(<AppointmentsScreen />);
    await screen.findByText('Ainda sem consultas marcadas.');
    await openForm();

    await pickType('Pediatria');
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('HH:MM'), '25:00');
    });
    expect(screen.getByText(/Hora inválida/)).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Marcar consulta' }));
    });
    expect(screen.queryByText(/toca para editar/)).toBeNull();
  });

  it('reopens a consulta saved before #82 (no type) as "Outra" with its title', async () => {
    const future = Date.now() + 3 * 24 * 60 * 60 * 1000;
    await AsyncStorage.setItem(STORAGE_KEYS.appointments, JSON.stringify([{ id: 'old', title: 'Consulta antiga', scheduledAt: future }]));
    await render(<AppointmentsScreen />);

    const row = await screen.findByText(/toca para editar/);
    await act(async () => {
      fireEvent.press(row);
    });

    expect(screen.getByRole('button', { name: 'Tipo de consulta' })).toHaveTextContent(/Outra/);
    expect(screen.getByDisplayValue('Consulta antiga')).toBeTruthy();
  });
});
