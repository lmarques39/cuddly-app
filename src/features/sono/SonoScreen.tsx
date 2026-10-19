import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { KeyboardAvoidingScreen } from '../../components/KeyboardAvoidingScreen';
import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { ManualEntryToggle } from '../../components/ManualEntryToggle';
import { SessionEntryRow } from '../../components/SessionEntryRow';
import { SessionTimesForm } from '../../components/SessionTimesForm';
import { spacing } from '../../theme/tokens';
import { createStyles, useTheme } from '../../theme/ThemeProvider';
import { formatClock, formatDuration } from '../../utils/time';
import { useNow } from '../../utils/useNow';
import { entryDurationMs, runningElapsedMs, withEditedTimes } from '../../utils/sessionTime';
import { PauseContinueButton } from '../../components/PauseContinueButton';
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
  const { entries, session, runningSince, start, stop, pause, resume, continueLast, addManual, remove, update } = useSono();
  const [editingId, setEditingId] = useState<string | null>(null);
  const now = useNow(runningSince != null ? 1000 : 30000);

  const elapsed = session ? runningElapsedMs(session, now) : 0;

  return (
    <KeyboardAvoidingScreen style={styles.screen}>
      <FlatList
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={type.h1}>{t('sono.title')}</Text>

            <Card style={styles.statCard}>
              <Text style={type.caption}>{session?.pausedAt != null ? t('trackers.paused') : t('trackers.currentDuration')}</Text>
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

            <PauseContinueButton session={session} last={entries[0]} now={now} onPause={pause} onResume={resume} onContinue={continueLast} />

            {runningSince == null && <ManualEntryToggle onSave={addManual} />}

            <Text style={[type.caption, styles.listTitle]}>{t('trackers.latest')}</Text>
          </View>
        }
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={type.caption}>{t('trackers.none')}</Text>}
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
  statCard: {},
  listTitle: { marginTop: spacing.sm },
}));
