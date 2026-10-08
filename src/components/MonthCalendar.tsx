import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { fontFamily, radii, spacing } from '../theme/tokens';
import { createStyles } from '../theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { monthNames, monthShortNames, weekdayLetters } from '../i18n/calendar';
import { useNow } from '../utils/useNow';


export function dateKey(epochMs: number): string {
  const d = new Date(epochMs);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Props = {
  /** date -> how many events land on that day (used to draw the dot) */
  markedDates: Record<string, number>;
  selectedKey: string | null;
  onSelectDate: (key: string) => void;
  /** month the grid opens on — defaults to today's month */
  initialMonth?: Date;
};

export function MonthCalendar({ markedDates, selectedKey, onSelectDate, initialMonth }: Props) {
  const styles = useStyles();
  // Re-renders on a language change, so the labels below follow it.
  useTranslation();
  const MONTH_LABEL = monthNames();
  const MONTH_SHORT = monthShortNames();
  const WEEKDAY_LABEL = weekdayLetters();
  const [cursor, setCursor] = useState(() => {
    const base = initialMonth ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [jumpOpen, setJumpOpen] = useState(false);

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
        <Pressable accessibilityRole="button" onPress={() => setJumpOpen((v) => !v)} hitSlop={6}>
          <Text style={styles.monthLabel}>
            {MONTH_LABEL[cursor.getMonth()]} {cursor.getFullYear()} {jumpOpen ? '▴' : '▾'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
        >
          <Text style={styles.nav}>›</Text>
        </Pressable>
      </View>

      {jumpOpen ? (
        <View style={styles.jumpPanel}>
          <View style={styles.jumpYearRow}>
            <Pressable
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => setCursor((c) => new Date(c.getFullYear() - 1, c.getMonth(), 1))}
            >
              <Text style={styles.nav}>‹</Text>
            </Pressable>
            <Text style={styles.jumpYearLabel}>{cursor.getFullYear()}</Text>
            <Pressable
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => setCursor((c) => new Date(c.getFullYear() + 1, c.getMonth(), 1))}
            >
              <Text style={styles.nav}>›</Text>
            </Pressable>
          </View>
          <View style={styles.jumpMonthGrid}>
            {MONTH_SHORT.map((label, i) => (
              <Pressable
                key={label}
                onPress={() => {
                  setCursor((c) => new Date(c.getFullYear(), i, 1));
                  setJumpOpen(false);
                }}
                style={[styles.jumpMonthCell, i === cursor.getMonth() && styles.jumpMonthCellOn]}
              >
                <Text style={[styles.jumpMonthLabel, i === cursor.getMonth() && styles.jumpMonthLabelOn]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <>
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
        </>
      )}
    </View>
  );
}

const CELL = 40;

const useStyles = createStyles((colors, type) => ({
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
  jumpPanel: { gap: spacing.sm, paddingVertical: spacing.xs },
  jumpYearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  jumpYearLabel: { fontFamily: fontFamily.display, fontSize: 18, color: colors.ink, minWidth: 64, textAlign: 'center' },
  jumpMonthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' },
  jumpMonthCell: {
    width: '30%',
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  jumpMonthCellOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  jumpMonthLabel: { fontFamily: fontFamily.bodyMedium, fontSize: 13, color: colors.inkSecondary },
  jumpMonthLabelOn: { color: colors.primaryInk, fontFamily: fontFamily.bodyBold },
}));
