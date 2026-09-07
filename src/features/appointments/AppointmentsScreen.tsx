import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { addToList, loadList, makeId, STORAGE_KEYS } from '../../storage/storage';
import { colors, fontFamily, radii, spacing, type } from '../../theme/tokens';
import { Appointment } from '../../types/records';

function parseDateTimeInput(value: string): number | undefined {
  const ms = new Date(value.trim().replace(' ', 'T')).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}

function formatAppointment(epochMs: number): string {
  return new Date(epochMs).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState('');

  const refresh = useCallback(() => {
    loadList<Appointment>(STORAGE_KEYS.appointments).then(setAppointments);
  }, []);

  useFocusEffect(refresh);

  const upcoming = appointments.filter((a) => a.scheduledAt >= Date.now()).sort((a, b) => a.scheduledAt - b.scheduledAt);
  const past = appointments.filter((a) => a.scheduledAt < Date.now()).sort((a, b) => b.scheduledAt - a.scheduledAt);

  const canSave = title.trim().length > 0 && parseDateTimeInput(when) != null;

  const save = async () => {
    if (!canSave) return;
    const entry: Appointment = { id: makeId(), title: title.trim(), scheduledAt: parseDateTimeInput(when)! };
    const next = await addToList(STORAGE_KEYS.appointments, entry);
    setAppointments(next);
    setTitle('');
    setWhen('');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>Consultas médicas</Text>

      <Card style={{ gap: spacing.md }}>
        <View>
          <Text style={type.caption}>Título</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ecografia"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
          />
        </View>
        <View>
          <Text style={type.caption}>Data e hora (AAAA-MM-DD HH:MM)</Text>
          <TextInput
            value={when}
            onChangeText={setWhen}
            placeholder="2026-09-20 10:30"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
          />
        </View>
        <BigButton
          label="Marcar consulta"
          background={canSave ? colors.primary : colors.surfaceSunken}
          foreground={canSave ? colors.primaryInk : colors.inkMuted}
          onPress={save}
          full
        />
      </Card>

      <FlatList
        data={[...upcoming, ...past]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
        ListEmptyComponent={<Text style={type.caption}>Ainda sem consultas marcadas.</Text>}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <Text style={type.body}>{item.title}</Text>
            <Text style={type.caption}>{formatAppointment(item.scheduledAt)}</Text>
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
    fontFamily: fontFamily.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
