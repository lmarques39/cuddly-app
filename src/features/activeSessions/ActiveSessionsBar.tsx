import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { domainColors, fontFamily, spacing } from '../../theme/tokens';
import { createStyles } from '../../theme/ThemeProvider';
import { ActiveSessionKind } from '../../types/records';
import { formatDuration } from '../../utils/time';
import { useNow } from '../../utils/useNow';
import { useActiveSessions } from './ActiveSessionsProvider';

export const SESSION_LABEL: Record<ActiveSessionKind, string> = {
  sono: 'Sono',
  breastfeeding: 'Amamentação',
  pumping: 'Extração',
  contractions: 'Contração',
};

const SESSION_STYLE: Record<ActiveSessionKind, { bg: string; ink: string; icon: keyof typeof Ionicons.glyphMap }> = {
  sono: { ...domainColors.sleep, icon: 'moon' },
  breastfeeding: { ...domainColors.breastfeeding, icon: 'heart' },
  pumping: { ...domainColors.pumping, icon: 'water' },
  contractions: { ...domainColors.contractions, icon: 'pulse' },
};

const ORDER: ActiveSessionKind[] = ['contractions', 'breastfeeding', 'pumping', 'sono'];

type Props = {
  /** Opens that timer's screen. */
  onOpen: (kind: ActiveSessionKind) => void;
  /** The timer whose screen is already showing — no point repeating it in the bar. */
  hideKind?: ActiveSessionKind | null;
};

/**
 * "A decorrer" strip above the tab bar (#100): every running timer, from any
 * tab, with its time ticking up. Tapping opens the timer's screen, where it's
 * finished — finishing here would need e.g. Extração's ml amount, which only
 * that screen asks for.
 */
export function ActiveSessionsBar({ onOpen, hideKind }: Props) {
  const styles = useStyles();
  const { sessions } = useActiveSessions();
  const running = ORDER.filter((kind) => sessions[kind] && kind !== hideKind);
  const now = useNow(1000, running.length > 0);

  if (running.length === 0) return null;

  return (
    <View style={styles.bar}>
      {running.map((kind) => {
        const { bg, ink, icon } = SESSION_STYLE[kind];
        const side = sessions[kind]?.side;
        const label = `${SESSION_LABEL[kind]}${side ? ` (${side === 'left' ? 'esq.' : 'dir.'})` : ''}`;
        return (
          <Pressable
            key={kind}
            accessibilityRole="button"
            accessibilityLabel={`${label} a decorrer, abrir`}
            onPress={() => onOpen(kind)}
            style={[styles.chip, { backgroundColor: bg }]}
          >
            <Ionicons name={icon} size={16} color={ink} />
            <Text style={[styles.label, { color: ink }]} numberOfLines={1}>
              {label}
            </Text>
            <Text style={[styles.time, { color: ink }]}>{formatDuration(now - (sessions[kind]?.startedAt ?? now))}</Text>
            <Ionicons name="chevron-forward" size={16} color={ink} />
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((colors, type) => ({
  bar: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderTopWidth: 2,
    borderTopColor: colors.inkBorder,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.inkBorder,
  },
  label: { flex: 1, fontFamily: fontFamily.bodyBold, fontSize: 14 },
  time: { fontFamily: fontFamily.bodyBold, fontSize: 14, fontVariant: ['tabular-nums'] },
}));
