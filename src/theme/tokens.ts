/**
 * Design tokens matched to the Ninho moodboard (see project proposal artifact).
 * Kept as plain objects so any screen can `import { colors, spacing } from '@/theme/tokens'`.
 */

export const colors = {
  paper: '#F1ECE3',
  surface: '#FBF8F3',
  surfaceSunken: '#E7DFD1',
  ink: '#2A2620',
  inkSecondary: '#6B6558',
  inkMuted: '#948C7C',
  border: 'rgba(42,38,32,0.14)',
  borderStrong: 'rgba(42,38,32,0.24)',

  primary: '#6B4E9C',
  primaryInk: '#FBF8F3',
  accent: '#4F8A3F',
  tertiary: '#D9724A',

  // one colour per tracking domain, consistent with the wireframes/gantt
  domain: {
    contractions: { bg: '#D9724A', ink: '#FBF8F3' },
    breastfeeding: { bg: '#6B4E9C', ink: '#FBF8F3' },
    bottle: { bg: '#C98A1E', ink: '#2A2620' },
    pumping: { bg: '#2E6FA8', ink: '#FBF8F3' },
    diapers: { bg: '#4F8A3F', ink: '#FBF8F3' },
    sleep: { bg: '#B0416E', ink: '#FBF8F3' },
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
} as const;

// tap targets stay large: this app is mostly used one-handed, half asleep
export const touchTarget = {
  minHeight: 56,
};

export const fontFamily = {
  display: 'Fredoka_600SemiBold',
  displayMedium: 'Fredoka_500Medium',
  body: 'Karla_400Regular',
  bodyMedium: 'Karla_500Medium',
  bodyBold: 'Karla_700Bold',
} as const;

export const type = {
  h1: { fontFamily: fontFamily.display, fontSize: 28, color: colors.ink },
  h2: { fontFamily: fontFamily.display, fontSize: 20, color: colors.ink },
  body: { fontFamily: fontFamily.body, fontSize: 15, color: colors.ink },
  caption: { fontFamily: fontFamily.body, fontSize: 12.5, color: colors.inkSecondary },
  data: { fontFamily: fontFamily.bodyBold, fontSize: 22, color: colors.ink },
} as const;
