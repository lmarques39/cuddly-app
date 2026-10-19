import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { getDoc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { auth } from '../../services/firebase';
import { STORAGE_KEYS } from '../../storage/storage';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../../types/records';
import { BREASTFEEDING_REMINDER_ID } from '../notifications/reminderScheduling';
import { ActiveSessionsProvider, useActiveSession, useActiveSessions } from './ActiveSessionsProvider';

const mockGetDoc = getDoc as jest.Mock;
const mockOnSnapshot = onSnapshot as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;
const mockDeleteDoc = deleteDoc as jest.Mock;

type Ref = { segments: unknown[] };
const path = (ref: Ref) => ref.segments.slice(1).join('/');
const wrapper = ({ children }: { children: React.ReactNode }) => <ActiveSessionsProvider>{children}</ActiveSessionsProvider>;

let pushSnapshot: (docs: { id: string; data: object }[]) => void = () => {};

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  Object.assign(auth, { currentUser: { uid: 'alice' } });
  mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ familyId: 'famA' }) });
  mockOnSnapshot.mockImplementation((_ref, _options, cb) => {
    pushSnapshot = (docs) => cb({ docs: docs.map((d) => ({ id: d.id, data: () => d.data })) });
    return () => {};
  });
});

it('starts a timer: shows it immediately and writes it to activeSessions/{kind}', async () => {
  const { result } = await renderHook(() => useActiveSession('sono'), { wrapper });

  await act(async () => result.current.start());

  expect(result.current.session).toMatchObject({ kind: 'sono', startedBy: 'alice', startedAt: expect.any(Number) });
  await waitFor(() => expect(mockSetDoc).toHaveBeenCalled());
  const [ref, data] = mockSetDoc.mock.calls[0];
  expect(path(ref)).toBe('families/famA/activeSessions/sono');
  expect(data).toMatchObject({ kind: 'sono', startedBy: 'alice' });
});

it('keeps the side for breastfeeding and hands it back on stop', async () => {
  const { result } = await renderHook(() => useActiveSession('breastfeeding'), { wrapper });

  await act(async () => result.current.start('left'));
  let finished: ReturnType<typeof result.current.stop> = null;
  await act(async () => {
    finished = result.current.stop();
  });

  expect(finished).toMatchObject({ side: 'left', startedAt: expect.any(Number), endedAt: expect.any(Number) });
  expect(result.current.session).toBeNull();
  await waitFor(() => expect(mockDeleteDoc).toHaveBeenCalled());
  expect(path(mockDeleteDoc.mock.calls[0][0])).toBe('families/famA/activeSessions/breastfeeding');
});

it('returns null when stopping a timer that is not running (e.g. the other caregiver already stopped it)', async () => {
  const { result } = await renderHook(() => useActiveSession('pumping'), { wrapper });

  let finished: unknown = 'not called';
  await act(async () => {
    finished = result.current.stop();
  });

  expect(finished).toBeNull();
  expect(mockDeleteDoc).not.toHaveBeenCalled();
});

it("shows a timer the other caregiver started, and drops it when they stop it", async () => {
  const { result } = await renderHook(() => useActiveSessions(), { wrapper });
  await waitFor(() => expect(mockOnSnapshot).toHaveBeenCalled());

  await act(async () => pushSnapshot([{ id: 'sono', data: { kind: 'sono', startedAt: 1000, startedBy: 'bob' } }]));
  expect(result.current.sessions.sono).toEqual({ kind: 'sono', startedAt: 1000, startedBy: 'bob' });

  await act(async () => pushSnapshot([]));
  expect(result.current.sessions.sono).toBeUndefined();
});

it('restores a running timer from the local cache on a cold start', async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.activeSessions, JSON.stringify([{ kind: 'contractions', startedAt: 500, startedBy: 'alice' }]));

  const { result } = await renderHook(() => useActiveSession('contractions'), { wrapper });

  await waitFor(() => expect(result.current.session).toMatchObject({ startedAt: 500 }));
});

it('holds the feeding reminder while a feed runs — even one the other caregiver started — and restarts it from its start (#123)', async () => {
  await AsyncStorage.setItem(
    STORAGE_KEYS.notificationPreferences,
    JSON.stringify({ ...DEFAULT_NOTIFICATION_PREFERENCES, breastfeeding: { enabled: true, intervalHours: 3 } }),
  );
  const schedule = Notifications.scheduleNotificationAsync as jest.Mock;
  const cancel = Notifications.cancelScheduledNotificationAsync as jest.Mock;
  await renderHook(() => useActiveSessions(), { wrapper });
  await waitFor(() => expect(mockOnSnapshot).toHaveBeenCalled());

  const startedAt = Date.now() - 20 * 60 * 1000;
  await act(async () => pushSnapshot([{ id: 'breastfeeding', data: { kind: 'breastfeeding', startedAt, startedBy: 'bob', side: 'left' } }]));
  await waitFor(() => expect(cancel).toHaveBeenCalledWith(BREASTFEEDING_REMINDER_ID));
  const reminder = () => schedule.mock.calls.find(([req]) => req.identifier === BREASTFEEDING_REMINDER_ID);
  expect(reminder()).toBeUndefined();

  await act(async () => pushSnapshot([]));
  await waitFor(() => expect(reminder()).toBeDefined());
  // 3 h from the feed's start, which was 20 min ago.
  expect(reminder()![0].trigger.seconds).toBeLessThanOrEqual(3 * 3600 - 20 * 60);
});

it('throws when used outside an ActiveSessionsProvider', async () => {
  await expect(renderHook(() => useActiveSession('sono'))).rejects.toThrow('useActiveSessions must be used within an ActiveSessionsProvider');
});
