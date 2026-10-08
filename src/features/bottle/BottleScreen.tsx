import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { RemoveEntryButton } from '../../components/RemoveEntryButton';
import { fontFamily, radii, spacing } from '../../theme/tokens';
import { createStyles, useTheme } from '../../theme/ThemeProvider';
import { BottleType } from '../../types/records';
import { formatClock } from '../../utils/time';
import { useBottle } from './useBottle';

const TYPE_LABEL = {
  breastmilk: 'bottleTypes.breastmilk',
  formula: 'bottleTypes.formula',
  mixed: 'bottleTypes.mixed',
} as const satisfies Record<BottleType, string>;

export function BottleScreen() {
  const { t } = useTranslation();
  const { colors, type } = useTheme();
  const styles = useStyles();
  const { todayEntries, todayTotalMl, save, remove } = useBottle();
  const [amount, setAmount] = useState('');
  const [type_, setType] = useState<BottleType>('breastmilk');

  const canSave = Number(amount) > 0;

  const handleSave = async () => {
    if (!canSave) return;
    await save(Number(amount), type_);
    setAmount('');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>{t('bottle.title')}</Text>

      <Card style={{ gap: spacing.md }}>
        <View>
          <Text style={type.caption}>{t('trackers.amountMl')}</Text>
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
          {(Object.keys(TYPE_LABEL) as BottleType[]).map((bottleType) => (
            <Pressable
              key={bottleType}
              onPress={() => setType(bottleType)}
              style={[
                styles.typeChip,
                { backgroundColor: type_ === bottleType ? colors.domain.bottle.bg : colors.surfaceSunken },
              ]}
            >
              <Text style={{ fontFamily: fontFamily.bodyMedium, fontSize: 12.5, color: type_ === bottleType ? colors.domain.bottle.ink : colors.inkSecondary }}>
                {t(TYPE_LABEL[bottleType])}
              </Text>
            </Pressable>
          ))}
        </View>

        <BigButton
          label={t('bottle.save')}
          background={canSave ? colors.domain.bottle.bg : colors.surfaceSunken}
          foreground={canSave ? colors.domain.bottle.ink : colors.inkMuted}
          onPress={handleSave}
          full
        />
      </Card>

      <Text style={type.caption}>
        {t('bottle.today', { count: todayEntries.length, ml: todayTotalMl })}
      </Text>

      <FlatList
        data={todayEntries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
        ListEmptyComponent={<Text style={type.caption}>{t('trackers.noneToday')}</Text>}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View>
              <Text style={type.body}>{formatClock(item.at)} · {t(TYPE_LABEL[item.type])}</Text>
              <Text style={type.caption}>{item.amountMl}ml</Text>
            </View>
            <RemoveEntryButton onRemove={() => remove(item.id)} />
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const useStyles = createStyles((colors, type) => ({
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
}));
