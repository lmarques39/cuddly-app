import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { KeyboardAvoidingScreen } from '../../components/KeyboardAvoidingScreen';
import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { ManualEntryToggle } from '../../components/ManualEntryToggle';
import { SessionEntryRow } from '../../components/SessionEntryRow';
import { SessionTimesForm } from '../../components/SessionTimesForm';
import { fontFamily, spacing } from '../../theme/tokens';
import { createStyles, useTheme } from '../../theme/ThemeProvider';
import { formatClock, formatDuration } from '../../utils/time';
import { useNow } from '../../utils/useNow';
import { entryDurationMs, withEditedTimes } from '../../utils/sessionTime';
import { useContractions } from './useContractions';

export function ContractionsScreen() {
  const { t } = useTranslation();
  const { colors, type } = useTheme();
  const styles = useStyles();
  const { entries, runningSince, start, stop, addManual, remove, update, fiveOneOne } = useContractions();
  const [editingId, setEditingId] = useState<string | null>(null);
  const now = useNow(1000, runningSince != null);

  const elapsed = runningSince != null ? now - runningSince : 0;
  // Start to start, like every other time in the app (#122) — and how
  // contraction frequency is usually counted.
  const lastInterval = entries.length > 0 ? now - entries[0].startedAt : null;

  return (
    <KeyboardAvoidingScreen style={styles.screen}>
      <FlatList
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={type.h1}>{t('contractions.title')}</Text>

            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <Text style={type.caption}>{t('trackers.currentDuration')}</Text>
                <Text style={type.data}>{formatDuration(elapsed)}</Text>
                {runningSince != null && <Text style={type.caption}>{t('trackers.startedAt', { time: formatClock(runningSince) })}</Text>}
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
          </View>
        }
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={type.caption}>{t('trackers.noneToday')}</Text>}
        renderItem={({ item }) => (
          editingId === item.id ? (
            <SessionTimesForm
              heading={t('trackers.editing')}
              initial={item}
              onSave={(startedAt, endedAt) => {
                update(withEditedTimes(item, startedAt, endedAt));
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <SessionEntryRow
              startedAt={item.startedAt}
              durationMs={entryDurationMs(item)}
              onPress={() => setEditingId(item.id)}
              onRemove={() => remove(item.id)}
            />
          )
        )}
      />
    </KeyboardAvoidingScreen>
  );
}

const useStyles = createStyles((colors, type) => ({
  screen: { flex: 1, backgroundColor: colors.paper },
  // The whole screen scrolls as one list, so a row being edited can move up above the keyboard.
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  header: { gap: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1 },
  alert: { borderWidth: 1.5 },
  listTitle: { marginTop: spacing.sm },
}));
