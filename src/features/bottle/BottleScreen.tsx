import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { addToList, isToday, loadList, makeId, STORAGE_KEYS } from '../../storage/storage';
import { colors, fontFamily, radii, spacing, type } from '../../theme/tokens';
import { BottleEntry, BottleType } from '../../types/records';
import { formatClock } from '../../utils/time';

const TYPE_LABEL: Record<BottleType, string> = {
  breastmilk: 'Leite materno',
  formula: 'Fórmula',
  mixed: 'Misto',
};

export function BottleScreen() {
  const [entries, setEntries] = useState<BottleEntry[]>([]);
  const [amount, setAmount] = useState('');
  const [type_, setType] = useState<BottleType>('breastmilk');

  useEffect(() => {
    loadList<BottleEntry>(STORAGE_KEYS.bottle).then(setEntries);
  }, []);

  const todayEntries = useMemo(() => entries.filter((e) => isToday(e.at)), [entries]);
  const todayTotalMl = useMemo(() => todayEntries.reduce((sum, e) => sum + e.amountMl, 0), [todayEntries]);

  const canSave = Number(amount) > 0;

  const save = async () => {
    if (!canSave) return;
    const entry: BottleEntry = { id: makeId(), amountMl: Number(amount), type: type_, at: Date.now() };
    const next = await addToList(STORAGE_KEYS.bottle, entry);
    setEntries(next);
    setAmount('');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>Biberão</Text>

      <Card style={{ gap: spacing.md }}>
        <View>
          <Text style={type.caption}>Quantidade (ml)</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            placeholder="120"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
          />
        </View>

        <View style={styles.typeRow}>
          {(Object.keys(TYPE_LABEL) as BottleType[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={[
                styles.typeChip,
                { backgroundColor: type_ === t ? colors.domain.bottle.bg : colors.surfaceSunken },
              ]}
            >
              <Text style={{ fontFamily: fontFamily.bodyMedium, fontSize: 12.5, color: type_ === t ? colors.domain.bottle.ink : colors.inkSecondary }}>
                {TYPE_LABEL[t]}
              </Text>
            </Pressable>
          ))}
        </View>

        <BigButton
          label="Guardar biberão"
          background={canSave ? colors.domain.bottle.bg : colors.surfaceSunken}
          foreground={canSave ? colors.domain.bottle.ink : colors.inkMuted}
          onPress={save}
          full
        />
      </Card>

      <Text style={type.caption}>
        Hoje: {todayEntries.length} biberão{todayEntries.length === 1 ? '' : 's'} · {todayTotalMl}ml no total
      </Text>

      <FlatList
        data={todayEntries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
        ListEmptyComponent={<Text style={type.caption}>Ainda sem registos hoje.</Text>}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <Text style={type.body}>{formatClock(item.at)} · {TYPE_LABEL[item.type]}</Text>
            <Text style={type.caption}>{item.amountMl}ml</Text>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    fontFamily: fontFamily.bodyBold,
    fontSize: 18,
    color: colors.ink,
  },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeChip: { flex: 1, paddingVertical: 10, borderRadius: radii.pill, alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
