import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import i18n from '../../i18n';
import { monthShortNames, weekdayLetters } from '../../i18n/calendar';
import { fontFamily, spacing } from '../../theme/tokens';
import { createStyles, useTheme } from '../../theme/ThemeProvider';
import { averagePerDay, CalendarEvent, CalendarSegment, dayStart, layOutWeek } from './calendarLayout';

const DAYS = 7;
const HOUR_PX = 18;
const GRID_PX = 24 * HOUR_PX;
const AXIS_PX = 26;
const MIN_MARK_PX = 4;
// Shaded as night, like the reference the tester sent (#129).
const NIGHT_BANDS = [
  [0, 7],
  [19, 24],
] as const;

/** "6,1" / "6.1" — one decimal, the language's own separator. */
function formatAverage(value: number): string {
  const rounded = (Math.round(value * 10) / 10).toFixed(1);
  return i18n.language === 'en' ? rounded : rounded.replace('.', ',');
}

function formatDay(epochMs: number): string {
  const d = new Date(epochMs);
  return `${d.getDate()} ${monthShortNames()[d.getMonth()]}`;
}

export type CalendarSeries = {
  key: string;
  /** "Amamentação" — in the legend, and before a tapped mark's details. */
  title: string;
  color: string;
  events: CalendarEvent[];
};

type Props = {
  /** One to three trackers (#131), in colour-slot order — also their lane order inside each day. */
  series: CalendarSeries[];
  now: number;
};

type Selected = { segment: CalendarSegment; seriesTitle: string };

/**
 * Tendências as a week calendar (#129): days across, hours 00→24 down, one
 * mark per entry at the hour it *started* and as tall as it lasted — so
 * the rhythm of feeds or naps across the day and night jumps out. Up to
 * three trackers together (#131), each in its own colour and its own lane
 * of every day, named in the legend. The timeline is the table view of the
 * same entries.
 */
export function TrendsCalendar({ series, now }: Props) {
  const { t } = useTranslation();
  const { colors, type } = useTheme();
  const styles = useStyles();
  const [weeksBack, setWeeksBack] = useState(0);
  const [selected, setSelected] = useState<Selected | null>(null);

  // The shown week ends today, so the latest days are always in view.
  const firstDay = dayStart(now, -(DAYS - 1) - weeksBack * DAYS);
  const todayStart = dayStart(now);
  const lanes = useMemo(
    () =>
      series.map((s) => ({
        ...s,
        segments: layOutWeek(s.events, firstDay, DAYS),
        average: averagePerDay(s.events, firstDay, now, DAYS),
      })),
    [series, firstDay, now],
  );
  const single = lanes.length === 1 ? lanes[0] : null;
  const columns = Array.from({ length: DAYS }, (_, i) => dayStart(firstDay, i));

  const changeWeek = (delta: number) => {
    setWeeksBack((w) => Math.max(0, w + delta));
    setSelected(null);
  };

  return (
    <Card style={styles.card}>
      {single ? (
        <View style={styles.headline}>
          <Text style={styles.average}>{single.average != null ? t('history.calendar.perDay', { value: formatAverage(single.average) }) : '—'}</Text>
          <Text style={type.caption}>
            {single.average != null ? t('history.calendar.caption', { kind: single.title }) : t('history.calendar.empty')}
          </Text>
        </View>
      ) : (
        // Two or more: a legend, so identity never rests on colour alone.
        <View style={styles.legend} accessibilityRole="summary">
          {lanes.map((lane) => (
            <View key={lane.key} style={styles.legendRow}>
              <View style={[styles.swatch, { backgroundColor: lane.color }]} />
              <Text style={styles.legendName}>{lane.title}</Text>
              <Text style={styles.legendValue}>
                {lane.average != null ? t('history.calendar.perDay', { value: formatAverage(lane.average) }) : '—'}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.weekNav}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('history.calendar.previousWeek')} hitSlop={12} onPress={() => changeWeek(1)}>
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </Pressable>
        <Text style={styles.weekLabel}>
          {formatDay(columns[0])} – {formatDay(columns[DAYS - 1])}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('history.calendar.nextWeek')}
          accessibilityState={{ disabled: weeksBack === 0 }}
          disabled={weeksBack === 0}
          hitSlop={12}
          onPress={() => changeWeek(-1)}
        >
          <Ionicons name="chevron-forward" size={20} color={weeksBack === 0 ? colors.inkMuted : colors.ink} />
        </Pressable>
      </View>

      <Text style={[type.caption, styles.detail]} numberOfLines={1}>
        {selected
          ? [
              single ? null : selected.seriesTitle,
              `${weekdayLetters()[new Date(columns[selected.segment.dayIndex]).getDay()]} ${new Date(columns[selected.segment.dayIndex]).getDate()}`,
              selected.segment.event.label,
            ]
              .filter(Boolean)
              .join(' · ')
          : t('history.calendar.tapHint')}
      </Text>

      <View style={styles.headerRow}>
        <View style={{ width: AXIS_PX }} />
        {columns.map((day) => {
          const isToday = day === todayStart;
          return (
            <View key={day} style={styles.dayHead}>
              <Text style={styles.weekday}>{weekdayLetters()[new Date(day).getDay()]}</Text>
              <View style={[styles.dateBubble, isToday && { backgroundColor: colors.primary }]}>
                <Text style={[styles.date, isToday && { color: colors.primaryInk }]}>{new Date(day).getDate()}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.gridRow}>
        <View style={{ width: AXIS_PX, height: GRID_PX }}>
          {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => (
            <Text key={h} style={[styles.hour, { top: h * HOUR_PX - 7 }]}>
              {h.toString().padStart(2, '0')}
            </Text>
          ))}
        </View>

        <View style={styles.plot}>
          {NIGHT_BANDS.map(([from, to]) => (
            <View key={from} style={[styles.night, { top: from * HOUR_PX, height: (to - from) * HOUR_PX }]} />
          ))}
          {[3, 6, 9, 12, 15, 18, 21].map((h) => (
            <View key={h} style={[styles.guide, { top: h * HOUR_PX }]} />
          ))}

          {columns.map((day, dayIndex) => (
            <View key={day} style={styles.column}>
              {lanes.map((lane) => (
                <View key={lane.key} style={styles.lane}>
                  {lane.segments
                    .filter((seg) => seg.dayIndex === dayIndex)
                    .map((seg) => {
                      const isSelected = selected?.segment.event.id === seg.event.id && selected.seriesTitle === lane.title;
                      const height = Math.max(MIN_MARK_PX, ((seg.endMin - seg.startMin) / 60) * HOUR_PX);
                      return (
                        <Pressable
                          key={`${seg.event.id}-${dayIndex}`}
                          accessibilityRole="button"
                          accessibilityLabel={`${lane.title} · ${seg.event.label}`}
                          hitSlop={{ top: 8, bottom: 8 }}
                          onPress={() => setSelected(isSelected ? null : { segment: seg, seriesTitle: lane.title })}
                          style={[
                            styles.mark,
                            {
                              top: Math.min((seg.startMin / 60) * HOUR_PX, GRID_PX - height),
                              height,
                              backgroundColor: lane.color,
                              borderWidth: isSelected ? 2 : 1,
                            },
                          ]}
                        />
                      );
                    })}
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

const useStyles = createStyles((colors, type) => ({
  card: { gap: spacing.sm, paddingHorizontal: spacing.md },
  headline: { alignItems: 'center', gap: 2 },
  average: { fontFamily: fontFamily.display, fontSize: 26, color: colors.ink },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xs },
  weekLabel: { fontFamily: fontFamily.bodyBold, fontSize: 14, color: colors.ink },
  detail: { textAlign: 'center', minHeight: 18 },
  headerRow: { flexDirection: 'row' },
  dayHead: { flex: 1, alignItems: 'center', gap: 2 },
  weekday: { fontFamily: fontFamily.bodyMedium, fontSize: 11, color: colors.inkMuted },
  dateBubble: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  date: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.ink },
  gridRow: { flexDirection: 'row', marginTop: spacing.xs },
  hour: { position: 'absolute', right: 6, fontFamily: fontFamily.bodyMedium, fontSize: 10, color: colors.inkMuted, fontVariant: ['tabular-nums'] },
  plot: {
    flex: 1,
    height: GRID_PX,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  night: { position: 'absolute', left: 0, right: 0, backgroundColor: colors.surfaceSunken },
  guide: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.border, opacity: 0.5 },
  column: { flex: 1, minWidth: 0, flexDirection: 'row', paddingHorizontal: 4, gap: 2 },
  lane: { flex: 1, minWidth: 0 },
  mark: { position: 'absolute', left: 0, right: 0, borderRadius: 3, borderColor: colors.inkBorder },
  legend: { gap: spacing.xs, paddingHorizontal: spacing.xs },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  swatch: { width: 12, height: 12, borderRadius: 3, borderWidth: 1, borderColor: colors.inkBorder },
  legendName: { flex: 1, fontFamily: fontFamily.bodyMedium, fontSize: 14, color: colors.ink },
  legendValue: { fontFamily: fontFamily.bodyBold, fontSize: 14, color: colors.ink, fontVariant: ['tabular-nums'] },
}));
