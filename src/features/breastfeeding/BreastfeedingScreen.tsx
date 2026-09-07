import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { colors, fontFamily, radii, spacing, type } from '../../theme/tokens';
import { formatClock, formatDuration } from '../../utils/time';
import { useBreastfeeding } from './useBreastfeeding';

const SIDE_LABEL = { left: 'Esquerdo', right: 'Direito' } as const;

export function BreastfeedingScreen() {
  const { todayEntries, todayDurationMs, running, start, stop, suggestedSide } = useBreastfeeding();
  const [selectedSide, setSelectedSide] = useState<'left' | 'right'>(suggestedSide);
  const [, forceTick] = useState(0);

  useEffect(() => setSelectedSide(suggestedSide), [suggestedSide]);

  useEffect(() => {
    if (running == null) return;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const elapsed = running != null ? Date.now() - running.startedAt : 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>Amamentação</Text>

      <View style={styles.sideRow}>
        {(['left', 'right'] as const).map((side) => (
          <Pressable
            key={side}
            disabled={running != null}
            onPress={() => setSelectedSide(side)}
            style={[
              styles.sideButton,
              {
                backgroundColor: selectedSide === side ? colors.domain.breastfeeding.bg : colors.surface,
                borderColor: colors.domain.breastfeeding.bg,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: fontFamily.bodyBold,
                color: selectedSide === side ? colors.domain.breastfeeding.ink : colors.domain.breastfeeding.bg,
              }}
            >
              {SIDE_LABEL[side]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Card style={styles.timerCard}>
        <Text style={type.caption}>
          {running != null ? `A decorrer · lado ${SIDE_LABEL[running.side].toLowerCase()}` : 'Pronta para começar'}
        </Text>
        <Text style={type.data}>{formatDuration(elapsed)}</Text>
      </Card>

      <BigButton
        label={running == null ? 'Iniciar mamada' : 'Terminar mamada'}
        background={colors.domain.breastfeeding.bg}
        foreground={colors.domain.breastfeeding.ink}
        onPress={() => (running == null ? start(selectedSide) : stop())}
        full
      />

      <Text style={type.caption}>
        Hoje: {todayEntries.length} mamada{todayEntries.length === 1 ? '' : 's'} · {formatDuration(todayDurationMs)}
      </Text>

      <FlatList
        data={todayEntries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
        ListEmptyComponent={<Text style={type.caption}>Ainda sem registos hoje.</Text>}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <Text style={type.body}>{formatClock(item.startedAt)} · {SIDE_LABEL[item.side]}</Text>
            <Text style={type.caption}>{formatDuration(item.endedAt - item.startedAt)}</Text>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  sideRow: { flexDirection: 'row', gap: spacing.sm },
  sideButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCard: { alignItems: 'center', gap: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
