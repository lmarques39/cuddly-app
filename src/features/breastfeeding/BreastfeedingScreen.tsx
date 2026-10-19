import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { KeyboardAvoidingScreen } from '../../components/KeyboardAvoidingScreen';
import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { ManualEntryToggle } from '../../components/ManualEntryToggle';
import { OptionPills } from '../../components/OptionPills';
import { SessionEntryRow } from '../../components/SessionEntryRow';
import { SessionTimesForm } from '../../components/SessionTimesForm';
import { fontFamily, radii, spacing } from '../../theme/tokens';
import { createStyles, useTheme } from '../../theme/ThemeProvider';
import { formatClock, formatDuration } from '../../utils/time';
import { useNow } from '../../utils/useNow';
import { entryDurationMs, runningElapsedMs, withEditedTimes } from '../../utils/sessionTime';
import { PauseContinueButton } from '../../components/PauseContinueButton';
import { useBreastfeeding } from './useBreastfeeding';

const SIDE_LABEL = { left: 'breastfeeding.sides.left', right: 'breastfeeding.sides.right' } as const;

export function BreastfeedingScreen() {
  const { t } = useTranslation();
  const { colors, type } = useTheme();
  const styles = useStyles();
  const { entries, todayEntries, todayDurationMs, session, running, start, stop, pause, resume, continueLast, addManual, remove, update, suggestedSide } =
    useBreastfeeding();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSide, setEditSide] = useState<'left' | 'right'>('left');
  const [selectedSide, setSelectedSide] = useState<'left' | 'right'>(suggestedSide);
  const now = useNow(running != null ? 1000 : 30000);

  // Keeps the side toggle following the app's suggestion (e.g. it flips
  // after a feed ends) until the person taps the other side themselves.
  // Not touched in this pass — react-hooks/set-state-in-effect flags it,
  // but reworking it risks changing that behavior; left as follow-up.
  useEffect(() => setSelectedSide(suggestedSide), [suggestedSide]);

  const elapsed = session ? runningElapsedMs(session, now) : 0;

  return (
    <KeyboardAvoidingScreen style={styles.screen}>
      <FlatList
        ListHeaderComponent={
          <View style={styles.header}>
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
                {session?.pausedAt != null
                  ? t('trackers.paused')
                  : running != null
                    ? t('breastfeeding.running', { side: t(running.side === 'left' ? 'side.left' : 'side.right') })
                    : t('breastfeeding.ready')}
              </Text>
              <Text style={type.data}>{formatDuration(elapsed)}</Text>
              {running != null && <Text style={type.caption}>{t('trackers.startedAt', { time: formatClock(running.startedAt) })}</Text>}
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
                // The feeding reminder restarts by itself (ActiveSessionsProvider, #123).
                stop();
              }}
              full
            />

            <PauseContinueButton session={session} last={entries[0]} now={now} onPause={pause} onResume={resume} onContinue={continueLast} />

            {running == null && (
              <ManualEntryToggle onSave={(startedAt, endedAt) => addManual(selectedSide, startedAt, endedAt)} />
            )}

            <Text style={type.caption}>
              {t('breastfeeding.today', { count: todayEntries.length, duration: formatDuration(todayDurationMs) })}
            </Text>
          </View>
        }
        data={todayEntries}
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
                update({ ...withEditedTimes(item, startedAt, endedAt), side: editSide });
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
              extraFields={
                <OptionPills options={['left', 'right'] as const} value={editSide} onChange={setEditSide} label={(s) => t(SIDE_LABEL[s])} />
              }
            />
          ) : (
            <SessionEntryRow
              startedAt={item.startedAt}
              durationMs={entryDurationMs(item)}
              detail={t(item.side === 'left' ? 'csv.leftBreast' : 'csv.rightBreast')}
              onPress={() => {
                setEditingId(item.id);
                setEditSide(item.side);
              }}
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
}));
