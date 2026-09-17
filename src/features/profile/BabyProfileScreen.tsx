import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { DateField } from '../../components/DateField';
import { colors, fontFamily, radii, spacing, type } from '../../theme/tokens';
import { useSavedFlash } from '../../utils/useSavedFlash';
import { useBabyProfile } from './useBabyProfile';

export function BabyProfileScreen() {
  const { profile, mode, save } = useBabyProfile();
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState<number | undefined>(undefined);
  const [birthDate, setBirthDate] = useState<number | undefined>(undefined);
  const { visible: showSaved, flash } = useSavedFlash();

  useEffect(() => {
    setName(profile?.name ?? '');
    setDueDate(profile?.dueDate);
    setBirthDate(profile?.birthDate);
  }, [profile]);

  const onSave = async () => {
    await save({
      name: name.trim() || undefined,
      dueDate,
      birthDate,
    });
    flash();
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
        <DateField label="Data prevista do parto" value={dueDate} onChange={setDueDate} placeholder="Data prevista" />
        <DateField
          label="Data de nascimento (se já nasceu)"
          value={birthDate}
          onChange={setBirthDate}
          placeholder="Quando nasceu"
        />
        <BigButton label="Guardar" background={colors.primary} foreground={colors.primaryInk} onPress={onSave} full />
        {showSaved && <Text style={styles.savedText}>Guardado com sucesso.</Text>}
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
  savedText: { fontFamily: fontFamily.bodyMedium, fontSize: 13, color: colors.accent, textAlign: 'center' },
});
