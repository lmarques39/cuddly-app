import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { colors, fontFamily, radii, spacing, type } from '../../theme/tokens';
import { useBabyProfile } from './useBabyProfile';

function toDateInput(epochMs?: number): string {
  if (!epochMs) return '';
  return new Date(epochMs).toISOString().slice(0, 10);
}

function parseDateInput(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const ms = new Date(`${value.trim()}T00:00:00`).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}

export function BabyProfileScreen() {
  const { profile, mode, save } = useBabyProfile();
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [birthDate, setBirthDate] = useState('');

  useEffect(() => {
    setName(profile?.name ?? '');
    setDueDate(toDateInput(profile?.dueDate));
    setBirthDate(toDateInput(profile?.birthDate));
  }, [profile]);

  const onSave = () => {
    save({
      name: name.trim() || undefined,
      dueDate: parseDateInput(dueDate),
      birthDate: parseDateInput(birthDate),
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={type.h1}>Perfil do bebé</Text>
      <Text style={type.caption}>
        Modo atual: {mode === 'gravida' ? 'Grávida' : 'Pós-parto'} — preencher a data de nascimento muda o modo da app.
      </Text>

      <Card style={{ gap: spacing.md }}>
        <View>
          <Text style={type.caption}>Nome/alcunha do bebé</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Opcional"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
          />
        </View>
        <View>
          <Text style={type.caption}>Data prevista do parto (AAAA-MM-DD)</Text>
          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="2026-12-01"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
          />
        </View>
        <View>
          <Text style={type.caption}>Data de nascimento (AAAA-MM-DD, se já nasceu)</Text>
          <TextInput
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="2026-11-20"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
          />
        </View>
        <BigButton label="Guardar" background={colors.primary} foreground={colors.primaryInk} onPress={onSave} full />
      </Card>
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
});
