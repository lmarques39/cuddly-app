import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { RemoveEntryButton } from '../../components/RemoveEntryButton';
import { colors, fontFamily, radii, spacing, type } from '../../theme/tokens';
import { formatClock, formatDuration } from '../../utils/time';
import { useNow } from '../../utils/useNow';
import { usePumping } from './usePumping';

/**
 * Deliberately simple/unstyled-to-the-Figma UI — no frame exists yet (#45)
 * — so the tracker is usable now instead of waiting on design. Swap the
 * styling later without touching usePumping.ts.
 */
export function PumpingScreen() {
  const { entries, runningSince, start, stop, remove, update } = usePumping();
  const now = useNow(1000, runningSince != null);
  const [amountMl, setAmountMl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const elapsed = runningSince != null ? now - runningSince : 0;
  const parsedAmount = Number(amountMl);
  const canStop = amountMl.trim().length > 0 && !Number.isNaN(parsedAmount) && parsedAmount > 0;

  const handleStop = () => {
    if (!canStop) return;
    stop(parsedAmount);
    setAmountMl('');
  };

  const parsedEditAmount = Number(editAmount);
  const canSaveEdit = editAmount.trim().length > 0 && !Number.isNaN(parsedEditAmount) && parsedEditAmount > 0;

  const saveEdit = (entry: (typeof entries)[number]) => {
    if (!canSaveEdit) return;
    update({ ...entry, amountMl: parsedEditAmount });
    setEditingId(null);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>Extração</Text>

      <Card>
        <Text style={type.caption}>Duração atual</Text>
        <Text style={type.data}>{formatDuration(elapsed)}</Text>
      </Card>

      {runningSince != null && (
        <View>
          <Text style={type.caption}>Quantidade (ml)</Text>
          <TextInput
            value={amountMl}
            onChangeText={setAmountMl}
            placeholder="120"
            placeholderTextColor={colors.inkMuted}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>
      )}

      <BigButton
        label={runningSince == null ? 'Iniciar extração' : 'Terminar extração'}
        background={runningSince == null || canStop ? colors.domain.pumping.bg : colors.surfaceSunken}
        foreground={runningSince == null || canStop ? colors.domain.pumping.ink : colors.inkMuted}
        onPress={runningSince == null ? start : handleStop}
        full
      />

      <Text style={[type.caption, styles.listTitle]}>Últimos registos</Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
        ListEmptyComponent={<Text style={type.caption}>Ainda sem registos.</Text>}
        renderItem={({ item }) =>
          editingId === item.id ? (
            <Card style={styles.row}>
              <TextInput
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="numeric"
                autoFocus
                style={styles.editInput}
              />
              <View style={styles.editActions}>
                <Pressable onPress={() => saveEdit(item)} style={styles.smallButton}>
                  <Text style={styles.smallButtonLabel}>Guardar</Text>
                </Pressable>
                <Pressable onPress={() => setEditingId(null)} hitSlop={8}>
                  <Text style={type.caption}>Cancelar</Text>
                </Pressable>
              </View>
            </Card>
          ) : (
            <Card style={styles.row}>
              <Pressable
                style={styles.rowText}
                onPress={() => {
                  setEditingId(item.id);
                  setEditAmount(String(item.amountMl));
                }}
              >
                <Text style={type.body}>{formatClock(item.startedAt)}</Text>
                <Text style={type.caption}>
                  {formatDuration(item.endedAt - item.startedAt)} · {item.amountMl}ml · toca para editar
                </Text>
              </Pressable>
              <RemoveEntryButton onRemove={() => remove(item.id)} />
            </Card>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  input: {
    marginTop: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.body,
    fontSize: 15,
    color: colors.ink,
  },
  listTitle: { marginTop: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowText: { flex: 1 },
  editInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    fontFamily: fontFamily.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  editActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginLeft: spacing.sm },
  smallButton: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 8 },
  smallButtonLabel: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.primaryInk },
});
