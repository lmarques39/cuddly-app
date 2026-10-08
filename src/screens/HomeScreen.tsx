import { appointmentDisplayTitle } from '../features/appointments/appointmentTypes';
import { useTranslation } from 'react-i18next';
import i18n, { currentLocale } from '../i18n';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
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
import { spacing } from '../theme/tokens';
import { createStyles, useTheme } from '../theme/ThemeProvider';
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
  return new Date(epochMs).toLocaleString(currentLocale(), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function babyAge(birthDate: number): string {
  const days = Math.floor((Date.now() - birthDate) / (24 * 60 * 60 * 1000));
  if (days < 14) return i18n.t('age.days', { count: days });
  const weeks = Math.floor(days / 7);
  if (weeks < 12) return i18n.t('age.weeks', { count: weeks });
  return i18n.t('age.months', { count: Math.floor(days / 30) });
}

function NextAppointmentCard({ appointment, onPress }: { appointment: Appointment | null; onPress: () => void }) {
  const { t } = useTranslation();
  const { type } = useTheme();
  const styles = useStyles();
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.appointmentCard}>
        <View style={styles.appointmentHead}>
          <Text style={type.caption}>{t('home.nextAppointment')}</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
        <Text style={type.body}>{appointment ? appointmentDisplayTitle(appointment) : t('home.noAppointments')}</Text>
        {appointment && <Text style={type.caption}>{formatAppointmentDate(appointment.scheduledAt)}</Text>}
      </Card>
    </Pressable>
  );
}

export function HomeScreen() {
  const { t } = useTranslation();
  const { type } = useTheme();
  const styles = useStyles();
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
      contractions[0] && { label: t('home.latestContraction'), at: contractions[0].endedAt },
      breastfeeding[0] && {
        label: t('home.latestBreastfeeding', { side: t(breastfeeding[0].side === 'left' ? 'side.left' : 'side.right') }),
        at: breastfeeding[0].endedAt,
      },
      bottle[0] && { label: t('home.latestBottle', { ml: bottle[0].amountMl }), at: bottle[0].at },
      diapers[0] && { label: t('home.latestDiaper'), at: diapers[0].at },
    ].filter(Boolean) as LatestEntry[];
    return items.sort((a, b) => b.at - a.at);
  }, [contractions, breastfeeding, bottle, diapers, t]);

  const nextAppointment: Appointment | null = useMemo(() => {
    const upcoming = appointments.filter((a) => a.scheduledAt >= now).sort((a, b) => a.scheduledAt - b.scheduledAt);
    return upcoming[0] ?? null;
  }, [appointments, now]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}>
        <Text style={type.h1}>{firstName ? t('home.hello', { name: firstName }) : t('home.helloAnon')}</Text>

        {mode === 'gravida' ? (
          <>
            <Card style={{ alignItems: 'center', gap: spacing.xs }}>
              <Text style={type.caption}>{t('home.pregnancyWeek')}</Text>
              <Text style={type.data}>{profile?.dueDate ? t('home.week', { week: pregnancyWeek(profile.dueDate) }) : '—'}</Text>
              {!profile?.dueDate && (
                <Text style={type.caption}>{t('home.setDueDate')}</Text>
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
              <Text style={type.caption}>{profile?.name || t('home.theBaby')}</Text>
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

            <Text style={[type.caption, { marginTop: spacing.sm }]}>{t('home.latest')}</Text>
            <Card style={{ gap: spacing.sm }}>
              {latest.length === 0 && <Text style={type.caption}>{t('home.noEntries')}</Text>}
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

const useStyles = createStyles((colors, type) => ({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  appointmentCard: { gap: spacing.xs },
  appointmentHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chevron: { fontSize: 16, color: colors.inkMuted },
}));
