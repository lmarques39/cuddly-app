import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { deleteDoc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import React from 'react';
import { Platform } from 'react-native';
import { auth } from '../../services/firebase';
import { loadList, STORAGE_KEYS } from '../../storage/storage';
import { ActiveSession, BreastfeedingEntry } from '../../types/records';
import { ActiveSessionsProvider, useActiveSession } from './ActiveSessionsProvider';
import { finishSessionOutsideApp } from './finishSession';
import { ACTION_FINISH, handleFinishTap } from './sessionNotification';

const mockSchedule = Notifications.scheduleNotificationAsync as jest.Mock;
const mockDismiss = Notifications.dismissNotificationAsync as jest.Mock;
const mockGetDoc = getDoc as jest.Mock;
const mockOnSnapshot = onSnapshot as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;
const mockDeleteDoc = deleteDoc as jest.Mock;

type Ref = { segments: unknown[] };
const path = (ref: Ref) => ref.segments.slice(1).join('/');
const wrapper = ({ children }: { children: React.ReactNode }) => <ActiveSessionsProvider>{children}</ActiveSessionsProvider>;

const feed: ActiveSession = { kind: 'breastfeeding', startedAt: Date.now() - 10 * 60 * 1000, startedBy: 'alice', side: 'right' };

function finishTap(kind: string, date = 1): Notifications.NotificationResponse {
  return {
    actionIdentifier: ACTION_FINISH,
    notification: { date, request: { identifier: `active-session-${kind}`, content: { data: { kind } } } },
  } as unknown as Notifications.NotificationResponse;
}

const originalOS = Platform.OS;

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  Platform.OS = 'android';
  Object.assign(auth, { currentUser: { uid: 'alice' } });
  mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ familyId: 'famA' }) });
  mockOnSnapshot.mockImplementation(() => () => {});
});

afterAll(() => {
  Platform.OS = originalOS;
});

describe('finishSessionOutsideApp', () => {
  it('saves the entry, clears the running timer and its Firestore doc', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.activeSessions, JSON.stringify([feed]));

    expect(await finishSessionOutsideApp('breastfeeding')).toBe(true);

    const saved = await loadList<BreastfeedingEntry>(STORAGE_KEYS.breastfeeding);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ side: 'right', startedAt: feed.startedAt });
    expect(await loadList(STORAGE_KEYS.activeSessions)).toEqual([]);
    expect(mockDeleteDoc.mock.calls.map(([ref]) => path(ref))).toContain('families/famA/activeSessions/breastfeeding');
    expect(mockSetDoc.mock.calls.map(([ref]) => path(ref))).toContain(`families/famA/breastfeeding/${saved[0].id}`);
  });

  it('does nothing when that timer already stopped', async () => {
    expect(await finishSessionOutsideApp('sono')).toBe(false);
    expect(await loadList(STORAGE_KEYS.sono)).toEqual([]);
  });
});

describe('handleFinishTap', () => {
  it('handles the same tap only once, even if the background task and the app both see it', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.activeSessions, JSON.stringify([{ ...feed, kind: 'sono', side: undefined }]));

    await Promise.all([handleFinishTap(finishTap('sono', 42)), handleFinishTap(finishTap('sono', 42))]);

    expect(await loadList(STORAGE_KEYS.sono)).toHaveLength(1);
    expect(mockDismiss).toHaveBeenCalledWith('active-session-sono');
  });

  it('ignores Terminar for Extração — it needs the ml amount', async () => {
    expect(await handleFinishTap(finishTap('pumping'))).toBe(false);
  });
});

describe('ActiveSessionsProvider notifications', () => {
  it('shows a sticky notification when a timer starts and dismisses it when it stops', async () => {
    const { result } = await renderHook(() => useActiveSession('sono'), { wrapper });

    await act(async () => result.current.start());
    await waitFor(() =>
      expect(mockSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'active-session-sono',
          content: expect.objectContaining({ title: 'Sono a decorrer', sticky: true, categoryIdentifier: 'active-session' }),
        }),
      ),
    );

    mockDismiss.mockClear();
    await act(async () => {
      result.current.stop();
    });
    await waitFor(() => expect(mockDismiss).toHaveBeenCalledWith('active-session-sono'));
  });

  it('gives Extração only the Ver button', async () => {
    const { result } = await renderHook(() => useActiveSession('pumping'), { wrapper });

    await act(async () => result.current.start());
    await waitFor(() =>
      expect(mockSchedule).toHaveBeenCalledWith(
        expect.objectContaining({ content: expect.objectContaining({ categoryIdentifier: 'active-session-view-only' }) }),
      ),
    );
  });

  it('drops a timer finished from the notification without waiting for Firestore', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.activeSessions, JSON.stringify([feed]));
    const { result } = await renderHook(() => useActiveSession('breastfeeding'), { wrapper });
    await waitFor(() => expect(result.current.session).not.toBeNull());

    await act(async () => {
      await finishSessionOutsideApp('breastfeeding');
    });

    expect(result.current.session).toBeNull();
  });
});
