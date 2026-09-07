import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/Card';
import { addToList, isToday, loadList, makeId, STORAGE_KEYS } from '../../storage/storage';
import { colors, fontFamily, radii, spacing, type } from '../../theme/tokens';
import { DiaperEntry, DiaperType } from '../../types/records';
import { formatClock, formatSince } from '../../utils/time';

const TYPE_LABEL: Record<DiaperType, string> = { wet: 'Xixi', dirty: 'Cocó', both: 'Ambos' };

export function DiapersScreen() {
  const [entries, setEntries] = useState<DiaperEntry[]>([]);
  const [, forceTick] = useState(0);

  useEffect(() => {
    loadList<DiaperEntry>(STORAGE_KEYS.diapers).then(setEntries);
  }, []);

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const todayEntries = useMemo(() => entries.filter((e) => isToday(e.at)), [entries]);
  const lastEntry = entries[0];

  const register = async (diaperType: DiaperType) => {
    const entry: DiaperEntry = { id: makeId(), type: diaperType, at: Date.now() };
    const next = await addToList(STORAGE_KEYS.diapers, entry);
    setEntries(next);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>Fraldas</Text>

      <Card style={styles.lastCard}>
        <Text style={type.caption}>Última muda</Text>
        <Text style={type.data}>{lastEntry ? formatSince(lastEntry.at) : 'sem registos'}</Text>
        {lastEntry && <Text style={type.caption}>{TYPE_LABEL[lastEntry.type]} às {formatClock(lastEntry.at)}</Text>}
      </Card>

      <View style={styles.buttonRow}>
        {(['wet', 'dirty', 'both'] as DiaperType[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => register(t)}
            style={[styles.diaperButton, { backgroundColor: colors.domain.diapers.bg }]}
          >
            <Text style={[styles.diaperLabel, { color: colors.domain.diapers.ink }]}>{TYPE_LABEL[t]}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={type.caption}>Hoje: {todayEntries.length} muda{todayEntries.length === 1 ? '' : 's'}</Text>

      <FlatList
        data={todayEntries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
        ListEmptyComponent={<Text style={type.caption}>Ainda sem registos hoje.</Text>}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <Text style={type.body}>{formatClock(item.at)}</Text>
            <Text style={type.caption}>{TYPE_LABEL[item.type]}</Text>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  lastCard: { alignItems: 'center', gap: spacing.xs },
  buttonRow: { flexDirection: 'row', gap: spacing.sm },
  diaperButton: { flex: 1, minHeight: 72, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  diaperLabel: { fontFamily: fontFamily.bodyBold, fontSize: 14.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
