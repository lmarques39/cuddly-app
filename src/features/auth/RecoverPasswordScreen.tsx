import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton } from '../../components/BigButton';
import { fontFamily, radii, spacing } from '../../theme/tokens';
import { createStyles, useTheme } from '../../theme/ThemeProvider';

type Props = {
  onSend: (email: string) => Promise<void>;
  onBack: () => void;
  error?: string | null;
};

// Firebase can only email a reset link — it can't accept a new password
// directly here, that would mean anyone who knows an email address could
// "recover" someone else's account. Deliberately simpler than the Figma
// frame for this reason (see #5's discussion).
export function RecoverPasswordScreen({ onSend, onBack, error }: Props) {
  const { t } = useTranslation();
  const { colors, type } = useTheme();
  const styles = useStyles();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSubmit = email.trim().length > 0 && !sending;

  const handleSend = async () => {
    if (!canSubmit) return;
    setSending(true);
    try {
      await onSend(email.trim());
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={[type.caption, styles.link]}>{t('common.back')}</Text>
        </Pressable>

        <View>
          <Text style={type.h1}>{t('auth.recover.title')}</Text>
          <Text style={[type.body, { color: colors.inkSecondary, marginTop: spacing.xs }]}>
            {sent
              ? t('auth.recover.sent')
              : t('auth.recover.intro')}
          </Text>
        </View>

        {!sent && (
          <>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
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
          </>
        )}
      </View>

      {!sent && (
        <View style={styles.footer}>
          <BigButton
            label={sending ? t('auth.recover.sending') : t('auth.recover.send')}
            background={canSubmit ? colors.action : colors.surfaceSunken}
            foreground={canSubmit ? colors.actionInk : colors.inkMuted}
            onPress={handleSend}
            full
          />
        </View>
      )}
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
