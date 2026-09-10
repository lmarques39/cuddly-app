import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { colors, fontFamily, radii, spacing, type } from '../../theme/tokens';
import { BabySex } from '../../types/records';

export type BabyInfo = {
  name: string;
  alreadyBorn: boolean;
  dueDate?: number;
  birthDate?: number;
  sex?: BabySex;
};

type Props = {
  onFinish: (baby: BabyInfo) => void;
};

const SEX_LABEL: Record<BabySex, string> = {
  menina: 'Menina',
  menino: 'Menino',
  prefiro_nao_dizer: 'Prefiro não dizer',
};

function parseDateInput(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const ms = new Date(`${value.trim()}T00:00:00`).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}

export function RegisterBabyScreen({ onFinish }: Props) {
  const [alreadyBorn, setAlreadyBorn] = useState(false);
  const [name, setName] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [sex, setSex] = useState<BabySex | undefined>(undefined);

  const handleFinish = () => {
    const dateMs = parseDateInput(dateInput);
    onFinish({
      name: name.trim(),
      alreadyBorn,
      dueDate: alreadyBorn ? undefined : dateMs,
      birthDate: alreadyBorn ? dateMs : undefined,
      sex,
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.progressRow}>
          <View style={[styles.progressSegment, { backgroundColor: colors.primary }]} />
          <View style={[styles.progressSegment, { backgroundColor: colors.primary }]} />
        </View>

        <View>
          <Text style={type.h1}>Sobre o bebé</Text>
          <Text style={[type.body, { color: colors.inkSecondary, marginTop: spacing.xs }]}>
            Isto determina o que a app mostra a seguir.
          </Text>
        </View>

        <View>
          <Text style={type.caption}>O bebé já nasceu?</Text>
          <View style={styles.toggleRow}>
            <Pressable
              onPress={() => setAlreadyBorn(true)}
              style={[styles.togglePill, { backgroundColor: alreadyBorn ? colors.action : colors.surfaceSunken }]}
            >
              <Text style={{ fontFamily: fontFamily.bodyMedium, fontSize: 13, color: alreadyBorn ? colors.actionInk : colors.inkSecondary }}>
                Já nasceu
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setAlreadyBorn(false)}
              style={[styles.togglePill, { backgroundColor: !alreadyBorn ? colors.action : colors.surfaceSunken }]}
            >
              <Text style={{ fontFamily: fontFamily.bodyMedium, fontSize: 13, color: !alreadyBorn ? colors.actionInk : colors.inkSecondary }}>
                Ainda não
              </Text>
            </Pressable>
          </View>
        </View>

        <View>
          <Text style={type.caption}>Nome ou alcunha</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Opcional"
            placeholderTextColor={colors.inkMuted}
            style={[styles.input, { fontFamily: fontFamily.bodyBold, fontSize: 16 }]}
          />
        </View>

        <View>
          <Text style={type.caption}>{alreadyBorn ? 'Data de nascimento' : 'Data prevista para o parto'} (AAAA-MM-DD)</Text>
          <TextInput
            value={dateInput}
            onChangeText={setDateInput}
            placeholder={alreadyBorn ? '2026-08-20' : '2026-12-01'}
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
          />
        </View>

        <View>
          <Text style={type.caption}>Sexo</Text>
          <View style={styles.toggleRow}>
            {(Object.keys(SEX_LABEL) as BabySex[]).map((s) => (
              <Pressable
                key={s}
                onPress={() => setSex(s)}
                style={[styles.sexPill, { backgroundColor: sex === s ? colors.action : colors.surfaceSunken }]}
              >
                <Text
                  style={{
                    fontFamily: fontFamily.bodyMedium,
                    fontSize: sex === s ? 12 : 12,
                    color: sex === s ? colors.actionInk : colors.inkSecondary,
                    textAlign: 'center',
                  }}
                >
                  {SEX_LABEL[s]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <BigButton label="Concluir" background={colors.action} foreground={colors.actionInk} onPress={handleFinish} full />
        <Text style={[type.caption, { textAlign: 'center', color: colors.inkMuted, marginTop: spacing.sm }]}>Passo 2 de 2</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, gap: spacing.lg, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  progressRow: { flexDirection: 'row', gap: spacing.sm },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  toggleRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  togglePill: { flex: 1, paddingVertical: 10, borderRadius: radii.pill, alignItems: 'center' },
  sexPill: { flex: 1, paddingVertical: 10, paddingHorizontal: 4, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  input: {
    marginTop: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.body,
    fontSize: 15,
    color: colors.ink,
  },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, paddingTop: spacing.sm },
});
