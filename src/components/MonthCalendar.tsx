import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radii, spacing } from '../theme/tokens';
import { useNow } from '../utils/useNow';

const WEEKDAY_LABEL = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_LABEL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function dateKey(epochMs: number): string {
  const d = new Date(epochMs);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Props = {
  /** date -> how many events land on that day (used to draw the dot) */
  markedDates: Record<string, number>;
  selectedKey: string | null;
  onSelectDate: (key: string) => void;
};

export function MonthCalendar({ markedDates, selectedKey, onSelectDate }: Props) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const now = useNow(60000);
  const todayKey = dateKey(now);

  const weeks = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: ({ day: number; key: string } | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ day, key });
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: (typeof cells)[] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [cursor]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
        >
          <Text style={styles.nav}>‹</Text>
        </Pressable>
        <Text style={styles.monthLabel}>
          {MONTH_LABEL[cursor.getMonth()]} {cursor.getFullYear()}
        </Text>
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
        >
          <Text style={styles.nav}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_LABEL.map((w, i) => (
          <Text key={i} style={styles.weekday}>{w}</Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((cell, ci) => {
            if (!cell) return <View key={ci} style={styles.dayCell} />;
            const isToday = cell.key === todayKey;
            const isSelected = cell.key === selectedKey;
            const count = markedDates[cell.key] ?? 0;
            return (
              <Pressable
                key={ci}
                accessibilityRole="button"
                onPress={() => onSelectDate(cell.key)}
                style={[
                  styles.dayCell,
                  styles.dayTouchable,
                  isSelected && styles.daySelected,
                  isToday && !isSelected && styles.dayToday,
                ]}
              >
                <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>{cell.day}</Text>
                {count > 0 && <View style={[styles.dot, isSelected && styles.dotSelected]} />}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const CELL = 40;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.inkBorder,
    padding: spacing.md,
    gap: spacing.xs,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: spacing.xs },
  nav: { fontFamily: fontFamily.bodyBold, fontSize: 22, color: colors.primary, paddingHorizontal: spacing.sm },
  monthLabel: { fontFamily: fontFamily.display, fontSize: 16, color: colors.ink },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekday: {
    width: CELL, textAlign: 'center', fontFamily: fontFamily.bodyBold, fontSize: 11, color: colors.inkMuted,
  },
  dayCell: { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center' },
  dayTouchable: { borderRadius: radii.pill },
  dayToday: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: radii.pill },
  daySelected: { backgroundColor: colors.action, borderRadius: radii.pill },
  dayLabel: { fontFamily: fontFamily.bodyMedium, fontSize: 13.5, color: colors.ink },
  dayLabelSelected: { color: colors.actionInk, fontFamily: fontFamily.bodyBold },
  dot: { position: 'absolute', bottom: 4, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.tertiary },
  dotSelected: { backgroundColor: colors.actionInk },
});
