import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { fontFamily, radii, spacing } from '../theme/tokens';
import { createStyles, useTheme } from '../theme/ThemeProvider';
import { parseDayOnly, resolveManualRange } from '../utils/time';
import { useNow } from '../utils/useNow';
import { Card } from './Card';
import { OptionPills } from './OptionPills';

const DAY_MS = 24 * 60 * 60 * 1000;

type DayOption = 'today' | 'yesterday' | 'custom';

const pad = (n: number) => n.toString().padStart(2, '0');
const hhmm = (epochMs: number) => {
  const d = new Date(epochMs);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function startOfDay(epochMs: number): number {
  const d = new Date(epochMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Which day pill an existing entry starts on — today, yesterday, or "Outro dia" with its DD/MM. */
function initialDay(startedAt: number | undefined, now: number): { option: DayOption; custom: string } {
  if (startedAt == null) return { option: 'today', custom: '' };
  const daysAgo = Math.round((startOfDay(now) - startOfDay(startedAt)) / DAY_MS);
  if (daysAgo === 0) return { option: 'today', custom: '' };
  if (daysAgo === 1) return { option: 'yesterday', custom: '' };
  const d = new Date(startedAt);
  return { option: 'custom', custom: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}` };
}

type Props = {
  heading: string;
  /** An existing entry's times, when editing it (#126); empty for a new one. */
  initial?: { startedAt: number; endedAt: number };
  /** Called with the resolved timestamps once "Guardar" is pressed on a valid range. */
  onSave: (startedAt: number, endedAt: number) => void;
  onCancel: () => void;
  /** Extra fields a specific tracker needs (e.g. side, ml) shown inside the form. */
  extraFields?: React.ReactNode;
  /** Set to false to block saving until the extra fields are also filled in. */
  extraValid?: boolean;
};

/**
 * Day + start/end "HH:MM" for a timed session — two explicit times, not a
 * bare duration, since that's what people actually remember (#76). Used to
 * log a session after the fact (ManualEntryToggle) and to correct one that
 * was timed wrong, e.g. the timer left running (#126).
 */
export function SessionTimesForm({ heading, initial, onSave, onCancel, extraFields, extraValid = true }: Props) {
  const { t } = useTranslation();
  const { colors, type } = useTheme();
  const styles = useStyles();
  const now = useNow(60000);
  const [dayOption, setDayOption] = useState<DayOption>(() => initialDay(initial?.startedAt, Date.now()).option);
  const [customDate, setCustomDate] = useState(() => initialDay(initial?.startedAt, Date.now()).custom);
  const [startTime, setStartTime] = useState(initial ? hhmm(initial.startedAt) : '');
  const [endTime, setEndTime] = useState(initial ? hhmm(initial.endedAt) : '');

  const dayMs = dayOption === 'today' ? now : dayOption === 'yesterday' ? now - DAY_MS : parseDayOnly(customDate, now);

  // Times left as they were keep the entry's exact timestamps — HH:MM
  // loses the seconds, so a 30 s session would otherwise become 11:29–11:29
  // and refuse to save a change to just its side or ml.
  const untouched =
    initial != null &&
    dayOption === initialDay(initial.startedAt, now).option &&
    customDate === initialDay(initial.startedAt, now).custom &&
    startTime === hhmm(initial.startedAt) &&
    endTime === hhmm(initial.endedAt);
  const range = untouched ? initial : dayMs != null ? resolveManualRange(dayMs, startTime, endTime) : undefined;
  const canSave = range != null && range.endedAt > range.startedAt && extraValid;

  const save = () => {
    if (!canSave || range == null) return;
    onSave(range.startedAt, range.endedAt);
  };

  return (
    <Card style={{ gap: spacing.md }}>
      <Text style={type.caption}>{heading}</Text>

      <View>
        <Text style={type.caption}>{t('common.day')}</Text>
        <OptionPills
          options={['today', 'yesterday', 'custom'] as const}
          value={dayOption}
          onChange={setDayOption}
          label={(option) => (option === 'today' ? t('common.today') : option === 'yesterday' ? t('common.yesterday') : t('common.otherDay'))}
        />
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
          <Text style={type.caption}>{t('common.start')}</Text>
          <TextInput
            value={startTime}
            onChangeText={setStartTime}
            placeholder="HH:MM"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
          />
        </View>
        <View style={styles.timeField}>
          <Text style={type.caption}>{t('common.end')}</Text>
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
          <Text style={[styles.saveButtonLabel, !canSave && styles.saveButtonLabelDisabled]}>{t('common.save')}</Text>
        </Pressable>
        <Pressable onPress={onCancel} hitSlop={8}>
          <Text style={type.caption}>{t('common.cancel')}</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const useStyles = createStyles((colors, type) => ({
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
}));
