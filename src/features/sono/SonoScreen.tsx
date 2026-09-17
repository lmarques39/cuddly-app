import React from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { colors, spacing, type } from '../../theme/tokens';
import { formatClock, formatDuration } from '../../utils/time';
import { useNow } from '../../utils/useNow';
import { useSono } from './useSono';

/**
 * Deliberately simple/unstyled-to-the-Figma UI — same visual pattern as
 * ContractionsScreen — so the tracker is usable now instead of waiting on
 * #36 (the Sono Figma frame). Swap the styling later without touching
 * useSono.ts.
 */
export function SonoScreen() {
  const { entries, runningSince, start, stop } = useSono();
  const now = useNow(1000, runningSince != null);

  const elapsed = runningSince != null ? now - runningSince : 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>Sono</Text>

      <Card style={styles.statCard}>
        <Text style={type.caption}>Duração atual</Text>
        <Text style={type.data}>{formatDuration(elapsed)}</Text>
      </Card>

      <BigButton
        label={runningSince == null ? 'Iniciar sono' : 'Terminar sono'}
        background={colors.domain.sleep.bg}
        foreground={colors.domain.sleep.ink}
        onPress={runningSince == null ? start : stop}
        full
      />

      <Text style={[type.caption, styles.listTitle]}>Últimos registos</Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
        ListEmptyComponent={<Text style={type.caption}>Ainda sem registos.</Text>}
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
  statCard: {},
  listTitle: { marginTop: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
