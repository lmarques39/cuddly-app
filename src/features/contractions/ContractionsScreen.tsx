import { useTranslation } from 'react-i18next';
import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { ManualEntryToggle } from '../../components/ManualEntryToggle';
import { RemoveEntryButton } from '../../components/RemoveEntryButton';
import { fontFamily, spacing } from '../../theme/tokens';
import { createStyles, useTheme } from '../../theme/ThemeProvider';
import { formatClock, formatDuration } from '../../utils/time';
import { useNow } from '../../utils/useNow';
import { useContractions } from './useContractions';

export function ContractionsScreen() {
  const { t } = useTranslation();
  const { colors, type } = useTheme();
  const styles = useStyles();
  const { entries, runningSince, start, stop, addManual, remove, fiveOneOne } = useContractions();
  const now = useNow(1000, runningSince != null);

  const elapsed = runningSince != null ? now - runningSince : 0;
  const lastInterval = entries.length > 0 ? now - entries[0].endedAt : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>{t('contractions.title')}</Text>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={type.caption}>{t('trackers.currentDuration')}</Text>
          <Text style={type.data}>{formatDuration(elapsed)}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={type.caption}>{t('contractions.sinceLast')}</Text>
          <Text style={type.data}>{lastInterval != null ? formatDuration(lastInterval) : '—'}</Text>
        </Card>
      </View>

      <BigButton
        label={runningSince == null ? t('contractions.start') : t('contractions.stop')}
        background={colors.domain.contractions.bg}
        foreground={colors.domain.contractions.ink}
        onPress={runningSince == null ? start : stop}
        full
      />

      {fiveOneOne && (
        <Card style={[styles.alert, { borderColor: colors.domain.contractions.bg }]}>
          <Text style={[type.body, { color: colors.domain.contractions.bg, fontFamily: fontFamily.bodyBold }]}>
            {t('contractions.fiveOneOne')}
          </Text>
        </Card>
      )}

      {runningSince == null && <ManualEntryToggle onSave={addManual} />}

      <Text style={[type.caption, styles.listTitle]}>{t('trackers.history')}</Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
        ListEmptyComponent={<Text style={type.caption}>{t('trackers.noneToday')}</Text>}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View>
              <Text style={type.body}>{formatClock(item.startedAt)}</Text>
              <Text style={type.caption}>{formatDuration(item.endedAt - item.startedAt)} de duração</Text>
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
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1 },
  alert: { borderWidth: 1.5 },
  listTitle: { marginTop: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
}));
