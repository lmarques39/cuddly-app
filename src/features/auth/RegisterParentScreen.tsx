import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { colors, fontFamily, radii, spacing, type } from '../../theme/tokens';

export type ParentRole = 'mae' | 'pai' | 'cuidador';

export type ParentInfo = {
  name: string;
  role: ParentRole;
  email: string;
  phone: string;
};

type Props = {
  onContinue: (parent: ParentInfo) => void;
  error?: string | null;
};

const ROLE_LABEL: Record<ParentRole, string> = {
  mae: 'Mãe',
  pai: 'Pai',
  cuidador: 'Cuidador(a)',
};

export function RegisterParentScreen({ onContinue, error }: Props) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<ParentRole>('mae');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const canContinue = name.trim().length > 0 && email.trim().length > 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.progressRow}>
          <View style={[styles.progressSegment, { backgroundColor: colors.primary }]} />
          <View style={[styles.progressSegment, { backgroundColor: colors.surfaceSunken }]} />
        </View>

        <View>
          <Text style={type.h1}>Sobre ti</Text>
          <Text style={[type.body, { color: colors.inkSecondary, marginTop: spacing.xs }]}>
            Isto ajuda-nos a saber quem está a registar.
          </Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View>
          <Text style={type.caption}>O teu nome</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Luís"
            placeholderTextColor={colors.inkMuted}
            style={[styles.input, { fontFamily: fontFamily.bodyBold, fontSize: 16 }]}
          />
        </View>

        <View>
          <Text style={type.caption}>O teu papel</Text>
          <View style={styles.roleRow}>
            {(Object.keys(ROLE_LABEL) as ParentRole[]).map((r) => (
              <Pressable
                key={r}
                onPress={() => setRole(r)}
                style={[styles.rolePill, { backgroundColor: role === r ? colors.action : colors.surfaceSunken }]}
              >
                <Text
                  style={{
                    fontFamily: fontFamily.bodyMedium,
                    fontSize: 12.5,
                    color: role === r ? colors.actionInk : colors.inkSecondary,
                  }}
                >
                  {ROLE_LABEL[r]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text style={type.caption}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            placeholderTextColor={colors.inkMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
        </View>

        <View>
          <Text style={type.caption}>Telemóvel (opcional)</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+351"
            placeholderTextColor={colors.inkMuted}
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <BigButton
          label="Continuar"
          background={canContinue ? colors.action : colors.surfaceSunken}
          foreground={canContinue ? colors.actionInk : colors.inkMuted}
          onPress={() => canContinue && onContinue({ name: name.trim(), role, email: email.trim(), phone: phone.trim() })}
          full
        />
        <Text style={[type.caption, { textAlign: 'center', color: colors.inkMuted, marginTop: spacing.sm }]}>
          Passo 1 de 2
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, gap: spacing.lg, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  progressRow: { flexDirection: 'row', gap: spacing.sm },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
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
  roleRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  rolePill: { flex: 1, paddingVertical: 10, borderRadius: radii.pill, alignItems: 'center' },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, paddingTop: spacing.sm },
  errorBox: {
    backgroundColor: colors.coralBg,
    borderWidth: 1.5,
    borderColor: colors.coral,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  errorText: { fontFamily: fontFamily.bodyMedium, fontSize: 13, color: colors.coral },
});
