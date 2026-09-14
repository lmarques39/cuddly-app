/**
 * Design tokens matched to the Cuddly moodboard (see project proposal artifact).
 * Kept as plain objects so any screen can `import { colors, spacing } from '@/theme/tokens'`.
 */

// Wireframe/Figma pass (2026-09-14): hand-drawn-doodle look — cream ground,
// solid black ink outlines on every control, pastel fills, pill buttons.
// See docs/assets/figma/ for the source screenshots this matches.
export const colors = {
  paper: '#F8F2E4',
  surface: '#FFFFFF',
  surfaceSunken: '#F0E9D8',
  ink: '#1C1712',
  inkSecondary: '#6B6558',
  inkMuted: '#948C7C',
  // Solid-reading (not a faint hairline) — every text input/toggle pill
  // in the wireframe has a visible ink outline, not a barely-there divider.
  border: 'rgba(28,23,18,0.55)',
  borderStrong: 'rgba(28,23,18,0.75)',
  // solid (non-alpha) ink border used on every card/button/input — the
  // wireframe's signature outline. Kept separate from `border` (which
  // stays a soft rgba hairline for subtler dividers).
  inkBorder: '#1C1712',

  primary: '#6B4E9C',
  primaryInk: '#FFFFFF',
  accent: '#4F8A3F',
  tertiary: '#D9724A',
  cream: '#F6D888', creamInk: '#1C1712',
  action: '#7FC993', actionInk: '#1C1712',
  coral: '#E0836F', coralBg: '#F8DAD2',
  cardBorder: '#1C1712',

  // one pastel per tracking domain — black ink text/borders throughout,
  // matching the wireframe convention (fill carries the meaning, not text
  // colour).
  domain: {
    contractions: { bg: '#F2B84B', ink: '#1C1712' },
    breastfeeding: { bg: '#B7A3E0', ink: '#1C1712' },
    bottle: { bg: '#F6D888', ink: '#1C1712' },
    pumping: { bg: '#93C1E6', ink: '#1C1712' },
    diapers: { bg: '#EFA9BE', ink: '#1C1712' },
    sleep: { bg: '#C9A6D6', ink: '#1C1712' },
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
