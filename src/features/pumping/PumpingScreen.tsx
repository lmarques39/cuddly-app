import { useTranslation } from 'react-i18next';
import React, { useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { ManualEntryToggle } from '../../components/ManualEntryToggle';
import { SessionEntryRow } from '../../components/SessionEntryRow';
import { fontFamily, radii, spacing } from '../../theme/tokens';
import { createStyles, useTheme } from '../../theme/ThemeProvider';
import { formatClock, formatDuration } from '../../utils/time';
import { useNow } from '../../utils/useNow';
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
  const { entries, runningSince, runningSide, start, stop, addManual, remove, update } = usePumping();
  const [selectedSide, setSelectedSide] = useState<PumpingSide>('both');
  const side = runningSide ?? selectedSide;
  const [showAmountError, setShowAmountError] = useState(false);
  const amountInputRef = useRef<TextInput>(null);
  const now = useNow(1000, runningSince != null);
  const [amountMl, setAmountMl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [manualAmountMl, setManualAmountMl] = useState('');

  const elapsed = runningSince != null ? now - runningSince : 0;
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

  const saveEdit = (entry: (typeof entries)[number]) => {
    if (!canSaveEdit) return;
    update({ ...entry, amountMl: parsedEditAmount });
    setEditingId(null);
  };

  const parsedManualAmount = Number(manualAmountMl);
  const canSaveManual = manualAmountMl.trim().length > 0 && !Number.isNaN(parsedManualAmount) && parsedManualAmount > 0;

  const saveManual = (startedAt: number, endedAt: number) => {
    addManual(startedAt, endedAt, parsedManualAmount, selectedSide);
    setManualAmountMl('');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
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
        <Text style={type.caption}>{t('trackers.currentDuration')}</Text>
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
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
        ListEmptyComponent={<Text style={type.caption}>{t('trackers.none')}</Text>}
        renderItem={({ item }) =>
          editingId === item.id ? (
            <Card style={styles.row}>
              <TextInput
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="numeric"
                autoFocus
                style={styles.editInput}
              />
              <View style={styles.editActions}>
                <Pressable onPress={() => saveEdit(item)} style={styles.smallButton}>
                  <Text style={styles.smallButtonLabel}>{t('common.save')}</Text>
                </Pressable>
                <Pressable onPress={() => setEditingId(null)} hitSlop={8}>
                  <Text style={type.caption}>{t('common.cancel')}</Text>
                </Pressable>
              </View>
            </Card>
          ) : (
            <SessionEntryRow
              startedAt={item.startedAt}
              durationMs={item.endedAt - item.startedAt}
              detail={[item.side && t(SIDE_DETAIL[item.side]), t('pumping.row', { ml: item.amountMl })].filter(Boolean).join(' · ')}
              onPress={() => {
                setEditingId(item.id);
                setEditAmount(String(item.amountMl));
              }}
              onRemove={() => remove(item.id)}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const useStyles = createStyles((colors, type) => ({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    fontFamily: fontFamily.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  editActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginLeft: spacing.sm },
  smallButton: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 8 },
  smallButtonLabel: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.primaryInk },
}));
