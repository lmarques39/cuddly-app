import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { colors, fontFamily, spacing, type } from '../../theme/tokens';
import { formatClock, formatDuration } from '../../utils/time';
import { useContractions } from './useContractions';

export function ContractionsScreen() {
  const { entries, runningSince, start, stop, fiveOneOne } = useContractions();
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (runningSince == null) return;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [runningSince]);

  const elapsed = runningSince != null ? Date.now() - runningSince : 0;
  const lastInterval =
    entries.length > 0 ? Date.now() - entries[0].endedAt : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>Contrações</Text>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={type.caption}>Duração atual</Text>
          <Text style={type.data}>{formatDuration(elapsed)}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={type.caption}>Desde a última</Text>
          <Text style={type.data}>{lastInterval != null ? formatDuration(lastInterval) : '—'}</Text>
        </Card>
      </View>

      <BigButton
        label={runningSince == null ? 'Iniciar contração' : 'Parar contração'}
        background={colors.domain.contractions.bg}
        foreground={colors.domain.contractions.ink}
        onPress={runningSince == null ? start : stop}
        full
      />

      {fiveOneOne && (
        <Card style={[styles.alert, { borderColor: colors.domain.contractions.bg }]}>
          <Text style={[type.body, { color: colors.domain.contractions.bg, fontFamily: fontFamily.bodyBold }]}>
            Padrão 5-1-1 detetado — considera contactar a maternidade.
          </Text>
        </Card>
      )}

      <Text style={[type.caption, styles.listTitle]}>Histórico</Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
        ListEmptyComponent={<Text style={type.caption}>Ainda sem registos hoje.</Text>}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <Text style={type.body}>{formatClock(item.startedAt)}</Text>
            <Text style={type.caption}>{formatDuration(item.endedAt - item.startedAt)} de duração</Text>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1 },
  alert: { borderWidth: 1.5 },
  listTitle: { marginTop: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
