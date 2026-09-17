import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { useAppointments } from '../features/appointments/useAppointments';
import { useBottle } from '../features/bottle/useBottle';
import { useBreastfeeding } from '../features/breastfeeding/useBreastfeeding';
import { useContractions } from '../features/contractions/useContractions';
import { useDiapers } from '../features/diapers/useDiapers';
import { useBabyProfile } from '../features/profile/useBabyProfile';
import { useCurrentMember } from '../features/profile/useCurrentMember';
import { RootTabParamList } from '../navigation/types';
import { colors, spacing, type } from '../theme/tokens';
import { Appointment } from '../types/records';
import { formatSince } from '../utils/time';
import { useNow } from '../utils/useNow';

type Nav = BottomTabNavigationProp<RootTabParamList, 'Início'>;

type LatestEntry = { label: string; at: number };

function pregnancyWeek(dueDate: number): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksRemaining = Math.ceil((dueDate - Date.now()) / msPerWeek);
  return Math.min(42, Math.max(1, 40 - weeksRemaining));
}

function formatAppointmentDate(epochMs: number): string {
  return new Date(epochMs).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function babyAge(birthDate: number): string {
  const days = Math.floor((Date.now() - birthDate) / (24 * 60 * 60 * 1000));
  if (days < 14) return `${days} dia${days === 1 ? '' : 's'}`;
  const weeks = Math.floor(days / 7);
  if (weeks < 12) return `${weeks} semanas`;
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? 'mês' : 'meses'}`;
}

function NextAppointmentCard({ appointment, onPress }: { appointment: Appointment | null; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.appointmentCard}>
        <View style={styles.appointmentHead}>
          <Text style={type.caption}>Próxima consulta</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
        <Text style={type.body}>{appointment ? appointment.title : 'Sem consultas agendadas.'}</Text>
        {appointment && <Text style={type.caption}>{formatAppointmentDate(appointment.scheduledAt)}</Text>}
      </Card>
    </Pressable>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { profile, mode } = useBabyProfile();
  const { member } = useCurrentMember();
  const firstName = member?.name?.trim().split(/\s+/)[0];
  const { entries: contractions } = useContractions();
  const { entries: breastfeeding } = useBreastfeeding();
  const { entries: bottle } = useBottle();
  const { entries: diapers } = useDiapers();
  const { appointments } = useAppointments();
  const now = useNow(60000);

  // Each of these hooks already stays live via its own Firestore
  // subscription — no refetch-on-focus needed, just derive the view.
  const latest = useMemo(() => {
    const items: LatestEntry[] = [
      contractions[0] && { label: 'Contração registada', at: contractions[0].endedAt },
      breastfeeding[0] && {
        label: `Amamentação (${breastfeeding[0].side === 'left' ? 'esquerdo' : 'direito'})`,
        at: breastfeeding[0].endedAt,
      },
      bottle[0] && { label: `Biberão · ${bottle[0].amountMl}ml`, at: bottle[0].at },
      diapers[0] && { label: 'Muda de fralda', at: diapers[0].at },
    ].filter(Boolean) as LatestEntry[];
    return items.sort((a, b) => b.at - a.at);
  }, [contractions, breastfeeding, bottle, diapers]);

  const nextAppointment: Appointment | null = useMemo(() => {
    const upcoming = appointments.filter((a) => a.scheduledAt >= now).sort((a, b) => a.scheduledAt - b.scheduledAt);
    return upcoming[0] ?? null;
  }, [appointments, now]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}>
        <Text style={type.h1}>{firstName ? `Olá, ${firstName} 👋` : 'Olá 👋'}</Text>

        {mode === 'gravida' ? (
          <>
            <Card style={{ alignItems: 'center', gap: spacing.xs }}>
              <Text style={type.caption}>Semana de gravidez</Text>
              <Text style={type.data}>{profile?.dueDate ? `Semana ${pregnancyWeek(profile.dueDate)}` : '—'}</Text>
              {!profile?.dueDate && (
                <Text style={type.caption}>Define a data prevista do parto em Perfil › Perfil do bebé.</Text>
              )}
            </Card>
            <NextAppointmentCard
              appointment={nextAppointment}
              onPress={() => navigation.navigate('Registar', { screen: 'MarcarConsulta' })}
            />
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

            <NextAppointmentCard
              appointment={nextAppointment}
              onPress={() => navigation.navigate('Registar', { screen: 'MarcarConsulta' })}
            />

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
  appointmentCard: { gap: spacing.xs },
  appointmentHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chevron: { fontSize: 16, color: colors.inkMuted },
});
