import { act, renderHook } from '@testing-library/react-native';
import { useSavedFlash } from './useSavedFlash';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('starts hidden', async () => {
  const { result } = await renderHook(() => useSavedFlash());
  expect(result.current.visible).toBe(false);
});

it('becomes visible after flash(), then hides itself after the duration', async () => {
  const { result } = await renderHook(() => useSavedFlash(1000));

  await act(async () => result.current.flash());
  expect(result.current.visible).toBe(true);

  await act(async () => jest.advanceTimersByTime(1000));
  expect(result.current.visible).toBe(false);
});

it('restarts the timer when flashed again before it hides', async () => {
  const { result } = await renderHook(() => useSavedFlash(1000));

  await act(async () => result.current.flash());
  await act(async () => jest.advanceTimersByTime(600));
  await act(async () => result.current.flash()); // restarts the countdown
  await act(async () => jest.advanceTimersByTime(600));

  expect(result.current.visible).toBe(true); // only 600ms since the restart, not 1000ms
});
