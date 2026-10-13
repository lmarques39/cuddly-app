import { act, renderHook } from '@testing-library/react-native';
import { AppState, AppStateStatus } from 'react-native';
import { useNow } from './useNow';

it('catches up as soon as the app comes back to the foreground, without waiting for the next tick (#130)', async () => {
  let onChange: (state: AppStateStatus) => void = () => {};
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    onChange = listener as (state: AppStateStatus) => void;
    return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
  });
  let clock = 1_000_000;
  jest.spyOn(Date, 'now').mockImplementation(() => clock);

  const { result } = await renderHook(() => useNow(60_000));
  expect(result.current).toBe(1_000_000);

  clock += 5 * 60_000; // phone locked for 5 minutes
  await act(async () => onChange('active'));

  expect(result.current).toBe(1_000_000 + 5 * 60_000);
  jest.restoreAllMocks();
});
