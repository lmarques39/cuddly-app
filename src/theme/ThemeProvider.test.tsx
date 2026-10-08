import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import * as RN from 'react-native';
import { AppearancePicker } from '../components/AppearancePicker';
import { createStyles, ThemeProvider, useTheme } from './ThemeProvider';
import { darkColors, lightColors } from './tokens';

const wrapper = ({ children }: { children: React.ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.restoreAllMocks();
});

it('follows the phone when nothing was picked', async () => {
  jest.spyOn(RN, 'useColorScheme').mockReturnValue('dark');
  const { result } = await renderHook(() => useTheme(), { wrapper });

  expect(result.current.scheme).toBe('dark');
  expect(result.current.colors).toBe(darkColors);
  expect(result.current.type.body.color).toBe(darkColors.ink);
});

it('a forced choice beats the phone setting and is remembered on the device', async () => {
  jest.spyOn(RN, 'useColorScheme').mockReturnValue('dark');
  const { result } = await renderHook(() => useTheme(), { wrapper });

  await act(async () => result.current.setPreference('light'));

  expect(result.current.colors).toBe(lightColors);
  expect(await AsyncStorage.getItem('@cuddly/theme-preference')).toBe('light');
});

it('restores the saved choice on the next start', async () => {
  jest.spyOn(RN, 'useColorScheme').mockReturnValue('light');
  await AsyncStorage.setItem('@cuddly/theme-preference', 'dark');

  const { result } = await renderHook(() => useTheme(), { wrapper });

  await waitFor(() => expect(result.current.scheme).toBe('dark'));
});

it('createStyles gives each theme its own sheet', async () => {
  jest.spyOn(RN, 'useColorScheme').mockReturnValue('light');
  const useStyles = createStyles((colors) => ({ box: { backgroundColor: colors.paper } }));
  const { result } = await renderHook(() => ({ styles: useStyles(), theme: useTheme() }), { wrapper });
  expect(RN.StyleSheet.flatten(result.current.styles.box).backgroundColor).toBe(lightColors.paper);

  await act(async () => result.current.theme.setPreference('dark'));

  expect(RN.StyleSheet.flatten(result.current.styles.box).backgroundColor).toBe(darkColors.paper);
});

it('Perfil → Aparência switches the theme', async () => {
  jest.spyOn(RN, 'useColorScheme').mockReturnValue('light');
  let seen: string | undefined;
  function Probe() {
    seen = useTheme().scheme;
    return null;
  }
  await render(
    <ThemeProvider>
      <AppearancePicker />
      <Probe />
    </ThemeProvider>,
  );

  await act(async () => {
    fireEvent.press(screen.getByRole('radio', { name: 'Aparência: Escuro' }));
  });

  expect(seen).toBe('dark');
  expect(screen.getByRole('radio', { name: 'Aparência: Escuro' }).props.accessibilityState).toMatchObject({ selected: true });
});
