import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { STORAGE_KEYS } from '../storage/storage';
import { ContractionEntry, DiaperEntry, FoodEntry, PumpingEntry, SonoEntry } from '../types/records';
import { HistoricoScreen } from './HistoricoScreen';
import { ActiveSessionsWrapper } from '../testUtils/ActiveSessionsWrapper';

describe('HistoricoScreen', () => {
  beforeEach(() => AsyncStorage.clear());

  it('groups the timeline by day, with today and yesterday labelled', async () => {
    const now = new Date(2026, 8, 24, 12, 0, 0).getTime(); // 2026-09-24 12:00
    jest.spyOn(Date, 'now').mockReturnValue(now);

    const todayContraction: ContractionEntry = {
      id: 'c1',
      startedAt: new Date(2026, 8, 24, 9, 0).getTime(),
      endedAt: new Date(2026, 8, 24, 9, 1).getTime(),
    };
    const yesterdayDiaper: DiaperEntry = {
      id: 'd1',
      type: 'wet',
      at: new Date(2026, 8, 23, 18, 0).getTime(),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.contractions, JSON.stringify([todayContraction]));
    await AsyncStorage.setItem(STORAGE_KEYS.diapers, JSON.stringify([yesterdayDiaper]));

    await render(<HistoricoScreen />, { wrapper: ActiveSessionsWrapper });

    expect(await screen.findByText('Hoje, 24/09')).toBeTruthy();
    expect(screen.getByText('Ontem, 23/09')).toBeTruthy();
    expect(screen.getAllByText('Contração').length).toBeGreaterThan(0); // also a filter chip label
    expect(screen.getAllByText('Fralda').length).toBeGreaterThan(0); // also a filter chip label

    jest.restoreAllMocks();
  });

  it('shows new foods on the timeline with their reaction, without a clock time', async () => {
    const now = new Date(2026, 9, 7, 15, 0, 0).getTime();
    jest.spyOn(Date, 'now').mockReturnValue(now);

    const egg: FoodEntry = { id: 'f1', food: 'Ovo', introducedAt: new Date(2026, 9, 7, 12, 0).getTime(), preparation: 'Puré', reaction: 'forte' };
    await AsyncStorage.setItem(STORAGE_KEYS.foods, JSON.stringify([egg]));

    await render(<HistoricoScreen />, { wrapper: ActiveSessionsWrapper });

    expect(await screen.findByText('Alimento novo · Ovo')).toBeTruthy();
    expect(screen.getByText('puré · reação forte')).toBeTruthy();

    jest.restoreAllMocks();
  });

  it('shows sleep and pumping sessions on the timeline, and lets you filter by them (#112)', async () => {
    const now = new Date(2026, 9, 7, 15, 0, 0).getTime();
    jest.spyOn(Date, 'now').mockReturnValue(now);

    const nap: SonoEntry = { id: 's1', startedAt: new Date(2026, 9, 7, 13, 0).getTime(), endedAt: new Date(2026, 9, 7, 14, 30).getTime() };
    const pump: PumpingEntry = {
      id: 'p1',
      startedAt: new Date(2026, 9, 7, 10, 0).getTime(),
      endedAt: new Date(2026, 9, 7, 10, 20).getTime(),
      amountMl: 120,
    };
    await AsyncStorage.setItem(STORAGE_KEYS.sono, JSON.stringify([nap]));
    await AsyncStorage.setItem(STORAGE_KEYS.pumping, JSON.stringify([pump]));

    await render(<HistoricoScreen />, { wrapper: ActiveSessionsWrapper });

    expect(await screen.findByText('14:30 · 01:30:00')).toBeTruthy();
    expect(screen.getByText('10:20 · 20:00 · 120ml')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getAllByText('Sono')[0]); // the filter chip comes before the timeline row
    });
    expect(screen.getByText('14:30 · 01:30:00')).toBeTruthy();
    expect(screen.queryByText('10:20 · 20:00 · 120ml')).toBeNull();

    jest.restoreAllMocks();
  });
});
