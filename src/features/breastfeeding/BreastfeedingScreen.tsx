import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { ManualEntryToggle } from '../../components/ManualEntryToggle';
import { RemoveEntryButton } from '../../components/RemoveEntryButton';
import { fontFamily, radii, spacing } from '../../theme/tokens';
import { createStyles, useTheme } from '../../theme/ThemeProvider';
import { rescheduleBreastfeedingReminder } from '../notifications/reminderScheduling';
import { useNotificationPreferences } from '../notifications/useNotificationPreferences';
import { formatClock, formatDuration } from '../../utils/time';
import { useNow } from '../../utils/useNow';
import { useBreastfeeding } from './useBreastfeeding';

const SIDE_LABEL = { left: 'breastfeeding.sides.left', right: 'breastfeeding.sides.right' } as const;

export function BreastfeedingScreen() {
  const { t } = useTranslation();
  const { colors, type } = useTheme();
  const styles = useStyles();
  const { todayEntries, todayDurationMs, running, start, stop, addManual, remove, suggestedSide } = useBreastfeeding();
  const { preferences } = useNotificationPreferences();
  const [selectedSide, setSelectedSide] = useState<'left' | 'right'>(suggestedSide);
  const now = useNow(1000, running != null);

  // Keeps the side toggle following the app's suggestion (e.g. it flips
  // after a feed ends) until the person taps the other side themselves.
  // Not touched in this pass — react-hooks/set-state-in-effect flags it,
  // but reworking it risks changing that behavior; left as follow-up.
  useEffect(() => setSelectedSide(suggestedSide), [suggestedSide]);

  const elapsed = running != null ? now - running.startedAt : 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>{t('breastfeeding.title')}</Text>

      <View style={styles.sideRow}>
        {(['left', 'right'] as const).map((side) => (
          <Pressable
            key={side}
            disabled={running != null}
            onPress={() => setSelectedSide(side)}
            style={[
              styles.sideButton,
              {
                backgroundColor: selectedSide === side ? colors.domain.breastfeeding.bg : colors.surface,
                borderColor: colors.domain.breastfeeding.bg,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: fontFamily.bodyBold,
                color: selectedSide === side ? colors.domain.breastfeeding.ink : colors.domain.breastfeeding.bg,
              }}
            >
              {t(SIDE_LABEL[side])}
            </Text>
          </Pressable>
        ))}
      </View>

      <Card style={styles.timerCard}>
        <Text style={type.caption}>
          {running != null ? t('breastfeeding.running', { side: t(SIDE_LABEL[running.side]).toLowerCase() }) : t('breastfeeding.ready')}
        </Text>
        <Text style={type.data}>{formatDuration(elapsed)}</Text>
      </Card>

      <BigButton
        label={running == null ? t('breastfeeding.start') : t('breastfeeding.finish')}
        background={colors.domain.breastfeeding.bg}
        foreground={colors.domain.breastfeeding.ink}
        onPress={() => {
          if (running == null) {
            start(selectedSide);
            return;
          }
          stop();
          if (preferences.breastfeeding.enabled) {
            rescheduleBreastfeedingReminder(preferences.breastfeeding.intervalHours);
          }
        }}
        full
      />

      {running == null && (
        <ManualEntryToggle onSave={(startedAt, endedAt) => addManual(selectedSide, startedAt, endedAt)} />
      )}

      <Text style={type.caption}>
        {t('breastfeeding.today', { count: todayEntries.length, duration: formatDuration(todayDurationMs) })}
      </Text>

      <FlatList
        data={todayEntries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
        ListEmptyComponent={<Text style={type.caption}>{t('trackers.noneToday')}</Text>}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View>
              <Text style={type.body}>{formatClock(item.startedAt)} · {t(SIDE_LABEL[item.side])}</Text>
              <Text style={type.caption}>{formatDuration(item.endedAt - item.startedAt)}</Text>
            </View>
            <RemoveEntryButton onRemove={() => remove(item.id)} />
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const useStyles = createStyles((colors, type) => ({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  sideRow: { flexDirection: 'row', gap: spacing.sm },
  sideButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCard: { alignItems: 'center', gap: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
}));
