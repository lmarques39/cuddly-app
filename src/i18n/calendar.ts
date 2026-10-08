import i18n from './index';

// Fixed tables rather than Intl: Hermes' Intl output varies between Android
// versions ("out." vs "Out"), and these labels sit in tight calendar cells.
const MONTHS = {
  pt: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const MONTHS_SHORT = {
  pt: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
// Sunday first, matching Date.getDay().
const WEEKDAY_LETTERS = {
  pt: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
  en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
};

const lang = (): 'pt' | 'en' => (i18n.language === 'en' ? 'en' : 'pt');

export const monthNames = () => MONTHS[lang()];
export const monthShortNames = () => MONTHS_SHORT[lang()];
export const weekdayLetters = () => WEEKDAY_LETTERS[lang()];
