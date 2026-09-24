import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { STORAGE_KEYS } from '../storage/storage';
import { ContractionEntry, DiaperEntry } from '../types/records';
import { HistoricoScreen } from './HistoricoScreen';

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

    await render(<HistoricoScreen />);

    expect(await screen.findByText('Hoje, 24/09')).toBeTruthy();
    expect(screen.getByText('Ontem, 23/09')).toBeTruthy();
    expect(screen.getAllByText('Contração').length).toBeGreaterThan(0); // also a filter chip label
    expect(screen.getAllByText('Fralda').length).toBeGreaterThan(0); // also a filter chip label

    jest.restoreAllMocks();
  });
});
