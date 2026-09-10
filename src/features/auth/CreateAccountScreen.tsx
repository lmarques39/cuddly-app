import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { colors, fontFamily, radii, spacing, type } from '../../theme/tokens';

type Props = {
  onCreateAccount: (email: string, password: string) => void;
  onBack: () => void;
  error?: string | null;
};

export function CreateAccountScreen({ onCreateAccount, onBack, error }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = email.trim().length > 0 && password.length >= 6 && passwordsMatch;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={[type.caption, styles.link]}>‹ Voltar</Text>
        </Pressable>

        <View>
          <Text style={type.h1}>Criar conta</Text>
          <Text style={[type.body, { color: colors.inkSecondary, marginTop: spacing.xs }]}>
            Só precisamos do teu email e de uma password para começar.
          </Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={{ gap: spacing.md }}>
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
            <Text style={type.caption}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Pelo menos 6 caracteres"
              placeholderTextColor={colors.inkMuted}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <View>
            <Text style={type.caption}>Confirmar password</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repete a password"
              placeholderTextColor={colors.inkMuted}
              secureTextEntry
              style={styles.input}
            />
            {password.length > 0 && confirmPassword.length > 0 && !passwordsMatch && (
              <Text style={styles.mismatchText}>As passwords não coincidem.</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <BigButton
          label="Criar conta"
          background={canSubmit ? colors.action : colors.surfaceSunken}
          foreground={canSubmit ? colors.actionInk : colors.inkMuted}
          onPress={() => canSubmit && onCreateAccount(email.trim(), password)}
          full
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, gap: spacing.lg, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  link: { color: colors.primary, fontFamily: fontFamily.bodyBold },
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
  mismatchText: { marginTop: spacing.xs, fontFamily: fontFamily.body, fontSize: 12, color: colors.coral },
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
