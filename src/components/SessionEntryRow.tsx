import { useTranslation } from 'react-i18next';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { fontFamily, spacing } from '../theme/tokens';
import { createStyles, useTheme } from '../theme/ThemeProvider';
import { formatClock, formatDurationShort } from '../utils/time';
import { Card } from './Card';
import { RemoveEntryButton } from './RemoveEntryButton';

type Props = {
  startedAt: number;
  durationMs: number;
  /** Whatever else this tracker records — "Mama esquerda", "120 ml · toca para editar". */
  detail?: string;
  onPress?: () => void;
  onRemove: () => void;
};

/**
 * One finished timed session (Amamentação, Sono, Extração, Contração) in a
 * tracker's list. Start time and duration each get their own label and a
 * different format ("14:32" vs "12 min") — side by side as two bare clock
 * readings they were easy to mix up (#124).
 */
export function SessionEntryRow({ startedAt, durationMs, detail, onPress, onRemove }: Props) {
  const { t } = useTranslation();
  const { type } = useTheme();
  const styles = useStyles();
  return (
    <Card style={styles.row}>
      <Pressable style={styles.text} onPress={onPress} disabled={!onPress}>
        <View style={styles.columns}>
          <View>
            <Text style={styles.label}>{t('trackers.startLabel')}</Text>
            <Text style={styles.value}>{formatClock(startedAt)}</Text>
          </View>
          <View>
            <Text style={styles.label}>{t('trackers.durationLabel')}</Text>
            <Text style={styles.value}>{formatDurationShort(durationMs)}</Text>
          </View>
        </View>
        {detail ? <Text style={type.caption}>{detail}</Text> : null}
      </Pressable>
      <RemoveEntryButton onRemove={onRemove} />
    </Card>
  );
}

const useStyles = createStyles((colors, type) => ({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md },
  text: { flex: 1, gap: spacing.xs },
  columns: { flexDirection: 'row', gap: spacing.xl },
  label: { fontFamily: fontFamily.bodyMedium, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.inkMuted },
  value: { fontFamily: fontFamily.bodyBold, fontSize: 16, color: colors.ink },
}));
