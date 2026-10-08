import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './en';
import { pt } from './pt';

/**
 * PT/EN for the whole app (#118). Strings live in pt.ts/en.ts (typed — a key
 * missing in either language fails the typecheck). Screens use
 * `const { t } = useTranslation()`; non-React code (notifications, CSV,
 * errors) imports `i18n` from here and calls `i18n.t(...)`.
 */

export type Language = 'pt' | 'en';
/** What the user picked in Perfil: follow the phone, or force one language. */
export type LanguagePreference = 'system' | Language;

// A device preference, like the theme — not wiped with the account data.
const PREFERENCE_KEY = '@cuddly/language-preference';

/** Portuguese phones get Portuguese; any other language gets English. */
export function deviceLanguage(): Language {
  try {
    return getLocales()[0]?.languageCode === 'pt' ? 'pt' : 'en';
  } catch {
    return 'pt';
  }
}

i18n.use(initReactI18next).init({
  resources: { pt: { translation: pt }, en: { translation: en } },
  lng: deviceLanguage(),
  fallbackLng: 'pt',
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
});

/** BCP 47 tag for Intl/toLocale*String — en-GB keeps day-first dates and the 24h clock. */
export function currentLocale(): string {
  return i18n.language === 'en' ? 'en-GB' : 'pt-PT';
}

export async function loadLanguagePreference(): Promise<LanguagePreference> {
  try {
    const saved = await AsyncStorage.getItem(PREFERENCE_KEY);
    if (saved === 'pt' || saved === 'en' || saved === 'system') return saved;
  } catch {
    // Storage unavailable — the phone's language still applies.
  }
  return 'system';
}

/** Applies a preference now and remembers it on this device. */
export async function setLanguagePreference(preference: LanguagePreference): Promise<void> {
  await i18n.changeLanguage(preference === 'system' ? deviceLanguage() : preference);
  await AsyncStorage.setItem(PREFERENCE_KEY, preference).catch(() => {});
}

/** Call once at startup: re-applies the saved choice (the phone's language is the default until then). */
export async function initLanguage(): Promise<void> {
  const preference = await loadLanguagePreference();
  if (preference !== 'system') await i18n.changeLanguage(preference);
}

export default i18n;
