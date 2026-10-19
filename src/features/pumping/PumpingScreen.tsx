import { useTranslation } from 'react-i18next';
import React, { useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
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
import { PumpingSide } from '../../types/records';
import { usePumping } from './usePumping';

const SIDES: PumpingSide[] = ['left', 'right', 'both'];
const SIDE_LABEL = { left: 'pumping.sides.left', right: 'pumping.sides.right', both: 'pumping.sides.both' } as const satisfies Record<
  PumpingSide,
  string
>;
const SIDE_DETAIL = { left: 'csv.leftBreast', right: 'csv.rightBreast', both: 'csv.bothBreasts' } as const satisfies Record<PumpingSide, string>;

/**
 * Deliberately simple/unstyled-to-the-Figma UI — no frame exists yet (#45)
 * — so the tracker is usable now instead of waiting on design. Swap the
 * styling later without touching usePumping.ts.
 */
export function PumpingScreen() {
  const { t } = useTranslation();
  const { colors, type } = useTheme();
  const styles = useStyles();
  const { entries, session, runningSince, runningSide, start, stop, pause, resume, continueLast, addManual, remove, update } = usePumping();
  const [selectedSide, setSelectedSide] = useState<PumpingSide>('both');
  const side = runningSide ?? selectedSide;
  const [showAmountError, setShowAmountError] = useState(false);
  const amountInputRef = useRef<TextInput>(null);
  const now = useNow(runningSince != null ? 1000 : 30000);
  const [amountMl, setAmountMl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editSide, setEditSide] = useState<PumpingSide>('both');
  const [manualAmountMl, setManualAmountMl] = useState('');

  const elapsed = session ? runningElapsedMs(session, now) : 0;
  const parsedAmount = Number(amountMl);
  const canStop = amountMl.trim().length > 0 && !Number.isNaN(parsedAmount) && parsedAmount > 0;

  // "Terminar" is never greyed out (#125) — without the ml it explains
  // what's missing instead of silently doing nothing.
  const handleStop = () => {
    if (!canStop) {
      setShowAmountError(true);
      amountInputRef.current?.focus();
      return;
    }
    stop(parsedAmount);
    setAmountMl('');
    setShowAmountError(false);
  };

  const parsedEditAmount = Number(editAmount);
  const canSaveEdit = editAmount.trim().length > 0 && !Number.isNaN(parsedEditAmount) && parsedEditAmount > 0;

  const saveEdit = (entry: (typeof entries)[number], startedAt: number, endedAt: number) => {
    update({ ...withEditedTimes(entry, startedAt, endedAt), amountMl: parsedEditAmount, side: editSide });
    setEditingId(null);
  };

  const parsedManualAmount = Number(manualAmountMl);
  const canSaveManual = manualAmountMl.trim().length > 0 && !Number.isNaN(parsedManualAmount) && parsedManualAmount > 0;

  const saveManual = (startedAt: number, endedAt: number) => {
    addManual(startedAt, endedAt, parsedManualAmount, selectedSide);
    setManualAmountMl('');
  };

  return (
    <KeyboardAvoidingScreen style={styles.screen}>
      <FlatList
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={type.h1}>{t('pumping.title')}</Text>

            <View style={styles.sideRow} accessibilityRole="radiogroup" accessibilityLabel={t('pumping.side')}>
              {SIDES.map((s) => (
                <Pressable
                  key={s}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: side === s, disabled: runningSince != null }}
                  disabled={runningSince != null}
                  onPress={() => setSelectedSide(s)}
                  style={[
                    styles.sideButton,
                    {
                      backgroundColor: side === s ? colors.domain.pumping.bg : colors.surface,
                      borderColor: colors.domain.pumping.bg,
                    },
                  ]}
                >
                  <Text style={{ fontFamily: fontFamily.bodyBold, color: side === s ? colors.domain.pumping.ink : colors.ink }}>
                    {t(SIDE_LABEL[s])}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Card>
              <Text style={type.caption}>{session?.pausedAt != null ? t('trackers.paused') : t('trackers.currentDuration')}</Text>
              <Text style={type.data}>{formatDuration(elapsed)}</Text>
              {runningSince != null && <Text style={type.caption}>{t('trackers.startedAt', { time: formatClock(runningSince) })}</Text>}
            </Card>

            {runningSince != null && (
              <View>
                <Text style={type.caption}>{t('trackers.amountMl')}</Text>
                <TextInput
                  ref={amountInputRef}
                  value={amountMl}
                  onChangeText={(text) => {
                    setAmountMl(text);
                    setShowAmountError(false);
                  }}
                  placeholder="120"
                  placeholderTextColor={colors.inkMuted}
                  keyboardType="numeric"
                  style={[styles.input, showAmountError && { borderColor: colors.coral }]}
                />
                {showAmountError && <Text style={[type.caption, { color: colors.coral }]}>{t('pumping.amountNeeded')}</Text>}
              </View>
            )}

            <BigButton
              label={runningSince == null ? t('pumping.start') : t('pumping.finish')}
              background={colors.domain.pumping.bg}
              foreground={colors.domain.pumping.ink}
              onPress={runningSince == null ? () => start(selectedSide) : handleStop}
              full
            />

            <PauseContinueButton
              session={session}
              last={entries[0]}
              now={now}
              onPause={pause}
              onResume={resume}
              onContinue={() => {
                // Offer the ml typed last time again, to add to or keep.
                const ml = continueLast();
                if (ml != null) setAmountMl(String(ml));
              }}
            />

            {runningSince == null && (
              <ManualEntryToggle
                onSave={saveManual}
                extraValid={canSaveManual}
                extraFields={
                  <View>
                    <Text style={type.caption}>{t('trackers.amountMl')}</Text>
                    <TextInput
                      value={manualAmountMl}
                      onChangeText={setManualAmountMl}
                      placeholder="120"
                      placeholderTextColor={colors.inkMuted}
                      keyboardType="numeric"
                      style={styles.input}
                    />
                  </View>
                }
              />
            )}

            <Text style={[type.caption, styles.listTitle]}>{t('trackers.latest')}</Text>
          </View>
        }
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={type.caption}>{t('trackers.none')}</Text>}
        renderItem={({ item }) =>
          editingId === item.id ? (
            <SessionTimesForm
              heading={t('trackers.editing')}
              initial={item}
              onSave={(startedAt, endedAt) => saveEdit(item, startedAt, endedAt)}
              onCancel={() => setEditingId(null)}
              extraValid={canSaveEdit}
              extraFields={
                <>
                  <OptionPills options={SIDES} value={editSide} onChange={setEditSide} label={(s) => t(SIDE_LABEL[s])} />
                  <View>
                    <Text style={type.caption}>{t('trackers.amountMl')}</Text>
                    <TextInput
                      value={editAmount}
                      onChangeText={setEditAmount}
                      placeholder="120"
                      placeholderTextColor={colors.inkMuted}
                      keyboardType="numeric"
                      style={styles.input}
                    />
                  </View>
                </>
              }
            />
          ) : (
            <SessionEntryRow
              startedAt={item.startedAt}
              durationMs={entryDurationMs(item)}
              detail={[item.side && t(SIDE_DETAIL[item.side]), t('pumping.row', { ml: item.amountMl })].filter(Boolean).join(' · ')}
              onPress={() => {
                setEditingId(item.id);
                setEditAmount(String(item.amountMl));
                setEditSide(item.side ?? 'both');
              }}
              onRemove={() => remove(item.id)}
            />
          )
        }
      />
    </KeyboardAvoidingScreen>
  );
}

const useStyles = createStyles((colors, type) => ({
  screen: { flex: 1, backgroundColor: colors.paper },
  // The whole screen scrolls as one list, so a row being edited can move up above the keyboard.
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  header: { gap: spacing.md },
  input: {
    marginTop: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.body,
    fontSize: 15,
    color: colors.ink,
  },
  listTitle: { marginTop: spacing.sm },
  sideRow: { flexDirection: 'row', gap: spacing.sm },
  sideButton: { flex: 1, minHeight: 48, borderRadius: radii.lg, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
}));
