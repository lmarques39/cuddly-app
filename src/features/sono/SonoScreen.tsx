import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { FlatList, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { ManualEntryToggle } from '../../components/ManualEntryToggle';
import { SessionEntryRow } from '../../components/SessionEntryRow';
import { SessionTimesForm } from '../../components/SessionTimesForm';
import { spacing } from '../../theme/tokens';
import { createStyles, useTheme } from '../../theme/ThemeProvider';
import { formatClock, formatDuration } from '../../utils/time';
import { useNow } from '../../utils/useNow';
import { useSono } from './useSono';

/**
 * Deliberately simple/unstyled-to-the-Figma UI — same visual pattern as
 * ContractionsScreen — so the tracker is usable now instead of waiting on
 * #36 (the Sono Figma frame). Swap the styling later without touching
 * useSono.ts.
 */
export function SonoScreen() {
  const { t } = useTranslation();
  const { colors, type } = useTheme();
  const styles = useStyles();
  const { entries, runningSince, start, stop, addManual, remove, update } = useSono();
  const [editingId, setEditingId] = useState<string | null>(null);
  const now = useNow(1000, runningSince != null);

  const elapsed = runningSince != null ? now - runningSince : 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>{t('sono.title')}</Text>

      <Card style={styles.statCard}>
        <Text style={type.caption}>{t('trackers.currentDuration')}</Text>
        <Text style={type.data}>{formatDuration(elapsed)}</Text>
        {runningSince != null && <Text style={type.caption}>{t('trackers.startedAt', { time: formatClock(runningSince) })}</Text>}
      </Card>

      <BigButton
        label={runningSince == null ? t('sono.start') : t('sono.finish')}
        background={colors.domain.sleep.bg}
        foreground={colors.domain.sleep.ink}
        onPress={runningSince == null ? start : stop}
        full
      />

      {runningSince == null && <ManualEntryToggle onSave={addManual} />}

      <Text style={[type.caption, styles.listTitle]}>{t('trackers.latest')}</Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
        ListEmptyComponent={<Text style={type.caption}>{t('trackers.none')}</Text>}
        renderItem={({ item }) => (
          editingId === item.id ? (
            <SessionTimesForm
              heading={t('trackers.editing')}
              initial={item}
              onSave={(startedAt, endedAt) => {
                update({ ...item, startedAt, endedAt });
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <SessionEntryRow
              startedAt={item.startedAt}
              durationMs={item.endedAt - item.startedAt}
              onPress={() => setEditingId(item.id)}
              onRemove={() => remove(item.id)}
            />
          )
        )}
      />
    </SafeAreaView>
  );
}

const useStyles = createStyles((colors, type) => ({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  statCard: {},
  listTitle: { marginTop: spacing.sm },
}));
