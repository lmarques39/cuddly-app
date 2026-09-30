import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { dateKey, MonthCalendar } from '../../components/MonthCalendar';
import { RemoveEntryButton } from '../../components/RemoveEntryButton';
import { colors, fontFamily, radii, spacing, type } from '../../theme/tokens';
import { Appointment, AppointmentType } from '../../types/records';
import { useNow } from '../../utils/useNow';
import { cancelAppointmentReminder, scheduleAppointmentReminder } from '../notifications/reminderScheduling';
import { useNotificationPreferences } from '../notifications/useNotificationPreferences';
import { APPOINTMENT_TYPES, appointmentTypeLabel } from './appointmentTypes';
import { useAppointments } from './useAppointments';

/** Builds a local-time timestamp from a "YYYY-MM-DD" key and a "HH:MM" label. */
function combineDateAndTime(key: string, time: string): number | undefined {
  const [y, m, d] = key.split('-').map(Number);
  const timeMatch = time.trim().match(/^([0-2]?\d):([0-5]\d)$/);
  if (!y || !m || !d || !timeMatch) return undefined;
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (hour > 23) return undefined;
  return new Date(y, m - 1, d, hour, minute).getTime();
}

function formatDateLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long' });
}

function formatAppointment(epochMs: number): string {
  return new Date(epochMs).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function timeLabel(epochMs: number): string {
  const d = new Date(epochMs);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function AppointmentsScreen() {
  const { appointments, save: saveAppointment, remove: removeAppointment, update: updateAppointment } = useAppointments();
  const { preferences } = useNotificationPreferences();
  const [appointmentType, setAppointmentType] = useState<AppointmentType | null>(null);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const now = useNow(60000);
  const todayKey = dateKey(now);
  const formDateKey = selectedKey ?? todayKey;

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

  const scheduledAt = combineDateAndTime(formDateKey, time);
  // 'outra' needs its own free-text title; any other type's label *is* the title.
  const title = appointmentType === 'outra' ? customTitle.trim() : appointmentType ? appointmentTypeLabel(appointmentType) : '';
  const canSave = title.length > 0 && scheduledAt != null;
  const timeInvalid = time.trim().length > 0 && scheduledAt == null;

  const resetForm = () => {
    setAppointmentType(null);
    setTypeMenuOpen(false);
    setCustomTitle('');
    setTime('');
    setNotes('');
    setEditingId(null);
    setFormOpen(false);
  };

  const save = async () => {
    if (!canSave || scheduledAt == null || appointmentType == null) return;
    const trimmedNotes = notes.trim();
    const fields = { title, type: appointmentType, scheduledAt, ...(trimmedNotes ? { notes: trimmedNotes } : {}) };

    if (editingId != null) {
      // Keep anything this form doesn't edit (e.g. location) instead of dropping it.
      const { notes: _oldNotes, ...existing } = appointments.find((a) => a.id === editingId) ?? { id: editingId };
      const updated: Appointment = { ...existing, id: editingId, ...fields };
      updateAppointment(updated);
      // Not awaited — like the scheduleAppointmentReminder call below,
      // expo-notifications throws UnavailabilityError on web, and this must
      // never block resetForm()/the rest of the save.
      cancelAppointmentReminder(editingId);
      if (preferences.appointment.enabled) {
        scheduleAppointmentReminder(updated, preferences.appointment.daysBefore);
      }
      resetForm();
      return;
    }

    const created = await saveAppointment(fields);
    if (preferences.appointment.enabled) {
      scheduleAppointmentReminder(created, preferences.appointment.daysBefore);
    }
    resetForm();
  };

  const startEdit = (appointment: Appointment) => {
    setEditingId(appointment.id);
    // Entries from before #82 have no type — reopen them as 'outra' with their title as the free text.
    const existingType = appointment.type ?? 'outra';
    setAppointmentType(existingType);
    setCustomTitle(existingType === 'outra' ? appointment.title : '');
    setTypeMenuOpen(false);
    setSelectedKey(dateKey(appointment.scheduledAt));
    setTime(timeLabel(appointment.scheduledAt));
    setNotes(appointment.notes ?? '');
    setFormOpen(true);
  };

  const removeAppointmentAndReminder = (id: string) => {
    removeAppointment(id);
    cancelAppointmentReminder(id);
    if (editingId === id) resetForm();
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

        {formOpen ? (
          <Card style={{ gap: spacing.md }}>
            <View style={styles.editingBanner}>
              <Text style={styles.editingBannerLabel}>{editingId != null ? 'A editar consulta' : 'Nova consulta'}</Text>
              <Pressable onPress={resetForm} hitSlop={8}>
                <Text style={styles.editingBannerCancel}>Cancelar</Text>
              </Pressable>
            </View>

            <Text style={[type.caption, styles.formTarget]}>
              A marcar para <Text style={styles.formTargetBold}>{formatDateLabel(formDateKey)}</Text>
              {!selectedKey && ' (hoje — toca num dia no calendário para escolher outro)'}
            </Text>

            <View>
              <Text style={type.caption}>Tipo de consulta</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tipo de consulta"
                onPress={() => setTypeMenuOpen((open) => !open)}
                style={[styles.input, styles.select]}
              >
                <Text style={appointmentType ? styles.selectValue : styles.selectPlaceholder}>
                  {appointmentType ? appointmentTypeLabel(appointmentType) : 'Escolher…'}
                </Text>
                <Text style={styles.selectValue}>{typeMenuOpen ? '▴' : '▾'}</Text>
              </Pressable>
              {typeMenuOpen && (
                <View style={styles.menu}>
                  {APPOINTMENT_TYPES.map((option) => (
                    <Pressable
                      key={option.value}
                      accessibilityRole="menuitem"
                      onPress={() => {
                        setAppointmentType(option.value);
                        setTypeMenuOpen(false);
                      }}
                      style={[styles.menuItem, appointmentType === option.value && styles.menuItemOn]}
                    >
                      <Text style={[styles.menuItemLabel, appointmentType === option.value && styles.menuItemLabelOn]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
              {appointmentType === 'outra' && (
                <TextInput
                  value={customTitle}
                  onChangeText={setCustomTitle}
                  placeholder="Qual? (ex: Fisioterapia)"
                  placeholderTextColor={colors.inkMuted}
                  style={[styles.input, { marginTop: spacing.sm }]}
                />
              )}
            </View>

            <View>
              <Text style={type.caption}>Hora</Text>
              <TextInput
                value={time}
                onChangeText={setTime}
                placeholder="HH:MM"
                placeholderTextColor={colors.inkMuted}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                style={styles.input}
              />
              {timeInvalid && <Text style={styles.fieldError}>Hora inválida — usa o formato HH:MM (ex: 09:30).</Text>}
            </View>

            <View>
              <Text style={type.caption}>Observações (opcional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Levar exames anteriores, perguntas para o médico…"
                placeholderTextColor={colors.inkMuted}
                multiline
                style={[styles.input, styles.notesInput]}
              />
            </View>

            <BigButton
              label={editingId != null ? 'Guardar alterações' : 'Marcar consulta'}
              background={canSave ? colors.primary : colors.surfaceSunken}
              foreground={canSave ? colors.primaryInk : colors.inkMuted}
              onPress={save}
              full
            />
          </Card>
        ) : (
          <BigButton
            label="+ Marcar nova consulta"
            background={colors.primary}
            foreground={colors.primaryInk}
            onPress={() => setFormOpen(true)}
            full
          />
        )}

        {visible.length === 0 ? (
          <Text style={type.caption}>
            {selectedKey ? 'Sem consultas neste dia.' : 'Ainda sem consultas marcadas.'}
          </Text>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {[...upcoming, ...past].map((item) => (
              <Card key={item.id} style={styles.row}>
                <Pressable style={styles.rowText} onPress={() => startEdit(item)}>
                  <Text style={type.body}>{item.title}</Text>
                  <Text style={type.caption}>{formatAppointment(item.scheduledAt)} · toca para editar</Text>
                  {item.notes ? (
                    <Text style={type.caption} numberOfLines={2}>
                      {item.notes}
                    </Text>
                  ) : null}
                </Pressable>
                <RemoveEntryButton onRemove={() => removeAppointmentAndReminder(item.id)} />
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
  rowText: { flex: 1 },
  clearFilter: { alignSelf: 'flex-start' },
  clearFilterLabel: { fontFamily: fontFamily.bodyBold, fontSize: 12.5, color: colors.primary },
  formTarget: { backgroundColor: colors.surfaceSunken, borderRadius: radii.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  editingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceSunken,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  editingBannerLabel: { fontFamily: fontFamily.bodyBold, fontSize: 12.5, color: colors.ink },
  editingBannerCancel: { fontFamily: fontFamily.bodyMedium, fontSize: 12.5, color: colors.coral },
  formTargetBold: { fontFamily: fontFamily.bodyBold, color: colors.ink },
  select: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectValue: { fontFamily: fontFamily.bodyMedium, fontSize: 15, color: colors.ink },
  selectPlaceholder: { fontFamily: fontFamily.bodyMedium, fontSize: 15, color: colors.inkMuted },
  menu: {
    marginTop: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  menuItem: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  menuItemOn: { backgroundColor: colors.primary },
  menuItemLabel: { fontFamily: fontFamily.bodyMedium, fontSize: 14, color: colors.ink },
  menuItemLabelOn: { color: colors.primaryInk, fontFamily: fontFamily.bodyBold },
  notesInput: { minHeight: 72, textAlignVertical: 'top' },
  fieldError: { fontFamily: fontFamily.bodyMedium, fontSize: 12, color: colors.coral, marginTop: spacing.xs },
});
