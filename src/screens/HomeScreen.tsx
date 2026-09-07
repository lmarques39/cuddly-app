import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { useBabyProfile } from '../features/profile/useBabyProfile';
import { loadList, STORAGE_KEYS } from '../storage/storage';
import { colors, spacing, type } from '../theme/tokens';
import { Appointment, BottleEntry, BreastfeedingEntry, ContractionEntry, DiaperEntry } from '../types/records';
import { formatSince } from '../utils/time';

type LatestEntry = { label: string; at: number };

function pregnancyWeek(dueDate: number): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksRemaining = Math.ceil((dueDate - Date.now()) / msPerWeek);
  return Math.min(42, Math.max(1, 40 - weeksRemaining));
}

function babyAge(birthDate: number): string {
  const days = Math.floor((Date.now() - birthDate) / (24 * 60 * 60 * 1000));
  if (days < 14) return `${days} dia${days === 1 ? '' : 's'}`;
  const weeks = Math.floor(days / 7);
  if (weeks < 12) return `${weeks} semanas`;
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? 'mês' : 'meses'}`;
}

export function HomeScreen() {
  const { profile, mode, refresh: refreshProfile } = useBabyProfile();
  const [latest, setLatest] = useState<LatestEntry[]>([]);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);

  const refresh = useCallback(async () => {
    refreshProfile();
    const [contractions, breastfeeding, bottle, diapers, appointments] = await Promise.all([
      loadList<ContractionEntry>(STORAGE_KEYS.contractions),
      loadList<BreastfeedingEntry>(STORAGE_KEYS.breastfeeding),
      loadList<BottleEntry>(STORAGE_KEYS.bottle),
      loadList<DiaperEntry>(STORAGE_KEYS.diapers),
      loadList<Appointment>(STORAGE_KEYS.appointments),
    ]);
    const items: LatestEntry[] = [
      contractions[0] && { label: 'Contração registada', at: contractions[0].endedAt },
      breastfeeding[0] && {
        label: `Amamentação (${breastfeeding[0].side === 'left' ? 'esquerdo' : 'direito'})`,
        at: breastfeeding[0].endedAt,
      },
      bottle[0] && { label: `Biberão · ${bottle[0].amountMl}ml`, at: bottle[0].at },
      diapers[0] && { label: 'Muda de fralda', at: diapers[0].at },
    ].filter(Boolean) as LatestEntry[];
    items.sort((a, b) => b.at - a.at);
    setLatest(items);

    const upcoming = appointments.filter((a) => a.scheduledAt >= Date.now()).sort((a, b) => a.scheduledAt - b.scheduledAt);
    setNextAppointment(upcoming[0] ?? null);
  }, [refreshProfile]);

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}>
        <Text style={type.h1}>Olá 👋</Text>

        {mode === 'gravida' ? (
          <>
            <Card style={{ alignItems: 'center', gap: spacing.xs }}>
              <Text style={type.caption}>Semana de gravidez</Text>
              <Text style={type.data}>{profile?.dueDate ? `Semana ${pregnancyWeek(profile.dueDate)}` : '—'}</Text>
              {!profile?.dueDate && (
                <Text style={type.caption}>Define a data prevista do parto em Perfil › Perfil do bebé.</Text>
              )}
            </Card>
            <Card style={{ gap: spacing.xs }}>
              <Text style={type.caption}>Próxima consulta</Text>
              <Text style={type.body}>{nextAppointment ? nextAppointment.title : 'Sem consultas agendadas.'}</Text>
            </Card>
          </>
        ) : (
          <>
            <Card style={{ alignItems: 'center', gap: spacing.xs }}>
              <Text style={type.caption}>{profile?.name || 'O bebé'}</Text>
              <Text style={type.data}>{profile?.birthDate ? babyAge(profile.birthDate) : '—'}</Text>
              {(profile?.weightKg || profile?.heightCm) && (
                <Text style={type.caption}>
                  {profile?.weightKg ? `${profile.weightKg}kg` : ''}
                  {profile?.weightKg && profile?.heightCm ? ' · ' : ''}
                  {profile?.heightCm ? `${profile.heightCm}cm` : ''}
                </Text>
              )}
            </Card>

            <Text style={[type.caption, { marginTop: spacing.sm }]}>Últimos registos</Text>
            <Card style={{ gap: spacing.sm }}>
              {latest.length === 0 && <Text style={type.caption}>Ainda sem registos — usa o separador Registar.</Text>}
              {latest.map((item, index) => (
                <View key={index} style={styles.row}>
                  <Text style={type.body}>{item.label}</Text>
                  <Text style={type.caption}>{formatSince(item.at)}</Text>
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});
