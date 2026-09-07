import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { loadList, STORAGE_KEYS } from '../storage/storage';
import { colors, fontFamily, radii, spacing, type } from '../theme/tokens';
import { BottleEntry, BreastfeedingEntry, ContractionEntry, DiaperEntry } from '../types/records';
import { formatClock, formatDuration } from '../utils/time';

type Kind = 'contraction' | 'breastfeeding' | 'bottle' | 'diaper';
type TimelineItem = { id: string; kind: Kind; label: string; detail: string; at: number };

const KIND_LABEL: Record<Kind, string> = {
  contraction: 'Contração',
  breastfeeding: 'Amamentação',
  bottle: 'Biberão',
  diaper: 'Fralda',
};

const KIND_COLOR: Record<Kind, string> = {
  contraction: colors.domain.contractions.bg,
  breastfeeding: colors.domain.breastfeeding.bg,
  bottle: colors.domain.bottle.bg,
  diaper: colors.domain.diapers.bg,
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function HistoricoScreen() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [view, setView] = useState<'linha' | 'tendencias'>('linha');
  const [filter, setFilter] = useState<Kind | 'todos'>('todos');

  const refresh = useCallback(() => {
    Promise.all([
      loadList<ContractionEntry>(STORAGE_KEYS.contractions),
      loadList<BreastfeedingEntry>(STORAGE_KEYS.breastfeeding),
      loadList<BottleEntry>(STORAGE_KEYS.bottle),
      loadList<DiaperEntry>(STORAGE_KEYS.diapers),
    ]).then(([contractions, breastfeeding, bottle, diapers]) => {
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
      ];
      merged.sort((a, b) => b.at - a.at);
      setItems(merged);
    });
  }, []);

  useFocusEffect(refresh);

  const filtered = useMemo(() => (filter === 'todos' ? items : items.filter((i) => i.kind === filter)), [items, filter]);

  const last7Days = useMemo(() => items.filter((i) => Date.now() - i.at <= SEVEN_DAYS_MS), [items]);
  const totals = useMemo(() => {
    const counts: Record<Kind, number> = { contraction: 0, breastfeeding: 0, bottle: 0, diaper: 0 };
    last7Days.forEach((i) => {
      counts[i.kind] += 1;
    });
    return counts;
  }, [last7Days]);
  const maxTotal = Math.max(1, ...Object.values(totals));

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
            {(['todos', 'contraction', 'breastfeeding', 'bottle', 'diaper'] as const).map((f) => (
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

          <FlatList
            data={filtered}
            keyExtractor={(item) => `${item.kind}-${item.id}`}
            contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
            ListEmptyComponent={<Text style={type.caption}>Ainda sem registos.</Text>}
            renderItem={({ item }) => (
              <Card style={styles.row}>
                <View style={[styles.dot, { backgroundColor: KIND_COLOR[item.kind] }]} />
                <View style={{ flex: 1 }}>
                  <Text style={type.body}>{item.label}</Text>
                  <Text style={type.caption}>
                    {formatClock(item.at)} · {item.detail}
                  </Text>
                </View>
              </Card>
            )}
          />
        </>
      ) : (
        <View style={{ gap: spacing.md }}>
          <Text style={type.caption}>Últimos 7 dias</Text>
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
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  toggleRow: { flexDirection: 'row', gap: spacing.sm },
  toggleChip: { flex: 1, paddingVertical: 10, borderRadius: radii.pill, alignItems: 'center' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  filterChip: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  barTrack: { height: 10, borderRadius: radii.pill, backgroundColor: colors.surfaceSunken, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radii.pill },
});
