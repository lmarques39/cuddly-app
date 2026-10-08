import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/Card';
import { RemoveEntryButton } from '../../components/RemoveEntryButton';
import { fontFamily, radii, spacing } from '../../theme/tokens';
import { createStyles, useTheme } from '../../theme/ThemeProvider';
import { DiaperType } from '../../types/records';
import { formatClock, formatSince } from '../../utils/time';
import { useDiapers } from './useDiapers';

const TYPE_LABEL = { wet: 'diaperTypes.wet', dirty: 'diaperTypes.dirty', both: 'diaperTypes.both' } as const satisfies Record<DiaperType, string>;

export function DiapersScreen() {
  const { t } = useTranslation();
  const { colors, type } = useTheme();
  const styles = useStyles();
  const { todayEntries, lastEntry, register, remove } = useDiapers();
  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>{t('diapers.title')}</Text>

      <Card style={styles.lastCard}>
        <Text style={type.caption}>{t('diapers.lastChange')}</Text>
        <Text style={type.data}>{lastEntry ? formatSince(lastEntry.at) : t('diapers.none')}</Text>
        {lastEntry && <Text style={type.caption}>{t('diapers.typeAt', { type: t(TYPE_LABEL[lastEntry.type]), time: formatClock(lastEntry.at) })}</Text>}
      </Card>

      <View style={styles.buttonRow}>
        {(['wet', 'dirty', 'both'] as DiaperType[]).map((diaperType) => (
          <Pressable
            key={diaperType}
            onPress={() => register(diaperType)}
            style={[styles.diaperButton, { backgroundColor: colors.domain.diapers.bg }]}
          >
            <Text style={[styles.diaperLabel, { color: colors.domain.diapers.ink }]}>{t(TYPE_LABEL[diaperType])}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={type.caption}>{t('diapers.today', { count: todayEntries.length })}</Text>

      <FlatList
        data={todayEntries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
        ListEmptyComponent={<Text style={type.caption}>{t('trackers.noneToday')}</Text>}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View>
              <Text style={type.body}>{formatClock(item.at)}</Text>
              <Text style={type.caption}>{t(TYPE_LABEL[item.type])}</Text>
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
  lastCard: { alignItems: 'center', gap: spacing.xs },
  buttonRow: { flexDirection: 'row', gap: spacing.sm },
  diaperButton: { flex: 1, minHeight: 72, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  diaperLabel: { fontFamily: fontFamily.bodyBold, fontSize: 14.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
}));
