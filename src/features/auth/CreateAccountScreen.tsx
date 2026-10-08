import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { PasswordField } from '../../components/PasswordField';
import { fontFamily, radii, spacing } from '../../theme/tokens';
import { createStyles, useTheme } from '../../theme/ThemeProvider';

type Props = {
  onCreateAccount: (email: string, password: string) => void;
  onBack: () => void;
  error?: string | null;
};

export function CreateAccountScreen({ onCreateAccount, onBack, error }: Props) {
  const { t } = useTranslation();
  const { colors, type } = useTheme();
  const styles = useStyles();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordTooShort = password.length > 0 && password.length < 6;
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = email.trim().length > 0 && password.length >= 6 && passwordsMatch;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={[type.caption, styles.link]}>{t('common.back')}</Text>
        </Pressable>

        <View>
          <Text style={type.h1}>{t('auth.create.title')}</Text>
          <Text style={[type.body, { color: colors.inkSecondary, marginTop: spacing.xs }]}>
            {t('auth.create.subtitle')}
          </Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={{ gap: spacing.md }}>
          <View>
            <Text style={type.caption}>{t('auth.email')}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor={colors.inkMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <View>
            <Text style={type.caption}>{t('auth.password')}</Text>
            <PasswordField value={password} onChangeText={setPassword} placeholder={t('auth.create.passwordPlaceholder')} />
            {passwordTooShort && <Text style={styles.mismatchText}>{t('auth.create.passwordTooShort')}</Text>}
          </View>

          <View>
            <Text style={type.caption}>{t('auth.create.confirm')}</Text>
            <PasswordField value={confirmPassword} onChangeText={setConfirmPassword} placeholder={t('auth.create.confirmPlaceholder')} />
            {password.length > 0 && confirmPassword.length > 0 && !passwordsMatch && (
              <Text style={styles.mismatchText}>{t('auth.create.mismatch')}</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <BigButton
          label={t('auth.create.title')}
          background={canSubmit ? colors.action : colors.surfaceSunken}
          foreground={canSubmit ? colors.actionInk : colors.inkMuted}
          onPress={() => canSubmit && onCreateAccount(email.trim(), password)}
          full
        />
      </View>
    </SafeAreaView>
  );
}

const useStyles = createStyles((colors, type) => ({
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
}));
