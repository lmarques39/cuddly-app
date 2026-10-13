import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, Text } from 'react-native';
import { fontFamily, radii, spacing } from '../theme/tokens';
import { createStyles, useTheme } from '../theme/ThemeProvider';
import { canContinue } from '../utils/sessionTime';
import { formatClock } from '../utils/time';

type Props = {
  /** The running timer, if any. */
  session: { pausedAt?: number } | null;
  /** The latest finished entry — offered for "Continuar" if it ended recently. */
  last: { startedAt: number; endedAt: number } | undefined;
  now: number;
  onPause: () => void;
  onResume: () => void;
  onContinue: () => void;
};

/**
 * The secondary action under a tracker's big Iniciar/Terminar button (#127):
 * Pausar / Retomar while it runs, or "Continuar o registo das 14:32" right after one
 * ended — for a break (burping, a nappy) that shouldn't split one feed or
 * nap into two entries, nor count as part of it.
 */
export function PauseContinueButton({ session, last, now, onPause, onResume, onContinue }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles();

  let label: string;
  let icon: keyof typeof Ionicons.glyphMap;
  let onPress: () => void;
  if (session) {
    const paused = session.pausedAt != null;
    label = paused ? t('trackers.resume') : t('trackers.pause');
    icon = paused ? 'play' : 'pause';
    onPress = paused ? onResume : onPause;
  } else if (last && canContinue(last, now)) {
    label = t('trackers.continueLast', { time: formatClock(last.startedAt) });
    icon = 'play-forward';
    onPress = onContinue;
  } else {
    return null;
  }

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.button}>
      <Ionicons name={icon} size={16} color={colors.ink} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const useStyles = createStyles((colors, type) => ({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.inkBorder,
    backgroundColor: colors.surface,
  },
  label: { fontFamily: fontFamily.bodyBold, fontSize: 14, color: colors.ink },
}));
