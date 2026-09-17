import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { NotificacoesScreen } from './NotificacoesScreen';

const mockSchedule = Notifications.scheduleNotificationAsync as jest.Mock;

describe('NotificacoesScreen', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('turning on the breastfeeding reminder and saving schedules a notification with the chosen interval', async () => {
    await render(<NotificacoesScreen />);

    await act(async () => {
      fireEvent(screen.getAllByRole('switch')[0], 'valueChange', true);
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    });

    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ trigger: expect.objectContaining({ seconds: 3 * 3600 }) }),
    );
    expect(screen.getByText('Guardado com sucesso.')).toBeTruthy();
  });

  it('shows "Novidades da Cuddly" as disabled — it is genuine push, out of scope', async () => {
    await render(<NotificacoesScreen />);

    expect(screen.getByText('Novidades da Cuddly')).toBeTruthy();
    expect(screen.getByText('Brevemente')).toBeTruthy();
  });
});
