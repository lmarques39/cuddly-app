import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { LanguagePicker } from '../components/LanguagePicker';
import { LoginScreen } from '../features/auth/LoginScreen';
import { formatSince } from '../utils/time';
import i18n, { currentLocale, initLanguage, setLanguagePreference } from './index';
import { en } from './en';
import { pt } from './pt';

const noop = () => {};

afterEach(async () => {
  await i18n.changeLanguage('pt');
  await AsyncStorage.clear();
  jest.restoreAllMocks();
});

it('starts in the phone language (Portuguese in the test setup)', () => {
  expect(i18n.language).toBe('pt');
  expect(currentLocale()).toBe('pt-PT');
});

it('renders a screen in English', async () => {
  await i18n.changeLanguage('en');
  await render(<LoginScreen onLogin={noop} onContinueWithGoogle={noop} onCreateAccount={noop} onForgotPassword={noop} />);

  expect(screen.getByText('Sign in')).toBeTruthy();
  expect(screen.getByText('Continue with Google')).toBeTruthy();
  expect(screen.queryByText('Entrar')).toBeNull();
  expect(currentLocale()).toBe('en-GB');
});

it('pluralises relative times in both languages', async () => {
  const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000 - 1000;
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000 - 1000;
  expect(formatSince(twoDaysAgo)).toBe('há 2 dias');
  expect(formatSince(oneDayAgo)).toBe('há 1 dia');

  await i18n.changeLanguage('en');
  expect(formatSince(twoDaysAgo)).toBe('2 days ago');
  expect(formatSince(oneDayAgo)).toBe('1 day ago');
});

it('Perfil → Idioma switches the language and remembers it on the device', async () => {
  await render(<LanguagePicker />);

  await act(async () => {
    fireEvent.press(screen.getByRole('radio', { name: 'Idioma: English' }));
  });

  expect(i18n.language).toBe('en');
  expect(await AsyncStorage.getItem('@cuddly/language-preference')).toBe('en');
  // the picker itself re-renders in English
  expect(screen.getByText('Language')).toBeTruthy();
});

it('re-applies a saved choice on the next start', async () => {
  await AsyncStorage.setItem('@cuddly/language-preference', 'en');
  await initLanguage();
  expect(i18n.language).toBe('en');
});

it('"Automático" goes back to the phone language', async () => {
  await setLanguagePreference('en');
  await setLanguagePreference('system');
  expect(i18n.language).toBe('pt');
});

it('every English string is translated (none left equal to a long Portuguese one by accident)', () => {
  // Keys are enforced by the typecheck; this catches copy-paste slips where the
  // English value is still the Portuguese text. Short/proper words may match.
  const same: string[] = [];
  const walk = (a: Record<string, unknown>, b: Record<string, unknown>, path: string) => {
    for (const k of Object.keys(a)) {
      const va = a[k];
      const vb = b[k];
      if (typeof va === 'object' && va) walk(va as Record<string, unknown>, vb as Record<string, unknown>, `${path}${k}.`);
      else if (typeof va === 'string' && va === vb && va.length > 12 && !/^[{}a-z@.\s·()-]+$/.test(va)) same.push(`${path}${k}`);
    }
  };
  walk(pt, en, '');
  expect(same).toEqual([]);
});
