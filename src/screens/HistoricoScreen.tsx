import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { useBottle } from '../features/bottle/useBottle';
import { useBreastfeeding } from '../features/breastfeeding/useBreastfeeding';
import { useContractions } from '../features/contractions/useContractions';
import { useDiapers } from '../features/diapers/useDiapers';
import { useFoods } from '../features/foods/useFoods';
import { usePumping } from '../features/pumping/usePumping';
import { useSono } from '../features/sono/useSono';
import { colors, fontFamily, radii, spacing, type } from '../theme/tokens';
import { formatClock, formatDuration } from '../utils/time';
import { useNow } from '../utils/useNow';

type Kind = 'contraction' | 'breastfeeding' | 'sono' | 'pumping' | 'bottle' | 'diaper' | 'food';
// allDay: only the day is known (a food tried "today"), so no clock time is shown.
type TimelineItem = { id: string; kind: Kind; label: string; detail: string; at: number; allDay?: boolean };

const REACTION_DETAIL = { nenhuma: 'sem reação', ligeira: 'reação ligeira', forte: 'reação forte' } as const;

const KIND_LABEL: Record<Kind, string> = {
  contraction: 'Contração',
  breastfeeding: 'Amamentação',
  sono: 'Sono',
  pumping: 'Extração',
  bottle: 'Biberão',
  diaper: 'Fralda',
  food: 'Alimento novo',
};

const KIND_COLOR: Record<Kind, string> = {
  contraction: colors.domain.contractions.bg,
  breastfeeding: colors.domain.breastfeeding.bg,
  sono: colors.domain.sleep.bg,
  pumping: colors.domain.pumping.bg,
  bottle: colors.domain.bottle.bg,
  diaper: colors.domain.diapers.bg,
  food: colors.domain.foods.bg,
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_LETTER = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function startOfDay(epochMs: number): number {
  const d = new Date(epochMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** "Hoje, 24/09" / "Ontem, 23/09" / "Terça-feira, 22/09" for older days. */
function formatDayLabel(dayStart: number, todayStart: number): string {
  const d = new Date(dayStart);
  const dateLabel = d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
  const diffDays = Math.round((todayStart - dayStart) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return `Hoje, ${dateLabel}`;
  if (diffDays === 1) return `Ontem, ${dateLabel}`;
  const weekday = d.toLocaleDateString('pt-PT', { weekday: 'long' });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${dateLabel}`;
}

export function HistoricoScreen() {
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
        label: 'Contração',
        detail: formatDuration(e.endedAt - e.startedAt),
        at: e.endedAt,
      })),
      ...breastfeeding.map((e) => ({
        id: e.id,
        kind: 'breastfeeding' as const,
        label: `Amamentação · ${e.side === 'left' ? 'esquerdo' : 'direito'}`,
        detail: formatDuration(e.endedAt - e.startedAt),
        at: e.endedAt,
      })),
      ...sono.map((e) => ({
        id: e.id,
        kind: 'sono' as const,
        label: 'Sono',
        detail: formatDuration(e.endedAt - e.startedAt),
        at: e.endedAt,
      })),
      ...pumping.map((e) => ({
        id: e.id,
        kind: 'pumping' as const,
        label: 'Extração',
        detail: `${formatDuration(e.endedAt - e.startedAt)} · ${e.amountMl}ml`,
        at: e.endedAt,
      })),
      ...bottle.map((e) => ({
        id: e.id,
        kind: 'bottle' as const,
        label: 'Biberão',
        detail: `${e.amountMl}ml`,
        at: e.at,
      })),
      ...diapers.map((e) => ({
        id: e.id,
        kind: 'diaper' as const,
        label: 'Fralda',
        detail: e.type === 'wet' ? 'Xixi' : e.type === 'dirty' ? 'Cocó' : 'Ambos',
        at: e.at,
      })),
      ...foods.map((e) => ({
        id: e.id,
        kind: 'food' as const,
        label: `Alimento novo · ${e.food}`,
        detail: [e.preparation?.toLowerCase(), REACTION_DETAIL[e.reaction] ?? e.reaction].filter(Boolean).join(' · '),
        at: e.introducedAt,
        allDay: true,
      })),
    ];
    return merged.sort((a, b) => b.at - a.at);
  }, [contractions, breastfeeding, sono, pumping, bottle, diapers, foods]);

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

  const dailyTotals = useMemo(() => {
    const today = startOfDay(now);
    const days = Array.from({ length: 7 }, (_, i) => {
      const dayStart = today - (6 - i) * 24 * 60 * 60 * 1000;
      const date = new Date(dayStart);
      const count = items.filter((it) => startOfDay(it.at) === dayStart).length;
      return { key: dayStart, letter: DAY_LETTER[date.getDay()], count, isToday: dayStart === today };
    });
    return days;
  }, [items, now]);
  const maxDaily = Math.max(1, ...dailyTotals.map((d) => d.count));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>Histórico</Text>

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
              {v === 'linha' ? 'Linha do tempo' : 'Tendências'}
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
                  {f === 'todos' ? 'Todos' : KIND_LABEL[f]}
                </Text>
              </Pressable>
            ))}
          </View>

          <SectionList
            sections={sections}
            keyExtractor={(item) => `${item.kind}-${item.id}`}
            contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
            stickySectionHeadersEnabled={false}
            ListEmptyComponent={<Text style={type.caption}>Ainda sem registos.</Text>}
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
          <Card style={{ gap: spacing.sm }}>
            <Text style={type.caption}>Atividade por dia · esta semana</Text>
            <View style={styles.chartRow}>
              {dailyTotals.map((d) => (
                <View key={d.key} style={styles.chartCol}>
                  <View style={styles.chartTrack}>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: `${(d.count / maxDaily) * 100}%`,
                          backgroundColor: d.isToday ? colors.primary : colors.domain.breastfeeding.bg,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.chartLabel, d.isToday && { fontFamily: fontFamily.bodyBold, color: colors.ink }]}>
                    {d.letter}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          <Text style={type.caption}>Totais dos últimos 7 dias</Text>
          {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
            <Card key={k} style={{ gap: spacing.xs }}>
              <View style={styles.row}>
                <Text style={type.body}>{KIND_LABEL[k]}</Text>
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

const styles = StyleSheet.create({
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
  filterChip: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110, paddingTop: spacing.sm },
  chartCol: { alignItems: 'center', gap: spacing.xs, width: 28 },
  chartTrack: { width: 16, height: 80, borderRadius: radii.pill, backgroundColor: colors.surfaceSunken, justifyContent: 'flex-end', overflow: 'hidden' },
  chartBar: { width: '100%', borderRadius: radii.pill },
  chartLabel: { fontFamily: fontFamily.bodyMedium, fontSize: 11, color: colors.inkMuted },
  dot: { width: 10, height: 10, borderRadius: 5 },
  barTrack: { height: 10, borderRadius: radii.pill, backgroundColor: colors.surfaceSunken, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radii.pill },
});
