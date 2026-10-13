import { useTranslation } from 'react-i18next';
import i18n, { currentLocale } from '../i18n';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, SectionList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { useBottle } from '../features/bottle/useBottle';
import { useBreastfeeding } from '../features/breastfeeding/useBreastfeeding';
import { useContractions } from '../features/contractions/useContractions';
import { useDiapers } from '../features/diapers/useDiapers';
import { useFoods } from '../features/foods/useFoods';
import { usePumping } from '../features/pumping/usePumping';
import { useSono } from '../features/sono/useSono';
import { domainColors, fontFamily, radii, spacing } from '../theme/tokens';
import { createStyles, useTheme } from '../theme/ThemeProvider';
import { formatClock, formatDurationShort } from '../utils/time';
import { useNow } from '../utils/useNow';
import { CalendarEvent } from '../features/history/calendarLayout';
import { CalendarSeries, TrendsCalendar } from '../features/history/TrendsCalendar';
import { MAX_SERIES, SERIES_COLORS, Slots, toggleSlot } from '../features/history/chartSeries';
import { useBabyProfile } from '../features/profile/useBabyProfile';
import { entryDurationMs } from '../utils/sessionTime';

type Kind = 'contraction' | 'breastfeeding' | 'sono' | 'pumping' | 'bottle' | 'diaper' | 'food';
// allDay: only the day is known (a food tried "today"), so no clock time is shown.
type TimelineItem = { id: string; kind: Kind; label: string; detail: string; at: number; allDay?: boolean };


const KIND_LABEL = {
  contraction: 'history.kinds.contraction',
  breastfeeding: 'history.kinds.breastfeeding',
  sono: 'history.kinds.sono',
  pumping: 'history.kinds.pumping',
  bottle: 'history.kinds.bottle',
  diaper: 'history.kinds.diaper',
  food: 'history.kinds.food',
} as const satisfies Record<Kind, string>;

const KIND_COLOR: Record<Kind, string> = {
  contraction: domainColors.contractions.bg,
  breastfeeding: domainColors.breastfeeding.bg,
  sono: domainColors.sleep.bg,
  pumping: domainColors.pumping.bg,
  bottle: domainColors.bottle.bg,
  diaper: domainColors.diapers.bg,
  food: domainColors.foods.bg,
};

// Food introductions are one-offs on a day, not a rhythm — no calendar for them.
type CalendarKind = Exclude<Kind, 'food'>;
const CALENDAR_KINDS: CalendarKind[] = ['breastfeeding', 'sono', 'pumping', 'bottle', 'diaper', 'contraction'];

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function startOfDay(epochMs: number): number {
  const d = new Date(epochMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** "Hoje, 24/09" / "Ontem, 23/09" / "Terça-feira, 22/09" for older days. */
function formatDayLabel(dayStart: number, todayStart: number): string {
  const d = new Date(dayStart);
  const dateLabel = d.toLocaleDateString(currentLocale(), { day: '2-digit', month: '2-digit' });
  const diffDays = Math.round((todayStart - dayStart) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return i18n.t('history.todayLabel', { date: dateLabel });
  if (diffDays === 1) return i18n.t('history.yesterdayLabel', { date: dateLabel });
  const weekday = d.toLocaleDateString(currentLocale(), { weekday: 'long' });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${dateLabel}`;
}

export function HistoricoScreen() {
  const { t } = useTranslation();
  const { colors, type, scheme } = useTheme();
  const styles = useStyles();
  const [view, setView] = useState<'linha' | 'tendencias'>('linha');
  const [filter, setFilter] = useState<Kind | 'todos'>('todos');

  const { entries: contractions } = useContractions();
  const { entries: breastfeeding } = useBreastfeeding();
  const { entries: bottle } = useBottle();
  const { entries: diapers } = useDiapers();
  const { entries: foods } = useFoods();
  const { entries: sono } = useSono();
  const { entries: pumping } = usePumping();

  // Each of these hooks already stays live via its own Firestore
  // subscription — no refetch-on-focus needed, just derive the view.
  const items = useMemo(() => {
    const merged: TimelineItem[] = [
      ...contractions.map((e) => ({
        id: e.id,
        kind: 'contraction' as const,
        label: t('history.kinds.contraction'),
        detail: t('trackers.durationSuffix', { duration: formatDurationShort(entryDurationMs(e)) }),
        at: e.startedAt,
      })),
      ...breastfeeding.map((e) => ({
        id: e.id,
        kind: 'breastfeeding' as const,
        label: t('history.breastfeedingSide', { side: t(e.side === 'left' ? 'side.left' : 'side.right') }),
        detail: t('trackers.durationSuffix', { duration: formatDurationShort(entryDurationMs(e)) }),
        at: e.startedAt,
      })),
      ...sono.map((e) => ({
        id: e.id,
        kind: 'sono' as const,
        label: t('history.kinds.sono'),
        detail: t('trackers.durationSuffix', { duration: formatDurationShort(entryDurationMs(e)) }),
        at: e.startedAt,
      })),
      ...pumping.map((e) => ({
        id: e.id,
        kind: 'pumping' as const,
        label: e.side ? `${t('history.kinds.pumping')} · ${t(`pumping.sides.${e.side}`)}` : t('history.kinds.pumping'),
        detail: `${t('trackers.durationSuffix', { duration: formatDurationShort(entryDurationMs(e)) })} · ${e.amountMl} ml`,
        at: e.startedAt,
      })),
      ...bottle.map((e) => ({
        id: e.id,
        kind: 'bottle' as const,
        label: t('history.kinds.bottle'),
        detail: `${e.amountMl}ml`,
        at: e.at,
      })),
      ...diapers.map((e) => ({
        id: e.id,
        kind: 'diaper' as const,
        label: t('history.kinds.diaper'),
        detail: t(`diaperTypes.${e.type}`),
        at: e.at,
      })),
      ...foods.map((e) => ({
        id: e.id,
        kind: 'food' as const,
        label: t('history.newFood', { food: e.food }),
        detail: [e.preparation?.toLowerCase(), t(`history.reactions.${e.reaction}`)].filter(Boolean).join(' · '),
        at: e.introducedAt,
        allDay: true,
      })),
    ];
    return merged.sort((a, b) => b.at - a.at);
  }, [contractions, breastfeeding, sono, pumping, bottle, diapers, foods, t]);

  const filtered = useMemo(() => (filter === 'todos' ? items : items.filter((i) => i.kind === filter)), [items, filter]);

  const now = useNow(60000);

  const sections = useMemo(() => {
    const today = startOfDay(now);
    const groups = new Map<number, TimelineItem[]>();
    filtered.forEach((item) => {
      const day = startOfDay(item.at);
      const bucket = groups.get(day);
      if (bucket) bucket.push(item);
      else groups.set(day, [item]);
    });
    return Array.from(groups.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([day, data]) => ({ title: formatDayLabel(day, today), data }));
  }, [filtered, now]);

  const last7Days = useMemo(() => items.filter((i) => now - i.at <= SEVEN_DAYS_MS), [items, now]);
  const totals = useMemo(() => {
    const counts: Record<Kind, number> = { contraction: 0, breastfeeding: 0, sono: 0, pumping: 0, bottle: 0, diaper: 0, food: 0 };
    last7Days.forEach((i) => {
      counts[i.kind] += 1;
    });
    return counts;
  }, [last7Days]);
  const maxTotal = Math.max(1, ...Object.values(totals));

  // Tendências (#129, #131): up to three trackers on one week calendar,
  // placed by start time. `slots` holds which tracker has which colour.
  const { mode, loaded: profileLoaded } = useBabyProfile();
  const [slots, setSlots] = useState<Slots<CalendarKind> | null>(null);
  const [slotsFull, setSlotsFull] = useState(false);
  const shownSlots = useMemo<Slots<CalendarKind>>(
    () => slots ?? [mode === 'gravida' ? 'contraction' : 'breastfeeding', null, null],
    [slots, mode],
  );
  const toggleKind = (kind: CalendarKind) => {
    const next = toggleSlot(shownSlots, kind);
    setSlots(next.slots);
    setSlotsFull(next.full);
  };
  const calendarSeries = useMemo((): CalendarSeries[] => {
    const session = (e: { id: string; startedAt: number; endedAt: number; pausedMs?: number }) => ({
      id: e.id,
      startedAt: e.startedAt,
      endedAt: e.endedAt,
      label: `${formatClock(e.startedAt)} · ${t('trackers.durationSuffix', { duration: formatDurationShort(entryDurationMs(e)) })}`,
    });
    const eventsOf = (kind: CalendarKind): CalendarEvent[] => {
      switch (kind) {
        case 'breastfeeding':
          return breastfeeding.map(session);
        case 'sono':
          return sono.map(session);
        case 'pumping':
          return pumping.map((e) => ({ ...session(e), label: `${session(e).label} · ${e.amountMl} ml` }));
        case 'contraction':
          return contractions.map(session);
        case 'bottle':
          return bottle.map((e) => ({ id: e.id, startedAt: e.at, label: `${formatClock(e.at)} · ${e.amountMl} ml` }));
        case 'diaper':
          return diapers.map((e) => ({ id: e.id, startedAt: e.at, label: `${formatClock(e.at)} · ${t(`diaperTypes.${e.type}`)}` }));
      }
    };
    return shownSlots.flatMap((kind, slot) =>
      kind ? [{ key: kind, title: t(KIND_LABEL[kind]), color: SERIES_COLORS[scheme][slot], events: eventsOf(kind) }] : [],
    );
  }, [shownSlots, scheme, breastfeeding, sono, pumping, contractions, bottle, diapers, t]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>{t('history.title')}</Text>

      <View style={styles.toggleRow}>
        {(['linha', 'tendencias'] as const).map((v) => (
          <Pressable
            key={v}
            onPress={() => setView(v)}
            style={[styles.toggleChip, { backgroundColor: view === v ? colors.primary : colors.surfaceSunken }]}
          >
            <Text
              style={{
                fontFamily: fontFamily.bodyBold,
                fontSize: 13,
                color: view === v ? colors.primaryInk : colors.inkSecondary,
              }}
            >
              {v === 'linha' ? t('history.timeline') : t('history.trends')}
            </Text>
          </Pressable>
        ))}
      </View>

      {view === 'linha' ? (
        <>
          <View style={styles.filterRow}>
            {(['todos', 'contraction', 'breastfeeding', 'sono', 'pumping', 'bottle', 'diaper', 'food'] as const).map((f) => (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterChip,
                  { backgroundColor: filter === f ? colors.surfaceSunken : 'transparent' },
                ]}
              >
                <Text style={{ fontFamily: fontFamily.bodyMedium, fontSize: 12, color: colors.inkSecondary }}>
                  {f === 'todos' ? t('history.all') : t(KIND_LABEL[f])}
                </Text>
              </Pressable>
            ))}
          </View>

          <SectionList
            sections={sections}
            keyExtractor={(item) => `${item.kind}-${item.id}`}
            contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
            stickySectionHeadersEnabled={false}
            ListEmptyComponent={<Text style={type.caption}>{t('history.empty')}</Text>}
            renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
            renderItem={({ item }) => (
              <Card style={styles.row}>
                <View style={[styles.dot, { backgroundColor: KIND_COLOR[item.kind] }]} />
                <View style={{ flex: 1 }}>
                  <Text style={type.body}>{item.label}</Text>
                  <Text style={type.caption}>
                    {item.allDay ? item.detail : `${formatClock(item.at)} · ${item.detail}`}
                  </Text>
                </View>
              </Card>
            )}
          />
        </>
      ) : (
        <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}>
          <View style={styles.filterRow}>
            {CALENDAR_KINDS.map((k) => {
              const slot = shownSlots.indexOf(k);
              const on = slot >= 0;
              return (
                <Pressable
                  key={k}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => toggleKind(k)}
                  style={[styles.filterChip, styles.seriesChip, { backgroundColor: on ? colors.surfaceSunken : 'transparent' }]}
                >
                  {on && <View style={[styles.chipSwatch, { backgroundColor: SERIES_COLORS[scheme][slot] }]} />}
                  <Text style={{ fontFamily: on ? fontFamily.bodyBold : fontFamily.bodyMedium, fontSize: 12, color: on ? colors.ink : colors.inkSecondary }}>
                    {t(KIND_LABEL[k])}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[type.caption, slotsFull && { color: colors.coral }]}>
            {t('history.calendar.pickHint', { count: MAX_SERIES })}
          </Text>

          {profileLoaded && <TrendsCalendar series={calendarSeries} now={now} />}

          <Text style={type.caption}>{t('history.totals7')}</Text>
          {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
            <Card key={k} style={{ gap: spacing.xs }}>
              <View style={styles.row}>
                <Text style={type.body}>{t(KIND_LABEL[k])}</Text>
                <Text style={[type.body, { fontFamily: fontFamily.bodyBold }]}>{totals[k]}</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(totals[k] / maxTotal) * 100}%`, backgroundColor: KIND_COLOR[k] }]} />
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const useStyles = createStyles((colors, type) => ({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  toggleRow: { flexDirection: 'row', gap: spacing.sm },
  toggleChip: { flex: 1, paddingVertical: 10, borderRadius: radii.pill, alignItems: 'center' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  sectionHeader: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.inkSecondary,
    backgroundColor: colors.paper,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  seriesChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipSwatch: { width: 10, height: 10, borderRadius: 2, borderWidth: 1, borderColor: colors.inkBorder },
  filterChip: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  barTrack: { height: 10, borderRadius: radii.pill, backgroundColor: colors.surfaceSunken, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radii.pill },
}));
