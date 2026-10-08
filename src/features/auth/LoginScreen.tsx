import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { PasswordField } from '../../components/PasswordField';
import { fontFamily, radii, spacing } from '../../theme/tokens';
import { createStyles, useTheme } from '../../theme/ThemeProvider';
import { useGoogleSignIn } from './useGoogleSignIn';

type Props = {
  onLogin: (email: string, password: string) => void;
  onContinueWithGoogle: (idToken: string) => void;
  onCreateAccount: () => void;
  onForgotPassword: () => void;
  error?: string | null;
};

export function LoginScreen({ onLogin, onContinueWithGoogle, onCreateAccount, onForgotPassword, error }: Props) {
  const { t } = useTranslation();
  const { colors, type } = useTheme();
  const styles = useStyles();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const google = useGoogleSignIn(onContinueWithGoogle);
  const shownError = error ?? google.error;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.brand}>
          <View style={styles.logoBadge} />
          <Text style={styles.wordmark}>cuddly</Text>
          <Text style={[type.caption, styles.tagline]}>{t('auth.login.tagline')}</Text>
        </View>

        <View style={{ gap: spacing.md }}>
          {shownError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{shownError}</Text>
            </View>
          )}

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
            <View style={styles.row}>
              <Text style={type.caption}>{t('auth.password')}</Text>
              <Pressable onPress={onForgotPassword} hitSlop={8}>
                <Text style={[type.caption, styles.link]}>{t('auth.login.forgot')}</Text>
              </Pressable>
            </View>
            <PasswordField value={password} onChangeText={setPassword} placeholder="••••••••" />
          </View>

          <BigButton
            label={t('auth.login.signIn')}
            background={colors.action}
            foreground={colors.actionInk}
            onPress={() => onLogin(email, password)}
            full
            style={{ marginTop: spacing.xs }}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={[type.caption, { color: colors.inkMuted }]}>{t('auth.login.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            onPress={google.start}
            disabled={!google.available}
            style={[styles.googleButton, !google.available && { opacity: 0.5 }]}
          >
            <Text style={styles.googleLabel}>{t('auth.login.google')}</Text>
          </Pressable>
        </View>

        <View style={styles.footerRow}>
          <Text style={type.caption}>{t('auth.login.noAccount')}</Text>
          <Pressable onPress={onCreateAccount}>
            <Text style={[type.caption, styles.link, { fontFamily: fontFamily.bodyBold }]}>{t('auth.login.createAccount')}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const useStyles = createStyles((colors, type) => ({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, justifyContent: 'center', gap: spacing.xl, paddingHorizontal: spacing.lg },
  brand: { alignItems: 'center', gap: spacing.sm },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  wordmark: { fontFamily: fontFamily.display, fontSize: 26, color: colors.ink },
  tagline: { textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  link: { color: colors.primary },
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
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  googleButton: {
    minHeight: 56,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLabel: { fontFamily: fontFamily.bodyBold, fontSize: 15, color: colors.ink },
  footerRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  errorBox: {
    backgroundColor: colors.coralBg,
    borderWidth: 1.5,
    borderColor: colors.coral,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  errorText: { fontFamily: fontFamily.bodyMedium, fontSize: 13, color: colors.coral },
}));
