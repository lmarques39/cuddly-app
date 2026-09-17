import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontFamily, radii, spacing, type } from '../theme/tokens';
import { parseDayOnly, resolveManualRange } from '../utils/time';
import { useNow } from '../utils/useNow';
import { Card } from './Card';

const DAY_MS = 24 * 60 * 60 * 1000;

type DayOption = 'today' | 'yesterday' | 'custom';

type Props = {
  /** Called with the resolved timestamps once "Guardar" is pressed on a valid range. */
  onSave: (startedAt: number, endedAt: number) => void;
  /** Extra fields a specific tracker needs (e.g. side, ml) shown inside the form. */
  extraFields?: React.ReactNode;
  /** Set to false to block saving until the extra fields are also filled in. */
  extraValid?: boolean;
};

/**
 * Lets a session be logged after the fact (e.g. the baby fell asleep and the
 * parents only noticed later, so the live timer was never started) — two
 * explicit "HH:MM" times, not a bare duration, since that's what people
 * actually remember (#76), on a day the person picks (not always today).
 */
export function ManualEntryToggle({ onSave, extraFields, extraValid = true }: Props) {
  const [open, setOpen] = useState(false);
  const [dayOption, setDayOption] = useState<DayOption>('today');
  const [customDate, setCustomDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const now = useNow(60000, open);

  const dayMs = dayOption === 'today' ? now : dayOption === 'yesterday' ? now - DAY_MS : parseDayOnly(customDate, now);

  const range = dayMs != null ? resolveManualRange(dayMs, startTime, endTime) : undefined;
  const canSave = range != null && range.endedAt > range.startedAt && extraValid;

  const reset = () => {
    setOpen(false);
    setDayOption('today');
    setCustomDate('');
    setStartTime('');
    setEndTime('');
  };

  const save = () => {
    if (!canSave || range == null) return;
    onSave(range.startedAt, range.endedAt);
    reset();
  };

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} hitSlop={8}>
        <Text style={styles.toggleLabel}>Registar sessão anterior</Text>
      </Pressable>
    );
  }

  return (
    <Card style={{ gap: spacing.md }}>
      <Text style={type.caption}>A registar uma sessão já terminada</Text>

      <View>
        <Text style={type.caption}>Dia</Text>
        <View style={styles.dayRow}>
          {(['today', 'yesterday', 'custom'] as DayOption[]).map((option) => (
            <Pressable
              key={option}
              onPress={() => setDayOption(option)}
              style={[styles.dayPill, dayOption === option && styles.dayPillOn]}
            >
              <Text style={[styles.dayPillLabel, dayOption === option && styles.dayPillLabelOn]}>
                {option === 'today' ? 'Hoje' : option === 'yesterday' ? 'Ontem' : 'Outro dia'}
              </Text>
            </Pressable>
          ))}
        </View>
        {dayOption === 'custom' && (
          <TextInput
            value={customDate}
            onChangeText={setCustomDate}
            placeholder="DD/MM"
            placeholderTextColor={colors.inkMuted}
            style={[styles.input, { marginTop: spacing.sm }]}
          />
        )}
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeField}>
          <Text style={type.caption}>Início</Text>
          <TextInput
            value={startTime}
            onChangeText={setStartTime}
            placeholder="HH:MM"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
          />
        </View>
        <View style={styles.timeField}>
          <Text style={type.caption}>Fim</Text>
          <TextInput
            value={endTime}
            onChangeText={setEndTime}
            placeholder="HH:MM"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
          />
        </View>
      </View>

      {extraFields}

      <View style={styles.actions}>
        <Pressable onPress={save} disabled={!canSave} style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}>
          <Text style={[styles.saveButtonLabel, !canSave && styles.saveButtonLabelDisabled]}>Guardar</Text>
        </Pressable>
        <Pressable onPress={reset} hitSlop={8}>
          <Text style={type.caption}>Cancelar</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  toggleLabel: { fontFamily: fontFamily.bodyMedium, fontSize: 13, color: colors.primary },
  dayRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  dayPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dayPillOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayPillLabel: { fontFamily: fontFamily.bodyMedium, fontSize: 12.5, color: colors.inkSecondary },
  dayPillLabelOn: { color: colors.primaryInk, fontFamily: fontFamily.bodyBold },
  timeRow: { flexDirection: 'row', gap: spacing.md },
  timeField: { flex: 1 },
  input: {
    marginTop: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  saveButton: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: 10 },
  saveButtonDisabled: { backgroundColor: colors.surfaceSunken },
  saveButtonLabel: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.primaryInk },
  saveButtonLabelDisabled: { color: colors.inkMuted },
});
