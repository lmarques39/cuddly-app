import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../components/BigButton';
import { Card } from '../components/Card';
import { RootTabParamList } from '../navigation/types';
import { loadList, STORAGE_KEYS } from '../storage/storage';
import { colors, spacing, type } from '../theme/tokens';
import { BottleEntry, BreastfeedingEntry, ContractionEntry, DiaperEntry } from '../types/records';
import { formatSince } from '../utils/time';

type LatestEntry = { label: string; at: number };

export function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const [latest, setLatest] = useState<LatestEntry[]>([]);

  const refresh = useCallback(async () => {
    const [contractions, breastfeeding, bottle, diapers] = await Promise.all([
      loadList<ContractionEntry>(STORAGE_KEYS.contractions),
      loadList<BreastfeedingEntry>(STORAGE_KEYS.breastfeeding),
      loadList<BottleEntry>(STORAGE_KEYS.bottle),
      loadList<DiaperEntry>(STORAGE_KEYS.diapers),
    ]);
    const items: LatestEntry[] = [
      contractions[0] && { label: 'Contração registada', at: contractions[0].endedAt },
      breastfeeding[0] && { label: `Amamentação (${breastfeeding[0].side === 'left' ? 'esquerdo' : 'direito'})`, at: breastfeeding[0].endedAt },
      bottle[0] && { label: `Biberão · ${bottle[0].amountMl}ml`, at: bottle[0].at },
      diapers[0] && { label: 'Muda de fralda', at: diapers[0].at },
    ].filter(Boolean) as LatestEntry[];
    items.sort((a, b) => b.at - a.at);
    setLatest(items);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', refresh);
    refresh();
    return unsubscribe;
  }, [navigation, refresh]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}>
        <Text style={type.h1}>Olá 👋</Text>
        <Text style={type.body}>O que queres registar agora?</Text>

        <View style={styles.grid}>
          <BigButton style={styles.gridItem} label="Contração" background={colors.domain.contractions.bg} foreground={colors.domain.contractions.ink} onPress={() => navigation.navigate('Contrações')} />
          <BigButton style={styles.gridItem} label="Amamentar" background={colors.domain.breastfeeding.bg} foreground={colors.domain.breastfeeding.ink} onPress={() => navigation.navigate('Amamentação')} />
          <BigButton style={styles.gridItem} label="Biberão" background={colors.domain.bottle.bg} foreground={colors.domain.bottle.ink} onPress={() => navigation.navigate('Biberão')} />
          <BigButton style={styles.gridItem} label="Fralda" background={colors.domain.diapers.bg} foreground={colors.domain.diapers.ink} onPress={() => navigation.navigate('Fraldas')} />
        </View>

        <Text style={[type.caption, { marginTop: spacing.sm }]}>Últimos registos</Text>
        <Card style={{ gap: spacing.sm }}>
          {latest.length === 0 && <Text style={type.caption}>Ainda sem registos — começa por um dos botões acima.</Text>}
          {latest.map((item, index) => (
            <View key={index} style={styles.row}>
              <Text style={type.body}>{item.label}</Text>
              <Text style={type.caption}>{formatSince(item.at)}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridItem: { flexBasis: '47%', flexGrow: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});
