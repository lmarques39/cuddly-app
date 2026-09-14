import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radii, spacing } from '../theme/tokens';
import { dateKey, MonthCalendar } from './MonthCalendar';

type Props = {
  label: string;
  value?: number;
  onChange: (epochMs: number) => void;
  placeholder?: string;
};

function parseDateKey(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

function formatLong(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** Tap-to-open calendar date field — no typing, no juggling 20 taps to page months. */
export function DateField({ label, value, onChange, placeholder = 'Escolher data' }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={() => setOpen((v) => !v)} style={styles.field}>
        <Text style={[styles.fieldText, !value && styles.fieldPlaceholder]}>
          {value ? formatLong(value) : placeholder}
        </Text>
        <Text style={styles.chevron}>{open ? '▴' : '▾'}</Text>
      </Pressable>
      {open && (
        <View style={styles.calendarWrap}>
          <MonthCalendar
            markedDates={{}}
            selectedKey={value ? dateKey(value) : null}
            initialMonth={value ? new Date(value) : undefined}
            onSelectDate={(key) => {
              onChange(parseDateKey(key));
              setOpen(false);
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fontFamily.body, fontSize: 12.5, color: colors.inkSecondary, marginBottom: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  fieldText: { fontFamily: fontFamily.bodyMedium, fontSize: 15, color: colors.ink },
  fieldPlaceholder: { color: colors.inkMuted, fontFamily: fontFamily.body },
  chevron: { color: colors.inkMuted, fontSize: 13 },
  calendarWrap: { marginTop: spacing.sm },
});
