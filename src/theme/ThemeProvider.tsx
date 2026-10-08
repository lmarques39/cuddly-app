import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { darkColors, lightColors, makeType, Palette, Typography } from './tokens';

/** What the user picked in Perfil: follow the phone, or force one theme. */
export type ThemePreference = 'system' | 'light' | 'dark';

// A device preference, like notification settings — not wiped with the
// account data by clearAllLocalData().
const PREFERENCE_KEY = '@cuddly/theme-preference';

type ThemeValue = {
  scheme: 'light' | 'dark';
  colors: Palette;
  type: Typography;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const lightType = makeType(lightColors);
const darkType = makeType(darkColors);

// Without a provider (tests, a component rendered on its own) everything
// still renders, in the light theme.
const ThemeContext = createContext<ThemeValue>({
  scheme: 'light',
  colors: lightColors,
  type: lightType,
  preference: 'system',
  setPreference: () => {},
});

/**
 * Light/dark theme for the whole app (#117). Follows the phone's setting
 * unless the user picked one in Perfil → Aparência.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(PREFERENCE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') setPreferenceState(saved);
      })
      .catch(() => {});
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(PREFERENCE_KEY, next).catch(() => {});
  }, []);

  const scheme: 'light' | 'dark' = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<ThemeValue>(
    () => ({
      scheme,
      colors: scheme === 'dark' ? darkColors : lightColors,
      type: scheme === 'dark' ? darkType : lightType,
      preference,
      setPreference,
    }),
    [scheme, preference, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}

/**
 * The themed replacement for a module-level `StyleSheet.create({...})`:
 *
 *   const useStyles = createStyles((colors, type) => ({ card: { backgroundColor: colors.surface } }));
 *   // in the component:
 *   const styles = useStyles();
 *
 * The sheet is rebuilt only when the theme changes.
 */
export function createStyles<T extends StyleSheet.NamedStyles<T>>(factory: (colors: Palette, type: Typography) => T) {
  const cache = new Map<Palette, T>();
  return function useStyles(): T {
    const { colors, type } = useTheme();
    let sheet = cache.get(colors);
    if (!sheet) {
      sheet = StyleSheet.create(factory(colors, type));
      cache.set(colors, sheet);
    }
    return sheet;
  };
}
