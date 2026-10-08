import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { BigButton } from '../../components/BigButton';
import { fontFamily, radii, spacing } from '../../theme/tokens';
import { createStyles, useTheme } from '../../theme/ThemeProvider';

type Props = {
  onInvite: (email: string) => Promise<void>;
};

/**
 * Just the "convidar" form (email + button) — deliberately not the whole
 * Cuidadores screen. #54 replaces CuidadoresScreen's placeholder with the
 * real member/invite list and embeds this alongside it.
 */
export function InviteCaregiverForm({ onInvite }: Props) {
  const { t } = useTranslation();
  const { colors, type } = useTheme();
  const styles = useStyles();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && !sending;

  const handleInvite = async () => {
    if (!canSubmit) return;
    setSending(true);
    setError(null);
    try {
      await onInvite(email.trim());
      setSent(true);
      setEmail('');
    } catch {
      setError(t('caregivers.inviteFailed'));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={type.caption}>{t('caregivers.emailLabel')}</Text>
      <TextInput
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setSent(false);
        }}
        placeholder={t('caregivers.emailPlaceholder')}
        placeholderTextColor={colors.inkMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}
      {sent && <Text style={styles.successText}>Convite enviado.</Text>}

      <BigButton
        label={sending ? t('caregivers.inviting') : t('caregivers.invite')}
        background={canSubmit ? colors.action : colors.surfaceSunken}
        foreground={canSubmit ? colors.actionInk : colors.inkMuted}
        onPress={handleInvite}
        full
      />
    </View>
  );
}

const useStyles = createStyles((colors, type) => ({
  container: { gap: spacing.sm },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.body,
    fontSize: 15,
    color: colors.ink,
  },
  errorText: { fontFamily: fontFamily.bodyMedium, fontSize: 13, color: colors.coral },
  successText: { fontFamily: fontFamily.bodyMedium, fontSize: 13, color: colors.ink },
}));
