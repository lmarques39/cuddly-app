import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { useNotificationPreferences } from '../notifications/useNotificationPreferences';
import { colors, fontFamily, radii, spacing, type } from '../../theme/tokens';
import { NotificationPreferences } from '../../types/records';
import { useSavedFlash } from '../../utils/useSavedFlash';

/**
 * Deliberately simple UI, no Figma frame changed here — matches the 3 real
 * toggles. "Novidades da Cuddly" from the Figma is left out on purpose:
 * it's genuine push (server-triggered), not a local reminder — see #14.
 */
export function NotificacoesScreen() {
  const { preferences, save } = useNotificationPreferences();
  const [draft, setDraft] = useState<NotificationPreferences>(preferences);
  const { visible: showSaved, flash } = useSavedFlash();

  useEffect(() => setDraft(preferences), [preferences]);

  const onSave = async () => {
    await save(draft);
    flash();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>Notificações</Text>
      <Text style={type.caption}>Só lembretes que tu crias — nunca notificações push de marketing.</Text>

      <Card style={styles.row}>
        <View style={styles.rowText}>
          <Text style={type.body}>Lembrete de amamentação</Text>
          <Text style={type.caption}>A cada</Text>
        </View>
        <TextInput
          value={String(draft.breastfeeding.intervalHours)}
          onChangeText={(v) => setDraft((d) => ({ ...d, breastfeeding: { ...d.breastfeeding, intervalHours: Number(v) || 0 } }))}
          keyboardType="numeric"
          style={styles.hoursInput}
        />
        <Text style={type.caption}>h</Text>
        <Switch
          value={draft.breastfeeding.enabled}
          onValueChange={(enabled) => setDraft((d) => ({ ...d, breastfeeding: { ...d.breastfeeding, enabled } }))}
        />
      </Card>

      <Card style={styles.row}>
        <View style={styles.rowText}>
          <Text style={type.body}>Lembrete de consultas</Text>
          <Text style={type.caption}>Dias antes</Text>
        </View>
        <TextInput
          value={String(draft.appointment.daysBefore)}
          onChangeText={(v) => setDraft((d) => ({ ...d, appointment: { ...d.appointment, daysBefore: Number(v) || 0 } }))}
          keyboardType="numeric"
          style={styles.hoursInput}
        />
        <Switch
          value={draft.appointment.enabled}
          onValueChange={(enabled) => setDraft((d) => ({ ...d, appointment: { ...d.appointment, enabled } }))}
        />
      </Card>

      <Card style={styles.row}>
        <View style={styles.rowText}>
          <Text style={type.body}>Resumo diário</Text>
          <Text style={type.caption}>Às</Text>
        </View>
        <TextInput
          value={String(draft.dailySummary.hour)}
          onChangeText={(v) => setDraft((d) => ({ ...d, dailySummary: { ...d.dailySummary, hour: Number(v) || 0 } }))}
          keyboardType="numeric"
          style={styles.hoursInput}
        />
        <Text style={type.caption}>h</Text>
        <Switch
          value={draft.dailySummary.enabled}
          onValueChange={(enabled) => setDraft((d) => ({ ...d, dailySummary: { ...d.dailySummary, enabled } }))}
        />
      </Card>

      <Card style={styles.disabledRow}>
        <View style={styles.rowText}>
          <Text style={[type.body, { color: colors.inkMuted }]}>Novidades da Cuddly</Text>
          <Text style={type.caption}>Brevemente</Text>
        </View>
        <Switch value={false} disabled />
      </Card>

      <BigButton label="Guardar" background={colors.primary} foreground={colors.primaryInk} onPress={onSave} full />
      {showSaved && <Text style={styles.savedText}>Guardado com sucesso.</Text>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  disabledRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: 0.6 },
  rowText: { flex: 1 },
  hoursInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    width: 48,
    textAlign: 'center',
    fontFamily: fontFamily.bodyMedium,
    fontSize: 15,
    color: colors.ink,
  },
  savedText: { fontFamily: fontFamily.bodyMedium, fontSize: 13, color: colors.accent, textAlign: 'center' },
});
