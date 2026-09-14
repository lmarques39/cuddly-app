import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { dateKey, MonthCalendar } from '../../components/MonthCalendar';
import { addToList, loadList, makeId, STORAGE_KEYS } from '../../storage/storage';
import { colors, fontFamily, radii, spacing, type } from '../../theme/tokens';
import { Appointment } from '../../types/records';
import { useNow } from '../../utils/useNow';

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
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const refresh = useCallback(() => {
    loadList<Appointment>(STORAGE_KEYS.appointments).then(setAppointments);
  }, []);

  useFocusEffect(refresh);
  const now = useNow(60000);

  const markedDates = useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.forEach((a) => {
      const key = dateKey(a.scheduledAt);
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return counts;
  }, [appointments]);

  const sorted = [...appointments].sort((a, b) => a.scheduledAt - b.scheduledAt);
  const visible = selectedKey ? sorted.filter((a) => dateKey(a.scheduledAt) === selectedKey) : sorted;
  const upcoming = visible.filter((a) => a.scheduledAt >= now);
  const past = visible.filter((a) => a.scheduledAt < now).reverse();

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
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={type.h1}>Consultas médicas</Text>

        <MonthCalendar
          markedDates={markedDates}
          selectedKey={selectedKey}
          onSelectDate={(key) => setSelectedKey((prev) => (prev === key ? null : key))}
        />

        {selectedKey && (
          <Pressable onPress={() => setSelectedKey(null)} style={styles.clearFilter}>
            <Text style={styles.clearFilterLabel}>« Ver todas as consultas</Text>
          </Pressable>
        )}

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

        {visible.length === 0 ? (
          <Text style={type.caption}>
            {selectedKey ? 'Sem consultas neste dia.' : 'Ainda sem consultas marcadas.'}
          </Text>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {[...upcoming, ...past].map((item) => (
              <Card key={item.id} style={styles.row}>
                <Text style={type.body}>{item.title}</Text>
                <Text style={type.caption}>{formatAppointment(item.scheduledAt)}</Text>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  scroll: { gap: spacing.md, paddingBottom: spacing.xl },
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
  clearFilter: { alignSelf: 'flex-start' },
  clearFilterLabel: { fontFamily: fontFamily.bodyBold, fontSize: 12.5, color: colors.primary },
});
