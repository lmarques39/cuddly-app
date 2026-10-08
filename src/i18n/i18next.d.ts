import 'i18next';
import type { Translations } from './pt';

// Typed keys: t('perfil.title') autocompletes, and a typo or a missing key is
// a compile error instead of a raw key showing up on screen.
declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: Translations };
    returnNull: false;
  }
}
